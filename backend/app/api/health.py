"""Health / liveness endpoints."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from app import __version__

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: str
    version: str


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Liveness probe. Does not touch the database or external services."""
    return HealthResponse(status="ok", version=__version__)
