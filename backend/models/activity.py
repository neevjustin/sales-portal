# ==============================================================================
# File: backend/models/activity.py (Updated)
# ==============================================================================
from sqlalchemy import Integer, String, Float, ForeignKey, UniqueConstraint, DateTime, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from ..database import Base

class ActivityType(Base):
    __tablename__ = "activity_types"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    scoring_weights = relationship("ScoringWeight", back_populates="activity_type")
    ba_targets = relationship("BATarget", back_populates="activity_type")
    team_targets = relationship("TeamTarget", back_populates="activity_type")
    activities = relationship("Activity", back_populates="activity_type")

class Activity(Base):
    __tablename__ = "activities"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id"), index=True, nullable=False)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), index=True, nullable=False)
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id"), index=True, nullable=False)
    activity_type_id: Mapped[int] = mapped_column(ForeignKey("activity_types.id"), index=True, nullable=False)
    customer_mobile: Mapped[str] = mapped_column(String, nullable=False)
    customer_name: Mapped[str | None] = mapped_column(String)
    aadhaar_number: Mapped[str | None] = mapped_column(String)
    customer_address: Mapped[str | None] = mapped_column(String)
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    logged_at: Mapped[DateTime] = mapped_column(DateTime, index=True, nullable=False)
    
    # --- NEW & UPDATED FIELDS ---
    hr_number: Mapped[str | None] = mapped_column(String)
    frc_selected: Mapped[str | None] = mapped_column(String) # For FRC if needed later
    is_lead: Mapped[bool] = mapped_column(Boolean, default=False)
    requested_service: Mapped[str | None] = mapped_column(String) # Simplified to string
    ftth_area_type: Mapped[str | None] = mapped_column(String) # Simplified to string
    is_converted: Mapped[bool] = mapped_column(Boolean, default=False)
    # --- END OF NEW & UPDATED FIELDS ---

    campaign = relationship("Campaign", back_populates="activities")
    employee = relationship("Employee", back_populates="activities")
    team = relationship("Team", back_populates="activities")
    activity_type = relationship("ActivityType", back_populates="activities")

    __table_args__ = (UniqueConstraint("campaign_id", "activity_type_id", "customer_mobile", name="uq_campaign_activity_customer"),)