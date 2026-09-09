"""Shared helpers for turning service-layer exceptions into HTTP responses.

Keeps user-facing error text in one place so the API never leaks raw upstream
provider messages (e.g. Gemini's ``429 RESOURCE_EXHAUSTED {...}`` blob) to the
browser. The original exception is logged server-side for debugging.
"""

from __future__ import annotations

import logging

from fastapi import HTTPException, status

from app.services.ai_service import (
    AIConfigError,
    AIError,
    AIResponseError,
    AITransientError,
)

logger = logging.getLogger(__name__)

_AI_MESSAGES: list[tuple[type[AIError], str]] = [
    (
        AIConfigError,
        "The AI service is not configured, or its API key was rejected.",
    ),
    (
        AITransientError,
        "The AI service is busy or over its rate limit right now. "
        "Please wait a moment and try again.",
    ),
    (
        AIResponseError,
        "The AI service returned a response that could not be processed. Please try again.",
    ),
]
_DEFAULT_AI_MESSAGE = "The AI request could not be completed. Please try again."


def ai_http_exception(exc: AIError) -> HTTPException:
    """Map an :class:`AIError` to a clean :class:`HTTPException`.

    ``AIConfigError`` / ``AITransientError`` → ``503`` (try again later);
    everything else → ``502`` (bad response from upstream).
    """
    logger.warning("AI request failed: %s: %s", type(exc).__name__, exc)

    code = (
        status.HTTP_503_SERVICE_UNAVAILABLE
        if isinstance(exc, AIConfigError | AITransientError)
        else status.HTTP_502_BAD_GATEWAY
    )
    detail = next(
        (msg for cls, msg in _AI_MESSAGES if isinstance(exc, cls)),
        _DEFAULT_AI_MESSAGE,
    )
    return HTTPException(status_code=code, detail=detail)
