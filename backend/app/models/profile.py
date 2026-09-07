"""Career profile model.

Holds the user's central career information. Scalar contact fields match the
technical documentation; the structured sections (education, experience, ...)
are stored as JSON so the profile stays the single source of truth for CV
generation without a proliferation of side tables in the MVP.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON as SA_JSON
from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class Profile(TimestampMixin, Base):
    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )

    # Scalar contact / summary fields
    full_name: Mapped[str | None] = mapped_column(String(200))
    email: Mapped[str | None] = mapped_column(String(320))
    phone: Mapped[str | None] = mapped_column(String(50))
    location: Mapped[str | None] = mapped_column(String(200))
    summary: Mapped[str | None] = mapped_column(Text)
    linkedin: Mapped[str | None] = mapped_column(String(255))
    github: Mapped[str | None] = mapped_column(String(255))
    website: Mapped[str | None] = mapped_column(String(255))

    # Structured sections (lists of objects)
    education: Mapped[list[dict[str, Any]]] = mapped_column(SA_JSON, default=list, nullable=False)
    experience: Mapped[list[dict[str, Any]]] = mapped_column(SA_JSON, default=list, nullable=False)
    skills: Mapped[list[str]] = mapped_column(SA_JSON, default=list, nullable=False)
    projects: Mapped[list[dict[str, Any]]] = mapped_column(SA_JSON, default=list, nullable=False)
    certifications: Mapped[list[dict[str, Any]]] = mapped_column(
        SA_JSON, default=list, nullable=False
    )
    languages: Mapped[list[dict[str, Any]]] = mapped_column(SA_JSON, default=list, nullable=False)
    awards: Mapped[list[dict[str, Any]]] = mapped_column(SA_JSON, default=list, nullable=False)

    user: Mapped[User] = relationship(back_populates="profile")

    def __repr__(self) -> str:  # pragma: no cover - debug aid
        return f"<Profile id={self.id} user_id={self.user_id}>"
