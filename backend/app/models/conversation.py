"""Chatbot conversation and message models."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON as SA_JSON
from sqlalchemy import Enum as SA_Enum
from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, CreatedAtMixin, TimestampMixin
from app.models.enums import MessageRole, enum_values_callable

if TYPE_CHECKING:
    from app.models.user import User


class Conversation(TimestampMixin, Base):
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    title: Mapped[str | None] = mapped_column(String(255))

    user: Mapped[User] = relationship(back_populates="conversations")
    messages: Mapped[list[ChatMessage]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="ChatMessage.id",
    )

    def __repr__(self) -> str:  # pragma: no cover - debug aid
        return f"<Conversation id={self.id} user_id={self.user_id}>"


class ChatMessage(CreatedAtMixin, Base):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    conversation_id: Mapped[int] = mapped_column(
        ForeignKey("conversations.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    role: Mapped[MessageRole] = mapped_column(
        SA_Enum(MessageRole, values_callable=enum_values_callable()),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    # Structured CV action proposed by the assistant, if any (Task 12).
    action: Mapped[dict[str, Any] | None] = mapped_column(SA_JSON)

    conversation: Mapped[Conversation] = relationship(back_populates="messages")

    def __repr__(self) -> str:  # pragma: no cover - debug aid
        return f"<ChatMessage id={self.id} role={self.role} conv={self.conversation_id}>"
