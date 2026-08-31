from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional
import json
from ..db.database import get_db
from .auth import get_current_user_id

router = APIRouter(prefix="/api/settings", tags=["settings"])

DEFAULT_SETTINGS = {
    "theme": "dark",
    "defaultModel": "llama3.2:3b",
    "codingModel": "qwen2.5-coder:7b",
    "visionModel": "llava:7b",
    "temperature": 0.7,
    "contextSize": 4096,
    "memoryEnabled": True,
    "voiceEnabled": True,
    "voiceAutoPlay": False,
    "voiceVoice": "default",
    "webSearchEnabled": True,
    "systemPrompt": "You are a helpful, intelligent, and precise AI assistant running locally and privately.",
    "hardwareProfile": "ZBook-16GB",
    "apiKeys": {
        "openai": "",
        "groq": "",
        "anthropic": "",
        "openrouter": "",
        "gemini": "",
        "tavily": ""
    }
}

@router.get("")
async def get_settings(user_id: str = Depends(get_current_user_id)):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT settings_json FROM settings WHERE user_id = ?", (user_id,))
        row = await cursor.fetchone()
        if row and row["settings_json"]:
            try:
                saved = json.loads(row["settings_json"])
                merged = {**DEFAULT_SETTINGS, **saved}
                return merged
            except Exception:
                pass
        return DEFAULT_SETTINGS
    finally:
        await db.close()

@router.put("")
async def update_settings(settings: Dict[str, Any], user_id: str = Depends(get_current_user_id)):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT settings_json FROM settings WHERE user_id = ?", (user_id,))
        row = await cursor.fetchone()
        curr = {}
        if row and row["settings_json"]:
            try:
                curr = json.loads(row["settings_json"])
            except Exception:
                pass
        
        updated = {**curr, **settings}
        updated_json = json.dumps(updated)

        await db.execute(
            """
            INSERT INTO settings (id, user_id, settings_json, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET settings_json = ?, updated_at = CURRENT_TIMESTAMP
            """,
            (f"settings_{user_id}", user_id, updated_json, updated_json)
        )
        await db.commit()
        return updated
    finally:
        await db.close()
