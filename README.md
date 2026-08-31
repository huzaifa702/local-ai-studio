# ⚡ LocalAI Studio

> **100% Private, Locally Hosted AI Platform with Offline Ollama Models, Real-Time Voice Mode, Web Search, Multi-User Authentication, and Persistent SQLite Memory.**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.115-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2019%20+%20TypeScript-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![Ollama](https://img.shields.io/badge/AI%20Engine-Ollama%20Local-black.svg?style=flat&logo=ollama)](https://ollama.com)
[![Database](https://img.shields.io/badge/Database-SQLite%203%20%28aiosqlite%29-003B57.svg?style=flat&logo=sqlite)](https://sqlite.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🌟 Overview

**LocalAI Studio** is a private, ChatGPT-style web platform and AI workspace engine built from the ground up to run locally on your own computer. All conversations, document embeddings, user profiles, and persistent memories remain **100% private on your local SSD** with zero telemetry.

Designed with exact visual parity to modern AI platforms, it combines high-performance local LLM execution through **Ollama** with live **Web Search**, **Real-Time Voice Assistant** with Push-to-Talk and interruption handling, **Multi-User Authentication**, and **Project Workspaces**.

---

## 💻 Target Hardware Specification

Tested and optimized for performance on laptop workstations:
- **Baseline Machine:** HP ZBook 15 G3 Workstation
- **Processor:** Intel Core i7 (8 Threads)
- **Memory:** 16 GB DDR3 RAM
- **Dedicated Graphics:** NVIDIA Quadro M2000M (4 GB GDDR5 VRAM)
- **Storage:** 500 GB SATA SSD
- **Operating System:** Windows 10 / 11, Linux, or macOS

---

## 🚀 Key Features

### 1. 🎨 ChatGPT Web Interface Parity
- **Clean Floating Pill Input Bar:** Includes `+` document attachment picker, auto-resizing textarea, `🧠 Think` step-by-step reasoning toggle, `🌐 Search` live web toggle, `🎙️ Mic` dictation, and **🔵 Solid Blue Circular Voice Button**.
- **Collapsible Sidebar:** *+ New chat*, *Projects*, *Models Hub*, *Memory & Context*, *Settings*, and full search over past conversations.
- **Message Feed Layout:** Right-aligned user pills and left-aligned assistant responses with syntax-highlighted code blocks, copy button, collapsible `<think>` reasoning accordions ("Thought for Xs"), and live clickable citation preview cards.

### 2. 🔐 Real Multi-User Authentication & Data Isolation
- **Email & Password:** Registration and login with salted SHA-256 password hashing and 30-day JWT sessions.
- **Google Sign-In:** Official Google Identity Services integration (`https://accounts.google.com/gsi/client`) verified on backend via Google's `tokeninfo` endpoint.
- **Account Partitioning:** Strict database scoping (`WHERE user_id = ?`) across chats, projects, files, and memories.

### 3. 🌐 Integrated Real-Time Web Search Engine
- **Zero-Config Search:** Scrapes and parses DuckDuckGo HTML & Instant Answer API without requiring paid API keys.
- **Tavily Fallback:** Supports Tavily Search API keys configured in settings.
- **Citation Cards:** Direct source attribution with titles, favicons, domain names, and clickable links embedded in chat responses.

### 4. 🎙️ Low-Latency Real-Time Voice Assistant
- **Push-to-Talk (PTT):** Hold **Spacebar** or the central visualizer orb to speak, and release to send instantly.
- **Hands-Free Mode:** Continuous speech activity detection with auto-reply.
- **Speech Interruption:** AI audio playback cuts off immediately the moment you speak or press spacebar.
- **Fluid Waveform Visualizer:** Animated dynamic rings matching ChatGPT Voice.

### 5. 🧠 Persistent SQLite Memory System
- Stores long-term user preferences, coding habits, and project guidelines.
- Automatically formats and injects remembered context into the model's system prompt.

### 6. 📁 Multi-Format File & Document Analysis
- Extracts text locally from **PDF** (`pypdf`), **Word** (`python-docx`), **CSV**, **Markdown**, **JSON**, and **Code files**.
- Direct visual support for screenshots and images with vision models (`moondream:latest` and `llava:7b`).

### 7. 🛠️ Model Hub & Hardware Telemetry
- In-app model discovery, 1-click model download with live percentage progress bar, and real-time RAM/VRAM telemetry via `psutil`.

---

## 📦 Curated Models & Hardware Footprint

| Model Name | Size on Disk | VRAM Required | Ideal Use Case |
| :--- | :---: | :---: | :--- |
| **`llama3.2:3b`** | **2.0 GB** | **2.0 GB** | Ultra-fast conversational chat, voice assistant, and general tasks. |
| **`moondream:latest`** | **1.7 GB** | **1.5 GB** | Lightweight multimodal vision model for images & screenshots. |
| **`qwen2.5-coder:7b`** | **4.7 GB** | **3.8 GB** | Coding intelligence specialist (Python, TypeScript, SQL, HTML). |
| **`deepseek-r1:7b`** | **4.7 GB** | **3.8 GB** | Deep mathematical reasoning and step-by-step logic chains. |

---

## 🏗️ Architecture

```
                       ┌────────────────────────────────────────┐
                       │          USER (Browser Client)         │
                       │          http://localhost:5173         │
                       └───────────────────┬────────────────────┘
                                           │ HTTP / SSE Stream
                                           ▼
                       ┌────────────────────────────────────────┐
                       │        FASTAPI BACKEND SERVER          │
                       │          http://127.0.0.1:8000         │
                       └───────────────────┬────────────────────┘
                                           │
         ┌─────────────────────────────────┼──────────────────────────────────┐
         │                                 │                                  │
         ▼                                 ▼                                  ▼
┌──────────────────┐             ┌───────────────────┐             ┌───────────────────┐
│   AUTH & JWT     │             │    CHAT ENGINE    │             │   DOCUMENT PARSER │
│  (auth.py)       │             │    (chat.py)      │             │  (doc_service.py) │
│ - Email/Password │             │ - SSE Streaming   │             │ - PDF (pypdf)     │
│ - Google OAuth   │             │ - Context Builder │             │ - DOCX (docx)     │
│ - SQLite Storage │             │ - History Manager │             │ - CSV / Code / MD │
└────────┬─────────┘             └─────────┬─────────┘             └─────────┬─────────┘
         │                                 │                                 │
         │                                 ├────────────────┐                │
         ▼                                 ▼                ▼                ▼
┌──────────────────┐             ┌───────────────────┐ ┌─────────┐ ┌───────────────────┐
│  SQLITE DATABASE │             │    SEARCH ENGINE  │ │ MEMORY  │ │  LOCAL STORAGE    │
│ (ai_platform.db) │             │ (search_service)  │ │(memory) │ │ (data/uploads/)   │
│ - users          │             │ - DuckDuckGo Web  │ │- SQLite │ └───────────────────┘
│ - conversations  │             │ - Tavily Search   │ │- Inject │
│ - messages       │             │ - Source Citation │ └─────────┘
│ - projects       │             └───────────────────┘
│ - memories       │                       │
│ - files          │                       ▼
└──────────────────┘             ┌────────────────────────────────────────┐
                                 │          OLLAMA LOCAL DAEMON           │
                                 │         http://127.0.0.1:11434         │
                                 │ - llama3.2:3b (Chat / Voice)           │
                                 │ - moondream:latest (Vision)            │
                                 │ - qwen2.5-coder:7b (Coding)            │
                                 └────────────────────────────────────────┘
```

---

## ⚡ Quick Start & Installation

### 1. Prerequisites
- **Git**
- **Node.js** (v18.0 or higher)
- **Python** (v3.10 or higher)
- **Ollama** (from [ollama.com](https://ollama.com))

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/local-ai-studio.git
cd local-ai-studio
```

### 3. Backend Setup
```bash
cd server
python -m venv venv

# Windows
venv\Scripts\activate
# Linux / macOS
# source venv/bin/activate

pip install -r requirements.txt
```

### 4. Frontend Setup
```bash
cd ../client
npm install
```

### 5. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Optional: Add your Google OAuth Client ID or Tavily/OpenAI API keys in `.env` or through the in-app Settings modal).*

### 6. Start Ollama and Download Models
```bash
# Start Ollama service in a separate terminal
ollama serve

# Pull essential models
ollama pull llama3.2:3b
ollama pull moondream
```

### 7. Run LocalAI Studio
**Windows 1-Click Launch:**
```powershell
.\run.ps1
```

**Manual Launch:**
```bash
# Terminal 1: Backend
cd server
python -m uvicorn app.main:app --port 8000 --host 127.0.0.1

# Terminal 2: Frontend
cd client
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 📚 API Endpoints Summary

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Register with Email & Password |
| `/api/auth/login` | `POST` | Authenticate with Email & Password |
| `/api/auth/google` | `POST` | Verify Google ID token & sign in |
| `/api/auth/me` | `GET` | Get authenticated user profile |
| `/api/chat/send` | `POST` | Server-Sent Events (SSE) chat stream with web search & memory |
| `/api/chat/search` | `POST` | Direct web search query returning citations |
| `/api/chat/conversations` | `GET / POST` | List and create conversations |
| `/api/models` | `GET` | List installed Ollama & cloud models |
| `/api/models/pull` | `POST` | Stream Ollama model download |
| `/api/files/upload` | `POST` | Upload and extract text from PDF, DOCX, CSV, Code |
| `/api/projects` | `GET / POST` | Manage project workspaces and instructions |
| `/api/memory` | `GET / POST` | Manage persistent memory items |
| `/api/settings` | `GET / PUT` | Manage user settings and encrypted cloud API keys |

---

## 🔮 Roadmap & Future Enhancements

1. **Autonomous Coding Agent View:** Build a dedicated Hermes-style IDE UI loop leveraging the existing `server/app/services/terminal_service.py` PowerShell execution engine and SQLite `agent_sessions` tables.
2. **Offline Neural TTS (Piper / Whisper):** Optional local Whisper STT and Piper neural voice model pipeline for 100% OS-independent voice synthesis.
3. **Vector Database RAG:** Embeddings with ChromaDB / FAISS for semantic search over large document repositories and codebases.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
