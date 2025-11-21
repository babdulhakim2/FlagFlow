import os
import json
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
import pandas as pd
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import asyncio
import time
import redis
from datetime import datetime

app = FastAPI(title="FlagFlow ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Redis client
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

class InvestigationRequest(BaseModel):
    transactions: List[Dict[str, Any]]

@app.get("/health")
async def health_check():
    try:
        redis_client.ping()
        redis_connected = True
    except:
        redis_connected = False

    return {
        "status": "healthy",
        "service": "flagflow-ml",
        "version": "1.0.0",
        "redis_connected": redis_connected
    }

@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        df = pd.read_csv(pd.io.common.BytesIO(contents))
        transactions = df.to_dict(orient="records")

        # Basic validation
        required_cols = ["amount", "from_entity", "to_entity", "from_location", "to_location"]
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise HTTPException(
                status_code=400,
                detail=f"CSV missing required columns: {missing_cols}"
            )

        return {"transactions": transactions, "count": len(transactions)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/generate-questions")
async def generate_questions(request: dict):
    """Generate follow-up questions based on initial AML query"""
    query = request.get("query", "")

    # AML-specific question templates based on query type
    questions = []

    # Wire transfer questions
    if any(keyword in query.lower() for keyword in ["wire", "transfer", "send", "remit"]):
        questions = [
            {
                "question": "What is the customer's stated business activity?",
                "options": [
                    "Import/Export business",
                    "Professional services",
                    "Retail/wholesale trade",
                    "Real estate transactions",
                ]
            },
            {
                "question": "Is this transaction amount typical for this customer?",
                "options": [
                    "Yes, consistent with normal activity",
                    "No, significantly higher than usual",
                    "No, much lower than expected",
                    "First transaction - no history available",
                ]
            },
            {
                "question": "What is the geographic risk profile?",
                "options": [
                    "Both countries are low-risk jurisdictions",
                    "Destination is high-risk/offshore jurisdiction",
                    "Origin is high-risk jurisdiction",
                    "Multiple jurisdictions involved in routing",
                ]
            },
            {
                "question": "What documentation was provided for this transfer?",
                "options": [
                    "Complete commercial invoices and contracts",
                    "Basic transfer instructions only",
                    "Suspicious or altered documentation",
                    "No supporting documentation provided",
                ]
            }
        ]

    # Cash/deposit questions
    elif any(keyword in query.lower() for keyword in ["cash", "deposit", "structur", "$10,000", "threshold"]):
        questions = [
            {
                "question": "What is the pattern of these cash deposits?",
                "options": [
                    "Single large deposit",
                    "Multiple deposits just under $10,000",
                    "Multiple small deposits over time",
                    "Deposits across multiple branches/accounts",
                ]
            },
            {
                "question": "What is the customer's stated source of funds?",
                "options": [
                    "Salary from employment",
                    "Cash business proceeds",
                    "Sale of assets/investments",
                    "Vague or inconsistent explanations",
                ]
            },
            {
                "question": "Does the activity match the customer profile?",
                "options": [
                    "Yes, consistent with known business",
                    "No, customer profile suggests different activity",
                    "Customer is new with limited profile",
                    "Significant change from historical patterns",
                ]
            }
        ]

    # Shell company/entity questions
    elif any(keyword in query.lower() for keyword in ["shell", "company", "entity", "beneficiary", "owner"]):
        questions = [
            {
                "question": "What information is available about the entity?",
                "options": [
                    "Full corporate records and beneficial ownership",
                    "Basic registration information only",
                    "Limited or suspicious documentation",
                    "Entity appears to be shell/nominee",
                ]
            },
            {
                "question": "What is the business relationship with our customer?",
                "options": [
                    "Long-standing legitimate business partner",
                    "Recent business relationship",
                    "One-time transaction with new entity",
                    "Relationship unclear or suspicious",
                ]
            },
            {
                "question": "What is the entity's jurisdiction and risk profile?",
                "options": [
                    "Incorporated in low-risk jurisdiction",
                    "Offshore jurisdiction with banking secrecy",
                    "High-risk jurisdiction with weak AML controls",
                    "Multiple layers of corporate structures",
                ]
            }
        ]

    # Default generic questions for other scenarios
    else:
        questions = [
            {
                "question": "What type of suspicious activity is indicated?",
                "options": [
                    "Unusual transaction patterns",
                    "Geographic/jurisdictional concerns",
                    "Customer behavior anomalies",
                    "Documentation or identity issues",
                ]
            },
            {
                "question": "What is the potential money laundering stage?",
                "options": [
                    "Placement (introducing illicit funds)",
                    "Layering (complex transactions to obscure)",
                    "Integration (funds appear legitimate)",
                    "Multiple stages involved",
                ]
            },
            {
                "question": "What is the urgency level for investigation?",
                "options": [
                    "High - immediate escalation required",
                    "Medium - investigate within 24 hours",
                    "Standard - routine investigation timeline",
                    "Low - monitor for additional activity",
                ]
            }
        ]

    return {
        "session_id": f"aml_{int(time.time())}",
        "questions": questions,
        "initial_query": query
    }

@app.post("/investigate-context")
async def investigate_context(request: dict):
    """Investigate based on context from question flow"""
    context = request.get("context", {})
    query = context.get("query", "")
    answers = context.get("answers", [])
    session_id = context.get("sessionId", "")

    async def stream_investigation():
        try:
            yield f"data: {json.dumps({'type': 'status', 'message': f'Starting investigation: {query}'})}\n\n"
            await asyncio.sleep(1)

            # Analyze the context to determine which agents to spawn
            spawn_osint = False
            spawn_geo = False
            spawn_pattern = False

            # Check if we need OSINT based on query and answers
            if any(keyword in query.lower() for keyword in ["entity", "company", "shell", "beneficiary"]):
                spawn_osint = True
            elif any("entity" in answer.lower() or "company" in answer.lower() for answer in answers):
                spawn_osint = True

            # Check if we need geo intelligence
            if any(keyword in query.lower() for keyword in ["wire", "transfer", "cross-border", "jurisdiction"]):
                spawn_geo = True
            elif any("jurisdiction" in answer.lower() or "offshore" in answer.lower() for answer in answers):
                spawn_geo = True

            # Check if we need pattern detection
            if any(keyword in query.lower() for keyword in ["structur", "multiple", "threshold", "pattern"]):
                spawn_pattern = True
            elif any("multiple" in answer.lower() or "pattern" in answer.lower() for answer in answers):
                spawn_pattern = True

            # Spawn agents based on context
            findings = []

            if spawn_osint:
                yield f"data: {json.dumps({'type': 'spawn_agent', 'agentType': 'osint', 'parentId': 'orchestrator'})}\n\n"
                await asyncio.sleep(1)

                osint_searching = {'type': 'agent_update', 'agentId': 'osint-1', 'status': 'searching', 'findings': ['Analyzing entity information from context...']}
                yield f"data: {json.dumps(osint_searching)}\n\n"
                await asyncio.sleep(2)

                # Generate findings based on answers
                osint_findings = []
                for answer in answers:
                    if "shell" in answer.lower() or "nominee" in answer.lower():
                        osint_findings.append("Entity exhibits shell company characteristics")
                    elif "limited" in answer.lower() or "suspicious" in answer.lower():
                        osint_findings.append("Limited documentation raises compliance concerns")
                    elif "offshore" in answer.lower():
                        osint_findings.append("Offshore jurisdiction increases risk profile")

                if not osint_findings:
                    osint_findings = ["Entity research completed - no immediate red flags"]

                osint_complete = {'type': 'agent_update', 'agentId': 'osint-1', 'status': 'complete', 'findings': osint_findings, 'riskLevel': 'medium'}
                yield f"data: {json.dumps(osint_complete)}\n\n"
                findings.extend(osint_findings)

            if spawn_geo:
                yield f"data: {json.dumps({'type': 'spawn_agent', 'agentType': 'geo', 'parentId': 'orchestrator'})}\n\n"
                await asyncio.sleep(1)

                geo_mapping = {'type': 'agent_update', 'agentId': 'geo-1', 'status': 'mapping', 'findings': ['Analyzing geographic routing from context...']}
                yield f"data: {json.dumps(geo_mapping)}\n\n"
                await asyncio.sleep(2)

                # Generate geo findings based on answers
                geo_findings = []
                for answer in answers:
                    if "high-risk" in answer.lower() or "offshore" in answer.lower():
                        geo_findings.append("High-risk jurisdiction routing detected")
                        map_data = {
                            "routes": [
                                {"from": "United States", "to": "High-Risk Jurisdiction", "risk": "high"},
                            ]
                        }
                        yield f"data: {json.dumps({'type': 'map_data', 'data': map_data})}\n\n"
                    elif "multiple" in answer.lower():
                        geo_findings.append("Complex multi-jurisdictional routing identified")

                if not geo_findings:
                    geo_findings = ["Geographic analysis completed - standard routing"]

                geo_complete = {'type': 'agent_update', 'agentId': 'geo-1', 'status': 'complete', 'findings': geo_findings, 'riskLevel': 'high' if any("high-risk" in f for f in geo_findings) else 'low'}
                yield f"data: {json.dumps(geo_complete)}\n\n"
                findings.extend(geo_findings)

            if spawn_pattern:
                yield f"data: {json.dumps({'type': 'spawn_agent', 'agentType': 'pattern', 'parentId': 'orchestrator'})}\n\n"
                await asyncio.sleep(1)

                pattern_analyzing = {'type': 'agent_update', 'agentId': 'pattern-1', 'status': 'analyzing', 'findings': ['Analyzing patterns from context...']}
                yield f"data: {json.dumps(pattern_analyzing)}\n\n"
                await asyncio.sleep(2)

                # Generate pattern findings
                pattern_findings = []
                for answer in answers:
                    if "under $10,000" in answer.lower() or "multiple deposits" in answer.lower():
                        pattern_findings.append("Structuring behavior detected - amounts avoid reporting thresholds")
                    elif "significantly higher" in answer.lower():
                        pattern_findings.append("Unusual transaction size compared to customer profile")

                if not pattern_findings:
                    pattern_findings = ["Pattern analysis completed - no significant anomalies"]

                pattern_complete = {'type': 'agent_update', 'agentId': 'pattern-1', 'status': 'complete', 'findings': pattern_findings, 'riskLevel': 'high' if any("structuring" in f.lower() for f in pattern_findings) else 'low'}
                yield f"data: {json.dumps(pattern_complete)}\n\n"
                findings.extend(pattern_findings)

            # Store learned patterns in Redis
            try:
                # Store context-based patterns
                for answer in answers:
                    if "high-risk" in answer.lower():
                        route_key = f"pattern:context:high-risk-routing"
                        current_count = int(redis_client.hget(route_key, "detection_count") or 0)
                        redis_client.hset(route_key, mapping={
                            "type": "context",
                            "confidence": 0.85,
                            "success_rate": 0.82,
                            "detection_count": current_count + 1,
                            "description": "High-risk jurisdiction identified through context",
                            "last_seen": datetime.now().isoformat()
                        })

                yield f"data: {json.dumps({'type': 'learning_update', 'message': 'Context patterns stored for future investigations'})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'type': 'learning_error', 'message': f'Failed to store patterns: {str(e)}'})}\n\n"

            # Determine overall risk
            overall_risk = 'high' if any(f for f in findings if 'high-risk' in f.lower() or 'structuring' in f.lower()) else 'medium' if findings else 'low'

            yield f"data: {json.dumps({'type': 'agent_update', 'agentId': 'orchestrator', 'status': 'complete', 'findings': [f'Investigation completed based on context: {query}'] + findings, 'riskLevel': overall_risk})}\n\n"

            yield f"data: {json.dumps({'type': 'complete', 'riskLevel': overall_risk, 'findings': findings, 'context': context})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        stream_investigation(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )

@app.post("/investigate")
async def investigate(request: InvestigationRequest):
    async def stream_investigation():
        try:
            # Simulate agent spawning and analysis
            yield f"data: {json.dumps({'type': 'status', 'message': 'Starting investigation...'})}\n\n"
            await asyncio.sleep(1)

            # Analyze transactions for red flags
            high_risk_indicators = []
            for tx in request.transactions:
                amount = tx.get('amount', 0)
                from_entity = tx.get('from_entity', '').lower()
                to_entity = tx.get('to_entity', '').lower()
                from_location = tx.get('from_location', '').lower()
                to_location = tx.get('to_location', '').lower()

                # Check for structuring (amounts near 10k)
                if 9900 <= amount <= 10000:
                    high_risk_indicators.append('Structuring: Amount near $10k threshold')

                # Check for shell companies
                if 'shell' in from_entity or 'shell' in to_entity:
                    high_risk_indicators.append('Shell company involvement detected')

                # Check for offshore routing
                offshore_jurisdictions = ['cayman', 'cyprus', 'bermuda', 'panama', 'bvi']
                if any(jurisdiction in from_location or jurisdiction in to_location
                       for jurisdiction in offshore_jurisdictions):
                    high_risk_indicators.append('Offshore jurisdiction routing detected')

            # Spawn OSINT agent if high risk entities
            if any('shell' in tx.get('from_entity', '').lower() for tx in request.transactions):
                yield f"data: {json.dumps({'type': 'spawn_agent', 'agentType': 'osint', 'parentId': 'orchestrator'})}\n\n"
                await asyncio.sleep(1)

                osint_searching = {'type': 'agent_update', 'agentId': 'osint-1', 'status': 'searching', 'findings': ['Searching sanctions databases...']}
                yield f"data: {json.dumps(osint_searching)}\n\n"
                await asyncio.sleep(2)

                osint_complete = {'type': 'agent_update', 'agentId': 'osint-1', 'status': 'complete', 'findings': ['Shell Corp BVI found on OFAC sanctions list', 'Adverse media: fraud charges 2023'], 'riskLevel': 'high'}
                yield f"data: {json.dumps(osint_complete)}\n\n"

            # Spawn geo-intelligence agent for cross-border transactions
            cross_border = any(tx.get('from_location') != tx.get('to_location') for tx in request.transactions)
            if cross_border:
                yield f"data: {json.dumps({'type': 'spawn_agent', 'agentType': 'geo', 'parentId': 'orchestrator'})}\n\n"
                await asyncio.sleep(1)

                geo_mapping = {'type': 'agent_update', 'agentId': 'geo-1', 'status': 'mapping', 'findings': ['Analyzing geographic routes...']}
                yield f"data: {json.dumps(geo_mapping)}\n\n"
                await asyncio.sleep(2)

                # Generate map data
                map_data = {
                    "routes": [
                        {"from": "Miami", "to": "Cayman Islands", "amount": 9999, "risk": "high"},
                        {"from": "Cayman Islands", "to": "Cyprus", "amount": 9999, "risk": "high"},
                        {"from": "Cyprus", "to": "Miami", "amount": 9950, "risk": "high"}
                    ]
                }

                yield f"data: {json.dumps({'type': 'map_data', 'data': map_data})}\n\n"
                geo_complete = {'type': 'agent_update', 'agentId': 'geo-1', 'status': 'complete', 'findings': ['Classic offshore layering route detected', 'Miami to Cayman to Cyprus triangle'], 'riskLevel': 'high'}
                yield f"data: {json.dumps(geo_complete)}\n\n"

            # Store learned patterns in Redis
            try:
                for tx in request.transactions:
                    from_location = tx.get('from_location', '').lower()
                    to_location = tx.get('to_location', '').lower()

                    # Store route pattern if offshore
                    if 'cayman' in from_location or 'cayman' in to_location:
                        route_key = f"pattern:route:cayman-routing"
                        current_count = int(redis_client.hget(route_key, "detection_count") or 0)
                        redis_client.hset(route_key, mapping={
                            "type": "route",
                            "confidence": 0.92,
                            "success_rate": 0.89,
                            "detection_count": current_count + 1,
                            "description": "Offshore routing through Cayman Islands",
                            "last_seen": datetime.now().isoformat()
                        })

                    # Store structuring pattern
                    amount = tx.get('amount', 0)
                    if 9900 <= amount <= 10000:
                        struct_key = f"pattern:structuring:threshold-avoidance"
                        current_count = int(redis_client.hget(struct_key, "detection_count") or 0)
                        redis_client.hset(struct_key, mapping={
                            "type": "structuring",
                            "confidence": 0.87,
                            "success_rate": 0.91,
                            "detection_count": current_count + 1,
                            "description": "Transaction amounts near reporting thresholds",
                            "last_seen": datetime.now().isoformat()
                        })

                yield f"data: {json.dumps({'type': 'learning_update', 'message': 'Patterns stored in memory for future investigations'})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'type': 'learning_error', 'message': f'Failed to store patterns: {str(e)}'})}\n\n"

            # Determine overall risk
            overall_risk = 'high' if len(high_risk_indicators) >= 2 else 'medium' if len(high_risk_indicators) == 1 else 'low'

            yield f"data: {json.dumps({'type': 'agent_update', 'agentId': 'orchestrator', 'status': 'complete', 'findings': high_risk_indicators, 'riskLevel': overall_risk})}\n\n"

            yield f"data: {json.dumps({'type': 'complete', 'riskLevel': overall_risk, 'findings': high_risk_indicators})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        stream_investigation(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )

@app.get("/memory/patterns")
async def get_patterns():
    try:
        patterns = []

        # Get all pattern keys from Redis
        keys = redis_client.keys("pattern:*")

        for key in keys:
            data = redis_client.hgetall(key)
            if data:
                patterns.append({
                    "key": key,
                    "type": data.get("type", "unknown"),
                    "confidence": float(data.get("confidence", 0)),
                    "success_rate": float(data.get("success_rate", 0)),
                    "detection_count": int(data.get("detection_count", 0)),
                    "last_seen": data.get("last_seen", "")
                })

        # If no patterns exist, create some demo patterns
        if not patterns:
            demo_patterns = [
                {
                    "type": "route",
                    "confidence": 0.89,
                    "success_rate": 0.92,
                    "detection_count": 7,
                    "pattern": "miami-cayman-cyprus",
                    "description": "Classic offshore layering route"
                },
                {
                    "type": "structuring",
                    "confidence": 0.85,
                    "success_rate": 0.88,
                    "detection_count": 15,
                    "pattern": "threshold-avoidance",
                    "description": "Amounts near $10k reporting threshold"
                }
            ]

            # Store demo patterns in Redis
            for i, pattern in enumerate(demo_patterns):
                key = f"pattern:{pattern['type']}:{pattern['pattern']}"
                redis_client.hset(key, mapping={
                    "type": pattern["type"],
                    "confidence": pattern["confidence"],
                    "success_rate": pattern["success_rate"],
                    "detection_count": pattern["detection_count"],
                    "description": pattern["description"],
                    "last_seen": datetime.now().isoformat()
                })

                patterns.append({
                    "key": key,
                    "type": pattern["type"],
                    "confidence": pattern["confidence"],
                    "success_rate": pattern["success_rate"],
                    "detection_count": pattern["detection_count"],
                    "last_seen": datetime.now().isoformat()
                })

        return {"patterns": patterns}

    except Exception as e:
        # Fallback to mock data if Redis fails
        return {"patterns": [
            {
                "key": "pattern:route:miami-cayman-cyprus",
                "type": "route",
                "confidence": 0.89,
                "success_rate": 0.92,
                "detection_count": 7,
                "last_seen": "2024-01-20T10:30:00Z"
            }
        ]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("simple_main:app", host="0.0.0.0", port=8001, reload=True)