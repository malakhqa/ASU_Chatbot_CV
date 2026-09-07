"""Centralized Gemini access.

Every part of the app that needs the model goes through this module — there is
exactly one place that talks to Gemini. Callers use :func:`generate_text` /
:func:`generate_structured`, or take the :func:`get_ai` FastAPI dependency.

The concrete client is created lazily so the app imports fine without a key
(tooling, tests). Tests swap in a fake via :func:`set_ai_client`.
"""

from __future__ import annotations

import json
import logging
import time
from functools import lru_cache
from typing import TYPE_CHECKING, Protocol, TypeVar

from pydantic import BaseModel, ValidationError

from app.core.config import settings

if TYPE_CHECKING:
    from collections.abc import Sequence

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

# HTTP-ish status codes we treat as retryable / as auth problems.
_RETRYABLE_CODES = {429, 500, 502, 503, 504}
_AUTH_CODES = {401, 403}
_RETRYABLE_NAMES = {"ServerError", "DeadlineExceeded", "ResourceExhausted", "ServiceUnavailable"}
_AUTH_NAMES = {"PermissionDenied", "Unauthenticated"}
_MAX_BACKOFF_SECONDS = 8


# --- Errors ----------------------------------------------------------------


class AIError(Exception):
    """Base class for all AI-service failures."""


class AIConfigError(AIError):
    """The AI client is not configured (missing/invalid API key)."""


class AITransientError(AIError):
    """A retryable failure that still failed after the configured retries."""


class AIResponseError(AIError):
    """The model returned something that could not be parsed / validated."""


# --- Client protocol -----------------------------------------------------------


class AIClient(Protocol):
    def generate_text(self, prompt: str, *, system: str | None = ...) -> str: ...

    def generate_structured(
        self, prompt: str, schema: type[T], *, system: str | None = ...
    ) -> T: ...


# --- Retry / error classification -------------------------------------------


def _describe(exc: Exception) -> tuple[int | None, str]:
    code = getattr(exc, "code", None) or getattr(exc, "status_code", None)
    return (code if isinstance(code, int) else None), type(exc).__name__


def _classify(exc: Exception, attempt: int, max_retries: int) -> bool:
    """Return True if the caller should retry; otherwise raise the mapped error."""
    code, name = _describe(exc)
    if code in _AUTH_CODES or name in _AUTH_NAMES:
        raise AIConfigError(str(exc)) from exc

    retryable = code in _RETRYABLE_CODES or name in _RETRYABLE_NAMES
    if retryable and attempt < max_retries:
        return True
    if retryable:
        raise AITransientError(str(exc)) from exc
    raise AIError(str(exc)) from exc


def _backoff_seconds(attempt: int) -> float:
    return float(min(2**attempt, _MAX_BACKOFF_SECONDS))


# --- Gemini implementation --------------------------------------------------


class GeminiClient:
    """Thin wrapper over ``google-genai`` with retries and structured output."""

    def __init__(
        self,
        *,
        model: str,
        api_key: str | None = None,
        timeout_seconds: int = 30,
        max_retries: int = 2,
        client: object | None = None,
    ) -> None:
        self._model = model
        self._max_retries = max_retries

        if client is not None:  # injected (tests)
            self._client = client
            self._types = None
            return

        # Imported lazily so the app (and tests) import fine without the package.
        from google import genai
        from google.genai import types

        self._types = types
        self._client = genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(timeout=timeout_seconds * 1000),
        )

    # -- public API --

    def generate_text(self, prompt: str, *, system: str | None = None) -> str:
        response = self._call(prompt, system=system, schema=None)
        return (getattr(response, "text", "") or "").strip()

    def generate_structured(self, prompt: str, schema: type[T], *, system: str | None = None) -> T:
        response = self._call(prompt, system=system, schema=schema)

        parsed = getattr(response, "parsed", None)
        if isinstance(parsed, schema):
            return parsed
        if isinstance(parsed, dict):
            return _validate(schema, parsed)

        text = getattr(response, "text", "") or ""
        try:
            data = json.loads(text)
        except json.JSONDecodeError as exc:
            raise AIResponseError(
                f"Model did not return JSON for {schema.__name__}: {exc}"
            ) from exc
        return _validate(schema, data)

    # -- internals --

    def _build_config(self, *, system: str | None, schema: type[BaseModel] | None) -> object | None:
        opts: dict[str, object] = {}
        if system:
            opts["system_instruction"] = system
        if schema is not None:
            opts["response_mime_type"] = "application/json"
            opts["response_schema"] = schema
        if not opts:
            return None
        if self._types is None:  # injected client — pass a plain dict
            return opts
        return self._types.GenerateContentConfig(**opts)

    def _call(
        self,
        prompt: str | Sequence[str],
        *,
        system: str | None,
        schema: type[BaseModel] | None,
    ) -> object:
        config = self._build_config(system=system, schema=schema)
        attempt = 0
        while True:
            try:
                return self._client.models.generate_content(  # type: ignore[attr-defined]
                    model=self._model,
                    contents=prompt,
                    config=config,
                )
            except Exception as exc:
                # _classify raises a mapped AIError, or returns True to retry.
                _classify(exc, attempt, self._max_retries)
                attempt += 1
                logger.warning(
                    "Gemini call failed (%s); retry %d/%d",
                    type(exc).__name__,
                    attempt,
                    self._max_retries,
                )
                time.sleep(_backoff_seconds(attempt))


def _validate(schema: type[T], data: object) -> T:
    try:
        return schema.model_validate(data)
    except ValidationError as exc:
        raise AIResponseError(f"{schema.__name__} validation failed: {exc}") from exc


# --- Registry / factory ---------------------------------------------------------

_client_override: AIClient | None = None


@lru_cache
def _real_client() -> GeminiClient:
    if not settings.gemini_api_key:
        raise AIConfigError(
            "GEMINI_API_KEY is not set. Add it to backend/.env to enable AI features."
        )
    return GeminiClient(
        model=settings.gemini_model,
        api_key=settings.gemini_api_key,
        timeout_seconds=settings.gemini_timeout_seconds,
        max_retries=settings.gemini_max_retries,
    )


def get_ai_client() -> AIClient:
    """Return the active AI client (a test override if set, else the real one)."""
    if _client_override is not None:
        return _client_override
    return _real_client()


def set_ai_client(client: AIClient | None) -> None:
    """Install (or clear, with ``None``) a process-wide client override. Tests only."""
    global _client_override
    _client_override = client


# --- Convenience module-level helpers ----------------------------------------


def generate_text(prompt: str, *, system: str | None = None) -> str:
    return get_ai_client().generate_text(prompt, system=system)


def generate_structured(prompt: str, schema: type[T], *, system: str | None = None) -> T:
    return get_ai_client().generate_structured(prompt, schema, system=system)
