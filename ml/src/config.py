import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API Keys
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
BRAVE_API_KEY = os.getenv("BRAVE_API_KEY")

# Redis Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Agent Configuration
AGENT_PATH = Path(__file__).parent
MAX_TURNS = 10
DEFAULT_MODEL = "claude-sonnet-4-20250514"

# Server Configuration
API_HOST = "0.0.0.0"
API_PORT = 8001

# CORS Configuration
ALLOWED_ORIGINS = ["http://localhost:3000"]

# Learning Parameters
PATTERN_CONFIDENCE_THRESHOLD = 0.7
PATTERN_EXPIRY_DAYS = 30
INVESTIGATION_METRICS_EXPIRY_DAYS = 7

# Agent Types
AGENT_TYPES = {
    "orchestrator": "blue",
    "osint-investigator": "orange",
    "geo-intelligence": "green",
    "pattern-detector": "purple",
    "jurisdiction-risk": "yellow"
}