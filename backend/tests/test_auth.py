from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.main import app

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def test_register_user():
    email = "register-user@example.com"
    response = client.post(
        "/api/auth/register",
        json={"full_name": "Test User", "email": email, "password": "password123"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == email


def test_login_user():
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


def test_get_current_user_requires_auth():
    response = client.get("/api/auth/me")
    assert response.status_code == 401
