# ==============================================================================
# File: backend/models/campaign.py
# ==============================================================================
from sqlalchemy import Integer, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship, Mapped, mapped_column
from ..database import Base

class Campaign(Base):
    __tablename__ = "campaigns"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    start_date: Mapped[DateTime] = mapped_column(DateTime, nullable=False)
    end_date: Mapped[DateTime] = mapped_column(DateTime, nullable=False)
    description: Mapped[str | None] = mapped_column(String)
    teams = relationship("Team", back_populates="campaign", cascade="all, delete-orphan")
    scoring_weights = relationship("ScoringWeight", back_populates="campaign", cascade="all, delete-orphan")
    bonus_points = relationship("BonusPoint", back_populates="campaign", cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="campaign", cascade="all, delete-orphan")
    ba_targets = relationship("BATarget", back_populates="campaign", cascade="all, delete-orphan")
    team_targets = relationship("TeamTarget", back_populates="campaign", cascade="all, delete-orphan")

class ScoringWeight(Base):
    __tablename__ = "scoring_weights"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id"), index=True, nullable=False)
    activity_type_id: Mapped[int] = mapped_column(ForeignKey("activity_types.id"), index=True, nullable=False)
    max_marks: Mapped[int] = mapped_column(Integer, nullable=False)
    scoring_logic: Mapped[str | None] = mapped_column(String)
    campaign = relationship("Campaign", back_populates="scoring_weights")
    activity_type = relationship("ActivityType", back_populates="scoring_weights")
    __table_args__ = (UniqueConstraint("campaign_id", "activity_type_id", name="uq_campaign_activity"),)

class BonusPoint(Base):
    __tablename__ = "bonus_points"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id"), index=True, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    points: Mapped[int] = mapped_column(Integer, nullable=False)
    campaign = relationship("Campaign", back_populates="bonus_points")

