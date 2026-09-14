def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_model_health_status(client):
    response = client.get("/api/health/model")
    assert response.status_code == 200
    assert "model_available" in response.json()
