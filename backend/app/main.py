from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.app.core.database import init_db
from backend.app.core.config import STORAGE_DIR
from backend.app.api import system_status, projects, characters, voices, video_editor

# Initialize SQLite database schema
init_db()

app = FastAPI(
    title="AI Cartoon Studio API",
    description="Backend orchestration engine for 3D AI cartoon generation & AI video editing",
    version="1.0.0"
)

# Enable CORS for frontend clients (local Vite / Next.js)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(system_status.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(characters.router, prefix="/api")
app.include_router(voices.router, prefix="/api")
app.include_router(video_editor.router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "app": "AI Cartoon Studio",
        "edition": "Personal Edition",
        "status": "online",
        "documentation": "/docs"
    }
