# ==============================================================================
# File: backend/models/__init__.py (Corrected)
# Description: This version correctly imports and exposes ALL database models.
# ==============================================================================
from ..database import Base
from .user import User
from .campaign import Campaign, ScoringWeight, BonusPoint # <-- BonusPoint is now included
from .team import BusinessArea, Team
from .employee import Employee
from .activity import ActivityType, Activity
from .target import BATarget, TeamTarget
from .score import Score
from .events import Mela, BrandingActivity, SpecialEvent, PressRelease