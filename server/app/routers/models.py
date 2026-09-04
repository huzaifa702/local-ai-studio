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

def infer_provider_from_key(key: str) -> Optional[str]:
    k = (key or "").strip()
    if k.startswith("gsk_"):
        return "groq"
    if k.startswith("sk-ant-"):
        return "anthropic"
    if k.startswith("sk-or-"):
        return "openrouter"
    if k.startswith("AIzaSy"):
        return "gemini"
    if k.startswith("hf_"):
        return "huggingface"
    if k.startswith("sk-proj-") or (k.startswith("sk-") and len(k) > 30):
        return "openai"
    return None

def classify_model(model_id: str, provider: str) -> Dict[str, Any]:
    mid = model_id.lower()
    
    # 1. Video detection (generation & video-LLMs)
    is_video = any(k in mid for k in [
        "video", "cogvideo", "hunyuan", "animatediff", "luma", "runway", "svd", 
        "kling", "sora", "pika", "video-llava", "minimax", "gen-2", "gen-3"
    ])
    
    # 2. Image generation detection
    is_image = any(k in mid for k in [
        "dall-e", "imagen", "flux", "stable-diffusion", "sdxl", "midjourney", 
        "recraft", "aurora", "sd-", "image-generation", "text-to-image"
    ])
    
    # 3. Vision / Multimodal detection
    is_vision = any(k in mid for k in [
        "vision", "moondream", "llava", "qwen-vl", "qwen2-vl", "vl", "gpt-4o", 
        "gemini", "claude-3", "llama-3.2-11b-vision", "pixtral", "internvl"
    ])
    
    # 4. Coding / Software Engineering detection
    is_coding = any(k in mid for k in [
        "coder", "coding", "codellama", "starcoder", "deepseek-coder", 
        "qwen2.5-coder", "code", "codestral", "devstral", "codegeex"
    ])
    
    # 5. Reasoning / Thinking detection (Chain-of-Thought)
    is_thinking = any(k in mid for k in [
        "r1", "o1", "o3", "reasoning", "thinking", "qwq", "claude-3-7", 
        "sonar-reasoning", "marco-o1"
    ])
    
    # 6. Audio / Speech detection
    is_audio = any(k in mid for k in [
        "whisper", "tts", "audio", "speech", "voice", "nova-2", "chatter"
    ])
    
    # 7. Text capability (most models, unless pure audio/image)
    is_text = not (is_audio and not (is_vision or is_coding or is_thinking or is_video))
    
    clean_name = model_id.split("/")[-1].replace("-", " ").replace(":", " ").title()
    
    # Determine dominant primary category
    if is_video:
        category = "video"
    elif is_image:
        category = "image"
    elif is_coding:
        category = "coding"
    elif is_thinking:
        category = "reasoning"
    elif is_vision:
        category = "vision"
    elif is_audio:
        category = "audio"
    else:
        category = "text"
        
    return {
        "id": model_id,
        "name": clean_name,
        "provider": provider,
        "capabilities": {
            "text": is_text,
            "coding": is_coding,
            "image": is_image,
            "video": is_video,
            "vision": is_vision,
            "audio": is_audio,
            "thinking": is_thinking
        },
        "category": category,
        "thinkingEffort": "MEDIUM" if is_thinking else "OFF"
    }

@router.post("/test-key")
async def test_provider_key(req: TestKeyRequest):
    raw_provider = (req.provider or "").lower().strip()
    key = (req.apiKey or "").strip()

    # Auto-detect provider if provider is "auto" or empty
    if not raw_provider or raw_provider in ["auto", "detect"]:
        inferred = infer_provider_from_key(key)
        if inferred:
            provider = inferred
        elif key.startswith("ollama") or not key:
            provider = "ollama"
        else:
            provider = "openai"
    else:
        provider = raw_provider

    if provider == "ollama":
        running = await ollama_service.is_running()
        if not running:
            return {"success": False, "message": "Ollama service is not reachable at localhost:11434", "models": [], "detectedModels": []}
        data = await ollama_service.get_models()
        raw_models = [m["name"] for m in data.get("installedModels", [])]
        categorized = [classify_model(m, "ollama") for m in raw_models]
        return {
            "success": True,
            "provider": "ollama",
            "message": f"Connected to Ollama! Detected {len(categorized)} local models.",
            "models": raw_models,
            "detectedModels": categorized,
            "counts": {
                "text": sum(1 for m in categorized if m["capabilities"]["text"]),
                "coding": sum(1 for m in categorized if m["capabilities"]["coding"]),
                "image": sum(1 for m in categorized if m["capabilities"]["image"]),
                "video": sum(1 for m in categorized if m["capabilities"]["video"]),
                "vision": sum(1 for m in categorized if m["capabilities"]["vision"]),
                "audio": sum(1 for m in categorized if m["capabilities"]["audio"]),
                "thinking": sum(1 for m in categorized if m["capabilities"]["thinking"])
            }
        }

    if not key:
        return {"success": False, "provider": provider, "message": "API key cannot be empty.", "models": [], "detectedModels": []}

    import httpx
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            raw_models = []
            if provider == "groq":
                res = await client.get(
                    "https://api.groq.com/openai/v1/models",
                    headers={"Authorization": f"Bearer {key}"}
                )
                if res.status_code == 200:
                    d = res.json()
                    raw_models = [m["id"] for m in d.get("data", [])]
                else:
                    return {"success": False, "provider": "groq", "message": f"Groq authentication failed: {res.text[:120]}", "models": [], "detectedModels": []}

            elif provider == "openai":
                res = await client.get(
                    "https://api.openai.com/v1/models",
                    headers={"Authorization": f"Bearer {key}"}
                )
                if res.status_code == 200:
                    d = res.json()
                    all_m = [m["id"] for m in d.get("data", [])]
                    raw_models = [m for m in all_m if any(p in m for p in ["gpt-4", "gpt-3.5", "o1", "o3", "chat", "dall-e", "whisper", "tts", "sora"])] or all_m[:25]
                else:
                    return {"success": False, "provider": "openai", "message": f"OpenAI authentication failed: {res.text[:120]}", "models": [], "detectedModels": []}

            elif provider == "gemini":
                res = await client.get(f"https://generativelanguage.googleapis.com/v1beta/models?key={key}")
                if res.status_code == 200:
                    d = res.json()
                    raw_models = [m["name"].replace("models/", "") for m in d.get("models", []) if "generateContent" in m.get("supportedGenerationMethods", [])]
                else:
                    return {"success": False, "provider": "gemini", "message": f"Gemini API key error: {res.text[:120]}", "models": [], "detectedModels": []}

            elif provider == "anthropic":
                res = await client.get(
                    "https://api.anthropic.com/v1/models",
                    headers={"x-api-key": key, "anthropic-version": "2023-06-01"}
                )
                if res.status_code == 200:
                    d = res.json()
                    raw_models = [m["id"] for m in d.get("data", [])]
                else:
                    raw_models = [
                        "claude-3-7-sonnet-20250219",
                        "claude-3-5-sonnet-20241022", 
                        "claude-3-5-haiku-20241022", 
                        "claude-3-opus-20240229"
                    ]

            elif provider == "openrouter":
                res = await client.get(
                    "https://openrouter.ai/api/v1/models",
                    headers={"Authorization": f"Bearer {key}"}
                )
                if res.status_code == 200:
                    d = res.json()
                    raw_models = [m["id"] for m in d.get("data", [])][:40]
                else:
                    return {"success": False, "provider": "openrouter", "message": f"OpenRouter authentication failed: {res.text[:120]}", "models": [], "detectedModels": []}

            elif provider in ["huggingface", "hf"]:
                res = await client.get(
                    "https://huggingface.co/api/models?sort=downloads&direction=-1&limit=30",
                    headers={"Authorization": f"Bearer {key}"}
                )
                if res.status_code == 200:
                    d = res.json()
                    raw_models = [m["id"] for m in d]
                else:
                    raw_models = [
                        "black-forest-labs/FLUX.1-schnell",
                        "stabilityai/stable-diffusion-xl-base-1.0",
                        "Qwen/Qwen2.5-Coder-7B-Instruct",
                        "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
                        "THUDM/CogVideoX-5B",
                        "vikhyatk/moondream2"
                    ]
            else:
                return {"success": False, "provider": provider, "message": f"Unsupported provider: {provider}", "models": [], "detectedModels": []}

            categorized = [classify_model(m, provider) for m in raw_models]
            return {
                "success": True,
                "provider": provider,
                "message": f"Connected to {provider.upper()}! Detected {len(categorized)} models.",
                "models": raw_models,
                "detectedModels": categorized,
                "counts": {
                    "text": sum(1 for m in categorized if m["capabilities"]["text"]),
                    "coding": sum(1 for m in categorized if m["capabilities"]["coding"]),
                    "image": sum(1 for m in categorized if m["capabilities"]["image"]),
                    "video": sum(1 for m in categorized if m["capabilities"]["video"]),
                    "vision": sum(1 for m in categorized if m["capabilities"]["vision"]),
                    "audio": sum(1 for m in categorized if m["capabilities"]["audio"]),
                    "thinking": sum(1 for m in categorized if m["capabilities"]["thinking"])
                }
            }
    except Exception as e:
        return {"success": False, "provider": provider, "message": f"Connection test failed: {str(e)}", "models": [], "detectedModels": []}

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
