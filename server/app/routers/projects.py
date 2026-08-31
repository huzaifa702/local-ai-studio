from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uuid
from ..db.database import get_db
from .auth import get_current_user_id

router = APIRouter(prefix="/api/projects", tags=["projects"])

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    instructions: Optional[str] = ""
    defaultModel: Optional[str] = "llama3.2:3b"
    workspacePath: Optional[str] = ""

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    defaultModel: Optional[str] = None
    workspacePath: Optional[str] = None

@router.get("")
async def list_projects(user_id: str = Depends(get_current_user_id)):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC", (user_id,))
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        await db.close()

@router.post("")
async def create_project(req: ProjectCreate, user_id: str = Depends(get_current_user_id)):
    db = await get_db()
    try:
        project_id = str(uuid.uuid4())
        await db.execute(
            """
            INSERT INTO projects (id, user_id, name, description, instructions, default_model, workspace_path)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (project_id, user_id, req.name, req.description, req.instructions, req.defaultModel, req.workspacePath)
        )
        await db.commit()
        cursor = await db.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
        row = await cursor.fetchone()
        return dict(row)
    finally:
        await db.close()

@router.put("/{project_id}")
async def update_project(project_id: str, req: ProjectUpdate, user_id: str = Depends(get_current_user_id)):
    db = await get_db()
    try:
        updates = []
        params = []
        if req.name is not None:
            updates.append("name = ?")
            params.append(req.name)
        if req.description is not None:
            updates.append("description = ?")
            params.append(req.description)
        if req.instructions is not None:
            updates.append("instructions = ?")
            params.append(req.instructions)
        if req.defaultModel is not None:
            updates.append("default_model = ?")
            params.append(req.defaultModel)
        if req.workspacePath is not None:
            updates.append("workspace_path = ?")
            params.append(req.workspacePath)

        if updates:
            updates.append("updated_at = CURRENT_TIMESTAMP")
            params.append(project_id)
            params.append(user_id)
            await db.execute(f"UPDATE projects SET {', '.join(updates)} WHERE id = ? AND user_id = ?", params)
            await db.commit()

        cursor = await db.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Project not found")
        return dict(row)
    finally:
        await db.close()

@router.delete("/{project_id}")
async def delete_project(project_id: str, user_id: str = Depends(get_current_user_id)):
    db = await get_db()
    try:
        await db.execute("DELETE FROM projects WHERE id = ? AND user_id = ?", (project_id, user_id))
        await db.commit()
        return {"success": True}
    finally:
        await db.close()
