# ==============================================================================
# File: backend/routes/admin_routes.py (NEW FILE)
# ==============================================================================
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, auth
from ..scoring_engine import recalculate_all_scores

router = APIRouter()

@router.post("/recalculate-scores/{campaign_id}", status_code=status.HTTP_200_OK)
def trigger_score_recalculation(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("admin"))
):
    """
    An admin-only endpoint to manually trigger the full score recalculation
    for a given campaign.
    """
    try:
        recalculate_all_scores(db, campaign_id)
        return {"message": f"Successfully recalculated scores for campaign {campaign_id}."}
    except Exception as e:
        # In a real app, you would log the full exception
        print(f"Error during recalculation: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred during recalculation.")