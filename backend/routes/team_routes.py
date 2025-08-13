# ==============================================================================
# File: backend/routes/team_routes.py (MODIFIED)
# ==============================================================================
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from pydantic import BaseModel # <-- Add this import

from ..database import get_db
from ..models import User, Team, Employee, BusinessArea
from ..schemas import Team as TeamSchema, TeamCreate, BusinessAreaInfo, EmployeeInfo # <-- Import EmployeeInfo
from ..auth import require_role, get_current_active_user, get_password_hash # <-- Import get_password_hash

router = APIRouter()

# No changes to create_team and get_teams_by_ba
class AddMemberRequest(BaseModel):
    hr_number: str
    name: str # Adding name for better user experience
    role: str = "employee" # Default role

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



@router.post("/{team_id}/add_member", response_model=EmployeeInfo, status_code=status.HTTP_201_CREATED)
def add_member_to_team(
    team_id: int,
    request: AddMemberRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Allows a Team Leader or Coordinator to add a new member to their team.
    Creates a new Employee and User if they don't exist.
    """
    # 1. Authorization Check
    user_employee = current_user.employee
    if not user_employee:
        raise HTTPException(status_code=403, detail="Current user is not an employee.")

    if user_employee.team_id != team_id or current_user.role not in ["team_leader", "team_coordinator"]:
        raise HTTPException(status_code=403, detail="Not authorized to add members to this team.")

    # 2. Check if employee or user already exists
    existing_employee = db.query(Employee).filter(Employee.employee_code == request.hr_number).first()
    if existing_employee:
        raise HTTPException(status_code=409, detail="Employee with this HR number already exists.")
    
    existing_user = db.query(User).filter(User.username == request.hr_number).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="A user with this username (HR number) already exists.")

    # 3. Create New Employee and User
    try:
        new_employee = Employee(
            name=request.name,
            employee_code=request.hr_number,
            role=request.role,
            team_id=team_id
        )
        db.add(new_employee)
        db.flush() # Flush to get the new_employee.id

        new_user = User(
            username=request.hr_number,
            password_hash=get_password_hash("BSNL@2025"), # Default password
            role=request.role,
            employee_id=new_employee.id,
            force_password_reset=True # Ensure they must reset password
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_employee)
        
        return new_employee
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")