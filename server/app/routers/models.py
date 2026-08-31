from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import json
import psutil
from ..services.ollama_service import ollama_service
from ..config import RECOMMENDED_MODELS

router = APIRouter(prefix="/api/models", tags=["models"])

class PullModelRequest(BaseModel):
    name: str

CLOUD_MODELS = [
    {"id": "gpt-4o", "name": "GPT-4o (OpenAI)", "provider": "openai", "context": 128000, "vision": True},
    {"id": "gpt-4o-mini", "name": "GPT-4o Mini (OpenAI)", "provider": "openai", "context": 128000, "vision": True},
    {"id": "llama-3.3-70b-versatile", "name": "Llama 3.3 70B (Groq Fast)", "provider": "groq", "context": 128000, "vision": False},
    {"id": "claude-3-5-sonnet-20241022", "name": "Claude 3.5 Sonnet (Anthropic)", "provider": "anthropic", "context": 200000, "vision": True},
    {"id": "gemini-2.0-flash", "name": "Gemini 2.0 Flash (Google)", "provider": "gemini", "context": 1000000, "vision": True},
    {"id": "deepseek/deepseek-r1", "name": "DeepSeek R1 (OpenRouter)", "provider": "openrouter", "context": 64000, "vision": False}
]

@router.get("")
async def get_models():
    data = await ollama_service.get_models()
    data["cloudModels"] = CLOUD_MODELS
    return data

@router.post("/pull")
async def pull_model(req: PullModelRequest):
    return StreamingResponse(
        ollama_service.pull_model_stream(req.name),
        media_type="application/x-ndjson"
    )

@router.get("/system-info")
async def get_system_info():
    mem = psutil.virtual_memory()
    return {
        "totalRamGb": round(mem.total / (1024**3), 2),
        "availableRamGb": round(mem.available / (1024**3), 2),
        "usedRamPercent": mem.percent,
        "gpuEstimate": "NVIDIA Quadro M2000M 4GB VRAM",
        "optimalContext": "4096 tokens (Local) / Unlimited (Cloud API)"
    }
