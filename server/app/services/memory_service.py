import aiosqlite
from typing import List, Dict, Any, Optional
from ..db.database import get_db

class MemoryService:
    async def get_active_memories(self, user_id: str = "local_user", project_id: Optional[str] = None) -> List[Dict[str, Any]]:
        db = await get_db()
        try:
            query = "SELECT * FROM memories WHERE user_id = ? AND enabled = 1"
            params = [user_id]
            if project_id:
                query += " AND (project_id = ? OR project_id IS NULL)"
                params.append(project_id)
            query += " ORDER BY updated_at DESC LIMIT 50"
            
            cursor = await db.execute(query, params)
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
        finally:
            await db.close()

    async def format_memory_prompt(self, user_id: str = "local_user", project_id: Optional[str] = None) -> str:
        memories = await self.get_active_memories(user_id, project_id)
        if not memories:
            return ""
        
        lines = ["\n[Local AI Memory Context - Remembered user preferences and context]:"]
        for m in memories:
            cat = f"({m['category']}) " if m.get('category') else ""
            lines.append(f"- {cat}{m['content']}")
        lines.append("")
        return "\n".join(lines)

memory_service = MemoryService()
