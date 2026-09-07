"""Integration tests for CV version history and restore."""

from __future__ import annotations

from fastapi.testclient import TestClient

CV = "/api/cv"


def _cv_with_three_versions(auth_client: TestClient) -> int:
    cv_id = auth_client.post(CV, json={"title": "Versioned"}).json()["id"]  # v1
    auth_client.put(f"{CV}/{cv_id}", json={"content": {"summary": "second"}, "note": "v2"})  # v2
    auth_client.put(f"{CV}/{cv_id}", json={"content": {"summary": "third"}, "note": "v3"})  # v3
    return cv_id


def test_versions_require_auth(client: TestClient) -> None:
    assert client.get(f"{CV}/1/versions").status_code == 401
    assert client.post(f"{CV}/1/versions/1/restore").status_code == 401


def test_list_versions_newest_first(auth_client: TestClient) -> None:
    cv_id = _cv_with_three_versions(auth_client)
    versions = auth_client.get(f"{CV}/{cv_id}/versions").json()
    assert [v["version_number"] for v in versions] == [3, 2, 1]
    assert versions[0]["content"]["summary"] == "third"
    assert versions[2]["source"] == "manual_edit"


def test_get_single_version(auth_client: TestClient) -> None:
    cv_id = _cv_with_three_versions(auth_client)
    v2 = auth_client.get(f"{CV}/{cv_id}/versions/2").json()
    assert v2["version_number"] == 2
    assert v2["content"]["summary"] == "second"
    assert v2["note"] == "v2"

    assert auth_client.get(f"{CV}/{cv_id}/versions/99").status_code == 404
    assert auth_client.get(f"{CV}/12345/versions/1").status_code == 404


def test_restore_appends_new_version(auth_client: TestClient) -> None:
    cv_id = _cv_with_three_versions(auth_client)
    resp = auth_client.post(f"{CV}/{cv_id}/versions/1/restore")
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["current_version_number"] == 4
    v = body["current_version"]
    assert v["source"] == "restore"
    assert v["note"] == "Restored from v1"
    assert v["content"]["summary"] == ""  # v1 was the blank CV

    # history now has 4 entries
    assert len(auth_client.get(f"{CV}/{cv_id}/versions").json()) == 4


def test_restore_missing_version_is_404(auth_client: TestClient) -> None:
    cv_id = auth_client.post(CV, json={"title": "x"}).json()["id"]
    assert auth_client.post(f"{CV}/{cv_id}/versions/9/restore").status_code == 404


def test_versions_scoped_to_owner(client: TestClient) -> None:
    a = client.post(
        "/api/auth/register", json={"email": "a@v.com", "password": "passw0rd1"}
    ).json()["access_token"]
    b = client.post(
        "/api/auth/register", json={"email": "b@v.com", "password": "passw0rd1"}
    ).json()["access_token"]

    cv_id = client.post(
        CV, json={"title": "A CV"}, headers={"Authorization": f"Bearer {a}"}
    ).json()["id"]

    assert (
        client.get(f"{CV}/{cv_id}/versions", headers={"Authorization": f"Bearer {b}"}).status_code
        == 404
    )
    assert (
        client.post(
            f"{CV}/{cv_id}/versions/1/restore", headers={"Authorization": f"Bearer {b}"}
        ).status_code
        == 404
    )
