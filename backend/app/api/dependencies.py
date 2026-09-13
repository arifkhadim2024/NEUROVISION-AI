from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.analysis import Analysis
from app.models.user import User


def get_authenticated_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user


def get_analysis_owner(
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_authenticated_user),
) -> Analysis:
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if analysis is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
    if analysis.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return analysis
