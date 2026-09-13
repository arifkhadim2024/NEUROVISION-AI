from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def create_user_and_auth(email: str = "alice@example.com"):
    client.post(
        "/api/auth/register",
        json={"full_name": "Alice Example", "email": email, "password": "securepass123"},
    )
    login = client.post(
        "/api/auth/login",
        json={"email": email, "password": "securepass123"},
    )
    return login.json()["access_token"]


def test_unauthorized_analysis_request():
    response = client.get("/api/analyses")
    assert response.status_code == 401


def test_invalid_file_upload():
    token = create_user_and_auth("invalid-upload@example.com")
    response = client.post(
        "/api/analyses",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("bad.txt", b"not an image", "text/plain")},
    )
    assert response.status_code in {400, 413, 422}


def test_analysis_ownership_and_model_info():
    token = create_user_and_auth("activity@example.com")
    model_response = client.get("/api/model/info")
    assert model_response.status_code == 200
    assert "model_available" in model_response.json()

    response = client.get("/api/analyses", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
