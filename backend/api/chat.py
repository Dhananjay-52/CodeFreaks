"""
Chat and model routes.

Key design decisions:
- The /api/chat streaming endpoint is the single source of truth for persistence.
  It creates the chat if missing, persists the user message BEFORE streaming,
  then persists the assistant message AFTER the stream completes — all within the
  generator itself, so no extra round-trip from the client is needed.
- /api/chats POST is kept for client-side compatibility (e.g. explicit title
  updates) but is NOT required for normal operation.
- Full conversation history is loaded from SQLite and sent to Ollama /api/chat,
  giving the LLM proper memory of previous turns.
"""

import json
import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from database.database_sql import (
    append_message,
    delete_chat,
    ensure_chat,
    get_chat_by_id,
    get_chat_messages,
    get_user_chats,
    touch_chat,
)
from llm.ollama import DEFAULT_MODEL, get_available_models, stream_chat

router = APIRouter(tags=["chat"])


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    message: str
    model: Optional[str] = DEFAULT_MODEL
    system_prompt: Optional[str] = None
    stream: Optional[bool] = True
    chat_id: Optional[str] = None
    user_id: Optional[Any] = "default"


class SaveChatRequest(BaseModel):
    chat_id: str
    user_id: Any
    title: Optional[str] = "New Chat"
    model: Optional[str] = DEFAULT_MODEL
    messages: List[Dict[str, Any]]
    metadata: Optional[Dict[str, Any]] = None


# ---------------------------------------------------------------------------
# Model listing
# ---------------------------------------------------------------------------

@router.get("/api/models")
def list_models():
    """Return locally installed Ollama models."""
    models = get_available_models()
    return {"models": models or [DEFAULT_MODEL]}


# ---------------------------------------------------------------------------
# Chat CRUD
# ---------------------------------------------------------------------------

@router.get("/api/chats")
def list_chats(user_id: str = Query("default")):
    """Return all chats for the sidebar."""
    return {"chats": get_user_chats(user_id)}


@router.get("/api/chats/{chat_id}")
def retrieve_chat(chat_id: str):
    """Return full chat session including messages."""
    chat = get_chat_by_id(chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found.")
    return {"chat": chat}


@router.post("/api/chats")
def upsert_chat(req: SaveChatRequest):
    """
    Lightweight upsert — ensures the chat row exists and updates the title.
    Message persistence is handled automatically by /api/chat.
    """
    ensure_chat(
        chat_id=req.chat_id,
        user_id=str(req.user_id),
        title=req.title or "New Chat",
        model=req.model or DEFAULT_MODEL,
    )
    touch_chat(req.chat_id, title=req.title)
    return {"success": True, "chat_id": req.chat_id}


@router.delete("/api/chats/{chat_id}")
def remove_chat(chat_id: str):
    """Delete a chat and all its messages."""
    deleted = delete_chat(chat_id)
    return {"success": deleted}


# ---------------------------------------------------------------------------
# Streaming chat endpoint (core feature)
# ---------------------------------------------------------------------------

@router.post("/api/chat")
def chat_stream(request: ChatRequest):
    """
    Stream a chat response.

    Flow:
      1. Resolve or create chat_id.
      2. Ensure chat row exists in SQLite.
      3. Persist the incoming user message.
      4. Load full conversation history.
      5. Call Ollama /api/chat with history → stream SSE to client.
      6. Persist the completed assistant message (inside the generator).
      7. Touch chat updated_at timestamp.
    """
    chat_id = request.chat_id or f"chat_{int(datetime.datetime.now().timestamp() * 1000)}"
    user_id = str(request.user_id or "default")
    model = request.model or DEFAULT_MODEL
    user_message = request.message.strip()

    if not user_message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # 1 & 2. Ensure chat row exists (safe to call multiple times)
    ensure_chat(
        chat_id=chat_id,
        user_id=user_id,
        title=user_message[:60],
        model=model,
    )

    # 3. Persist the user message before streaming
    append_message(chat_id=chat_id, role="user", content=user_message)

    # 4. Load conversation history for context (includes the just-saved user message)
    history = get_chat_messages(chat_id)
    ollama_messages = [{"role": m["role"], "content": m["content"]} for m in history]

    def generate():
        accumulated_content = ""
        accumulated_thinking = ""
        think_start = datetime.datetime.now().timestamp()
        think_end_delta = None

        for chunk_str in stream_chat(ollama_messages, model=model, system_prompt=request.system_prompt):
            yield chunk_str

            # Parse the emitted SSE to accumulate content for persistence
            if not chunk_str.startswith("data: "):
                continue
            try:
                payload = json.loads(chunk_str[6:])
                ptype = payload.get("type")
                if ptype == "thinking":
                    accumulated_thinking += payload.get("content", "")
                elif ptype == "content":
                    if think_end_delta is None:
                        think_end_delta = datetime.datetime.now().timestamp() - think_start
                    accumulated_content += payload.get("content", "")
                elif ptype == "done":
                    # 6. Persist the completed assistant response
                    append_message(
                        chat_id=chat_id,
                        role="assistant",
                        content=accumulated_content,
                        thinking=accumulated_thinking,
                        think_duration=round(think_end_delta or 0, 1),
                    )
                    # 7. Update the chat's updated_at timestamp
                    touch_chat(chat_id)
            except Exception:
                pass  # Never crash the stream due to a parse error

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
