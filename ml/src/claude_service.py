import os
import json
import logging
from typing import Optional, AsyncGenerator, Dict, Any
from pathlib import Path
from claude_code_sdk import query, ClaudeCodeOptions, Message

logger = logging.getLogger(__name__)

class ClaudeService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")

        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is required")

        os.environ["ANTHROPIC_API_KEY"] = self.api_key
        logger.info("Claude service initialized")

    async def query_stream(
        self,
        prompt: str,
        space_id: Optional[str] = None,
        tracker: Optional[Any] = None,
        max_turns: int = 10
    ) -> AsyncGenerator[str, None]:
        try:
            agent_path = Path(__file__).parent

            options = ClaudeCodeOptions(
                max_turns=max_turns,
                system_prompt="""You are the FlagFlow AML investigation orchestrator.
                Analyze transactions for money laundering patterns and coordinate specialist agents.
                Use the Task tool to spawn agents: osint-investigator, geo-intelligence, pattern-detector.
                Provide clear risk assessments and evidence for all findings.""",
                cwd=agent_path,
                allowed_tools=["Task", "WebFetch", "WebSearch"],
                permission_mode="acceptEdits",
                model="claude-sonnet-4-20250514"
            )

            async for message in query(prompt=prompt, options=options):
                message_dict = self._to_dict(message)

                # Track agent spawning
                if tracker and message_dict.get("type") == "tool_use":
                    if message_dict.get("tool") == "Task":
                        await tracker.track_operation(
                            tool_use_id=message_dict.get("id", ""),
                            subagent_type=message_dict.get("subagent_type", ""),
                            space_id=space_id or ""
                        )

                # Safely JSON-encode complex SDK objects (e.g., TextBlock)
                safe_payload = self._jsonify(message_dict)
                yield f"data: {json.dumps(safe_payload, ensure_ascii=False)}\n\n"

            logger.info("Claude stream completed successfully")
            yield f"data: {json.dumps({'type': 'complete'})}\n\n"

        except Exception as e:
            logger.error(f"Stream error: {str(e)}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    def _to_dict(self, message: Message) -> Dict[str, Any]:
        # Convert SDK Message to a lightweight dict; fall back to string content
        try:
            if isinstance(message, dict):
                return message  # already a dict
            # Some SDKs expose .to_dict(); if present, use it
            if hasattr(message, 'to_dict') and callable(getattr(message, 'to_dict')):
                return message.to_dict()
            if hasattr(message, '__dict__'):
                return dict(message.__dict__)
        except Exception:
            pass
        return {"type": "content", "content": str(message)}

    def _jsonify(self, obj: Any) -> Any:
        """Recursively convert SDK objects (e.g., TextBlock) to JSON-serializable structures."""
        # Primitives
        if obj is None or isinstance(obj, (bool, int, float, str)):
            return obj
        # Dict-like
        if isinstance(obj, dict):
            return {str(k): self._jsonify(v) for k, v in obj.items()}
        # List/tuple
        if isinstance(obj, (list, tuple)):
            return [self._jsonify(v) for v in obj]
        # Known text block pattern: has 'type'=='text' and 'text' field, or attribute .text
        tname = type(obj).__name__.lower()
        if hasattr(obj, 'text') and ('textblock' in tname or 'block' in tname or 'text' in tname):
            try:
                return {"type": "text", "text": str(getattr(obj, 'text'))}
            except Exception:
                return str(obj)
        # Generic object: try dict
        if hasattr(obj, '__dict__'):
            try:
                return {k: self._jsonify(v) for k, v in obj.__dict__.items()}
            except Exception:
                return str(obj)
        # Fallback to string
        return str(obj)
