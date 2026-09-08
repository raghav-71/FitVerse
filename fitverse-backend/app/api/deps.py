from fastapi import Depends, Header, HTTPException, status
from typing import Optional, Dict, Any
try:
    import jwt
except ImportError:
    jwt = None

from app.core.config import settings
from app.core.logging import logger
from app.database.supabase import get_supabase
from app.utils.exceptions import UnauthorizedException

# Default local developer user for offline development without live Supabase tokens
DEV_USER = {
    "id": "usr_001",
    "email": "athlete@fitverse.ai",
    "name": "Aryan Sharma",
    "age": 24,
    "gender": "male",
    "height_cm": 178.0,
    "weight_kg": 75.8,
    "selected_goal": "Build Muscle",
    "activity_level": "Moderately Active",
    "experience_level": "Intermediate",
    "xp": 4820,
    "level": 14,
    "coins": 1450,
    "current_streak": 18,
}

async def get_current_user(
    authorization: Optional[str] = Header(None, description="Bearer <token>")
) -> Dict[str, Any]:
    """
    Dependency that authenticates requests using Supabase JWT tokens.
    In development mode, if no header is supplied, seamlessly provides the default athlete profile.
    """
    if not authorization:
        if settings.ENVIRONMENT == "development" or settings.DEBUG:
            return DEV_USER
        raise UnauthorizedException("Authorization header missing.")

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise UnauthorizedException("Invalid authorization header format. Expected 'Bearer <token>'.")

    token = parts[1]

    # 1. Try Supabase Auth Client verification if configured
    supabase = get_supabase()
    if supabase:
        try:
            res = supabase.auth.get_user(token)
            if res and res.user:
                u = res.user
                return {
                    "id": str(u.id),
                    "email": u.email,
                    "name": u.user_metadata.get("name", "Athlete"),
                    "age": u.user_metadata.get("age", 24),
                    "gender": u.user_metadata.get("gender", "male"),
                    "height_cm": u.user_metadata.get("height_cm", 178.0),
                    "weight_kg": u.user_metadata.get("weight_kg", 75.8),
                    "selected_goal": u.user_metadata.get("selected_goal", "Build Muscle"),
                    "activity_level": u.user_metadata.get("activity_level", "Moderately Active"),
                    "experience_level": u.user_metadata.get("experience_level", "Intermediate"),
                    "xp": 4820,
                    "level": 14,
                    "coins": 1450,
                    "current_streak": 18,
                }
        except Exception as e:
            logger.warning(f"Supabase token validation failed: {e}")

    # 2. Try raw JWT decoding if JWT secret is supplied
    if settings.SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(token, settings.SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated")
            return {
                "id": payload.get("sub", "usr_001"),
                "email": payload.get("email", "athlete@fitverse.ai"),
                "name": payload.get("user_metadata", {}).get("name", "Athlete"),
                "age": 24,
                "gender": "male",
                "height_cm": 178.0,
                "weight_kg": 75.8,
                "selected_goal": "Build Muscle",
                "activity_level": "Moderately Active",
                "experience_level": "Intermediate",
                "xp": 4820,
                "level": 14,
                "coins": 1450,
                "current_streak": 18,
            }
        except jwt.PyJWTError as e:
            logger.error(f"JWT decode error: {e}")

    # 3. Development fallback
    if settings.ENVIRONMENT == "development" or settings.DEBUG:
        logger.info("Using development user profile.")
        return DEV_USER

    raise UnauthorizedException("Invalid or expired session token.")
