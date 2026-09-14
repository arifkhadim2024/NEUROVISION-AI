def test_register_user(client):
    email = "register-user@example.com"
    response = client.post(
        "/api/auth/register",
        json={"full_name": "Test User", "email": email, "password": "password123"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == email


def test_login_user(client):
    email = "login-user@example.com"
    client.post(
        "/api/auth/register",
        json={"full_name": "Login User", "email": email, "password": "password123"},
    )
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": "password123"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_get_current_user_requires_auth(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
