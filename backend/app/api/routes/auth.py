from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, get_current_user
from app.schemas.auth import TokenResponse, UserCreate, UserLogin, UserResponse
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED, summary="Register a new user")
def register_user(payload: UserCreate, db: Session = Depends(get_db)):
    user = AuthService.register_user(db, payload.full_name, payload.email, payload.password)
    return user


@router.post("/login", response_model=TokenResponse, summary="Log in and return a JWT")
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = AuthService.authenticate_user(db, payload.email, payload.password)
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    token = create_access_token(user.email, access_token_expires)
    return {"access_token": token, "token_type": "bearer"}


@router.post("/token", response_model=TokenResponse, include_in_schema=False)
def login_form(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = AuthService.authenticate_user(db, form_data.username, form_data.password)
    token = create_access_token(user.email)
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse, summary="Get current authenticated user")
def get_me(current_user=Depends(get_current_user)):
    return current_user
