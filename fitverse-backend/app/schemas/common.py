from pydantic import BaseModel, Field
from typing import Optional, Any, Dict

class HealthCheckResponse(BaseModel):
    status: str = Field(default="healthy", description="Service health state")
    timestamp: str = Field(description="ISO timestamp")
    version: str = Field(description="Backend application version")
    database: str = Field(description="Database connectivity status: connected or disconnected")

class APIStatusResponse(BaseModel):
    app_name: str
    environment: str
    api_version: str
    status: str
    services: Dict[str, str]

class APIResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None
    data: Optional[Any] = None
