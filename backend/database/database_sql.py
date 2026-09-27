"""
SQLite database layer for the Sovereign Autonomous AI Workbench.

Tables:
    users       — authentication credentials
    chats       — chat session metadata
    messages    — individual messages per chat
    audit_logs  — reserved for future audit logging
"""

import sqlite3
import os
import hashlib
import secrets
import datetime
from typing import Optional, Dict, Any, List

# DB is created adjacent to the backend directory (not committed to git)
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "workbench.db")


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    """Create all tables if they do not already exist."""
    conn = get_connection()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            email          TEXT    UNIQUE NOT NULL,
            name           TEXT    NOT NULL,
            workspace_name TEXT    DEFAULT 'My AI Workspace',
            password_hash  TEXT    NOT NULL,
            salt           TEXT    NOT NULL,
            created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS chats (
            chat_id    TEXT PRIMARY KEY,
            user_id    TEXT NOT NULL,
            title      TEXT DEFAULT 'New Chat',
            model      TEXT DEFAULT 'qwen3:4b',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);

        CREATE TABLE IF NOT EXISTS messages (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            chat_id       TEXT    NOT NULL,
            role          TEXT    NOT NULL,
            content       TEXT    NOT NULL DEFAULT '',
            thinking      TEXT    DEFAULT '',
            think_duration REAL   DEFAULT 0,
            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (chat_id) REFERENCES chats(chat_id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);

        CREATE TABLE IF NOT EXISTS audit_logs (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    TEXT,
            action     TEXT NOT NULL,
            details    TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()
    conn.close()
    print("[DB] SQLite initialized at", DB_PATH)


# ---------------------------------------------------------------------------
# Password utilities
# ---------------------------------------------------------------------------

def _hash_password(password: str, salt: Optional[str] = None):
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100_000,
    ).hex()
    return hashed, salt


# ---------------------------------------------------------------------------
# User operations
# ---------------------------------------------------------------------------

def create_user(email: str, name: str, password: str, workspace_name: Optional[str] = None) -> Dict[str, Any]:
    email = email.strip().lower()
    hashed_pw, salt = _hash_password(password)
    ws = workspace_name or "My AI Workspace"
    conn = get_connection()
    try:
        cursor = conn.execute(
            "INSERT INTO users (email, name, workspace_name, password_hash, salt) VALUES (?, ?, ?, ?, ?)",
            (email, name.strip(), ws, hashed_pw, salt),
        )
        conn.commit()
        return {"id": cursor.lastrowid, "email": email, "name": name.strip(), "workspace_name": ws}
    finally:
        conn.close()


def verify_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    email = email.strip().lower()
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        if not row:
            return None
        expected_hash, _ = _hash_password(password, row["salt"])
        if secrets.compare_digest(expected_hash, row["password_hash"]):
            return {
                "id": row["id"],
                "email": row["email"],
                "name": row["name"],
                "workspace_name": row["workspace_name"],
            }
        return None
    finally:
        conn.close()


def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT id, email, name, workspace_name, created_at FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Chat operations
# ---------------------------------------------------------------------------

def _now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def ensure_chat(chat_id: str, user_id: str, title: str, model: str) -> None:
    """Insert a chat row if it does not already exist (INSERT OR IGNORE)."""
    now = _now_iso()
    conn = get_connection()
    try:
        conn.execute(
            """
            INSERT OR IGNORE INTO chats (chat_id, user_id, title, model, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (chat_id, str(user_id), title[:120], model, now, now),
        )
        conn.commit()
    finally:
        conn.close()


def touch_chat(chat_id: str, title: Optional[str] = None) -> None:
    """Update updated_at (and optionally title) for a chat."""
    now = _now_iso()
    conn = get_connection()
    try:
        if title:
            conn.execute(
                "UPDATE chats SET updated_at = ?, title = ? WHERE chat_id = ?",
                (now, title[:120], chat_id),
            )
        else:
            conn.execute("UPDATE chats SET updated_at = ? WHERE chat_id = ?", (now, chat_id))
        conn.commit()
    finally:
        conn.close()


def append_message(
    chat_id: str,
    role: str,
    content: str,
    thinking: str = "",
    think_duration: float = 0,
) -> int:
    """Append a message row to a chat. Returns the new message id."""
    now = _now_iso()
    conn = get_connection()
    try:
        cursor = conn.execute(
            """
            INSERT INTO messages (chat_id, role, content, thinking, think_duration, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (chat_id, role, content, thinking or "", think_duration or 0, now),
        )
        conn.commit()
        return cursor.lastrowid # type: ignore
    finally:
        conn.close()


def get_chat_messages(chat_id: str) -> List[Dict[str, Any]]:
    """Return all messages for a chat, ordered by insertion order."""
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT id, role, content, thinking, think_duration, created_at FROM messages WHERE chat_id = ? ORDER BY id ASC",
            (chat_id,),
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def get_chat_by_id(chat_id: str) -> Optional[Dict[str, Any]]:
    """Return chat metadata + messages list."""
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM chats WHERE chat_id = ?", (chat_id,)).fetchone()
        if not row:
            return None
        chat = dict(row)
    finally:
        conn.close()
    chat["messages"] = get_chat_messages(chat_id)
    return chat


def get_user_chats(user_id: str) -> List[Dict[str, Any]]:
    """Return chat list for the sidebar, most recently updated first."""
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT chat_id, title, model, created_at, updated_at FROM chats WHERE user_id = ? ORDER BY updated_at DESC",
            (str(user_id),),
        ).fetchall()
        result = []
        for row in rows:
            chat = dict(row)
            cnt = conn.execute(
                "SELECT COUNT(*) FROM messages WHERE chat_id = ?", (chat["chat_id"],)
            ).fetchone()[0]
            chat["message_count"] = cnt
            result.append(chat)
        return result
    finally:
        conn.close()


def delete_chat(chat_id: str) -> bool:
    """Delete a chat and all its messages (CASCADE). Returns True if a row was deleted."""
    conn = get_connection()
    try:
        cursor = conn.execute("DELETE FROM chats WHERE chat_id = ?", (chat_id,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()
