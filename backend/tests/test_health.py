from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_model_health_status():
    response = client.get("/api/health/model")
    assert response.status_code == 200
    assert "model_available" in response.json()
