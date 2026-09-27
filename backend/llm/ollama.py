"""
Ollama communication layer.

Uses /api/chat (instead of the older /api/generate) so that we can pass
the full conversation history for proper context/memory.

Ollama /api/chat streaming chunk format:
    {"model":"...", "message":{"role":"assistant","content":"...","thinking":"..."}, "done":false}

We emit Server-Sent Events (SSE) in the format the frontend expects:
    data: {"type": "thinking", "content": "..."}
    data: {"type": "content", "content": "..."}
    data: {"type": "done", "total_duration": ..., "eval_count": ...}
    data: {"type": "error", "error": "..."}
"""

import json
import requests
from typing import List, Dict, Any, Optional

OLLAMA_BASE_URL = "http://localhost:11434"
DEFAULT_MODEL = "qwen3:4b"


def get_available_models() -> List[str]:
    """Return list of locally installed Ollama model names."""
    try:
        res = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        if res.status_code == 200:
            return [m.get("name") for m in res.json().get("models", [])]
    except Exception:
        pass
    return [DEFAULT_MODEL]


def stream_chat(
    messages: List[Dict[str, Any]],
    model: str = DEFAULT_MODEL,
    system_prompt: Optional[str] = None,
    images: Optional[List[str]] = None,
):
    """
    Stream a chat response from Ollama using /api/chat with full message history.

    Args:
        messages:      Conversation history as [{"role": ..., "content": ...}, ...]
        model:         Ollama model name.
        system_prompt: Optional system prompt prepended to the context.

    Yields:
        SSE-formatted strings ready to be sent to the client.
    """
    ollama_messages: List[Dict[str, Any]] = []
    if system_prompt:
        ollama_messages.append({"role": "system", "content": system_prompt})
    ollama_messages.extend(messages)

    # Attach images to the latest user message for multimodal models
    if images:
        for message in reversed(ollama_messages):
            if message.get("role") == "user":
                message["images"] = images
                break

    # Only request native thinking tokens for models that support it (e.g. qwen3, deepseek-r1)
    supports_native_thinking = any(k in (model or "").lower() for k in ("qwen3", "deepseek-r1"))

    payload: Dict[str, Any] = {
        "model": model or DEFAULT_MODEL,
        "messages": ollama_messages,
        "stream": True,
    }
    if supports_native_thinking:
        payload["think"] = True

    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json=payload,
            stream=True,
            timeout=120,
        )

        # Resilient fallback: if Ollama rejects the think parameter, retry without it
        if response.status_code == 400 and "think" in payload:
            payload.pop("think")
            response = requests.post(
                f"{OLLAMA_BASE_URL}/api/chat",
                json=payload,
                stream=True,
                timeout=120,
            )

        if response.status_code != 200:
            try:
                err_detail = response.json().get("error", response.text)
            except Exception:
                err_detail = f"HTTP {response.status_code}"
            err_msg = f"Ollama error: {err_detail}"
            yield f"data: {json.dumps({'type': 'error', 'error': err_msg})}\n\n"
            return

        # State for inline <think>...</think> tag parsing (fallback for models that
        # don't have native thinking field but embed tags in content).
        in_think_tag = False
        tag_buffer = ""

        for line in response.iter_lines():
            if not line:
                continue
            try:
                chunk = json.loads(line.decode("utf-8"))
            except Exception:
                continue

            msg = chunk.get("message", {})
            thinking_token = msg.get("thinking", "")
            response_token = msg.get("content", "")
            is_done = chunk.get("done", False)

            # 1. Native thinking field (e.g. qwen3:4b)
            if thinking_token:
                yield f"data: {json.dumps({'type': 'thinking', 'content': thinking_token})}\n\n"

            # 2. Content field — may contain inline <think>...</think> tags
            if response_token:
                combined = tag_buffer + response_token
                tag_buffer = ""

                while combined:
                    if not in_think_tag:
                        if "<think>" in combined:
                            before, after = combined.split("<think>", 1)
                            if before:
                                yield f"data: {json.dumps({'type': 'content', 'content': before})}\n\n"
                            in_think_tag = True
                            combined = after
                        elif "<" in combined and "</" not in combined:
                            # Possible partial opening tag — buffer
                            tag_buffer = combined
                            break
                        else:
                            yield f"data: {json.dumps({'type': 'content', 'content': combined})}\n\n"
                            break
                    else:
                        if "</think>" in combined:
                            thought, after = combined.split("</think>", 1)
                            if thought:
                                yield f"data: {json.dumps({'type': 'thinking', 'content': thought})}\n\n"
                            in_think_tag = False
                            combined = after
                        elif "<" in combined:
                            tag_buffer = combined
                            break
                        else:
                            yield f"data: {json.dumps({'type': 'thinking', 'content': combined})}\n\n"
                            break

            # 3. Done signal — flush any remaining buffer
            if is_done:
                if tag_buffer:
                    token_type = "thinking" if in_think_tag else "content"
                    yield f"data: {json.dumps({'type': token_type, 'content': tag_buffer})}\n\n"

                yield f"data: {json.dumps({'type': 'done', 'total_duration': chunk.get('total_duration'), 'eval_count': chunk.get('eval_count')})}\n\n"
                break

    except requests.exceptions.ConnectionError:
        yield f"data: {json.dumps({'type': 'error', 'error': 'Could not connect to Ollama at http://localhost:11434. Please verify Ollama is running.'})}\n\n"
    except Exception as ex:
        yield f"data: {json.dumps({'type': 'error', 'error': str(ex)})}\n\n"
