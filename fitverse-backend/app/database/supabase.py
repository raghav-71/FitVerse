from typing import Optional
from app.core.config import settings
from app.core.logging import logger

try:
    from supabase import create_client, Client
except ImportError:
    Client = None
    create_client = None

class SupabaseManager:
    """
    Singleton manager for Supabase PostgreSQL & Auth Client.
    Gracefully handles unconfigured local development states.
    """
    _client: Optional[Client] = None

    @classmethod
    def get_client(cls) -> Optional[Client]:
        if cls._client is not None:
            return cls._client

        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            logger.warning(
                "SUPABASE_URL or SUPABASE_KEY is not configured in .env. "
                "Database queries requiring real Supabase connection will return fallback responses."
            )
            return None

        try:
            if create_client:
                cls._client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
                logger.info("Successfully connected to Supabase PostgreSQL.")
            return cls._client
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            return None

    @classmethod
    def is_connected(cls) -> bool:
        return cls.get_client() is not None

def get_supabase() -> Optional[Client]:
    return SupabaseManager.get_client()
