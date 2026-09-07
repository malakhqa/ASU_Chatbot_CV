"""Pydantic request/response schemas."""

from __future__ import annotations

from app.schemas.analysis import AnalysisResponse, AnalysisResult, AnalyzeRequest
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenRefreshRequest,
    TokenResponse,
    UserResponse,
)
from app.schemas.chat import (
    ChatMessageResponse,
    ChatSendRequest,
    ChatSendResponse,
    ChatTurn,
    ConversationResponse,
    ConversationSummary,
    CVAction,
)
from app.schemas.common import Message, ORMModel
from app.schemas.cv import (
    CVContent,
    CVCreateRequest,
    CVResponse,
    CVSummary,
    CVUpdateRequest,
    CVVersionResponse,
)
from app.schemas.job import CustomizeRequest, JobDescriptionCreate, JobDescriptionResponse
from app.schemas.profile import ProfileResponse, ProfileUpdate

__all__ = [
    "ORMModel",
    "Message",
    "RegisterRequest",
    "LoginRequest",
    "TokenRefreshRequest",
    "TokenResponse",
    "UserResponse",
    "ProfileUpdate",
    "ProfileResponse",
    "CVContent",
    "CVCreateRequest",
    "CVUpdateRequest",
    "CVVersionResponse",
    "CVSummary",
    "CVResponse",
    "ChatSendRequest",
    "ChatSendResponse",
    "ChatMessageResponse",
    "ChatTurn",
    "ConversationSummary",
    "ConversationResponse",
    "CVAction",
    "JobDescriptionCreate",
    "JobDescriptionResponse",
    "CustomizeRequest",
    "AnalyzeRequest",
    "AnalysisResult",
    "AnalysisResponse",
]
