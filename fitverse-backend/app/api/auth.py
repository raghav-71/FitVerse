from fastapi import APIRouter, status
from pydantic import BaseModel
from app.database.supabase import get_supabase
from app.core.logging import logger
from app.utils.exceptions import FitVerseException

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str

@router.post("/login", summary="User Login via Supabase Auth")
async def login(payload: LoginRequest):
    supabase = get_supabase()
    if not supabase:
        return {
            "success": True,
            "access_token": "mock_jwt_token_for_local_dev",
            "token_type": "bearer",
            "user": {"id": "usr_001", "email": payload.email, "name": "Aryan Sharma"}
        }

    try:
        res = supabase.auth.sign_in_with_password({"email": payload.email, "password": payload.password})
        if res and res.session:
            return {
                "success": True,
                "access_token": res.session.access_token,
                "refresh_token": res.session.refresh_token,
                "token_type": "bearer",
                "user": {"id": str(res.user.id), "email": res.user.email}
            }
        raise FitVerseException("Invalid email or password", status_code=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise FitVerseException(str(e), status_code=status.HTTP_400_BAD_REQUEST)

@router.post("/register", summary="User Registration via Supabase Auth")
async def register(payload: RegisterRequest):
    supabase = get_supabase()
    if not supabase:
        return {
            "success": True,
            "message": "User registered successfully (Local Dev Mode)",
            "user": {"id": f"usr_{payload.email.split('@')[0]}", "email": payload.email, "name": payload.name}
        }

    try:
        res = supabase.auth.sign_up({
            "email": payload.email,
            "password": payload.password,
            "options": {"data": {"name": payload.name}}
        })
        return {
            "success": True,
            "message": "Registration initiated. Verification email sent if enabled.",
            "user": {"id": str(res.user.id) if res.user else None, "email": payload.email}
        }
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise FitVerseException(str(e), status_code=status.HTTP_400_BAD_REQUEST)
