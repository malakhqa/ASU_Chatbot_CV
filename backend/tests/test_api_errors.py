"""The AI-error → HTTP mapping never leaks raw provider text to the client."""

from __future__ import annotations

import pytest

from app.api.errors import ai_http_exception
from app.services.ai_service import (
    AIConfigError,
    AIError,
    AIResponseError,
    AITransientError,
)

# A realistic raw Gemini blob we must never forward verbatim.
_RAW = "429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'You exceeded your quota'}}"


@pytest.mark.parametrize(
    ("exc", "expected_status"),
    [
        (AIConfigError(_RAW), 503),
        (AITransientError(_RAW), 503),
        (AIResponseError(_RAW), 502),
        (AIError(_RAW), 502),
    ],
)
def test_ai_http_exception_status_and_clean_detail(exc: AIError, expected_status: int) -> None:
    http_exc = ai_http_exception(exc)

    assert http_exc.status_code == expected_status
    assert "RESOURCE_EXHAUSTED" not in http_exc.detail
    assert "{" not in http_exc.detail
    assert http_exc.detail.endswith((".",))
    assert len(http_exc.detail) < 200
