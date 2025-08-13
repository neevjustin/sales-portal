# ==============================================================================
# File: backend/routes/activity_routes.py (Corrected Permissions)
# Description: This version fixes the bug where Team Leaders/Coordinators
# could only see their own logs. They can now see all logs for their team.
# ==============================================================================
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import date, datetime, timezone, timedelta
from pydantic import BaseModel

from ..database import get_db
from ..models import User, Activity, ActivityType, Score, Team
from ..schemas import Activity as ActivitySchema, ActivityCreate, ActivityTypeInfo
from ..auth import get_current_active_user, require_role
from .. import models 
from ..scoring_engine import update_score_for_employee, recalculate_all_scores

router = APIRouter()

class ActivitySubmissionResponse(BaseModel):
    activity: ActivitySchema
    new_total_score: int

@router.post("/", response_model=ActivitySubmissionResponse, status_code=status.HTTP_201_CREATED)
def submit_activity(
    activity: ActivityCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if not current_user.employee: 
        raise HTTPException(status_code=400, detail="Authenticated user is not linked to an employee record.")

    activity_type = db.query(ActivityType).filter(ActivityType.id == activity.activity_type_id).first()
    if not activity_type:
        raise HTTPException(status_code=404, detail="Activity type not found.")

    if activity_type.name != "House Visit":
        existing_activity = db.query(Activity).filter(
            Activity.campaign_id == activity.campaign_id,
            Activity.activity_type_id == activity.activity_type_id,
            Activity.customer_mobile == activity.customer_mobile
        ).first()
        if existing_activity:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"This entry already exists (Logged by {existing_activity.employee.name} on {existing_activity.logged_at.date()})."
            )

    if activity_type.name == "FTTH Connection":
        house_visit_type = db.query(ActivityType).filter(ActivityType.name == "House Visit").first()
        if house_visit_type:
            matching_lead = db.query(Activity).filter(
                Activity.campaign_id == activity.campaign_id,
                Activity.employee_id == current_user.employee_id,
                Activity.activity_type_id == house_visit_type.id,
                Activity.customer_mobile == activity.customer_mobile,
                Activity.is_lead == True,
                Activity.is_converted == False
            ).order_by(Activity.logged_at.desc()).first()
            
            if matching_lead:
                matching_lead.is_converted = True
                print(f"Marking lead ID {matching_lead.id} as converted.")
    
    db_activity = Activity(
        **activity.model_dump(), 
        employee_id=current_user.employee_id, 
        team_id=current_user.employee.team_id, 
        logged_at=datetime.now(timezone.utc)
    )
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)

    update_score_for_employee(db, employee_id=current_user.employee_id, campaign_id=activity.campaign_id)
    background_tasks.add_task(recalculate_all_scores, db, campaign_id=activity.campaign_id)
    
    new_score_query = db.query(func.sum(Score.points)).filter(
        Score.campaign_id == activity.campaign_id,
        Score.entity_id == current_user.employee_id,
        Score.entity_type == 'employee'
    ).scalar()
    
    new_total_score = int(new_score_query) if new_score_query else 0

    return ActivitySubmissionResponse(activity=db_activity, new_total_score=new_total_score)


@router.get("/my-logs", response_model=List[ActivitySchema], summary="Get activity logs based on user role")
def get_my_logs(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """
    Fetches activity logs based on the hierarchy:
    - Admin: All logs.
    - BA Coordinator: All logs for their Business Area.
    - Team Leader/Coordinator: All logs for their team.
    - Employee: Only their own logs.
    """
    query = db.query(Activity).options(
        joinedload(Activity.employee),
        joinedload(Activity.team),
        joinedload(Activity.activity_type)
    )

    if not current_user.employee:
        raise HTTPException(status_code=403, detail="User has no employee record.")

    # --- THIS IS THE FIX ---
    if current_user.role == "admin":
        # Admin sees everything, no filter needed.
        pass
    elif current_user.role == "ba_coordinator":
        # BA Coordinator sees everything in their BA.
        ba_id = current_user.employee.team.ba_id
        teams_in_ba = db.query(Team.id).filter(Team.ba_id == ba_id).all()
        team_ids_in_ba = [t[0] for t in teams_in_ba]
        query = query.filter(Activity.team_id.in_(team_ids_in_ba))
    elif current_user.role in ["team_leader", "team_coordinator"]:
        # Team Leader/Coordinator sees everything in their own team.
        if not current_user.employee.team_id:
             raise HTTPException(status_code=403, detail="User is not assigned to a team.")
        query = query.filter(Activity.team_id == current_user.employee.team_id)
    else: # 'employee' role
        # Regular employee sees only their own logs.
        query = query.filter(Activity.employee_id == current_user.employee_id)
    # --- END OF FIX ---

    return query.order_by(Activity.logged_at.desc()).all()


@router.get("/types", response_model=List[ActivityTypeInfo], summary="Get filtered activity types for data entry")
def get_activity_types(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    customer_interaction_types = [
        "MNP",
        "SIM Sales",
        "4G SIM Upgradation",
        "House Visit",
        "FTTH Connection"
    ]
    return db.query(ActivityType).filter(ActivityType.name.in_(customer_interaction_types)).all()


@router.get("/monitor", response_model=List[ActivitySchema], summary="Get and filter all activities")
def get_all_activities(
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_role("ba_coordinator")), 
    start_date: Optional[date] = None, 
    end_date: Optional[date] = None, 
    team_id: Optional[int] = None, 
    employee_id: Optional[int] = None
):
    query = db.query(Activity).options(
        joinedload(Activity.employee),
        joinedload(Activity.team),
        joinedload(Activity.activity_type)
    )
    
    if current_user.role == 'ba_coordinator':
        if not current_user.employee or not current_user.employee.team:
            raise HTTPException(status_code=403, detail="User is not associated with a BA.")
        
        ba_id = current_user.employee.team.ba_id
        teams_in_ba = db.query(Team.id).filter(Team.ba_id == ba_id).all()
        team_ids_in_ba = [t[0] for t in teams_in_ba]
        query = query.filter(Activity.team_id.in_(team_ids_in_ba))

    if start_date: query = query.filter(Activity.logged_at >= start_date)
    if end_date: 
        query = query.filter(Activity.logged_at < (end_date + timedelta(days=1)))
    if team_id: query = query.filter(Activity.team_id == team_id)
    if employee_id: query = query.filter(Activity.employee_id == employee_id)
    
    return query.order_by(Activity.logged_at.desc()).all()


@router.get("/types/all", response_model=List[ActivityTypeInfo], summary="Get all activity types (for admin/management)")
def get_all_activity_types(
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_role("ba_coordinator"))
):
    return db.query(ActivityType).order_by(ActivityType.name).all()


@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_activity(
    activity_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    activity_to_delete = db.query(Activity).options(joinedload(Activity.team)).filter(Activity.id == activity_id).first()

    if not activity_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found.")

    user_employee = current_user.employee
    if not user_employee:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User has no employee record.")

    is_admin = current_user.role == 'admin'
    is_owner = activity_to_delete.employee_id == user_employee.id
    is_ba_coordinator_of_activity = (
        current_user.role == 'ba_coordinator' and
        activity_to_delete.team and
        activity_to_delete.team.ba_id == user_employee.team.ba_id
    )

    if not (is_admin or is_owner or is_ba_coordinator_of_activity):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to delete this entry.")

    campaign_id = activity_to_delete.campaign_id

    db.delete(activity_to_delete)
    db.commit()

    background_tasks.add_task(recalculate_all_scores, db, campaign_id=campaign_id)

    return None
