from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import FileResponse
from typing import List, Optional
import uuid
import shutil
from pathlib import Path
from ..config import UPLOAD_DIR
from ..db.database import get_db
from ..services.doc_service import doc_service
from .auth import get_current_user_id

router = APIRouter(prefix="/api/files", tags=["files"])

@router.post("/upload")
async def upload_files(
    files: List[UploadFile] = File(...),
    conversation_id: Optional[str] = Form(None),
    project_id: Optional[str] = Form(None),
    user_id: str = Depends(get_current_user_id)
):
    results = []
    db = await get_db()
    try:
        for file in files:
            file_id = str(uuid.uuid4())
            safe_filename = file.filename or f"upload_{file_id[:8]}"
            file_ext = Path(safe_filename).suffix
            saved_name = f"{file_id}_{safe_filename}"
            dest_path = UPLOAD_DIR / saved_name

            with open(dest_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            # Extract text & metadata locally
            extracted = doc_service.extract_text(dest_path, safe_filename)
            text_content = extracted.get("text", "")
            file_size = dest_path.stat().st_size

            await db.execute(
                """
                INSERT INTO uploaded_files (id, user_id, conversation_id, project_id, filename, file_path, file_type, file_size, extracted_text)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (file_id, user_id, conversation_id, project_id, safe_filename, str(dest_path), file_ext, file_size, text_content)
            )

            results.append({
                "id": file_id,
                "filename": safe_filename,
                "fileType": file_ext,
                "fileSize": file_size,
                "extractedText": text_content,
                "isImage": file_ext.lower() in [".png", ".jpg", ".jpeg", ".webp", ".gif"],
                "preview": extracted.get("metadata", {}).get("preview", "")
            })

        await db.commit()
        return results
    finally:
        await db.close()

@router.get("/{file_id}")
async def get_file(file_id: str):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM uploaded_files WHERE id = ?", (file_id,))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="File not found.")
        
        file_path = Path(row["file_path"])
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found on disk.")
        
        return FileResponse(path=str(file_path), filename=row["filename"])
    finally:
        await db.close()

@router.delete("/{file_id}")
async def delete_file(file_id: str, user_id: str = Depends(get_current_user_id)):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT file_path FROM uploaded_files WHERE id = ? AND user_id = ?", (file_id, user_id))
        row = await cursor.fetchone()
        if row:
            p = Path(row["file_path"])
            if p.exists():
                p.unlink(missing_ok=True)
            await db.execute("DELETE FROM uploaded_files WHERE id = ? AND user_id = ?", (file_id, user_id))
            await db.commit()
        return {"success": True}
    finally:
        await db.close()
