"""Shared test doubles."""

from __future__ import annotations

from typing import Any, TypeVar

from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class FakeAIClient:
    """Deterministic stand-in for the Gemini client.

    Configure ``text`` for :meth:`generate_text` and ``structured`` (a dict, or a
    mapping of ``schema.__name__`` -> dict) for :meth:`generate_structured`.
    Every call is recorded in ``calls`` as ``(kind, prompt, system)``.
    """

    def __init__(
        self,
        *,
        text: str = "fake ai response",
        structured: dict[str, Any] | None = None,
    ) -> None:
        self.text = text
        self.structured = structured or {}
        self.calls: list[tuple[str, str, str | None]] = []

    def generate_text(self, prompt: str, *, system: str | None = None) -> str:
        self.calls.append(("text", prompt, system))
        return self.text

    def generate_structured(self, prompt: str, schema: type[T], *, system: str | None = None) -> T:
        self.calls.append(("structured", prompt, system))
        payload = self.structured.get(schema.__name__, self.structured)
        return schema.model_validate(payload)
