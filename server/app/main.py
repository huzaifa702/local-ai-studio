from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from .config import UPLOAD_DIR
from .db.database import init_db
from .routers import auth, chat, models, files, projects, memory, settings, images, videos

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database tables on startup
    await init_db()
    yield

app = FastAPI(
    title="LocalAI Studio API",
    description="ChatGPT-Style Web Platform with Local Ollama & Cloud APIs",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(models.router)
app.include_router(files.router)
app.include_router(projects.router)
app.include_router(memory.router)
app.include_router(settings.router)
app.include_router(images.router)
app.include_router(videos.router)

# Mount uploads directory for static file preview
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

@app.get("/api/health")
async def health():
    return {
        "status": "online",
        "service": "LocalAI Studio",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
