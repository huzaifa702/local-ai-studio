from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uuid
import json
import asyncio
from datetime import datetime
from ..db.database import get_db
from ..services.ollama_service import ollama_service
from ..services.memory_service import memory_service
from ..services.search_service import WebSearchService
from .auth import get_current_user_id

router = APIRouter(prefix="/api/chat", tags=["chat"])

class ConversationCreate(BaseModel):
    title: Optional[str] = "New Conversation"
    model: str = "llama3.2:3b"
    projectId: Optional[str] = None
    systemPrompt: Optional[str] = None

class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    isPinned: Optional[bool] = None
    isArchived: Optional[bool] = None
    projectId: Optional[str] = None

class SendMessageRequest(BaseModel):
    conversationId: Optional[str] = None
    content: str
    model: str = "llama3.2:3b"
    systemPrompt: Optional[str] = None
    attachments: Optional[List[Dict[str, Any]]] = []
    images: Optional[List[str]] = []
    temperature: Optional[float] = 0.7
    projectId: Optional[str] = None
    cloudApiKey: Optional[str] = None
    provider: Optional[str] = "ollama"
    webSearchEnabled: Optional[bool] = False
    thinkEnabled: Optional[bool] = False

class FeedbackRequest(BaseModel):
    messageId: str
    feedback: str

class QuickSearchRequest(BaseModel):
    query: str
    maxResults: Optional[int] = 5

@router.post("/search")
async def perform_search(req: QuickSearchRequest, user_id: str = Depends(get_current_user_id)):
    """
    Direct web search endpoint for search bar or assistant citations.
    """
    results = WebSearchService.search(req.query, max_results=req.maxResults or 5)
    return {"query": req.query, "results": results}

@router.get("/conversations")
async def list_conversations(
    user_id: str = Depends(get_current_user_id),
    search: Optional[str] = None,
    project_id: Optional[str] = None,
    include_archived: bool = False
):
    db = await get_db()
    try:
        query = "SELECT * FROM conversations WHERE user_id = ?"
        params = [user_id]
        
        if not include_archived:
            query += " AND is_archived = 0"
        
        if project_id:
            query += " AND project_id = ?"
            params.append(project_id)
            
        if search:
            query += " AND (title LIKE ? OR id IN (SELECT conversation_id FROM messages WHERE content LIKE ?))"
            params.extend([f"%{search}%", f"%{search}%"])
            
        query += " ORDER BY is_pinned DESC, updated_at DESC"
        
        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()
        
        convs = []
        for r in rows:
            c = dict(r)
            m_cursor = await db.execute("SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?", (c["id"],))
            m_count = await m_cursor.fetchone()
            c["messageCount"] = m_count["count"] if m_count else 0
            convs.append(c)
            
        return convs
    finally:
        await db.close()

@router.post("/conversations")
async def create_conversation(req: ConversationCreate, user_id: str = Depends(get_current_user_id)):
    db = await get_db()
    try:
        conv_id = str(uuid.uuid4())
        await db.execute(
            """
            INSERT INTO conversations (id, user_id, title, project_id, is_pinned, is_archived, model, system_prompt)
            VALUES (?, ?, ?, ?, 0, 0, ?, ?)
            """,
            (conv_id, user_id, req.title, req.projectId, req.model, req.systemPrompt)
        )
        await db.commit()
        
        cursor = await db.execute("SELECT * FROM conversations WHERE id = ?", (conv_id,))
        row = await cursor.fetchone()
        res = dict(row)
        res["messageCount"] = 0
        return res
    finally:
        await db.close()

@router.get("/conversations/{conv_id}")
async def get_conversation(conv_id: str, user_id: str = Depends(get_current_user_id)):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM conversations WHERE id = ?", (conv_id,))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        conv = dict(row)
        m_cursor = await db.execute(
            "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
            (conv_id,)
        )
        messages = [dict(m) for m in await m_cursor.fetchall()]
        for m in messages:
            try:
                m["attachments"] = json.loads(m.get("attachments_json") or "[]")
            except Exception:
                m["attachments"] = []
            try:
                m["citations"] = json.loads(m.get("citations_json") or "[]")
            except Exception:
                m["citations"] = []
        conv["messages"] = messages
        return conv
    finally:
        await db.close()

@router.put("/conversations/{conv_id}")
async def update_conversation(conv_id: str, req: ConversationUpdate, user_id: str = Depends(get_current_user_id)):
    db = await get_db()
    try:
        updates = []
        params = []
        if req.title is not None:
            updates.append("title = ?")
            params.append(req.title)
        if req.isPinned is not None:
            updates.append("is_pinned = ?")
            params.append(1 if req.isPinned else 0)
        if req.isArchived is not None:
            updates.append("is_archived = ?")
            params.append(1 if req.isArchived else 0)
        if req.projectId is not None:
            updates.append("project_id = ?")
            params.append(req.projectId)

        if updates:
            updates.append("updated_at = CURRENT_TIMESTAMP")
            params.append(conv_id)
            await db.execute(f"UPDATE conversations SET {', '.join(updates)} WHERE id = ?", params)
            await db.commit()

        cursor = await db.execute("SELECT * FROM conversations WHERE id = ?", (conv_id,))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return dict(row)
    finally:
        await db.close()

@router.delete("/conversations/{conv_id}")
async def delete_conversation(conv_id: str, user_id: str = Depends(get_current_user_id)):
    db = await get_db()
    try:
        await db.execute("DELETE FROM messages WHERE conversation_id = ?", (conv_id,))
        await db.execute("DELETE FROM conversations WHERE id = ?", (conv_id,))
        await db.commit()
        return {"success": True}
    finally:
        await db.close()

@router.delete("/conversations")
async def clear_all_conversations(user_id: str = Depends(get_current_user_id)):
    db = await get_db()
    try:
        await db.execute(
            "DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE user_id = ?)",
            (user_id,)
        )
        await db.execute("DELETE FROM conversations WHERE user_id = ?", (user_id,))
        await db.commit()
        return {"success": True}
    finally:
        await db.close()

def should_auto_search(text: str) -> bool:
    keywords = ["latest", "news", "today", "price of", "weather", "who won", "current", "release date", "stock", "update on"]
    t = text.lower()
    return any(k in t for k in keywords)

@router.post("/send")
async def send_message(req: SendMessageRequest, user_id: str = Depends(get_current_user_id)):
    db = await get_db()
    try:
        conv_id = req.conversationId
        
        # 1. Create conversation if not provided
        if not conv_id:
            conv_id = str(uuid.uuid4())
            auto_title = req.content[:35] + ("..." if len(req.content) > 35 else "")
            await db.execute(
                """
                INSERT INTO conversations (id, user_id, title, project_id, is_pinned, is_archived, model, system_prompt)
                VALUES (?, ?, ?, ?, 0, 0, ?, ?)
                """,
                (conv_id, user_id, auto_title, req.projectId, req.model, req.systemPrompt)
            )
            await db.commit()

        # 2. Web Search Engine integration
        search_citations = []
        search_context = ""
        
        if req.webSearchEnabled or should_auto_search(req.content):
            try:
                # Clean query for search
                clean_query = req.content.replace("search for", "").replace("search", "").strip()
                search_results = WebSearchService.search(clean_query[:100], max_results=5)
                if search_results:
                    search_citations = search_results
                    search_context = WebSearchService.format_search_context(search_results)
            except Exception as e:
                print(f"Web search execution error: {e}")

        # 3. Build document attachments context
        doc_context = ""
        if req.attachments:
            doc_context += "\n\n[Attached Local Documents/Files]:\n"
            for att in req.attachments:
                fname = att.get("filename", "file")
                ftext = att.get("extractedText", "")
                if ftext:
                    doc_context += f"--- Begin File: {fname} ---\n{ftext}\n--- End File: {fname} ---\n"

        full_user_content = req.content + doc_context

        # 4. Store User message in DB
        user_msg_id = str(uuid.uuid4())
        await db.execute(
            """
            INSERT INTO messages (id, conversation_id, role, content, attachments_json, model)
            VALUES (?, ?, 'user', ?, ?, ?)
            """,
            (user_msg_id, conv_id, full_user_content, json.dumps(req.attachments or []), req.model)
        )
        await db.commit()

        # 5. Fetch prior message history
        cursor = await db.execute(
            "SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
            (conv_id,)
        )
        history_rows = await cursor.fetchall()
        messages_payload = [{"role": r["role"], "content": r["content"]} for r in history_rows]

        # 6. Inject memory + web search into system prompt
        memory_ctx = await memory_service.format_memory_prompt(user_id, req.projectId)
        base_system = req.systemPrompt or "You are a powerful, intelligent, and concise AI assistant running locally and privately."
        if req.thinkEnabled:
            base_system += "\n\nProvide deep step-by-step reasoning and logical analysis before delivering your answer."
            
        full_system_prompt = base_system + memory_ctx + search_context

        # 7. Stream generator
        assistant_msg_id = str(uuid.uuid4())
        
        async def event_stream():
            init_payload = {
                'type': 'init', 
                'conversationId': conv_id, 
                'userMessageId': user_msg_id, 
                'assistantMessageId': assistant_msg_id,
                'citations': search_citations
            }
            yield f"data: {json.dumps(init_payload)}\n\n"
            
            collected_response = []
            
            async for token in ollama_service.stream_chat(
                model=req.model,
                messages=messages_payload,
                system_prompt=full_system_prompt,
                images=req.images,
                temperature=req.temperature or 0.7,
                cloud_api_key=req.cloudApiKey,
                provider=req.provider or "ollama"
            ):
                if "error" in token:
                    err_msg = token["error"]
                    collected_response.append(f"\n\n> ⚠️ **Error**: {err_msg}")
                    yield f"data: {json.dumps({'type': 'error', 'error': err_msg})}\n\n"
                    break
                
                content = token.get("content", "")
                done = token.get("done", False)
                if content:
                    collected_response.append(content)
                    yield f"data: {json.dumps({'type': 'token', 'content': content})}\n\n"
                if done:
                    break

            final_content = "".join(collected_response)
            
            # Save assistant message to SQLite
            db_save = await get_db()
            try:
                await db_save.execute(
                    """
                    INSERT INTO messages (id, conversation_id, role, content, model, citations_json)
                    VALUES (?, ?, 'assistant', ?, ?, ?)
                    """,
                    (assistant_msg_id, conv_id, final_content, req.model, json.dumps(search_citations))
                )
                await db_save.execute(
                    "UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                    (conv_id,)
                )
                await db_save.commit()
            finally:
                await db_save.close()

            yield f"data: {json.dumps({'type': 'done', 'finalContent': final_content, 'citations': search_citations})}\n\n"

        return StreamingResponse(event_stream(), media_type="text/event-stream")
    finally:
        await db.close()

@router.post("/messages/{message_id}/feedback")
async def submit_feedback(message_id: str, req: FeedbackRequest):
    db = await get_db()
    try:
        await db.execute(
            "UPDATE messages SET feedback = ? WHERE id = ?",
            (req.feedback, message_id)
        )
        await db.commit()
        return {"success": True}
    finally:
        await db.close()

@router.delete("/messages/{message_id}")
async def delete_message(message_id: str):
    db = await get_db()
    try:
        await db.execute("DELETE FROM messages WHERE id = ?", (message_id,))
        await db.commit()
        return {"success": True}
    finally:
        await db.close()
