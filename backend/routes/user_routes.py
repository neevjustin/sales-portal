# ==============================================================================
# File: backend/routes/user_routes.py (MODIFIED)
# ==============================================================================
from fastapi import APIRouter, Depends, HTTPException
from ..database import get_db
from ..models import User
from ..schemas import UserDetails
from ..auth import get_current_active_user

router = APIRouter()

@router.get("/me", response_model=UserDetails, summary="Get current user details")
def get_current_user_details(current_user: User = Depends(get_current_active_user)):
    if not current_user.employee:
        raise HTTPException(status_code=404, detail="Employee details not found for this user.")
    
    return {
        "username": current_user.username, 
        "role": current_user.role, 
        "employee_id": current_user.employee.id, 
        "employee_name": current_user.employee.name, 
        "ba_id": current_user.employee.team.ba_id if current_user.employee.team else None,
        "team_id": current_user.employee.team_id # <-- ADD THIS LINE
    }