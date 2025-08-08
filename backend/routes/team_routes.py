# ==============================================================================
# File: backend/routes/team_routes.py (MODIFIED)
# ==============================================================================
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from ..database import get_db
from ..models import User, Team, Employee # Import Employee
from ..schemas import Team as TeamSchema, TeamCreate
from ..auth import require_role, get_current_active_user
from ..models import BusinessArea # Add BusinessArea to imports
from ..schemas import BusinessAreaInfo # You'll need to create this schema
router = APIRouter()

# No changes to create_team and get_teams_by_ba

@router.post("/", response_model=TeamSchema, status_code=status.HTTP_201_CREATED)
def create_team(team: TeamCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role("ba_coordinator"))):
    existing_team = db.query(Team).filter(Team.team_code == team.team_code).first()
    if existing_team: raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Team with code '{team.team_code}' already exists.")
    db_team = Team(**team.model_dump())
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    return db_team

@router.get("/by_ba/{ba_id}", response_model=List[TeamSchema])
def get_teams_by_ba(ba_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(Team).filter(Team.ba_id == ba_id).all()


@router.get("/{team_id}", response_model=TeamSchema)
def get_team_details(team_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    team = db.query(Team).options(
        joinedload(Team.employees)
    ).filter(Team.id == team_id).first()

    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # --- PERMISSION FIX STARTS HERE ---
    user_employee = current_user.employee
    if not user_employee:
        raise HTTPException(status_code=403, detail="User has no employee record.")

    is_admin = current_user.role == 'admin'
    is_ba_coord_of_team = (
        current_user.role == 'ba_coordinator' and 
        team.ba_id == user_employee.team.ba_id
    )
    is_member_of_team = user_employee.team_id == team_id

    if not (is_admin or is_ba_coord_of_team or is_member_of_team):
        raise HTTPException(status_code=403, detail="Not authorized to view this team's details")
    # --- PERMISSION FIX ENDS HERE ---
    
    return team


@router.get("/business-areas/", response_model=List[BusinessAreaInfo], summary="Get all business areas")
def get_all_business_areas(db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    """
    Fetches a list of all business areas. Admin only.
    """
    return db.query(BusinessArea).all()