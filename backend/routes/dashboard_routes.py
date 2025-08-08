# File: backend/routes/dashboard_routes.py (NEW FILE)

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel

from ..database import get_db
from ..models import User, Activity, BATarget, ActivityType, Team, Employee
from ..auth import require_role, get_current_active_user
from ..utils import calculate_ba_leaderboard_scores, calculate_team_leaderboard_scores, calculate_leaderboard_scores

router = APIRouter()

# --- Pydantic Schemas for Dashboard Data ---
class KpiData(BaseModel):
    name: str
    achieved: int
    target: int

class PerformanceData(BaseModel):
    id: int
    name: str
    team_name: Optional[str] = None
    score: int
    leader_name: Optional[str] = None
    coordinator_name: Optional[str] = None

# --- Endpoints ---

@router.get("/circle_kpis/{campaign_id}", response_model=List[KpiData], summary="Get Circle-level Key Performance Indicators")
def get_circle_kpis(campaign_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    # This endpoint fetches high-level KPIs for the entire circle.
    # It aggregates BA-level targets to get the total target.
    key_metrics = ["MNP", "SIM Sales", "FTTH Provision Target"]
    activity_types = db.query(ActivityType).filter(ActivityType.name.in_(key_metrics)).all()
    activity_type_map = {at.name: at.id for at in activity_types}
    kpis = []

    for metric_name in key_metrics:
        activity_type_id = activity_type_map.get(metric_name)
        total_target = 0
        total_achieved = 0

        if activity_type_id:
            # Sum up all BA targets for this metric
            total_target_query = db.query(func.sum(BATarget.target_value)).filter(
                BATarget.campaign_id == campaign_id,
                BATarget.activity_type_id == activity_type_id
            ).scalar()
            total_target = int(total_target_query) if total_target_query else 0

            # Count all activities of this type
            total_achieved = db.query(func.count(Activity.id)).filter(
                Activity.campaign_id == campaign_id,
                Activity.activity_type_id == activity_type_id
            ).scalar() or 0
        
        # Special handling for composite FTTH target
        elif metric_name == "FTTH Provision Target":
             bnu_id = activity_type_map.get("BNU connections")
             urban_id = activity_type_map.get("Urban connections")
             if bnu_id and urban_id:
                # Sum targets for both BNU and Urban
                total_target_query = db.query(func.sum(BATarget.target_value)).filter(
                    BATarget.campaign_id == campaign_id,
                    BATarget.activity_type_id.in_([bnu_id, urban_id])
                ).scalar()
                total_target = int(total_target_query) if total_target_query else 0
                
                # Count activities for both
                total_achieved = db.query(func.count(Activity.id)).filter(
                    Activity.campaign_id == campaign_id,
                    Activity.activity_type_id.in_([bnu_id, urban_id])
                ).scalar() or 0
        
        kpis.append(KpiData(name=metric_name, achieved=total_achieved, target=total_target))
        
    return kpis

@router.get("/ba_performance/{campaign_id}", response_model=List[PerformanceData], summary="Get ranked performance of all BAs")
def get_ba_performance(campaign_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    ba_scores = calculate_ba_leaderboard_scores(db, campaign_id)
    return [
        PerformanceData(
            id=ba.get('ba_id', 0), 
            name=ba.get('ba_name', 'Unknown BA'), 
            score=ba.get('total_score', 0), 
            coordinator_name=ba.get('coordinator_name', "N/A")
        ) for ba in ba_scores
    ]

@router.get("/team_performance/{campaign_id}/{ba_id}", response_model=List[PerformanceData], summary="Get ranked performance of teams in a BA")
def get_team_performance_in_ba(campaign_id: int, ba_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("ba_coordinator"))):
    # Security check to ensure BA coordinator can only see their own BA
    if current_user.employee.team.ba_id != ba_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this BA")
    
    team_scores = calculate_team_leaderboard_scores(db, campaign_id)
    ba_team_scores = []
    
    for team_data in team_scores:
        team_obj = db.query(Team).filter(Team.id == team_data['team_id']).first()
        if team_obj and team_obj.ba_id == ba_id:
            # --- THIS IS THE FIX ---
            # Use 'ilike' for case-insensitive matching and check for both role naming conventions.
            leader = db.query(Employee).filter(
                Employee.team_id == team_obj.id, 
                func.lower(Employee.role).in_(['team leader', 'team_leader'])
            ).first()

            coordinator = db.query(Employee).filter(
                Employee.team_id == team_obj.id,
                func.lower(Employee.role).in_(['team coordinator', 'team_coordinator'])
            ).first()
            # --- END OF FIX ---
            
            ba_team_scores.append(PerformanceData(
                id=team_data['team_id'], 
                name=team_data['team_code'], # This field is used for team_code
                team_name=team_obj.name, # <-- ADD TEAM NAME HERE
                score=team_data['total_score'],
                leader_name=leader.name if leader else "N/A",
                coordinator_name=coordinator.name if coordinator else "N/A"
            ))
            
    return ba_team_scores

@router.get("/team_members/{campaign_id}/{team_id}", response_model=List[PerformanceData], summary="Get ranked performance of members in a team")
def get_team_member_performance(campaign_id: int, team_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # Add security check for team leads/coordinators
    employee_scores = calculate_leaderboard_scores(db, campaign_id)
    team_member_scores = []
    
    for emp in employee_scores:
        employee_obj = db.query(Employee).get(emp['employee_id'])
        if employee_obj and employee_obj.team_id == team_id:
            team_member_scores.append(PerformanceData(id=emp['employee_id'], name=emp['employee_name'], score=emp['total_score']))
            
    return team_member_scores