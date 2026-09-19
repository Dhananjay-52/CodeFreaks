"""Authentication routes — signup, login, and user lookup."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from database.database_sql import create_user, verify_user, get_user_by_id

router = APIRouter(prefix="/api/auth", tags=["auth"])


class SignupRequest(BaseModel):
    email: str
    name: str
    password: str
    workspace_name: Optional[str] = "My AI Workspace"


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/signup")
def signup_endpoint(req: SignupRequest):
    if not req.email or not req.password or not req.name:
        raise HTTPException(status_code=400, detail="Name, email, and password are required.")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    try:
        user = create_user(
            email=req.email,
            name=req.name,
            password=req.password,
            workspace_name=req.workspace_name,
        )
        return {
            "success": True,
            "message": "Account created successfully.",
            "user": user,
            "token": f"workbench_token_{user['id']}",
        }
    except Exception as e:
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(status_code=409, detail="An account with this email already exists.")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login")
def login_endpoint(req: LoginRequest):
    if not req.email or not req.password:
        raise HTTPException(status_code=400, detail="Email and password are required.")
    user = verify_user(req.email, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return {
        "success": True,
        "message": "Login successful.",
        "user": user,
        "token": f"workbench_token_{user['id']}",
    }


@router.get("/me")
def get_me(user_id: Optional[int] = None):
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required.")
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return {"user": user}
