import asyncio
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
from claude_service import ClaudeService
from redis_memory import RedisMemory
from agent_tracker import AgentTracker
import config
from datetime import datetime
from pathlib import Path
import os
from uuid import uuid4

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="FlagFlow ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
claude_service = ClaudeService()
redis_memory = RedisMemory()
agent_tracker = AgentTracker()

# Per-request JSONL logging in repo (default: ml/logs). Override with FF_LOG_DIR to change.
LOG_DIR = Path(os.getenv("FF_LOG_DIR", str((Path(__file__).parent.parent / "logs"))))
LOG_DIR.mkdir(parents=True, exist_ok=True)

def _sanitize_name(s: str) -> str:
    return "".join(ch for ch in str(s) if ch.isalnum() or ch in ("-", "_")).strip() or "anon"

def make_request_logger(name_hint: str):
    ts = datetime.utcnow().strftime("%Y%m%dT%H%M%S%fZ")
    fname = f"{_sanitize_name(name_hint)}_{ts}.log"
    path = LOG_DIR / fname
    def _log(event: Dict[str, Any]):
        try:
            line = json.dumps({"ts": datetime.utcnow().isoformat() + "Z", **event}, ensure_ascii=False)
            with path.open('a', encoding='utf-8') as f:
                f.write(line + "\n")
        except Exception as e:
            logger.debug(f"request log write error: {e}")
    return _log, path

class InvestigationRequest(BaseModel):
    transactions: List[Dict[str, Any]]
    space_id: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    redis_connected: bool

@app.get("/health", response_model=HealthResponse)
async def health_check():
    redis_connected = await redis_memory.ping()
    return HealthResponse(
        status="healthy",
        service="flagflow-ml",
        version="1.0.0",
        redis_connected=redis_connected
    )

@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        df = pd.read_csv(pd.io.common.BytesIO(contents))
        transactions = df.to_dict(orient="records")

        # Basic validation
        required_cols = ["amount", "from_entity", "to_entity", "from_location", "to_location"]
        if not all(col in df.columns for col in required_cols):
            raise HTTPException(
                status_code=400,
                detail=f"CSV must contain columns: {required_cols}"
            )

        return {"transactions": transactions, "count": len(transactions)}
    except Exception as e:
        logger.error(f"CSV upload error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/investigate")
async def investigate(request: Dict[str, Any]):
    """Unified investigate endpoint compatible with FlagFlow web.
    Accepts either:
      - { "context": { query, answers, sessionId, questions } }
      - { "transactions": [...] }
    Streams SSE updates.
    """

    body = request or {}

    # Branch: direct prompt from frontend
    if "prompt" in body:
        prompt = str(body.get("prompt", ""))
        req_log, log_path = make_request_logger("prompt")
        logger.info(f"Logging stream to {log_path}")
        req_log({"direction": "in", "kind": "prompt", "prompt": prompt[:2000]})

        async def stream_context():
            try:
                async for message in claude_service.query_stream(
                    prompt=prompt,
                    space_id=None,
                    tracker=agent_tracker,
                    max_turns=12,
                ):
                    msg_data = json.loads(message.replace("data: ", ""))
                    req_log({"direction": "out", "event": msg_data})
                    # Surface agent spawns to the UI
                    if msg_data.get("type") == "tool_use" and msg_data.get("tool") == "Task":
                        agent_type = msg_data.get("subagent_type", "osint")
                        yield f"data: {json.dumps({'type': 'spawn_agent', 'agentType': agent_type, 'parentId': 'orchestrator'})}\n\n"
                    # Bubble through risk updates if present
                    if msg_data.get("type") == "content":
                        content = msg_data.get("content", "")
                        if isinstance(content, str) and "risk:" in content.lower():
                            risk_level = extract_risk_level(content)
                            yield f"data: {json.dumps({'type': 'risk_update', 'riskLevel': risk_level})}\n\n"
                    # Forward raw message for richer UIs (optional to consume)
                    yield message

            except Exception as e:
                logger.error(f"Context investigation error: {e}")
                yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

        return StreamingResponse(stream_context(), media_type="text/event-stream")

    # Branch: context-driven investigation (Claude orchestrates sub-agents)
    if "context" in body:
        ctx = body.get("context", {})
        hint = f"ctx_{ctx.get('sessionId') or uuid4().hex[:8]}"
        req_log, log_path = make_request_logger(hint)
        logger.info(f"Logging stream to {log_path}")
        req_log({"direction": "in", "kind": "context", "context": ctx})
        # Stringify full context for the sub-agent
        context_str = json.dumps(ctx, ensure_ascii=False)

        # Backend fallback prompt if frontend didn't build one
        prompt = f"""
You are the AML Orchestrator.
Start by using the Task tool to call the subagent "osint-investigator" to gather OSINT about the entities, wallets, and counterparties mentioned.
Pass the following context string to the subagent as input:

CONTEXT:
{context_str}

After the OSINT subagent returns, continue coordinating additional agents (geo-intelligence, pattern-detector, chain) if applicable.
Emit concise, incremental updates.
"""

        async def stream_context2():
            try:
                async for message in claude_service.query_stream(
                    prompt=prompt,
                    space_id=None,
                    tracker=agent_tracker,
                    max_turns=12,
                ):
                    msg_data = json.loads(message.replace("data: ", ""))
                    req_log({"direction": "out", "event": msg_data})
                    # Surface agent spawns to the UI
                    if msg_data.get("type") == "tool_use" and msg_data.get("tool") == "Task":
                        agent_type = msg_data.get("subagent_type", "osint")
                        yield f"data: {json.dumps({'type': 'spawn_agent', 'agentType': agent_type, 'parentId': 'orchestrator'})}\n\n"
                    # Bubble through risk updates if present
                    if msg_data.get("type") == "content":
                        content = msg_data.get("content", "")
                        if isinstance(content, str) and "risk:" in content.lower():
                            risk_level = extract_risk_level(content)
                            yield f"data: {json.dumps({'type': 'risk_update', 'riskLevel': risk_level})}\n\n"
                    # Forward raw message for richer UIs (optional to consume)
                    yield message

            except Exception as e:
                logger.error(f"Context investigation error: {e}")
                yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

        return StreamingResponse(stream_context2(), media_type="text/event-stream")

    # Branch: transactions-driven investigation (original behavior)
    transactions = body.get("transactions", [])
    if transactions:
        hint = f"tx_{len(transactions)}_{uuid4().hex[:8]}"
        req_log, log_path = make_request_logger(hint)
        logger.info(f"Logging stream to {log_path}")
        req_log({"direction": "in", "kind": "transactions", "count": len(transactions)})

    async def stream_transactions():
        try:
            # Check Redis for similar patterns
            patterns = await redis_memory.get_similar_patterns(transactions)
            if patterns:
                evt = {"type": "pattern_match", "patterns": patterns}
                yield f"data: {json.dumps(evt)}\n\n"
                req_log({"direction": "out", "event": evt})

            prompt = f"""
            Analyze these financial transactions for money laundering indicators:
            {json.dumps(transactions, indent=2)}

            Use the orchestrator agent to coordinate the investigation.
            Spawn specialist agents as needed based on risk indicators.
            """

            async for message in claude_service.query_stream(
                prompt=prompt,
                space_id=None,
                tracker=agent_tracker,
                max_turns=10,
            ):
                msg_data = json.loads(message.replace("data: ", ""))
                if msg_data.get("type") == "tool_use" and msg_data.get("tool") == "Task":
                    agent_type = msg_data.get("subagent_type")
                    yield f"data: {json.dumps({'type': 'spawn_agent', 'agentType': agent_type})}\n\n"
                elif msg_data.get("type") == "content":
                    content = msg_data.get("content", "")
                    if "risk:" in content.lower():
                        risk_level = extract_risk_level(content)
                        yield f"data: {json.dumps({'type': 'risk_update', 'riskLevel': risk_level})}\n\n"
                yield message

            await store_investigation_results(transactions, patterns)
            yield f"data: {json.dumps({'type': 'complete'})}\n\n"
        except Exception as e:
            logger.error(f"Investigation error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(stream_transactions(), media_type="text/event-stream")

@app.get("/memory/patterns")
async def get_patterns():
    patterns = await redis_memory.get_all_patterns()
    return {"patterns": patterns}

@app.get("/memory/entities/{entity_name}")
async def get_entity_reputation(entity_name: str):
    reputation = await redis_memory.get_entity_reputation(entity_name)
    return {"entity": entity_name, "reputation": reputation}

@app.post("/memory/learn")
async def store_learning(data: Dict[str, Any]):
    await redis_memory.store_pattern(data)
    return {"status": "stored"}

def extract_risk_level(content: str) -> str:
    content_lower = content.lower()
    if "high risk" in content_lower or "risk: high" in content_lower:
        return "high"
    elif "medium risk" in content_lower or "risk: medium" in content_lower:
        return "medium"
    elif "low risk" in content_lower or "risk: low" in content_lower:
        return "low"
    return "unknown"

async def store_investigation_results(transactions: List[Dict], patterns: List[Dict]):
    for tx in transactions:
        # Extract features for pattern learning
        features = {
            "amount": tx.get("amount"),
            "from_location": tx.get("from_location"),
            "to_location": tx.get("to_location"),
            "routing": f"{tx.get('from_location')}-{tx.get('to_location')}",
        }

        # Store successful patterns
        if any(p.get("confidence", 0) > 0.7 for p in patterns):
            await redis_memory.store_pattern({
                "type": "transaction",
                "features": features,
                "confidence": 0.8,
                "success_rate": 0.9
            })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
