"""Shared enumerations used by ORM models and schemas."""

from __future__ import annotations

import enum
from collections.abc import Callable


def _values(enum_cls: type[enum.Enum]) -> list[str]:
    return [member.value for member in enum_cls]


def enum_values_callable() -> Callable[[type[enum.Enum]], list[str]]:
    """``values_callable`` for SQLAlchemy ``Enum`` so the *values* are persisted."""
    return _values


class MessageRole(enum.StrEnum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class CVVersionSource(enum.StrEnum):
    """How a CV version came to exist."""

    GENERATED = "generated"
    MANUAL_EDIT = "manual_edit"
    JOB_CUSTOMIZATION = "job_customization"
    CHAT_EDIT = "chat_edit"
    RESTORE = "restore"
