"""ORM models package.

Every model module is imported here so that ``Base.metadata`` is fully
populated for Alembic autogenerate and ``create_all``.
"""

from __future__ import annotations

from app.database.base import Base
from app.models.analysis import Analysis
from app.models.conversation import ChatMessage, Conversation
from app.models.cv import CV, CVVersion
from app.models.enums import CVVersionSource, MessageRole
from app.models.job import JobDescription
from app.models.profile import Profile
from app.models.user import User

__all__ = [
    "Base",
    "User",
    "Profile",
    "CV",
    "CVVersion",
    "Conversation",
    "ChatMessage",
    "JobDescription",
    "Analysis",
    "MessageRole",
    "CVVersionSource",
]
