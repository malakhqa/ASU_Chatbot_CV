"""Integration tests for the AI career chatbot."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.services import ai_service
from tests._fakes import FakeAIClient

MESSAGE = "/api/chat/message"
CONVERSATIONS = "/api/chat/conversations"


def _fake_turn(reply: str = "Here to help.", cv_action: dict | None = None) -> None:
    payload = {"reply": reply, "cv_action": cv_action}
    ai_service.set_ai_client(FakeAIClient(structured={"ChatTurn": payload}))


def _new_cv(auth_client: TestClient) -> int:
    return auth_client.post("/api/cv", json={"title": "CV"}).json()["id"]


def test_chat_requires_auth(client: TestClient) -> None:
    assert client.post(MESSAGE, json={"message": "hi"}).status_code == 401
    assert client.get(CONVERSATIONS).status_code == 401


def test_plain_message_creates_conversation(auth_client: TestClient) -> None:
    _fake_turn(reply="Focus on impact verbs.")
    resp = auth_client.post(MESSAGE, json={"message": "How do I improve my summary?"})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["applied"] is False
    assert body["proposed_action"] is None
    assert body["message"]["role"] == "assistant"
    assert body["message"]["content"] == "Focus on impact verbs."

    convs = auth_client.get(CONVERSATIONS).json()
    assert len(convs) == 1
    assert convs[0]["title"] == "How do I improve my summary?"


def test_message_appends_to_existing_conversation(auth_client: TestClient) -> None:
    _fake_turn()
    conv_id = auth_client.post(MESSAGE, json={"message": "first"}).json()["conversation_id"]
    _fake_turn(reply="second reply")
    auth_client.post(MESSAGE, json={"message": "second", "conversation_id": conv_id})

    detail = auth_client.get(f"{CONVERSATIONS}/{conv_id}").json()
    roles = [(m["role"], m["content"]) for m in detail["messages"]]
    assert roles == [
        ("user", "first"),
        ("assistant", "Here to help."),
        ("user", "second"),
        ("assistant", "second reply"),
    ]


def test_cv_action_add_skill_is_applied(auth_client: TestClient) -> None:
    cv_id = _new_cv(auth_client)
    _fake_turn(
        reply="Added Python to your skills.",
        cv_action={"section": "skills", "action": "add", "content": "Python"},
    )
    resp = auth_client.post(MESSAGE, json={"message": "add python to my skills", "cv_id": cv_id})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["applied"] is True
    assert body["cv_version_number"] == 2
    assert body["proposed_action"]["section"] == "skills"

    cv = auth_client.get(f"/api/cv/{cv_id}").json()
    assert cv["current_version"]["content"]["skills"] == ["Python"]
    assert cv["current_version"]["source"] == "chat_edit"


def test_cv_action_replace_summary(auth_client: TestClient) -> None:
    cv_id = _new_cv(auth_client)
    _fake_turn(
        reply="Updated your summary.",
        cv_action={"section": "summary", "action": "replace", "content": "New crisp summary."},
    )
    auth_client.post(MESSAGE, json={"message": "rewrite my summary", "cv_id": cv_id})
    cv = auth_client.get(f"/api/cv/{cv_id}").json()
    assert cv["current_version"]["content"]["summary"] == "New crisp summary."


def test_invalid_action_is_not_applied_but_reply_returned(auth_client: TestClient) -> None:
    cv_id = _new_cv(auth_client)
    _fake_turn(
        reply="Replacing your skills.",
        cv_action={"section": "skills", "action": "replace", "content": "not-a-list"},
    )
    resp = auth_client.post(MESSAGE, json={"message": "replace skills", "cv_id": cv_id})
    body = resp.json()
    assert body["applied"] is False
    assert "could not apply" in body["message"]["content"]

    cv = auth_client.get(f"/api/cv/{cv_id}").json()
    assert cv["current_version_number"] == 1  # unchanged


def test_action_without_cv_id_is_proposed_only(auth_client: TestClient) -> None:
    _fake_turn(
        reply="You can add that.",
        cv_action={"section": "skills", "action": "add", "content": "Go"},
    )
    body = auth_client.post(MESSAGE, json={"message": "add go"}).json()
    assert body["applied"] is False
    assert body["proposed_action"]["content"] == "Go"
    assert body["message"]["action"]["section"] == "skills"


def test_unknown_refs_are_404(auth_client: TestClient) -> None:
    _fake_turn()
    assert auth_client.post(MESSAGE, json={"message": "x", "cv_id": 9999}).status_code == 404
    assert (
        auth_client.post(MESSAGE, json={"message": "x", "conversation_id": 9999}).status_code == 404
    )


def test_chat_without_ai_is_503(auth_client: TestClient) -> None:
    assert auth_client.post(MESSAGE, json={"message": "hello"}).status_code == 503


def test_conversation_crud_and_scoping(client: TestClient) -> None:
    a = client.post(
        "/api/auth/register", json={"email": "a@c.com", "password": "passw0rd1"}
    ).json()["access_token"]
    b = client.post(
        "/api/auth/register", json={"email": "b@c.com", "password": "passw0rd1"}
    ).json()["access_token"]
    ah = {"Authorization": f"Bearer {a}"}
    bh = {"Authorization": f"Bearer {b}"}

    ai_service.set_ai_client(
        FakeAIClient(structured={"ChatTurn": {"reply": "ok", "cv_action": None}})
    )
    conv_id = client.post(MESSAGE, json={"message": "hi"}, headers=ah).json()["conversation_id"]

    assert client.get(f"{CONVERSATIONS}/{conv_id}", headers=bh).status_code == 404
    assert client.delete(f"{CONVERSATIONS}/{conv_id}", headers=bh).status_code == 404
    assert client.delete(f"{CONVERSATIONS}/{conv_id}", headers=ah).status_code == 204
    assert client.get(f"{CONVERSATIONS}/{conv_id}", headers=ah).status_code == 404
