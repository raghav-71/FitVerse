from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from datetime import datetime
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.logging import logger
from app.database.supabase import get_supabase, SupabaseManager
from app.api.router import api_router
from app.schemas.common import HealthCheckResponse
from app.utils.exceptions import (
    FitVerseException,
    fitverse_exception_handler,
    validation_exception_handler,
    http_exception_handler,
    global_exception_handler,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION} [{settings.ENVIRONMENT}]...")
    # Verify Supabase connectivity on boot
    supabase = get_supabase()
    if supabase:
        logger.info("Supabase PostgreSQL client connected and verified.")
    else:
        logger.warning("Supabase credentials unpopulated. Server operating in decoupled local mode.")
    yield
    logger.info("Shutting down FitVerse API service...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-grade AI Biomechanical & Health Analytics Backend for FitVerse.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ==============================================================================
# CORS Configuration (Expo Mobile & Web Friendly)
# ==============================================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================================================================
# Global Exception Handlers
# ==============================================================================
app.add_exception_handler(FitVerseException, fitverse_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# ==============================================================================
# Health Check Endpoints
# ==============================================================================
@app.get(
    "/health",
    response_model=HealthCheckResponse,
    tags=["Health & Monitoring"],
    summary="Root Health Probe",
    description="Returns service availability, timestamp, and database connectivity."
)
async def health_check():
    db_status = "connected" if SupabaseManager.is_connected() else "disconnected"
    return HealthCheckResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat() + "Z",
        version=settings.VERSION,
        database=db_status,
    )

@app.get(
    "/",
    tags=["Health & Monitoring"],
    summary="API Root Welcome",
    include_in_schema=False
)
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health",
        "v1_status": f"{settings.API_V1_STR}/status"
    }

# ==============================================================================
# Mount API Version 1
# ==============================================================================
app.include_router(api_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
