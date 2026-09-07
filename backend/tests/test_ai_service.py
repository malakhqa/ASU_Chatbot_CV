"""Unit tests for the AI service wrapper and prompt builder."""

from __future__ import annotations

from types import SimpleNamespace

import pytest
from pydantic import BaseModel

from app.core.config import settings
from app.services import ai_service, prompt_builder
from app.services.ai_service import (
    AIConfigError,
    AIError,
    AIResponseError,
    AITransientError,
    GeminiClient,
    _classify,
    _real_client,
)


class _Schema(BaseModel):
    score: int
    note: str


class _Boom(Exception):
    def __init__(self, code: int) -> None:
        super().__init__(f"boom {code}")
        self.code = code


class _FakeModels:
    def __init__(
        self, fail_times: int = 0, code: int = 503, response: object | None = None
    ) -> None:
        self.fail_times = fail_times
        self.code = code
        self.response = response or SimpleNamespace(text="ok", parsed=None)
        self.calls = 0

    def generate_content(self, *, model: str, contents: object, config: object) -> object:
        self.calls += 1
        if self.calls <= self.fail_times:
            raise _Boom(self.code)
        return self.response


def _client(models: _FakeModels, **kw: object) -> GeminiClient:
    return GeminiClient(model="m", client=SimpleNamespace(models=models), **kw)


@pytest.fixture(autouse=True)
def _no_sleep(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(ai_service.time, "sleep", lambda _s: None)


# --- error hierarchy / classification --------------------------------------


def test_error_hierarchy() -> None:
    for cls in (AIConfigError, AITransientError, AIResponseError):
        assert issubclass(cls, AIError)


def test_classify_auth_code_is_config_error() -> None:
    with pytest.raises(AIConfigError):
        _classify(_Boom(403), attempt=0, max_retries=2)


def test_classify_retryable_then_exhausted() -> None:
    assert _classify(_Boom(503), attempt=0, max_retries=2) is True
    with pytest.raises(AITransientError):
        _classify(_Boom(503), attempt=2, max_retries=2)


def test_classify_non_retryable_is_ai_error() -> None:
    with pytest.raises(AIError) as info:
        _classify(_Boom(400), attempt=0, max_retries=2)
    assert not isinstance(info.value, AITransientError | AIConfigError)


# --- GeminiClient with an injected client ---------------------------------------


def test_generate_text_strips() -> None:
    gc = _client(_FakeModels(response=SimpleNamespace(text="  hi there \n", parsed=None)))
    assert gc.generate_text("prompt") == "hi there"


def test_generate_structured_from_parsed_dict() -> None:
    gc = _client(_FakeModels(response=SimpleNamespace(text="", parsed={"score": 9, "note": "ok"})))
    out = gc.generate_structured("p", _Schema)
    assert isinstance(out, _Schema) and out.score == 9


def test_generate_structured_from_json_text() -> None:
    resp = SimpleNamespace(text='{"score": 3, "note": "x"}', parsed=None)
    gc = _client(_FakeModels(response=resp))
    assert gc.generate_structured("p", _Schema).note == "x"


def test_generate_structured_bad_json_raises() -> None:
    gc = _client(_FakeModels(response=SimpleNamespace(text="not json", parsed=None)))
    with pytest.raises(AIResponseError):
        gc.generate_structured("p", _Schema)


def test_generate_structured_schema_mismatch_raises() -> None:
    gc = _client(_FakeModels(response=SimpleNamespace(text='{"score": "NaN"}', parsed=None)))
    with pytest.raises(AIResponseError):
        gc.generate_structured("p", _Schema)


def test_call_retries_then_succeeds() -> None:
    models = _FakeModels(fail_times=2, code=503)
    gc = _client(models, max_retries=2)
    assert gc.generate_text("p") == "ok"
    assert models.calls == 3


def test_call_gives_up_after_max_retries() -> None:
    models = _FakeModels(fail_times=5, code=503)
    gc = _client(models, max_retries=2)
    with pytest.raises(AITransientError):
        gc.generate_text("p")
    assert models.calls == 3


def test_call_does_not_retry_client_error() -> None:
    models = _FakeModels(fail_times=5, code=400)
    gc = _client(models, max_retries=3)
    with pytest.raises(AIError):
        gc.generate_text("p")
    assert models.calls == 1


# --- registry / factory ------------------------------------------------------


def test_real_client_requires_key(monkeypatch: pytest.MonkeyPatch) -> None:
    _real_client.cache_clear()
    monkeypatch.setattr(settings, "gemini_api_key", "")
    with pytest.raises(AIConfigError):
        ai_service.get_ai_client()
    _real_client.cache_clear()


def test_override_is_used() -> None:
    sentinel = _client(_FakeModels(response=SimpleNamespace(text="overridden", parsed=None)))
    ai_service.set_ai_client(sentinel)
    assert ai_service.get_ai_client() is sentinel
    assert ai_service.generate_text("p") == "overridden"


# --- prompt builder --------------------------------------------------------


def test_guardrails_forbid_fabrication() -> None:
    assert "NEVER invent" in prompt_builder.GUARDRAILS


def test_build_context_includes_provided_sections() -> None:
    ctx = prompt_builder.build_context(
        profile={"full_name": "Jane", "skills": ["Python"]},
        job={"title": "Backend Dev", "company": "Acme", "description": "Build APIs"},
        task="Rewrite the summary.",
    )
    assert "## Career Profile" in ctx
    assert "Skills: Python" in ctx
    assert "## Target Job" in ctx
    assert "Backend Dev" in ctx
    assert "## Task" in ctx
    assert "## Current CV" not in ctx


def test_history_is_truncated() -> None:
    msgs = [{"role": "user", "content": f"m{i}"} for i in range(30)]
    text = prompt_builder.history_to_text(msgs, max_messages=5)
    assert "m29" in text and "m24" not in text
