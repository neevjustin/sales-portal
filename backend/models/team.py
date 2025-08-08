# ==============================================================================
# File: backend/models/team.py
# ==============================================================================
from sqlalchemy import Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship, Mapped, mapped_column
from ..database import Base

class BusinessArea(Base):
    __tablename__ = "business_areas"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, unique=False, nullable=True)
    full_name: Mapped[str | None] = mapped_column(String)
    teams = relationship("Team", back_populates="business_area")
    ba_targets = relationship("BATarget", back_populates="business_area")

class Team(Base):
    __tablename__ = "teams"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id"), index=True, nullable=False)
    ba_id: Mapped[int] = mapped_column(ForeignKey("business_areas.id"), index=True, nullable=False)
    team_code: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str | None] = mapped_column(String)
    campaign = relationship("Campaign", back_populates="teams")
    business_area = relationship("BusinessArea", back_populates="teams")
    employees = relationship("Employee", back_populates="team")
    activities = relationship("Activity", back_populates="team")
    team_targets = relationship("TeamTarget", back_populates="team", cascade="all, delete-orphan")
