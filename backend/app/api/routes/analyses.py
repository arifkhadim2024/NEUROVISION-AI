from __future__ import annotations

import logging
import os
import time
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.analysis import Analysis
from app.schemas.analysis import (
    AnalysisDetailResponse,
    AnalysisListResponse,
    AnalysisResponse,
)
from app.services.storage_service import StorageService
from app.ml.gradcam import GradCAM
from app.ml.inference import predict
from app.ml.model_loader import get_model, get_model_metadata
from app.ml.preprocessing import preprocess_image


router = APIRouter()


@router.post(
    "",
    response_model=AnalysisResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload an image and run analysis",
)
async def create_analysis(
    file: UploadFile = File(...),
    patient_id: str | None = Form(default=None),
    scan_type: str | None = Form(default=None),
    notes: str | None = Form(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    StorageService.ensure_directories()
    original_path = StorageService.save_upload(file)

    analysis = Analysis(
        user_id=current_user.id,
        original_filename=file.filename or "upload",
        stored_image_path=original_path,
        status="processing",
        model_name=settings.model_name or "pending",
        model_version=settings.model_version or "pending",
    )

    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    start = time.time()

    try:
        # 1. Run model inference
        prediction = predict(original_path)

        # 2. Load the trained model
        model = get_model()

        # 3. Find the predicted class index
        class_index = next(
            index
            for index, item in enumerate(prediction["probabilities"])
            if item["label"] == prediction["label"]
        )

        # 4. Preprocess image for Grad-CAM
        input_tensor = preprocess_image(original_path)

        # 5. Generate Grad-CAM
        gradcam = GradCAM(model)

        gradcam_result = gradcam.generate(
            input_tensor=input_tensor,
            class_index=class_index,
            output_dir=settings.output_dir,
            original_image_path=original_path,
            analysis_id=analysis.id,
        )

        # 6. Save generated file paths
        analysis.heatmap_path = gradcam_result["heatmap_path"]
        analysis.overlay_path = gradcam_result["overlay_path"]

        # 7. Get model metadata
        model_meta = get_model_metadata()

        # 8. Save prediction information
        analysis.prediction_label = prediction["label"]
        analysis.prediction_confidence = prediction["confidence"]
        analysis.prediction_data = {
            "probabilities": prediction["probabilities"]
        }

        analysis.model_name = settings.model_name
        analysis.model_version = settings.model_version

        analysis.status = "completed"
        analysis.processing_time_ms = int(
            (time.time() - start) * 1000
        )

        db.commit()
        db.refresh(analysis)

        # 9. Return complete analysis response
        response = AnalysisResponse(
            id=analysis.id,
            status=analysis.status,
            prediction={
                "label": analysis.prediction_label,
                "confidence": analysis.prediction_confidence or 0.0,
            },
            predictions=prediction["probabilities"],
            original_image_url=(
                f"/api/analyses/media/analyses/{analysis.id}/original"
            ),
            heatmap_url=(
                f"/api/analyses/media/analyses/{analysis.id}/heatmap"
            ),
            overlay_url=(
                f"/api/analyses/media/analyses/{analysis.id}/overlay"
            ),
            model_name=analysis.model_name,
            model_version=analysis.model_version,
            processing_time_ms=analysis.processing_time_ms,
            created_at=analysis.created_at.isoformat(),
            note=notes,
        )

        return response

    except Exception as exc:
        logging.exception("ANALYSIS FAILED")
        analysis.status = "failed"
        analysis.error_message = str(exc)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Analysis failed",
        ) from exc


@router.get(
    "",
    response_model=AnalysisListResponse,
    summary="List analysis history with pagination and filters",
)
def list_analyses(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
    prediction: str | None = Query(default=None),
    sort: str = Query(default="created_at desc"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Analysis).filter(
        Analysis.user_id == current_user.id
    )

    if search:
        search_term = f"%{search.lower()}%"

        query = query.filter(
            or_(
                Analysis.original_filename.ilike(search_term),
                Analysis.prediction_label.ilike(search_term),
            )
        )

    if status:
        query = query.filter(Analysis.status == status)

    if prediction:
        query = query.filter(
            Analysis.prediction_label == prediction
        )

    total = query.count()

    if sort == "created_at asc":
        query = query.order_by(Analysis.created_at.asc())
    else:
        query = query.order_by(Analysis.created_at.desc())

    items = (
        query
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": [
            {
                "id": item.id,
                "original_filename": item.original_filename,
                "prediction_label": item.prediction_label,
                "prediction_confidence": item.prediction_confidence,
                "status": item.status,
                "created_at": item.created_at.isoformat(),
                "model_name": item.model_name,
                "model_version": item.model_version,
            }
            for item in items
        ],
        "page": page,
        "page_size": page_size,
        "total": total,
    }


@router.get(
    "/{analysis_id}",
    response_model=AnalysisDetailResponse,
    summary="Get one analysis by ID",
)
def get_analysis(
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    analysis = (
        db.query(Analysis)
        .filter(
            Analysis.id == analysis_id,
            Analysis.user_id == current_user.id,
        )
        .first()
    )

    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found",
        )

    return {
        "id": analysis.id,
        "status": analysis.status,
        "prediction": (
            {
                "label": analysis.prediction_label,
                "confidence": analysis.prediction_confidence or 0.0,
            }
            if analysis.prediction_label
            else None
        ),
        "predictions": (
            analysis.prediction_data.get("probabilities", [])
            if analysis.prediction_data
            else []
        ),
        "original_image_url": (
            f"/api/analyses/media/analyses/{analysis.id}/original"
        ),
        "heatmap_url": (
            f"/api/analyses/media/analyses/{analysis.id}/heatmap"
        ),
        "overlay_url": (
            f"/api/analyses/media/analyses/{analysis.id}/overlay"
        ),
        "model_name": analysis.model_name,
        "model_version": analysis.model_version,
        "processing_time_ms": analysis.processing_time_ms,
        "created_at": analysis.created_at.isoformat(),
        "original_filename": analysis.original_filename,
        "stored_image_path": analysis.stored_image_path,
        "error_message": analysis.error_message,
        "patient_id": None,
        "scan_type": None,
        "notes": None,
    }


@router.delete(
    "/{analysis_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an analysis and associated files",
)
def delete_analysis(
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    analysis = (
        db.query(Analysis)
        .filter(
            Analysis.id == analysis_id,
            Analysis.user_id == current_user.id,
        )
        .first()
    )

    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found",
        )

    for path_value in [
        analysis.stored_image_path,
        analysis.heatmap_path,
        analysis.overlay_path,
    ]:
        if path_value and Path(path_value).exists():
            Path(path_value).unlink()

    db.delete(analysis)
    db.commit()

    return None


@router.get(
    "/media/analyses/{analysis_id}/{file_type}"
)
def serve_analysis_media(
    analysis_id: str,
    file_type: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    analysis = (
        db.query(Analysis)
        .filter(
            Analysis.id == analysis_id,
            Analysis.user_id == current_user.id,
        )
        .first()
    )

    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found",
        )

    file_map = {
        "original": analysis.stored_image_path,
        "heatmap": analysis.heatmap_path,
        "overlay": analysis.overlay_path,
    }

    exact_path = file_map.get(file_type)

    if not exact_path or not os.path.exists(exact_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    return FileResponse(path=exact_path)