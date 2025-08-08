# ==============================================================================
# File: backend/models/target.py
# ==============================================================================
from sqlalchemy import Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship, Mapped, mapped_column
from ..database import Base

class BATarget(Base):
    __tablename__ = "ba_targets"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id"), index=True, nullable=False)
    ba_id: Mapped[int] = mapped_column(ForeignKey("business_areas.id"), index=True, nullable=False)
    activity_type_id: Mapped[int] = mapped_column(ForeignKey("activity_types.id"), index=True, nullable=False)
    target_value: Mapped[int] = mapped_column(Integer, nullable=False)
    target_category: Mapped[str | None] = mapped_column(String)
    campaign = relationship("Campaign", back_populates="ba_targets")
    business_area = relationship("BusinessArea", back_populates="ba_targets")
    activity_type = relationship("ActivityType", back_populates="ba_targets")
    __table_args__ = (UniqueConstraint("campaign_id", "ba_id", "activity_type_id", "target_category", name="uq_ba_target"),)

class TeamTarget(Base):
    __tablename__ = "team_targets"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id"), index=True, nullable=False)
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id"), index=True, nullable=False)
    activity_type_id: Mapped[int] = mapped_column(ForeignKey("activity_types.id"), index=True, nullable=False)
    target_value: Mapped[int] = mapped_column(Integer, nullable=False)
    target_category: Mapped[str | None] = mapped_column(String)
    campaign = relationship("Campaign", back_populates="team_targets")
    team = relationship("Team", back_populates="team_targets")
    activity_type = relationship("ActivityType", back_populates="team_targets")
    __table_args__ = (UniqueConstraint("campaign_id", "team_id", "activity_type_id", "target_category", name="uq_team_target"),)
