# ==============================================================================
# File: backend/routes/employee_routes.py (MODIFIED)
# ==============================================================================
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from .. import auth, schemas, models
from ..database import get_db

router = APIRouter()

can_manage_users = Depends(auth.require_role("ba_coordinator"))

@router.post("/", response_model=schemas.EmployeeInfo, status_code=status.HTTP_201_CREATED)
def create_employee(employee: schemas.EmployeeCreate, db: Session = Depends(get_db), current_user: models.User = can_manage_users):
    team = db.query(models.Team).filter(models.Team.id == employee.team_id).first()
    if not team: raise HTTPException(status_code=404, detail="Team not found")
    if current_user.role == 'ba_coordinator' and team.ba_id != current_user.employee.team.ba_id:
        raise HTTPException(status_code=403, detail="Cannot add employee to a team outside your BA.")
    db_employee = models.Employee(**employee.model_dump())
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee

@router.get("/by_ba/{ba_id}", response_model=List[schemas.EmployeeInfo])
def get_employees_by_ba(ba_id: int, db: Session = Depends(get_db), current_user: models.User = can_manage_users):
    if current_user.role == 'ba_coordinator' and ba_id != current_user.employee.team.ba_id:
        raise HTTPException(status_code=403, detail="Cannot view employees outside your BA.")
    employees = db.query(models.Employee).join(models.Team).filter(models.Team.ba_id == ba_id).all()
    return employees

# --- NEW ENDPOINTS START HERE ---

@router.get("/unassigned/{ba_id}", response_model=List[schemas.EmployeeInfo], summary="Get unassigned employees, with optional search")
def get_unassigned_employees(
    ba_id: int, 
    search: Optional[str] = None, # <-- Add search parameter
    db: Session = Depends(get_db), 
    current_user: models.User = can_manage_users
):
    """
    Fetches employees from a BA who are eligible for assignment.
    If a search term is provided, it filters by name or employee code.
    """
    if current_user.employee.team.ba_id != ba_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Base query for eligible employees in the BA
    query = db.query(models.Employee).join(models.Team).filter(
        models.Team.ba_id == ba_id,
        models.Employee.role.notin_(['Admin', 'BA Head', 'ba_coordinator'])
    )

    # Apply search filter if a term is provided
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                models.Employee.name.ilike(search_term),
                models.Employee.employee_code.ilike(search_term)
            )
        )
    
    # Return up to 10 results to keep the list manageable
    employees = query.limit(10).all()
    return employees

@router.put("/{employee_id}/assign_team/{team_id}", response_model=schemas.EmployeeInfo, summary="Assign an employee to a team")
def assign_employee_to_team(employee_id: int, team_id: int, db: Session = Depends(get_db), current_user: models.User = can_manage_users):
    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not employee: raise HTTPException(status_code=404, detail="Employee not found")
    
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team: raise HTTPException(status_code=404, detail="Team not found")

    if team.ba_id != current_user.employee.team.ba_id:
        raise HTTPException(status_code=403, detail="Cannot assign to a team outside your BA.")

    employee.team_id = team_id
    db.commit()
    db.refresh(employee)
    return employee

@router.put("/{employee_id}/unassign", response_model=schemas.EmployeeInfo, summary="Unassign an employee from their team")
def unassign_employee(employee_id: int, db: Session = Depends(get_db), current_user: models.User = can_manage_users):
    employee = db.query(models.Employee).options(joinedload(models.Employee.team)).filter(models.Employee.id == employee_id).first()
    if not employee: raise HTTPException(status_code=404, detail="Employee not found")
    if not employee.team: raise HTTPException(status_code=400, detail="Employee is not in a team")
    
    if employee.team.ba_id != current_user.employee.team.ba_id:
        raise HTTPException(status_code=403, detail="Cannot unassign members from teams outside your BA.")
    
    # Assign the user to the BA coordinator's own (default) team
    employee.team_id = current_user.employee.team_id 
    employee.is_team_lead = False
    db.commit()
    db.refresh(employee)
    return employee

@router.put("/{employee_id}/toggle_lead/{team_id}", response_model=schemas.EmployeeInfo, summary="Set or unset an employee as a team lead")
def toggle_team_lead(employee_id: int, team_id: int, db: Session = Depends(get_db), current_user: models.User = can_manage_users):
    employee_to_promote = db.query(models.Employee).filter(models.Employee.id == employee_id, models.Employee.team_id == team_id).first()
    if not employee_to_promote: raise HTTPException(status_code=404, detail="Employee not found in this team.")

    current_lead = db.query(models.Employee).filter(models.Employee.team_id == team_id, models.Employee.is_team_lead == True).first()

    if current_lead and current_lead.id != employee_to_promote.id:
        current_lead.is_team_lead = False

    employee_to_promote.is_team_lead = not employee_to_promote.is_team_lead
    
    db.commit()
    db.refresh(employee_to_promote)
    return employee_to_promote