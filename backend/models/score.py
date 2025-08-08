# ==============================================================================
# File: backend/models/score.py (NEW FILE)
# ==============================================================================
from sqlalchemy import Integer, String, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from ..database import Base

class Score(Base):
    __tablename__ = "scores"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id"), index=True, nullable=False)
    
    entity_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False) # Can be team_id or ba_id
    entity_type: Mapped[str] = mapped_column(String, nullable=False) # 'team' or 'ba'
    
    parameter: Mapped[str] = mapped_column(String, nullable=False) # e.g., 'MNP', 'SIM Sales'
    points: Mapped[float] = mapped_column(Float, nullable=False)