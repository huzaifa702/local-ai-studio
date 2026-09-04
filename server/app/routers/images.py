import os
import uuid
import datetime
import httpx
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

router = APIRouter(prefix="/api/images", tags=["images"])

IMAGES_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "generated_images"
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

class GenerateImageRequest(BaseModel):
    prompt: str
    style: Optional[str] = "Anime"
    aspectRatio: Optional[str] = "1:1"
    provider: Optional[str] = "pollinations"
    apiKey: Optional[str] = None

STYLE_MODIFIERS = {
    "Anime": "masterpiece anime style, dark fantasy manga aesthetic, high contrast dramatic lighting, highly detailed",
    "Photorealistic": "photorealistic 8k uhd, cinematic lighting, sharp focus, octane render, raw photo",
    "Sticker": "die-cut vector sticker, clean white border, vibrant colors, bold outlines, flat design illustration",
    "3D Render": "blender 3d render, claymorphism, smooth volumetric lighting, modern pixar art station",
    "Cyberpunk": "futuristic neon cyberpunk city, glowing holographic accents, rain soaked reflections, dark sci-fi",
    "Fantasy": "epic dark fantasy landscape, mystical fog, ancient ruins, Elden Ring ethereal mood, ultra detailed"
}

ASPECT_RATIOS = {
    "1:1": (1024, 1024),
    "16:9": (1280, 720),
    "9:16": (720, 1280),
    "4:3": (1024, 768)
}

@router.post("/generate")
async def generate_image(req: GenerateImageRequest):
    p = req.prompt.strip()
    if not p:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")

    modifier = STYLE_MODIFIERS.get(req.style, "")
    full_prompt = f"{p}, {modifier}" if modifier else p
    width, height = ASPECT_RATIOS.get(req.aspectRatio, (1024, 1024))
    img_id = f"img_{uuid.uuid4().hex[:12]}"
    out_path = IMAGES_DIR / f"{img_id}.jpg"

    # 1. OpenAI DALL-E 3 Provider
    if req.apiKey and req.provider == "openai":
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                res = await client.post(
                    "https://api.openai.com/v1/images/generations",
                    headers={"Authorization": f"Bearer {req.apiKey}"},
                    json={
                        "model": "dall-e-3",
                        "prompt": full_prompt[:1000],
                        "n": 1,
                        "size": "1024x1024",
                        "quality": "standard"
                    }
                )
                if res.status_code == 200:
                    d = res.json()
                    openai_url = d["data"][0]["url"]
                    # Download and cache locally
                    dl = await client.get(openai_url, timeout=30.0)
                    if dl.status_code == 200:
                        out_path.write_bytes(dl.content)
                        return {
                            "success": True,
                            "id": img_id,
                            "prompt": p,
                            "style": req.style,
                            "url": f"/api/images/view/{img_id}.jpg",
                            "directUrl": openai_url,
                            "provider": "openai-dalle3",
                            "createdAt": datetime.datetime.utcnow().isoformat()
                        }
        except Exception as e:
            print(f"OpenAI Image Gen error: {e}, falling back to Pollinations")

    # 2. HuggingFace Inference API (Free Flux.1 / SDXL)
    if req.apiKey and (req.provider == "huggingface" or req.apiKey.startswith("hf_")):
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                res = await client.post(
                    "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
                    headers={"Authorization": f"Bearer {req.apiKey}"},
                    json={"inputs": full_prompt}
                )
                if res.status_code == 200:
                    out_path.write_bytes(res.content)
                    return {
                        "success": True,
                        "id": img_id,
                        "prompt": p,
                        "style": req.style,
                        "url": f"/api/images/view/{img_id}.jpg",
                        "provider": "huggingface-flux",
                        "createdAt": datetime.datetime.utcnow().isoformat()
                    }
        except Exception as e:
            print(f"HuggingFace Gen error: {e}, falling back to Pollinations")

    # 3. Pollinations AI (100% Free, Flux & Turbo Engine, No API Key Required)
    import urllib.parse
    encoded = urllib.parse.quote(full_prompt)
    seed = int(datetime.datetime.utcnow().timestamp() * 1000) % 1000000

    # Try flux first, fallback to turbo
    urls_to_try = [
        f"https://image.pollinations.ai/prompt/{encoded}?width={width}&height={height}&seed={seed}&nologo=true&model=flux",
        f"https://image.pollinations.ai/prompt/{encoded}?width={width}&height={height}&seed={seed}&nologo=true&model=turbo"
    ]

    last_err = None
    for target_url in urls_to_try:
        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                res = await client.get(target_url, headers={"User-Agent": "Mozilla/5.0"})
                if res.status_code == 200 and len(res.content) > 1000:
                    out_path.write_bytes(res.content)
                    return {
                        "success": True,
                        "id": img_id,
                        "prompt": p,
                        "style": req.style,
                        "url": f"/api/images/view/{img_id}.jpg",
                        "directUrl": target_url,
                        "provider": "pollinations-flux",
                        "createdAt": datetime.datetime.utcnow().isoformat()
                    }
        except Exception as e:
            last_err = e
            continue

    # If network timeout on server, return direct cloud image url so frontend loads it directly
    direct_fallback = urls_to_try[0]
    return {
        "success": True,
        "id": img_id,
        "prompt": p,
        "style": req.style,
        "url": direct_fallback,
        "directUrl": direct_fallback,
        "provider": "pollinations-flux-direct",
        "createdAt": datetime.datetime.utcnow().isoformat()
    }

@router.get("/view/{filename}")
async def view_image(filename: str):
    file_path = IMAGES_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found.")
    return FileResponse(path=file_path, media_type="image/jpeg")

@router.get("/gallery")
async def list_gallery():
    items = []
    for f in sorted(IMAGES_DIR.glob("*.jpg"), key=os.path.getmtime, reverse=True)[:30]:
        items.append({
            "id": f.stem,
            "filename": f.name,
            "url": f"/api/images/view/{f.name}",
            "createdAt": datetime.datetime.fromtimestamp(f.stat().st_mtime).isoformat()
        })
    return items
