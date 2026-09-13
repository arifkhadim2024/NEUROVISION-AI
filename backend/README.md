# NEUROVISION AI Backend

## Overview

This backend provides the API, database, authentication, file validation, and machine-learning inference layer for the NEUROVISION AI multi-modal medical image analysis platform.

## Architecture

- FastAPI REST API
- SQLAlchemy + PostgreSQL
- JWT authentication
- PyTorch inference layer with configurable model metadata
- Grad-CAM compatibility layer for CNN backbones
- File storage for uploads and generated outputs

## Installation

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Environment variables

Copy the example env file and adjust values:

```bash
cp .env.example .env
```

Required variables:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/neurovision
JWT_SECRET_KEY=change-me-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
MODEL_PATH=
UPLOAD_DIR=uploads
OUTPUT_DIR=outputs
ALLOWED_ORIGINS=http://localhost:5173
MAX_UPLOAD_SIZE_MB=10
MODEL_NAME=
MODEL_VERSION=
MODEL_ARCHITECTURE=efficientnet_b0
NUM_CLASSES=2
```

## PostgreSQL setup

```bash
createdb neurovision
```

## Running migrations

```bash
alembic init alembic
alembic revision --autogenerate -m "init"
alembic upgrade head
```

## Starting backend

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API documentation

Visit:

- http://localhost:8000/docs
- http://localhost:8000/redoc

## Model setup

The system is designed to use a real trained PyTorch checkpoint. Set `MODEL_PATH` to your trained `.pth`/`.pt` file. If no checkpoint exists, the backend returns a clear "model not available" state instead of fabricating predictions.

## Dataset setup

Provide a legitimate dataset using a custom training pipeline. The `ml_training` folder exists as a starter structure and expects an actual dataset definition.

## Training

Training code is intentionally separated from the runtime API. See `ml_training` for the optional training pipeline.

## Evaluation

The backend does not report model metrics unless they are actually calculated in the training pipeline.

## Grad-CAM

Grad-CAM is implemented in the runtime ML package. It requires a CNN-compatible architecture and will gracefully report unsupported architectures instead of fake outputs.

## Testing

```bash
python -m pytest
```

## Docker

```bash
docker compose up --build
```

## Connecting Lovable frontend

Set the frontend to call:

- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- GET /api/dashboard/stats
- GET /api/dashboard/activity
- GET /api/dashboard/distribution
- POST /api/analyses
- GET /api/analyses
- GET /api/analyses/{id}
- DELETE /api/analyses/{id}
- GET /api/model/info
- GET /api/health
- GET /api/health/model

## Deployment

- Use environment variables for secrets.
- Configure ALLOWED_ORIGINS for your hosting domain.
- Run behind a production WSGI server such as Gunicorn or a container orchestrator.

## Medical/ethical limitations

This backend is an educational and research-focused project. It is not a medical device, does not provide clinical diagnosis, and must not be presented as clinical advice.
