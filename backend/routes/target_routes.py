# ==============================================================================
# File: backend/routes/target_routes.py (MERGED & COMPLETE)
# ==============================================================================
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..auth import require_role
from ..models import User, Team, TeamTarget, BusinessArea, BATarget
from ..schemas import TeamTarget as TeamTargetSchema, TeamTargetCreate
from ..schemas import BATarget as BATargetSchema, BATargetCreate

router = APIRouter()

# ============================ TEAM-LEVEL TARGET ROUTES ============================

@router.get("/by_ba/{ba_id}", response_model=List[TeamTargetSchema], summary="Get all targets for all teams in a BA")
def get_all_targets_for_ba(ba_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("ba_coordinator"))):
    """
    Fetches all existing targets for every team within a specific Business Area.
    """
    if current_user.employee.team.ba_id != ba_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view targets for this BA")
    
    team_ids = db.query(Team.id).filter(Team.ba_id == ba_id).all()
    team_ids_list = [t[0] for t in team_ids]

    if not team_ids_list:
        return []

    return db.query(TeamTarget).filter(TeamTarget.team_id.in_(team_ids_list)).all()


@router.post("/batch", response_model=List[TeamTargetSchema], status_code=status.HTTP_201_CREATED, summary="Create or update targets for multiple teams")
def create_or_update_batch_targets(targets: List[TeamTargetCreate], db: Session = Depends(get_db), current_user: User = Depends(require_role("ba_coordinator"))):
    """
    Receives a list of team targets. For each, it updates the target if it
    exists or creates it if it does not. This is for bulk operations from the UI.
    """
    created_targets = []

    for target_data in targets:
        team = db.query(Team).filter(Team.id == target_data.team_id).first()
        if not team or team.ba_id != current_user.employee.team.ba_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Not authorized to set targets for team ID {target_data.team_id}")

        existing_target = db.query(TeamTarget).filter(
            TeamTarget.team_id == target_data.team_id,
            TeamTarget.campaign_id == target_data.campaign_id,
            TeamTarget.activity_type_id == target_data.activity_type_id
        ).first()

        if existing_target:
            existing_target.target_value = target_data.target_value
        else:
            existing_target = TeamTarget(**target_data.model_dump())
            db.add(existing_target)
        
        db.commit()
        db.refresh(existing_target)
        created_targets.append(existing_target)
        
    return created_targets

# ============================ BA-LEVEL TARGET ROUTES ============================

@router.get("/by_circle/{campaign_id}", response_model=List[BATargetSchema], summary="Get all BA targets for a campaign")
def get_all_ba_targets_for_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    """
    Fetches all existing BA-level targets for a campaign. Admin only.
    """
    return db.query(BATarget).filter(BATarget.campaign_id == campaign_id).all()


@router.post("/batch_ba", response_model=List[BATargetSchema], status_code=status.HTTP_201_CREATED, summary="Create or update BA targets")
def create_or_update_batch_ba_targets(
    targets: List[BATargetCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    """
    Receives a list of BA targets. For each, it updates the target if it
    exists or creates it if it does not. Admin only.
    """
    created_targets = []

    for target_data in targets:
        existing_target = db.query(BATarget).filter(
            BATarget.ba_id == target_data.ba_id,
            BATarget.campaign_id == target_data.campaign_id,
            BATarget.activity_type_id == target_data.activity_type_id
        ).first()

        if existing_target:
            existing_target.target_value = target_data.target_value
        else:
            existing_target = BATarget(**target_data.model_dump())
            db.add(existing_target)

        db.commit()
        db.refresh(existing_target)
        created_targets.append(existing_target)

    return created_targets
