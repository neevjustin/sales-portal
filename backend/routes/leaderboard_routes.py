# ==============================================================================
# File: backend/routes/leaderboard_routes.py (FINAL & CORRECTED)
# Description: This version fixes the float vs. integer validation error by
# rounding all final scores to the nearest whole number before returning them.
# ==============================================================================
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional

from .. import auth, models, schemas
from ..database import get_db

router = APIRouter()

@router.get("/employee/{campaign_id}", response_model=List[schemas.LeaderboardEntry])
def get_employee_leaderboard(
    campaign_id: int,
    ba_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    query = db.query(
        models.Employee.id.label("employee_id"),
        models.Employee.name.label("employee_name"),
        models.Team.name.label("team_name"),
        models.BusinessArea.name.label("ba_name"),
        func.sum(models.Score.points).label("total_score")
    ).select_from(models.Score).join(
        models.Employee,
        and_(
            models.Score.entity_id == models.Employee.id,
            models.Score.entity_type == 'employee'
        )
    ).join(
        models.Team, models.Employee.team_id == models.Team.id
    ).join(
        models.BusinessArea, models.Team.ba_id == models.BusinessArea.id
    ).filter(
        models.Score.campaign_id == campaign_id
    )

    query = query.filter(models.Team.team_code.notlike('%_00'))
    
    if ba_id:
        query = query.filter(models.Team.ba_id == ba_id)

    results = query.group_by(
        models.Employee.id, models.Employee.name, models.Team.name, models.BusinessArea.name
    ).order_by(func.sum(models.Score.points).desc()).all()
    
    # --- FIX: Manually build response and round the score ---
    return [
        {
            "employee_id": r.employee_id,
            "employee_name": r.employee_name,
            "team_name": r.team_name,
            "ba_name": r.ba_name,
            "total_score": round(r.total_score or 0)
        }
        for r in results
    ]

@router.get("/team/{campaign_id}", response_model=List[schemas.TeamLeaderboardEntry])
def get_team_leaderboard(
    campaign_id: int,
    ba_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    query = db.query(
        models.Team.id.label("team_id"),
        models.Team.name.label("team_name"),
        models.Team.team_code,
        models.BusinessArea.name.label("ba_name"),
        func.sum(models.Score.points).label("total_score")
    ).select_from(models.Score).join(
        models.Team,
        and_(
            models.Score.entity_id == models.Team.id,
            models.Score.entity_type == 'team'
        )
    ).join(
        models.BusinessArea, models.Team.ba_id == models.BusinessArea.id
    ).filter(
        models.Score.campaign_id == campaign_id
    )

    if ba_id:
        query = query.filter(models.Team.ba_id == ba_id)

    results = query.group_by(
        models.Team.id, models.Team.name, models.Team.team_code, models.BusinessArea.name
    ).order_by(func.sum(models.Score.points).desc()).all()
    
    # --- FIX: Manually build response and round the score ---
    return [
        {
            "team_id": r.team_id,
            "team_code": r.team_code,
            "team_name": r.team_name,
            "ba_name": r.ba_name,
            "total_score": round(r.total_score or 0)
        }
        for r in results
    ]

@router.get("/ba/{campaign_id}", response_model=List[schemas.BALeaderboardEntry])
def get_ba_leaderboard(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    query = db.query(
        models.BusinessArea.id.label("ba_id"),
        models.BusinessArea.name.label("ba_name"),
        func.sum(models.Score.points).label("total_score")
    ).select_from(models.Score).join(
        models.BusinessArea,
        and_(
            models.Score.entity_id == models.BusinessArea.id,
            models.Score.entity_type == 'ba'
        )
    ).filter(
        models.Score.campaign_id == campaign_id
    )
    
    results = query.group_by(
        models.BusinessArea.id, models.BusinessArea.name
    ).order_by(func.sum(models.Score.points).desc()).all()
    
    final_results = []
    for r in results:
        coordinator = db.query(models.Employee).join(models.Team).filter(
            models.Team.ba_id == r.ba_id,
            models.Employee.role == 'ba_coordinator'
        ).first()
        final_results.append({
            "ba_id": r.ba_id,
            "ba_name": r.ba_name,
            # --- FIX: Round the score here as well ---
            "total_score": round(r.total_score or 0),
            "coordinator_name": coordinator.name if coordinator else "N/A"
        })

    return final_results