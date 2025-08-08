# ==============================================================================
# File: backend/routes/events_routes.py (Production Ready & Complete)
# ==============================================================================
import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter()

UPLOAD_DIRECTORY = "backend/uploads"
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

def save_upload_file(upload_file: UploadFile) -> str:
    """Saves a file to the UPLOAD_DIRECTORY with a unique filename."""
    if not upload_file.filename:
        raise HTTPException(status_code=400, detail="File has no name.")
    file_extension = os.path.splitext(upload_file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIRECTORY, unique_filename)
    
    with open(file_path, "wb") as buffer:
        buffer.write(upload_file.file.read())
        
    return file_path

@router.post("/mela", status_code=status.HTTP_201_CREATED)
def log_mela(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
    mela_date: datetime = Form(...),
    location: str = Form(...),
    territory: str = Form(...),
    participants_count: int = Form(...),
    campaign_id: int = Form(...),
    photo: UploadFile = File(...)
):
    if not current_user.employee or not current_user.employee.team_id:
        raise HTTPException(status_code=403, detail="User is not part of a team.")

    photo_path = save_upload_file(photo)
    new_mela = models.Mela(
        campaign_id=campaign_id,
        team_id=current_user.employee.team_id,
        employee_id=current_user.employee_id,
        mela_date=mela_date,
        location=location,
        territory=territory,
        participants_count=participants_count,
        photo_url=photo_path
    )
    db.add(new_mela)
    db.commit()
    return {"message": "Mela event logged successfully."}

@router.post("/branding", status_code=status.HTTP_201_CREATED)
def log_branding(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("ba_coordinator")),
    location_type: str = Form(...),
    campaign_id: int = Form(...),
    location_name: Optional[str] = Form(None),
    retailer_code: Optional[str] = Form(None),
    photos: List[UploadFile] = File(...)
):
    if not current_user.employee or not current_user.employee.team or not current_user.employee.team.ba_id:
        raise HTTPException(status_code=403, detail="User is not part of a BA.")

    photo_paths = [save_upload_file(photo) for photo in photos]
    new_branding = models.BrandingActivity(
        campaign_id=campaign_id,
        ba_id=current_user.employee.team.ba_id,
        employee_id=current_user.employee_id,
        location_type=location_type,
        location_name=location_name,
        retailer_code=retailer_code,
        photo_urls=",".join(photo_paths)
    )
    db.add(new_branding)
    db.commit()
    return {"message": "Branding activity logged successfully."}

# --- NEW ENDPOINT FOR SPECIAL EVENTS ---
@router.post("/special-event", status_code=status.HTTP_201_CREATED)
def log_special_event(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("ba_coordinator")),
    event_date: datetime = Form(...),
    location: str = Form(...),
    event_type: str = Form(...),
    campaign_id: int = Form(...),
    media: List[UploadFile] = File(...)
):
    if not current_user.employee or not current_user.employee.team or not current_user.employee.team.ba_id:
        raise HTTPException(status_code=403, detail="User is not part of a BA.")

    media_paths = [save_upload_file(m) for m in media]
    new_event = models.SpecialEvent(
        campaign_id=campaign_id,
        ba_id=current_user.employee.team.ba_id,
        employee_id=current_user.employee_id,
        event_date=event_date,
        location=location,
        event_type=event_type,
        media_urls=",".join(media_paths)
    )
    db.add(new_event)
    db.commit()
    return {"message": "Special event logged successfully."}

# --- NEW ENDPOINT FOR PRESS RELEASES ---
@router.post("/press-release", status_code=status.HTTP_201_CREATED)
def log_press_release(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("ba_coordinator")),
    release_date: datetime = Form(...),
    media_outlet: str = Form(...),
    campaign_id: int = Form(...),
    clipping: UploadFile = File(...)
):
    if not current_user.employee or not current_user.employee.team or not current_user.employee.team.ba_id:
        raise HTTPException(status_code=403, detail="User is not part of a BA.")

    clipping_path = save_upload_file(clipping)
    new_release = models.PressRelease(
        campaign_id=campaign_id,
        ba_id=current_user.employee.team.ba_id,
        employee_id=current_user.employee_id,
        release_date=release_date,
        media_outlet=media_outlet,
        clipping_url=clipping_path
    )
    db.add(new_release)
    db.commit()
    return {"message": "Press release logged successfully."}