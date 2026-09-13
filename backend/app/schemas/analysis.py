from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class AnalysisPrediction(BaseModel):
    label: str
    confidence: float


class AnalysisResult(BaseModel):
    label: str
    confidence: float
    probabilities: list[dict[str, Any]] = []


class AnalysisCreate(BaseModel):
    patient_id: str | None = None
    scan_type: str | None = None
    notes: str | None = None


class AnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    status: str
    prediction: AnalysisPrediction | None = None
    predictions: list[dict[str, Any]] = []
    original_image_url: str | None = None
    heatmap_url: str | None = None
    overlay_url: str | None = None
    model_name: str | None = None
    model_version: str | None = None
    processing_time_ms: int | None = None
    created_at: str | None = None
    note: str | None = None


class AnalysisListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    original_filename: str
    prediction_label: str | None = None
    prediction_confidence: float | None = None
    status: str
    created_at: str
    model_name: str | None = None
    model_version: str | None = None


class AnalysisListResponse(BaseModel):
    items: list[AnalysisListItem]
    page: int
    page_size: int
    total: int


class AnalysisDetailResponse(AnalysisResponse):
    original_filename: str | None = None
    stored_image_path: str | None = None
    error_message: str | None = None
    patient_id: str | None = None
    scan_type: str | None = None
    notes: str | None = None
