# ==============================================================================
# File: backend/routes/activity_routes.py (MODIFIED)
# ==============================================================================
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload # Import joinedload
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from datetime import date
from ..database import get_db
from ..models import User, Activity, ActivityType
from ..schemas import Activity as ActivitySchema, ActivityCreate, ActivityTypeInfo
from ..auth import get_current_active_user, require_role
from .. import models 
router = APIRouter()

# No changes to submit_activity or get_activity_types...
# File: backend/routes/activity_routes.py (add to existing file)
# ...
@router.post("/", response_model=ActivitySchema, status_code=status.HTTP_201_CREATED)
def submit_activity(activity: ActivityCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not current_user.employee: 
        raise HTTPException(status_code=400, detail="Authenticated user is not linked to an employee record.")

    activity_type = db.query(ActivityType).filter(ActivityType.id == activity.activity_type_id).first()
    if not activity_type:
        raise HTTPException(status_code=404, detail="Activity type not found.")

    # --- Duplicate check logic ---
    if activity_type.name != "House Visit": # Allow multiple house visits for the same customer
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

    # --- Real-time Lead Conversion Logic ---
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
    # --- End of Lead Conversion Logic ---

    logged_at_time = datetime.now(timezone.utc)
    db_activity = Activity(
        **activity.model_dump(), 
        employee_id=current_user.employee_id, 
        team_id=current_user.employee.team_id, 
        logged_at=logged_at_time
    )
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)
    return db_activity

@router.get("/my-logs", response_model=List[ActivitySchema], summary="Get activity logs based on user role")
def get_my_logs(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """
    Fetches activity logs based on the hierarchy:
    - Admin: All logs.
    - BA Coordinator: All logs for their Business Area.
    - Employee: Only their own logs.
    """
    query = db.query(Activity).options(
        joinedload(Activity.employee),
        joinedload(Activity.team),
        joinedload(Activity.activity_type)
    )

    if not current_user.employee:
        raise HTTPException(status_code=403, detail="User has no employee record.")

    if current_user.role == "admin":
        # Admin can see everything
        pass
    elif current_user.role == "ba_coordinator":
        # BA Coordinator sees everything in their BA
        ba_id = current_user.employee.team.ba_id
        teams_in_ba = db.query(models.Team.id).filter(models.Team.ba_id == ba_id).all()
        team_ids_in_ba = [t[0] for t in teams_in_ba]
        query = query.filter(Activity.team_id.in_(team_ids_in_ba))
    else: # 'employee' role
        # Employee sees only their own logs
        query = query.filter(Activity.employee_id == current_user.employee_id)

    return query.order_by(Activity.logged_at.desc()).all()


@router.get("/types", response_model=List[ActivityTypeInfo], summary="Get filtered activity types for data entry")
def get_activity_types(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """
    Returns a list of activity types that are relevant for direct customer interaction logging.
    This prevents cluttering the dropdown with event-based types like "No of Melas".
    """
    customer_interaction_types = [
        "MNP",
        "SIM Sales",
        "4G SIM Upgradation",
        "House Visit",
        "FTTH Connection"
    ]
    return db.query(ActivityType).filter(ActivityType.name.in_(customer_interaction_types)).all()



# --- MODIFICATION STARTS HERE ---
@router.get("/monitor", response_model=List[ActivitySchema], summary="Get and filter all activities")
def get_all_activities(
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_role("ba_coordinator")), 
    start_date: Optional[date] = None, 
    end_date: Optional[date] = None, 
    team_id: Optional[int] = None, 
    employee_id: Optional[int] = None
):
    # Base query with eager loading to prevent frontend crashes
    query = db.query(Activity).options(
        joinedload(Activity.employee),
        joinedload(Activity.team),
        joinedload(Activity.activity_type)
    )
    
    # Filter query based on user's role and BA
    if current_user.role == 'ba_coordinator':
        if not current_user.employee or not current_user.employee.team:
            raise HTTPException(status_code=403, detail="User is not associated with a BA.")
        
        # Get all team IDs for the coordinator's BA
        ba_id = current_user.employee.team.ba_id
        teams_in_ba = db.query(models.Team.id).filter(models.Team.ba_id == ba_id).all()
        team_ids_in_ba = [t[0] for t in teams_in_ba]
        query = query.filter(Activity.team_id.in_(team_ids_in_ba))

    # Apply optional filters from the request
    if start_date: query = query.filter(Activity.logged_at >= start_date)
    if end_date: 
        # Add one day to end_date to include all of that day
        query = query.filter(Activity.logged_at < (end_date + timedelta(days=1)))
    if team_id: query = query.filter(Activity.team_id == team_id)
    if employee_id: query = query.filter(Activity.employee_id == employee_id)
    
    return query.order_by(Activity.logged_at.desc()).all()