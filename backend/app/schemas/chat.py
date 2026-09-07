"""Chatbot schemas, including the structured CV-action protocol."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

from app.models.enums import MessageRole
from app.schemas.common import ORMModel

CVActionVerb = Literal["add", "remove", "replace", "update"]


class CVAction(BaseModel):
    """Structured change the assistant proposes; validated and applied by the CV service.

    The assistant never writes to the database directly.
    """

    type: Literal["cv_update"] = "cv_update"
    section: str
    action: CVActionVerb
    content: Any = None


class ChatSendRequest(BaseModel):
    message: str = Field(min_length=1, max_length=8000)
    conversation_id: int | None = None
    cv_id: int | None = None
    job_description_id: int | None = None


class ChatMessageResponse(ORMModel):
    id: int
    role: MessageRole
    content: str
    action: dict[str, Any] | None = None
    created_at: datetime


class ChatSendResponse(BaseModel):
    conversation_id: int
    message: ChatMessageResponse
    proposed_action: CVAction | None = None


class ConversationSummary(ORMModel):
    id: int
    title: str | None = None
    created_at: datetime
    updated_at: datetime


class ConversationResponse(ConversationSummary):
    messages: list[ChatMessageResponse] = Field(default_factory=list)
