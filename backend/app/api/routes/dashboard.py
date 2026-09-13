from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.analysis import Analysis
from app.schemas.dashboard import DashboardActivityItem, DashboardDistributionItem, DashboardStats

router = APIRouter()


@router.get("/stats", response_model=DashboardStats, summary="Get dashboard summary statistics")
def get_dashboard_stats(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    total_analyses = db.query(Analysis).filter(Analysis.user_id == current_user.id).count()
    week_ago = datetime.utcnow() - timedelta(days=7)
    analyses_this_week = (
        db.query(Analysis)
        .filter(Analysis.user_id == current_user.id)
        .filter(Analysis.created_at >= week_ago)
        .count()
    )

    avg_conf = (
        db.query(func.avg(Analysis.prediction_confidence))
        .filter(Analysis.user_id == current_user.id)
        .filter(Analysis.prediction_confidence.isnot(None))
        .scalar()
    )

    return {
        "total_analyses": total_analyses,
        "analyses_this_week": analyses_this_week,
        "average_confidence": float(avg_conf or 0),
        "model_version": current_user.email,
    }


@router.get("/activity", response_model=list[DashboardActivityItem], summary="Get daily analysis activity")
def get_dashboard_activity(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    start = datetime.utcnow() - timedelta(days=30)
    rows = (
        db.query(func.date(Analysis.created_at).label("date"), func.count(Analysis.id).label("count"))
        .filter(Analysis.user_id == current_user.id)
        .filter(Analysis.created_at >= start)
        .group_by(func.date(Analysis.created_at))
        .all()
    )
    return [{"date": row.date.isoformat(), "count": row.count} for row in rows]


@router.get("/distribution", response_model=list[DashboardDistributionItem], summary="Get prediction distribution for stored analyses")
def get_dashboard_distribution(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    rows = (
        db.query(Analysis.prediction_label.label("label"), func.count(Analysis.id).label("count"))
        .filter(Analysis.user_id == current_user.id)
        .filter(Analysis.prediction_label.isnot(None))
        .group_by(Analysis.prediction_label)
        .all()
    )
    return [{"label": row.label, "count": row.count} for row in rows]
