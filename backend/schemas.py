# ==============================================================================
# File: backend/schemas.py (Corrected and Reorganized)
# ==============================================================================
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime, date
from typing import Optional, List


# ==============================================================================
# 1. Token & Auth Schemas
# ==============================================================================
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

# ==============================================================================
# 2. User & Employee Schemas
# ==============================================================================
class UserBase(BaseModel):
    username: str
    email: Optional[str] = None

class UserCreate(UserBase):
    password: str
    employee_id: int
    role: str

class UserInDB(UserBase):
    id: int
    employee_id: Optional[int] = None
    role: str
    is_active: bool
    model_config = ConfigDict(from_attributes=True)

class UserDetails(BaseModel):
    username: str
    role: str
    employee_id: int
    employee_name: str
    ba_id: Optional[int] = None
    team_id: Optional[int] = None 
    force_password_reset: bool
    model_config = ConfigDict(from_attributes=True)

class PasswordChange(BaseModel):
    new_password: str
    
class EmployeeBase(BaseModel):
    name: str
    employee_code: str
    email: Optional[str] = None
    role: str
    is_team_lead: bool = False

class EmployeeCreate(EmployeeBase):
    team_id: int

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    team_id: Optional[int] = None
    is_team_lead: Optional[bool] = None

class EmployeeInfo(EmployeeBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# ==============================================================================
# 3. Team & Business Area Schemas
# ==============================================================================
class TeamBase(BaseModel):
    name: str  # <-- ADDED BACK
    team_code: str = Field(..., pattern=r"^[A-Z]{3}_\d{2}$")
    campaign_id: int
    ba_id: int

class TeamCreate(TeamBase):
    pass

class TeamInfo(BaseModel):
    name: str
    team_code: str # <-- ADDED for consistency
    model_config = ConfigDict(from_attributes=True)

class Team(TeamBase):
    id: int
    employees: List['EmployeeInfo'] = []
    model_config = ConfigDict(from_attributes=True)

class BusinessAreaInfo(BaseModel):
    id: int
    name: str
    full_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# ==============================================================================
# 4. Campaign Schemas
# ==============================================================================
class CampaignInfo(BaseModel):
    id: int
    name: str
    start_date: datetime
    end_date: datetime
    model_config = ConfigDict(from_attributes=True)

# ==============================================================================
# 5. Activity Schemas
# ==============================================================================
class ActivityTypeInfo(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)

class ActivityBase(BaseModel):
    activity_type_id: int
    customer_mobile: str
    customer_name: Optional[str] = None
    customer_address: Optional[str] = None
    aadhaar_number: Optional[str] = None
    hr_number: Optional[str] = None
    frc_selected: Optional[str] = None
    campaign_id: int
    is_lead: Optional[bool] = False
    requested_service: Optional[str] = None
    ftth_area_type: Optional[str] = None

class ActivityCreate(ActivityBase):
    pass

class Activity(ActivityBase):
    id: int
    employee_id: int
    team_id: int
    logged_at: datetime
    
    # Add these nested objects to match the `joinedload` in the backend query
    employee: EmployeeInfo
    # The TeamInfo model used here now correctly handles a `None` value for 'name'.
    team: Optional[TeamInfo] = None
    activity_type: ActivityTypeInfo

    model_config = ConfigDict(from_attributes=True)

# ==============================================================================
# 6. Target Schemas
# ==============================================================================
class TargetBase(BaseModel):
    campaign_id: int
    activity_type_id: int
    target_value: int
    target_category: Optional[str] = None

class TeamTargetCreate(TargetBase):
    team_id: int

class TeamTarget(TargetBase):
    id: int
    team_id: int
    model_config = ConfigDict(from_attributes=True)

class BATargetCreate(TargetBase):
    ba_id: int

class BATarget(TargetBase):
    id: int
    ba_id: int
    model_config = ConfigDict(from_attributes=True)

# ==============================================================================
# 7. Leaderboard Schemas
# ==============================================================================
class LeaderboardEntry(BaseModel):
    employee_id: int
    employee_name: str
    team_name: str
    ba_name: str
    total_score: int
    model_config = ConfigDict(from_attributes=True)

class BALeaderboardEntry(BaseModel):
    ba_id: int
    ba_name: str
    coordinator_name: Optional[str] = "N/A"
    total_score: int
    model_config = ConfigDict(from_attributes=True)

# Corrected TeamLeaderboardEntry to match the frontend's expectation
# and your decision to remove team names.
class TeamLeaderboardEntry(BaseModel):
    team_id: int
    team_code: str
    team_name: str
    ba_name: str
    total_score: int
    model_config = ConfigDict(from_attributes=True)



# --- NEW SCHEMAS FOR EVENTS ---

class MelaBase(BaseModel):
    mela_date: datetime
    location: str
    territory: str
    participants_count: int

class MelaCreate(MelaBase):
    pass

class BrandingActivityBase(BaseModel):
    location_type: str
    location_name: Optional[str] = None
    retailer_code: Optional[str] = None

class BrandingActivityCreate(BrandingActivityBase):
    pass

class SpecialEventBase(BaseModel):
    event_date: datetime
    location: str
    event_type: str

class SpecialEventCreate(SpecialEventBase):
    pass

class PressReleaseBase(BaseModel):
    release_date: datetime
    media_outlet: str

class PressReleaseCreate(PressReleaseBase):
    pass