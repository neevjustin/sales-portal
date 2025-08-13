# ===== File: backend/routes/user_routes.py (MODIFIED) =====

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import UserDetails, PasswordChange # <-- Import PasswordChange
from ..auth import get_current_active_user, get_password_hash # <-- Import get_password_hash

router = APIRouter()

@router.get("/me", response_model=UserDetails, summary="Get current user details")
def get_current_user_details(current_user: User = Depends(get_current_active_user)):
    if not current_user.employee:
        raise HTTPException(status_code=404, detail="Employee details not found for this user.")
    
    # --- START MODIFICATION ---
    # The return dictionary is now updated to include the new flag.
    return {
        "username": current_user.username, 
        "role": current_user.role, 
        "employee_id": current_user.employee.id, 
        "employee_name": current_user.employee.name, 
        "ba_id": current_user.employee.team.ba_id if current_user.employee.team else None,
        "team_id": current_user.employee.team_id,
        "force_password_reset": current_user.force_password_reset
    }
    # --- END MODIFICATION ---

# --- ADD THIS NEW ENDPOINT ---
@router.post("/change-password", status_code=status.HTTP_200_OK, summary="Change the current user's password")
def change_password(
    password_data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Allows an authenticated user to change their own password.
    On success, the 'force_password_reset' flag is set to False.
    """
    if len(password_data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long."
        )

    # Hash the new password and update the user record
    current_user.password_hash = get_password_hash(password_data.new_password)
    
    # Flip the flag to indicate the password has been changed
    current_user.force_password_reset = False
    
    db.commit()
    
    return {"message": "Password changed successfully."}
# --- END OF ADDITION ---