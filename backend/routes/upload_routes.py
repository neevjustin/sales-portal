# ===== File: backend/routes/upload_routes.py (FINAL CORRECTED VERSION) =====

import re
import pandas as pd
from pathlib import Path # <-- Add this import
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Team, Employee
from ..auth import require_role, get_password_hash

router = APIRouter()

@router.get("/teams/template", summary="Download the pre-made Excel template")
def get_team_upload_template(current_user: User = Depends(require_role("ba_coordinator"))):
    """
    Serves the pre-made Excel file from the same directory as this script.
    """
    # --- THIS IS THE FIX ---
    # Get the directory of the current file (backend/routes/)
    current_dir = Path(__file__).parent
    # Create the full path to the template file in the same directory
    template_path = current_dir / "team_entry_template.xlsx"
    # --- END OF FIX ---

    download_filename = "bsnl_team_upload_template.xlsx"
    
    return FileResponse(
        path=template_path,
        filename=download_filename,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

@router.post("/teams/{ba_id}", summary="Validate and then replace all teams for a BA from an Excel file")
def upload_teams_from_excel(
    ba_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ba_coordinator"))
):
    """
    Performs a 'clean install' of teams for the BA in a safe, atomic transaction.
    """
    campaign_id = 1 # Hardcoded campaign ID
    
    if current_user.employee.team.ba_id != ba_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to manage this BA")

    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file type.")

    try:
        df = pd.read_excel(file.file, header=0, usecols="A:F", dtype=str)
        df.columns = ['team_code', 'team_name', 'leader_name', 'coordinator_name', 'leader_hr_no', 'coordinator_hr_no']
        df.dropna(how='all', inplace=True)
        
        validation_pattern = re.compile(r"^[A-Z]{3}_\d{2}$")
        for index, row in df.iterrows():
            team_code = str(row['team_code']).strip().upper()
            if not validation_pattern.match(team_code):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid Team Code on row {index + 2}: '{row['team_code']}'. Required format is 'XXX_01'."
                )

        teams_to_delete = db.query(Team).filter(Team.ba_id == ba_id, Team.team_code.notlike('%_00')).all()
        for team in teams_to_delete:
            db.query(Employee).filter(Employee.team_id == team.id).update({"team_id": current_user.employee.team_id})
            db.delete(team)

        db.flush()

        created_teams = 0
        created_users = 0
        for index, row in df.iterrows():
            team_code = str(row['team_code']).strip().upper()
            team = Team(team_code=team_code, name=str(row['team_name']).strip(), campaign_id=campaign_id, ba_id=ba_id)
            db.add(team)
            db.flush()

            leader_hr_no = str(row['leader_hr_no']).strip()
            leader = db.query(Employee).filter(Employee.employee_code == leader_hr_no).first()
            if not leader:
                leader = Employee(name=str(row['leader_name']).strip(), employee_code=leader_hr_no, role='team_leader', team_id=team.id)
                db.add(leader)
                db.flush()
                db.add(User(username=leader_hr_no, password_hash=get_password_hash("BSNL@2025"), role='team_leader', employee_id=leader.id, force_password_reset=True))
                created_users += 1
            else:
                leader.team_id = team.id
                leader.role = 'team_leader'

            coordinator_hr_no = str(row['coordinator_hr_no']).strip()
            coordinator = db.query(Employee).filter(Employee.employee_code == coordinator_hr_no).first()
            if not coordinator:
                coordinator = Employee(name=str(row['coordinator_name']).strip(), employee_code=coordinator_hr_no, role='team_coordinator', team_id=team.id)
                db.add(coordinator)
                db.flush()
                db.add(User(username=coordinator_hr_no, password_hash=get_password_hash("BSNL@2025"), role='team_coordinator', employee_id=coordinator.id, force_password_reset=True))
                created_users += 1
            else:
                coordinator.team_id = team.id
                coordinator.role = 'team_coordinator'
            
            created_teams += 1

        db.commit()
        return {"message": f"Validation successful. Replaced teams for your BA. Created: {created_teams} teams, {created_users} users."}

    except HTTPException as http_exc:
        db.rollback()
        raise http_exc
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"A critical error occurred: {str(e)}")