import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
WORKSPACE_DIR = ROOT_DIR / "workspace"
DB_PATH = DATA_DIR / "ai_platform.db"

# Simple Zero-Dependency .env Loader
def load_env_file(env_path: Path):
    if env_path.exists():
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, val = line.split("=", 1)
                        key = key.strip()
                        val = val.strip().strip("\"'")
                        if key and key not in os.environ:
                            os.environ[key] = val
        except Exception:
            pass

# Load .env from server dir or root dir
load_env_file(BASE_DIR / ".env")
load_env_file(ROOT_DIR / ".env")

# Ensure directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
WORKSPACE_DIR.mkdir(parents=True, exist_ok=True)

# Environment Variables & Secrets
JWT_SECRET = os.getenv("JWT_SECRET", "local-ai-studio-secret-jwt-key-2026")
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "8000"))
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")

# Hardware defaults (HP ZBook 15 G3 baseline)
RECOMMENDED_MODELS = [
    {
        "name": "qwen2.5-coder:7b",
        "displayName": "Qwen 2.5 Coder 7B",
        "description": "Best local model for coding agent & refactoring. Fast and precise.",
        "size": "4.7 GB",
        "vramEstimate": "3.8 GB",
        "recommendedFor": "Coding Agent & IDE",
        "tags": ["Coding", "Fast", "Agent"]
    },
    {
        "name": "llama3.2:3b",
        "displayName": "Llama 3.2 3B",
        "description": "Ultra lightweight conversational model. Runs entirely in 4GB VRAM.",
        "size": "2.0 GB",
        "vramEstimate": "2.0 GB",
        "recommendedFor": "General Chat & Assistant",
        "tags": ["Chat", "Lightweight", "Low RAM"]
    },
    {
        "name": "moondream",
        "displayName": "Moondream 2 Vision",
        "description": "Ultra-fast lightweight vision model for images, diagrams, and screenshots.",
        "size": "1.7 GB",
        "vramEstimate": "1.5 GB",
        "recommendedFor": "Image Analysis & Vision",
        "tags": ["Vision", "Fast", "Multimodal"]
    },
    {
        "name": "deepseek-r1:7b",
        "displayName": "DeepSeek R1 7B",
        "description": "State of the art reasoning & logic chain-of-thought model.",
        "size": "4.7 GB",
        "vramEstimate": "3.8 GB",
        "recommendedFor": "Deep Reasoning & Math",
        "tags": ["Reasoning", "Math", "Analysis"]
    },
    {
        "name": "phi3.5:3.8b",
        "displayName": "Phi 3.5 Mini 3.8B",
        "description": "Microsoft lightweight reasoning model with great instruction following.",
        "size": "2.2 GB",
        "vramEstimate": "2.2 GB",
        "recommendedFor": "Summary & Quick Chat",
        "tags": ["Fast", "Chat"]
    },
    {
        "name": "llava:7b",
        "displayName": "LLaVA 7B (Vision)",
        "description": "Multimodal vision model for analyzing images, diagrams, and screenshots.",
        "size": "4.5 GB",
        "vramEstimate": "3.9 GB",
        "recommendedFor": "Image Analysis & Vision",
        "tags": ["Vision", "Multimodal"]
    }
]
