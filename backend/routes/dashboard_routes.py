# ==============================================================================
# File: backend/routes/dashboard_routes.py (Production Ready)
# Description: Provides data for the admin, BA, and Team dashboards by
# querying pre-calculated data for maximum performance.
# ==============================================================================
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from pydantic import BaseModel

from ..database import get_db
from .. import models 
from ..models import User, Activity, BATarget, ActivityType, Team, Employee, Score, BusinessArea
from ..auth import require_role, get_current_active_user

router = APIRouter()

# --- Pydantic Schemas for Dashboard Data ---
class KpiData(BaseModel):
    name: str
    achieved: int
    target: int

class PerformanceData(BaseModel):
    id: int
    name: str # For BA name, Team Code, or Employee Name
    team_name: Optional[str] = None # Specifically for showing team name alongside team code
    score: int
    leader_name: Optional[str] = None
    coordinator_name: Optional[str] = None



class PersonalProgress(BaseModel):
    parameter: str
    achieved: int
    target: int

class PersonalScoreSummary(BaseModel):
    total_score: int
    breakdown: List[PerformanceData]
    progress: List[PersonalProgress]

@router.get("/my_summary/{campaign_id}", response_model=PersonalScoreSummary, summary="Get a score and progress summary for the current user")
def get_my_score_summary(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Provides a detailed summary for an employee's dashboard, including:
    - Their total score.
    - A breakdown of points by activity.
    - Their personal contribution towards their team's targets.
    """
    if not current_user.employee:
        raise HTTPException(status_code=404, detail="Employee record not found for user.")
    
    employee_id = current_user.employee.id
    team_id = current_user.employee.team_id

    # 1. Get Score Breakdown and Total
    score_data = db.query(
        models.Score.parameter.label("name"),
        func.sum(models.Score.points).label("score")
    ).filter(
        models.Score.campaign_id == campaign_id,
        models.Score.entity_id == employee_id,
        models.Score.entity_type == 'employee'
    ).group_by(models.Score.parameter).all()

    total_score = sum(s.score for s in score_data)
    
    # Format the breakdown
    breakdown = [PerformanceData(id=i, name=s.name, score=int(s.score)) for i, s in enumerate(score_data)]

    # 2. Get Progress towards Team Targets
    progress = []
    if team_id:
        team_targets = db.query(models.TeamTarget).filter(
            models.TeamTarget.campaign_id == campaign_id,
            models.TeamTarget.team_id == team_id
        ).all()
        
        target_map = {t.activity_type_id: t for t in team_targets}
        target_activity_ids = list(target_map.keys())

        if target_activity_ids:
            personal_achievements = db.query(
                models.Activity.activity_type_id,
                func.count(models.Activity.id).label("count")
            ).filter(
                models.Activity.campaign_id == campaign_id,
                models.Activity.employee_id == employee_id,
                models.Activity.activity_type_id.in_(target_activity_ids)
            ).group_by(models.Activity.activity_type_id).all()

            achieved_map = {pa.activity_type_id: pa.count for pa in personal_achievements}

            for activity_id, target in target_map.items():
                activity_type = db.query(models.ActivityType).get(activity_id)
                if activity_type:
                    progress.append(PersonalProgress(
                        parameter=activity_type.name,
                        achieved=achieved_map.get(activity_id, 0),
                        target=target.target_value
                    ))

    return PersonalScoreSummary(
        total_score=int(total_score),
        breakdown=breakdown,
        progress=progress
    )


# --- Endpoints ---

@router.get("/circle_kpis/{campaign_id}", response_model=List[KpiData], summary="Get Circle-level Key Performance Indicators")
def get_circle_kpis(campaign_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    """
    Fetches high-level KPIs for the entire circle by aggregating BA-level targets
    and comparing them against total logged activities.
    """
    key_metrics = ["MNP", "SIM Sales", "4G SIM Upgradation", "FTTH Provision Target"]
    

    activity_types = db.query(ActivityType).all()

    activity_type_map = {at.name: at.id for at in activity_types}
    kpis = []

    for metric_name in key_metrics:
        total_target = 0
        total_achieved = 0

        if metric_name == "FTTH Provision Target":
            bnu_id = activity_type_map.get("BNU connections")
            urban_id = activity_type_map.get("Urban connections")
            
            if bnu_id and urban_id:
                
                total_target_query = db.query(func.sum(BATarget.target_value)).filter(
                    BATarget.campaign_id == campaign_id,
                    BATarget.activity_type_id.in_([bnu_id, urban_id])
                ).scalar()
                total_target = int(total_target_query) if total_target_query else 0
                
                total_achieved = db.query(func.count(Activity.id)).filter(
                    Activity.campaign_id == campaign_id,
                    Activity.activity_type_id.in_([bnu_id, urban_id])
                ).scalar() or 0
        else:
            activity_type_id = activity_type_map.get(metric_name)
            if activity_type_id:
                total_target_query = db.query(func.sum(BATarget.target_value)).filter(
                    BATarget.campaign_id == campaign_id,
                    BATarget.activity_type_id == activity_type_id
                ).scalar()
                total_target = int(total_target_query) if total_target_query else 0

                total_achieved = db.query(func.count(Activity.id)).filter(
                    Activity.campaign_id == campaign_id,
                    Activity.activity_type_id == activity_type_id
                ).scalar() or 0
        
        kpis.append(KpiData(name=metric_name, achieved=total_achieved, target=total_target))
        
    return kpis

@router.get("/ba_performance/{campaign_id}", response_model=List[PerformanceData], summary="Get ranked performance of all BAs")
def get_ba_performance(campaign_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    """
    Fetches ranked BA performance by querying the pre-calculated 'scores' table.
    """
    ba_scores = db.query(
        BusinessArea.id.label("id"),
        BusinessArea.name.label("name"),
        func.sum(Score.points).label("score")
    ).select_from(Score).join(
        BusinessArea, and_(Score.entity_id == BusinessArea.id, Score.entity_type == 'ba')
    ).filter(Score.campaign_id == campaign_id).group_by(BusinessArea.id, BusinessArea.name).order_by(func.sum(Score.points).desc()).all()
    results = []
    for ba in ba_scores:
        coordinator = db.query(Employee).join(Team).filter(
            Team.ba_id == ba.id,
            Employee.role == 'ba_coordinator'
        ).first()
        results.append(
            PerformanceData(
                id=ba.id,
                name=ba.name,
                score=int(ba.score),
                coordinator_name=coordinator.name if coordinator else "N/A"
            )
        )
    return results

@router.get("/team_performance/{campaign_id}/{ba_id}", response_model=List[PerformanceData], summary="Get ranked performance of teams in a BA")
def get_team_performance_in_ba(campaign_id: int, ba_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("ba_coordinator"))):
    """
    Fetches ranked team performance for a specific BA by querying the 'scores' table.
    """
    if current_user.employee.team.ba_id != ba_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this BA")
    
    team_scores = db.query(
        Team.id.label("id"),
        Team.team_code.label("name"), # Use 'name' field for team_code as per schema
        Team.name.label("team_name"),
        func.sum(Score.points).label("score")
    ).select_from(Score).join(
        Team, and_(Score.entity_id == Team.id, Score.entity_type == 'team')
    ).filter(Score.campaign_id == campaign_id, Team.ba_id == ba_id).group_by(Team.id, Team.team_code, Team.name).order_by(func.sum(Score.points).desc()).all()
    

    
    results = []
    for team in team_scores:
        leader = db.query(Employee).filter(Employee.team_id == team.id, Employee.role == 'team_leader').first()
        coordinator = db.query(Employee).filter(Employee.team_id == team.id, Employee.role == 'team_coordinator').first()
        results.append(
            PerformanceData(
                id=team.id,
                name=team.name,
                team_name=team.team_name,
                score=int(team.score),
                leader_name=leader.name if leader else "N/A",
                coordinator_name=coordinator.name if coordinator else "N/A"
            )
        )
    return results

@router.get("/team_members/{campaign_id}/{team_id}", response_model=List[PerformanceData], summary="Get ranked performance of members in a team")
def get_team_member_performance(campaign_id: int, team_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """
    Fetches ranked employee performance for a specific team by querying the 'scores' table.
    """
    # Security check: Ensure user is admin, BA coord of that team's BA, or member of that team.
    is_admin = current_user.role == 'admin'
    is_member = current_user.employee.team_id == team_id
    is_ba_coord = False
    if current_user.role == 'ba_coordinator':
        team = db.query(Team).get(team_id)
        if team and team.ba_id == current_user.employee.team.ba_id:
            is_ba_coord = True

    if not (is_admin or is_member or is_ba_coord):
        raise HTTPException(status_code=403, detail="Not authorized to view this team's data")

    employee_scores = db.query(
        Employee.id.label("id"),
        Employee.name.label("name"),
        func.sum(Score.points).label("score")
    ).select_from(Score).join(
        Employee, and_(Score.entity_id == Employee.id, Score.entity_type == 'employee')
    ).filter(Score.campaign_id == campaign_id, Employee.team_id == team_id).group_by(Employee.id, Employee.name).order_by(func.sum(Score.points).desc()).all()

    return [PerformanceData(id=emp.id, name=emp.name, score=int(emp.score)) for emp in employee_scores]

@router.get("/ba_kpis/{campaign_id}/{ba_id}", response_model=List[KpiData], summary="Get BA-level Key Performance Indicators")
def get_ba_kpis(
    campaign_id: int,
    ba_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ba_coordinator"))
):
    """
    Fetches high-level KPIs for a specific Business Area by aggregating team-level targets
    and comparing them against logged activities for that BA.
    """
    if current_user.employee.team.ba_id != ba_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    key_metrics = ["MNP", "SIM Sales", "4G SIM Upgradation", "BNU connections", "Urban connections"]
    activity_types = db.query(ActivityType).filter(ActivityType.name.in_(key_metrics)).all()
    activity_type_map = {at.name: at.id for at in activity_types}
    kpis = []

    teams_in_ba = db.query(Team.id).filter(Team.ba_id == ba_id).all()
    team_ids_in_ba = [t[0] for t in teams_in_ba]

    for metric_name in key_metrics:
        activity_type_id = activity_type_map.get(metric_name)
        total_target = 0
        total_achieved = 0

        if activity_type_id and team_ids_in_ba:
            # Sum the targets for all teams within the BA for this activity type
            total_target_query = db.query(func.sum(models.TeamTarget.target_value)).filter(
                models.TeamTarget.campaign_id == campaign_id,
                models.TeamTarget.activity_type_id == activity_type_id,
                models.TeamTarget.team_id.in_(team_ids_in_ba)
            ).scalar()
            total_target = int(total_target_query) if total_target_query else 0

            # Count all activities logged by teams in this BA
            total_achieved = db.query(func.count(Activity.id)).filter(
                Activity.campaign_id == campaign_id,
                Activity.activity_type_id == activity_type_id,
                Activity.team_id.in_(team_ids_in_ba)
            ).scalar() or 0
        
        kpis.append(KpiData(name=metric_name, achieved=total_achieved, target=total_target))
        
    return kpis


from sqlalchemy import func, and_, desc, text
from pydantic import BaseModel


class RankData(BaseModel):
    rank: int
    total: int


@router.get("/ba_rank/{campaign_id}/{ba_id}", response_model=RankData, summary="Get the rank of a specific BA")
def get_ba_rank(
    campaign_id: int,
    ba_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ba_coordinator"))
):
    """
    Calculates the current rank of a specific BA based on total score.
    """
    if current_user.employee.team.ba_id != ba_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # This subquery calculates the total score for each BA and ranks them
    subquery = db.query(
        Score.entity_id,
        func.sum(Score.points).label("total_score"),
        func.rank().over(order_by=desc(func.sum(Score.points))).label("rank")
    ).filter(
        Score.campaign_id == campaign_id,
        Score.entity_type == 'ba'
    ).group_by(Score.entity_id).subquery()

    # This query finds the specific rank for the requested ba_id from the subquery
    ba_rank_result = db.query(subquery.c.rank).filter(subquery.c.entity_id == ba_id).first()
    
    # Get the total number of participating BAs
    total_bas = db.query(func.count(func.distinct(Score.entity_id))).filter(
        Score.campaign_id == campaign_id,
        Score.entity_type == 'ba'
    ).scalar() or 0

    return RankData(
        rank=ba_rank_result[0] if ba_rank_result else 0,
        total=total_bas
    )