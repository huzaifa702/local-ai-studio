from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uuid
from ..db.database import get_db
from .auth import get_current_user_id

router = APIRouter(prefix="/api/memory", tags=["memory"])

class MemoryCreate(BaseModel):
    content: str
    category: Optional[str] = "general"
    projectId: Optional[str] = None

class MemoryUpdate(BaseModel):
    content: Optional[str] = None
    category: Optional[str] = None
    enabled: Optional[bool] = None

@router.get("")
async def list_memories(user_id: str = Depends(get_current_user_id), project_id: Optional[str] = None):
    db = await get_db()
    try:
        if project_id:
            cursor = await db.execute("SELECT * FROM memories WHERE user_id = ? AND (project_id = ? OR project_id IS NULL) ORDER BY updated_at DESC", (user_id, project_id))
        else:
            cursor = await db.execute("SELECT * FROM memories WHERE user_id = ? ORDER BY updated_at DESC", (user_id,))
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        await db.close()

@router.post("")
async def add_memory(req: MemoryCreate, user_id: str = Depends(get_current_user_id)):
    db = await get_db()
    try:
        mem_id = str(uuid.uuid4())
        await db.execute(
            """
            INSERT INTO memories (id, user_id, project_id, category, content, enabled)
            VALUES (?, ?, ?, ?, ?, 1)
            """,
            (mem_id, user_id, req.projectId, req.category or "general", req.content)
        )
        await db.commit()
        cursor = await db.execute("SELECT * FROM memories WHERE id = ?", (mem_id,))
        row = await cursor.fetchone()
        return dict(row)
    finally:
        await db.close()

@router.put("/{memory_id}")
async def update_memory(memory_id: str, req: MemoryUpdate, user_id: str = Depends(get_current_user_id)):
    db = await get_db()
    try:
        updates = []
        params = []
        if req.content is not None:
            updates.append("content = ?")
            params.append(req.content)
        if req.category is not None:
            updates.append("category = ?")
            params.append(req.category)
        if req.enabled is not None:
            updates.append("enabled = ?")
            params.append(1 if req.enabled else 0)

        if updates:
            updates.append("updated_at = CURRENT_TIMESTAMP")
            params.append(memory_id)
            params.append(user_id)
            await db.execute(f"UPDATE memories SET {', '.join(updates)} WHERE id = ? AND user_id = ?", params)
            await db.commit()

        cursor = await db.execute("SELECT * FROM memories WHERE id = ?", (memory_id,))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Memory not found")
        return dict(row)
    finally:
        await db.close()

@router.delete("/{memory_id}")
async def delete_memory(memory_id: str, user_id: str = Depends(get_current_user_id)):
    db = await get_db()
    try:
        await db.execute("DELETE FROM memories WHERE id = ? AND user_id = ?", (memory_id, user_id))
        await db.commit()
        return {"success": True}
    finally:
        await db.close()
