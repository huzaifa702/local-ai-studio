import aiosqlite
import json
from typing import Any, Dict, List, Optional
from datetime import datetime
from ..config import DB_PATH

async def get_db():
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    return db

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT,
            phone_number TEXT,
            password_hash TEXT,
            google_id TEXT,
            display_name TEXT,
            avatar TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        await db.execute("""
        CREATE TABLE IF NOT EXISTS phone_verifications (
            id TEXT PRIMARY KEY,
            phone_number TEXT NOT NULL,
            otp_code TEXT NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            verified INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        await db.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            user_id TEXT DEFAULT 'local_user',
            title TEXT NOT NULL,
            project_id TEXT,
            is_pinned INTEGER DEFAULT 0,
            is_archived INTEGER DEFAULT 0,
            model TEXT NOT NULL,
            system_prompt TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        await db.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            thought TEXT,
            attachments_json TEXT DEFAULT '[]',
            citations_json TEXT DEFAULT '[]',
            tokens INTEGER DEFAULT 0,
            model TEXT,
            feedback TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE
        );
        """)

        await db.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            user_id TEXT DEFAULT 'local_user',
            name TEXT NOT NULL,
            description TEXT,
            instructions TEXT,
            workspace_path TEXT,
            default_model TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        await db.execute("""
        CREATE TABLE IF NOT EXISTS memories (
            id TEXT PRIMARY KEY,
            user_id TEXT DEFAULT 'local_user',
            project_id TEXT,
            category TEXT DEFAULT 'general',
            content TEXT NOT NULL,
            enabled INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        await db.execute("""
        CREATE TABLE IF NOT EXISTS agent_sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT DEFAULT 'local_user',
            project_id TEXT,
            title TEXT NOT NULL,
            status TEXT DEFAULT 'idle',
            goal TEXT NOT NULL,
            workspace_path TEXT NOT NULL,
            model TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        await db.execute("""
        CREATE TABLE IF NOT EXISTS agent_steps (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            step_number INTEGER NOT NULL,
            step_type TEXT NOT NULL,
            title TEXT,
            thought TEXT,
            tool_name TEXT,
            tool_args_json TEXT,
            tool_result_json TEXT,
            status TEXT DEFAULT 'completed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES agent_sessions (id) ON DELETE CASCADE
        );
        """)

        await db.execute("""
        CREATE TABLE IF NOT EXISTS uploaded_files (
            id TEXT PRIMARY KEY,
            user_id TEXT DEFAULT 'local_user',
            conversation_id TEXT,
            project_id TEXT,
            filename TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_type TEXT,
            file_size INTEGER,
            extracted_text TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        await db.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            id TEXT PRIMARY KEY,
            user_id TEXT UNIQUE DEFAULT 'local_user',
            settings_json TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Migration helper for older SQLite databases (add columns if not exists)
        columns_to_add = [
            ("users", "phone_number", "TEXT"),
            ("users", "google_id", "TEXT"),
            ("messages", "citations_json", "TEXT DEFAULT '[]'"),
            ("uploaded_files", "user_id", "TEXT DEFAULT 'local_user'")
        ]
        for table, col, col_type in columns_to_add:
            try:
                await db.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_type};")
            except Exception:
                pass

        # Insert default local user if not exists
        await db.execute("""
        INSERT OR IGNORE INTO users (id, username, email, display_name, avatar)
        VALUES ('local_user', 'developer', 'local@ai.dev', 'huzaifa rajput', 'HR');
        """)

        # Default settings if not exists
        default_settings = {
            "theme": "dark",
            "defaultModel": "llama3.2:3b",
            "codingModel": "qwen2.5-coder:7b",
            "visionModel": "llava:7b",
            "temperature": 0.7,
            "contextSize": 4096,
            "memoryEnabled": True,
            "voiceEnabled": True,
            "voiceAutoPlay": False,
            "webSearchEnabled": True,
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
        await db.execute("""
        INSERT OR IGNORE INTO settings (id, user_id, settings_json)
        VALUES ('default_settings', 'local_user', ?);
        """, (json.dumps(default_settings),))

        await db.commit()
