# ==============================================================================
# File: backend/routes/campaign_routes.py
# ==============================================================================
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import User, Campaign
from ..schemas import CampaignInfo
from ..auth import get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[CampaignInfo], summary="Get all campaigns")
def get_all_campaigns(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(Campaign).order_by(Campaign.start_date.desc()).all()
