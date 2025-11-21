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

                yield f"data: {json.dumps(message_dict)}\n\n"

            logger.info("Claude stream completed successfully")
            yield f"data: {json.dumps({'type': 'complete'})}\n\n"

        except Exception as e:
            logger.error(f"Stream error: {str(e)}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    def _to_dict(self, message: Message) -> Dict[str, Any]:
        if hasattr(message, '__dict__'):
            return message.__dict__
        return {"type": "content", "content": str(message)}