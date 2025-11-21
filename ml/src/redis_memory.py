import json
import hashlib
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import redis.asyncio as redis

logger = logging.getLogger(__name__)

class RedisMemory:
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.pattern_prefix = "pattern:"
        self.entity_prefix = "entity:"
        self.route_prefix = "route:"
        self.query_prefix = "query:"

    async def ping(self) -> bool:
        try:
            await self.redis.ping()
            return True
        except Exception:
            return False

    async def store_pattern(self, pattern_data: Dict[str, Any]) -> bool:
        try:
            pattern_hash = self._hash_pattern(pattern_data.get("features", {}))
            key = f"{self.pattern_prefix}{pattern_data.get('type')}:{pattern_hash}"

            await self.redis.hset(key, mapping={
                "pattern": json.dumps(pattern_data.get("features", {})),
                "confidence": pattern_data.get("confidence", 0.5),
                "success_rate": pattern_data.get("success_rate", 0.0),
                "detection_count": 1,
                "last_seen": datetime.now().isoformat(),
                "type": pattern_data.get("type", "unknown")
            })

            # Update confidence if pattern exists
            await self.redis.hincrby(key, "detection_count", 1)

            # Set expiry (30 days)
            await self.redis.expire(key, 30 * 24 * 60 * 60)

            logger.info(f"Stored pattern: {key}")
            return True

        except Exception as e:
            logger.error(f"Failed to store pattern: {e}")
            return False

    async def get_similar_patterns(
        self, transactions: List[Dict[str, Any]], threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        similar_patterns = []

        for tx in transactions:
            # Check for routing patterns
            route_key = f"{self.route_prefix}{tx.get('from_location')}-{tx.get('to_location')}"
            route_data = await self.redis.hgetall(route_key)

            if route_data and float(route_data.get("confidence", 0)) > threshold:
                similar_patterns.append({
                    "type": "route",
                    "pattern": route_data.get("pattern"),
                    "confidence": float(route_data.get("confidence", 0)),
                    "success_rate": float(route_data.get("success_rate", 0))
                })

            # Check for amount patterns (structuring)
            amount = tx.get("amount", 0)
            if 9900 <= amount <= 10000:
                structuring_key = f"{self.pattern_prefix}structuring:threshold"
                struct_data = await self.redis.hgetall(structuring_key)
                if struct_data:
                    similar_patterns.append({
                        "type": "structuring",
                        "confidence": float(struct_data.get("confidence", 0.8)),
                        "pattern": "Amount near reporting threshold"
                    })

        return similar_patterns

    async def store_entity_reputation(
        self, entity_name: str, reputation_data: Dict[str, Any]
    ) -> bool:
        try:
            key = f"{self.entity_prefix}{entity_name.lower()}"

            await self.redis.hset(key, mapping={
                "entity_name": entity_name,
                "risk_score": reputation_data.get("risk_score", 0.5),
                "sanctions_status": reputation_data.get("sanctions_status", "unknown"),
                "adverse_media": reputation_data.get("adverse_media", "none"),
                "investigation_count": reputation_data.get("investigation_count", 1),
                "last_updated": datetime.now().isoformat()
            })

            logger.info(f"Stored entity reputation: {entity_name}")
            return True

        except Exception as e:
            logger.error(f"Failed to store entity reputation: {e}")
            return False

    async def get_entity_reputation(self, entity_name: str) -> Optional[Dict[str, Any]]:
        try:
            key = f"{self.entity_prefix}{entity_name.lower()}"
            data = await self.redis.hgetall(key)
            return data if data else None

        except Exception as e:
            logger.error(f"Failed to get entity reputation: {e}")
            return None

    async def store_successful_query(
        self, query_type: str, query_template: str, effectiveness: float
    ) -> bool:
        try:
            key = f"{self.query_prefix}{query_type}"

            await self.redis.zadd(
                key,
                {query_template: effectiveness}
            )

            # Keep only top 20 queries
            await self.redis.zremrangebyrank(key, 0, -21)

            logger.info(f"Stored successful query: {query_type} - {query_template}")
            return True

        except Exception as e:
            logger.error(f"Failed to store query: {e}")
            return False

    async def get_best_queries(self, query_type: str, limit: int = 5) -> List[str]:
        try:
            key = f"{self.query_prefix}{query_type}"
            queries = await self.redis.zrevrange(key, 0, limit - 1)
            return queries

        except Exception as e:
            logger.error(f"Failed to get queries: {e}")
            return []

    async def update_pattern_confidence(
        self, pattern_hash: str, success: bool
    ) -> bool:
        try:
            keys = await self.redis.keys(f"{self.pattern_prefix}*:{pattern_hash}")

            for key in keys:
                current_conf = float(await self.redis.hget(key, "confidence") or 0.5)
                success_rate = float(await self.redis.hget(key, "success_rate") or 0.5)

                # Update using exponential moving average
                alpha = 0.1
                new_success_rate = alpha * (1.0 if success else 0.0) + (1 - alpha) * success_rate
                new_confidence = min(0.99, max(0.01, new_success_rate))

                await self.redis.hset(key, mapping={
                    "confidence": new_confidence,
                    "success_rate": new_success_rate
                })

            return True

        except Exception as e:
            logger.error(f"Failed to update pattern confidence: {e}")
            return False

    async def get_all_patterns(self) -> List[Dict[str, Any]]:
        try:
            patterns = []
            keys = await self.redis.keys(f"{self.pattern_prefix}*")

            for key in keys:
                data = await self.redis.hgetall(key)
                if data:
                    patterns.append({
                        "key": key,
                        "type": data.get("type"),
                        "confidence": float(data.get("confidence", 0)),
                        "success_rate": float(data.get("success_rate", 0)),
                        "detection_count": int(data.get("detection_count", 0)),
                        "last_seen": data.get("last_seen")
                    })

            # Sort by confidence
            patterns.sort(key=lambda x: x["confidence"], reverse=True)
            return patterns

        except Exception as e:
            logger.error(f"Failed to get all patterns: {e}")
            return []

    async def store_investigation_metrics(
        self, investigation_id: str, metrics: Dict[str, Any]
    ) -> bool:
        try:
            key = f"investigation:{investigation_id}"

            await self.redis.hset(key, mapping={
                "duration_seconds": metrics.get("duration", 0),
                "agents_spawned": metrics.get("agents_spawned", 0),
                "patterns_matched": metrics.get("patterns_matched", 0),
                "risk_level": metrics.get("risk_level", "unknown"),
                "timestamp": datetime.now().isoformat()
            })

            # Expire after 7 days
            await self.redis.expire(key, 7 * 24 * 60 * 60)

            return True

        except Exception as e:
            logger.error(f"Failed to store metrics: {e}")
            return False

    def _hash_pattern(self, features: Dict[str, Any]) -> str:
        feature_str = json.dumps(features, sort_keys=True)
        return hashlib.sha256(feature_str.encode()).hexdigest()[:16]