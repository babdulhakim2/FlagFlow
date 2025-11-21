import asyncio
import time
import logging
from typing import Dict, Optional, Any
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class OperationMetadata:
    subagent_type: str
    space_id: str
    started_at: float
    tool_use_id: str

    def duration(self) -> float:
        return time.time() - self.started_at

class AgentTracker:
    def __init__(self):
        self._operations: Dict[str, OperationMetadata] = {}
        self._lock = asyncio.Lock()
        self._agent_metrics = {}

    async def track_operation(
        self, tool_use_id: str, subagent_type: str, space_id: str
    ) -> bool:
        try:
            metadata = OperationMetadata(
                subagent_type=subagent_type,
                space_id=space_id,
                started_at=time.time(),
                tool_use_id=tool_use_id,
            )

            async with self._lock:
                self._operations[tool_use_id] = metadata

            logger.info(f"Tracking {subagent_type} agent ({tool_use_id})")

            # Track metrics
            if subagent_type not in self._agent_metrics:
                self._agent_metrics[subagent_type] = {
                    "spawn_count": 0,
                    "total_duration": 0,
                    "average_duration": 0
                }

            self._agent_metrics[subagent_type]["spawn_count"] += 1

            return True

        except Exception as e:
            logger.error(f"Failed to track operation {tool_use_id}: {e}")
            return False

    async def complete_operation(
        self, tool_use_id: str, content: str, space_id: str, subagent_type: Optional[str]
    ) -> bool:
        try:
            async with self._lock:
                metadata = self._operations.pop(tool_use_id, None)

            if not metadata:
                logger.warning(f"No metadata found for {tool_use_id}")
                return False

            duration = metadata.duration()
            agent_type = subagent_type or metadata.subagent_type

            # Update metrics
            if agent_type in self._agent_metrics:
                metrics = self._agent_metrics[agent_type]
                metrics["total_duration"] += duration
                metrics["average_duration"] = (
                    metrics["total_duration"] / metrics["spawn_count"]
                )

            logger.info(
                f"Completed {agent_type} operation in {duration:.2f}s"
            )

            return True

        except Exception as e:
            logger.error(f"Failed to complete operation {tool_use_id}: {e}")
            return False

    def get_metrics(self) -> Dict[str, Any]:
        return {
            "active_operations": len(self._operations),
            "agent_metrics": self._agent_metrics
        }

    async def cleanup_stale_operations(self, timeout_seconds: int = 300):
        current_time = time.time()
        stale_operations = []

        async with self._lock:
            for tool_id, metadata in self._operations.items():
                if current_time - metadata.started_at > timeout_seconds:
                    stale_operations.append(tool_id)

            for tool_id in stale_operations:
                self._operations.pop(tool_id)
                logger.warning(f"Cleaned up stale operation: {tool_id}")