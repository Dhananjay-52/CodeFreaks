"""
Sovereign Autonomous AI Workbench — FastAPI Backend

Responsibilities of this file:
  - Create the FastAPI application
  - Configure CORS
  - Register API routers (auth + chat)
  - Expose a health check endpoint
  - Run DB initialization on startup
"""

import os
import sys

# Ensure this directory is on the Python path so submodules can import each other
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.auth import router as auth_router
from api.chat import router as chat_router
from database.database_sql import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the database tables on startup."""
    init_db()
    yield


app = FastAPI(
    title="Sovereign Autonomous AI Workbench",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(chat_router)


@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "Sovereign Autonomous AI Workbench",
        "database": "SQLite (users, chats, messages)",
        "llm": "Ollama (local)",
        "router": "Deterministic Benchmark Reference Router",
    }


if __name__ == "__main__":
    import uvicorn
    print("Starting Sovereign Autonomous AI Workbench Backend on http://127.0.0.1:8000 ...")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
