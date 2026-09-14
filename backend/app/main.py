from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import analyses, auth, dashboard, health, model
from app.core.config import settings
from app.core.database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NEUROVISION AI Backend",
    version="1.0.0",
    description="Multi-Modal AI Diagnostic & Medical Image Analysis Suite backend",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(analyses.router, prefix="/api/analyses", tags=["analyses"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(model.router, prefix="/api/model", tags=["model"])
app.include_router(health.router, prefix="/api/health", tags=["health"])


@app.get("/")
def read_root():
    return {"message": "NEUROVISION AI backend is running"}
