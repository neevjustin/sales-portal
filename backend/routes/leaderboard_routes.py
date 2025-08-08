# ==============================================================================
# File: backend/routes/leaderboard_routes.py (FULLY CORRECTED)
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
    """
    Calculates and returns the leaderboard scores for individual employees.
    This logic now correctly calculates scores live from the Activity and ScoringWeight tables.
    """
    query = db.query(
        models.Employee.id.label("employee_id"),
        models.Employee.name.label("employee_name"),
        models.Team.name.label("team_name"),
        models.BusinessArea.name.label("ba_name"),
        func.sum(models.ScoringWeight.max_marks).label("total_score")
    ).select_from(models.Activity).join(
        models.Employee, models.Activity.employee_id == models.Employee.id
    ).join(
        models.Team, models.Activity.team_id == models.Team.id
    ).join(
        models.BusinessArea, models.Team.ba_id == models.BusinessArea.id
    ).join(
        models.ScoringWeight, and_(
            models.Activity.activity_type_id == models.ScoringWeight.activity_type_id,
            models.Activity.campaign_id == models.ScoringWeight.campaign_id
        )
    ).filter(
        models.Activity.campaign_id == campaign_id
    )

    if ba_id:
        query = query.filter(models.Team.ba_id == ba_id)

    results = query.group_by(
        models.Employee.id, models.Employee.name, models.Team.name, models.BusinessArea.name
    ).order_by(func.sum(models.ScoringWeight.max_marks).desc()).all()
    
    return results

@router.get("/team/{campaign_id}", response_model=List[schemas.TeamLeaderboardEntry])
def get_team_leaderboard(
    campaign_id: int,
    ba_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Fetches pre-calculated leaderboard scores for teams from the Score table.
    """
    # This query starts from the Team model, which is more stable.
    query = db.query(
        models.Team.id.label("team_id"),
        models.Team.name.label("team_name"),
        models.Team.team_code,
        models.BusinessArea.name.label("ba_name"),
        func.sum(models.Score.points).label("total_score")
    ).join(
        models.BusinessArea, models.Team.ba_id == models.BusinessArea.id
    ).join(
        models.Score, and_(
            models.Team.id == models.Score.entity_id,
            models.Score.entity_type == 'team'
        )
    ).filter(
        models.Score.campaign_id == campaign_id
    )

    if ba_id:
        query = query.filter(models.Team.ba_id == ba_id)

    results = query.group_by(
        models.Team.id, models.Team.name, models.Team.team_code, models.BusinessArea.name
    ).order_by(func.sum(models.Score.points).desc()).all()
    
    return results

@router.get("/ba/{campaign_id}", response_model=List[schemas.BALeaderboardEntry])
def get_ba_leaderboard(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Fetches pre-calculated leaderboard scores for Business Areas.
    """
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
            "total_score": int(r.total_score),
            "coordinator_name": coordinator.name if coordinator else "N/A"
        })

    return final_results