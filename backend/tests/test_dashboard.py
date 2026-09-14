def test_dashboard_endpoints(client):
    # Register and login
    email = "dash@example.com"
    client.post(
        "/api/auth/register",
        json={"full_name": "Dashboard User", "email": email, "password": "securepass123"},
    )
    login = client.post(
        "/api/auth/login",
        json={"email": email, "password": "securepass123"},
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Test stats
    stats_res = client.get("/api/dashboard/stats", headers=headers)
    assert stats_res.status_code == 200
    stats_data = stats_res.json()
    assert "total_analyses" in stats_data
    assert "average_confidence" in stats_data
    assert "model_version" in stats_data
    assert stats_data["total_analyses"] == 0

    # Test activity
    act_res = client.get("/api/dashboard/activity", headers=headers)
    assert act_res.status_code == 200
    assert isinstance(act_res.json(), list)

    # Test distribution
    dist_res = client.get("/api/dashboard/distribution", headers=headers)
    assert dist_res.status_code == 200
    assert isinstance(dist_res.json(), list)
