# ==============================================================================
# File: backend/routes/upload_routes.py (NEW FILE)
# ==============================================================================
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Team, Employee, BusinessArea
from ..auth import require_role

router = APIRouter()

@router.post("/teams/{ba_id}", summary="Upload an Excel file to bulk create/update teams")
def upload_teams_from_excel(
    ba_id: int,
    campaign_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ba_coordinator"))
):
    """
    Processes an Excel file to bulk assign Team Leaders and Coordinators to teams.
    The Excel file must contain columns: 'Team Code', 'Team Name', 'Team Leader', 'Team coordinator'.
    """
    # Security check
    if current_user.employee.team.ba_id != ba_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to manage this BA")

    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file type. Please upload an Excel file.")

    try:
        df = pd.read_excel(file.file)
        required_columns = ['Team Code', 'Team Name', 'Team Leader', 'Team coordinator']
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Excel file must contain columns: {', '.join(required_columns)}")

        updated_count = 0
        created_count = 0

        for index, row in df.iterrows():
            team_code = row['Team Code']
            team_name = row['Team Name']
            leader_name = row['Team Leader']
            coordinator_name = row['Team coordinator']

            # Find employees by name (assumes names are unique for simplicity)
            leader = db.query(Employee).filter(Employee.name == leader_name).first()
            coordinator = db.query(Employee).filter(Employee.name == coordinator_name).first()

            if not leader or not coordinator:
                # In a real scenario, you might want to log this error and continue
                raise HTTPException(status_code=404, detail=f"Employee not found on row {index+2}: Leader '{leader_name}' or Coordinator '{coordinator_name}'. Please ensure all employees exist.")

            # Find existing team or create a new one
            team = db.query(Team).filter(Team.team_code == team_code).first()
            if team:
                # Update existing team
                team.name = team_name
                updated_count += 1
            else:
                # Create new team
                team = Team(
                    team_code=team_code,
                    name=team_name,
                    campaign_id=campaign_id,
                    ba_id=ba_id
                )
                db.add(team)
                created_count += 1
            
            # Assign roles
            leader.team_id = team.id
            leader.role = 'Team Leader'
            coordinator.team_id = team.id
            coordinator.role = 'Team Coordinator'

        db.commit()
        return {"message": f"Successfully created {created_count} and updated {updated_count} teams."}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An error occurred while processing the file: {e}")