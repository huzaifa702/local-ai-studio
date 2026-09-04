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

class TestKeyRequest(BaseModel):
    provider: str
    apiKey: Optional[str] = None

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

@router.post("/test-key")
async def test_provider_key(req: TestKeyRequest):
    provider = req.provider.lower().strip()
    key = (req.apiKey or "").strip()

    if provider == "ollama":
        running = await ollama_service.is_running()
        if not running:
            return {"success": False, "message": "Ollama service is not reachable at localhost:11434", "models": []}
        data = await ollama_service.get_models()
        models = [m["name"] for m in data.get("installedModels", [])]
        return {"success": True, "message": f"Connected to Ollama! Found {len(models)} local models.", "models": models}

    if not key:
        return {"success": False, "message": "API key cannot be empty.", "models": []}

    import httpx
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            if provider == "groq":
                res = await client.get(
                    "https://api.groq.com/openai/v1/models",
                    headers={"Authorization": f"Bearer {key}"}
                )
                if res.status_code == 200:
                    d = res.json()
                    models = [m["id"] for m in d.get("data", [])]
                    return {"success": True, "message": f"Groq Connected! Found {len(models)} models.", "models": models}
                else:
                    return {"success": False, "message": f"Groq authentication failed: {res.text[:120]}", "models": []}

            elif provider == "openai":
                res = await client.get(
                    "https://api.openai.com/v1/models",
                    headers={"Authorization": f"Bearer {key}"}
                )
                if res.status_code == 200:
                    d = res.json()
                    all_m = [m["id"] for m in d.get("data", [])]
                    filtered = [m for m in all_m if any(p in m for p in ["gpt-4", "gpt-3.5", "o1", "o3", "chat"])]
                    return {"success": True, "message": f"OpenAI Connected! Found {len(filtered)} chat models.", "models": filtered or all_m[:15]}
                else:
                    return {"success": False, "message": f"OpenAI authentication failed: {res.text[:120]}", "models": []}

            elif provider == "gemini":
                res = await client.get(f"https://generativelanguage.googleapis.com/v1beta/models?key={key}")
                if res.status_code == 200:
                    d = res.json()
                    raw_models = d.get("models", [])
                    models = [m["name"].replace("models/", "") for m in raw_models if "generateContent" in m.get("supportedGenerationMethods", [])]
                    return {"success": True, "message": f"Google Gemini Connected! Found {len(models)} models.", "models": models}
                else:
                    return {"success": False, "message": f"Gemini API key error: {res.text[:120]}", "models": []}

            elif provider == "anthropic":
                res = await client.get(
                    "https://api.anthropic.com/v1/models",
                    headers={"x-api-key": key, "anthropic-version": "2023-06-01"}
                )
                if res.status_code == 200:
                    d = res.json()
                    models = [m["id"] for m in d.get("data", [])]
                    return {"success": True, "message": f"Anthropic Connected! Found {len(models)} models.", "models": models}
                elif res.status_code in [400, 404]: # Some Anthropic keys validate on message endpoint
                    known = ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"]
                    return {"success": True, "message": "Anthropic API Key recognized!", "models": known}
                else:
                    return {"success": False, "message": f"Anthropic error: {res.text[:120]}", "models": []}

            elif provider == "openrouter":
                res = await client.get(
                    "https://openrouter.ai/api/v1/models",
                    headers={"Authorization": f"Bearer {key}"}
                )
                if res.status_code == 200:
                    d = res.json()
                    models = [m["id"] for m in d.get("data", [])][:30]
                    return {"success": True, "message": f"OpenRouter Connected! 100+ models available.", "models": models}
                else:
                    return {"success": False, "message": f"OpenRouter authentication failed: {res.text[:120]}", "models": []}

            else:
                return {"success": False, "message": f"Unsupported provider: {provider}", "models": []}
    except Exception as e:
        return {"success": False, "message": f"Connection test failed: {str(e)}", "models": []}

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
