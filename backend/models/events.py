# ==============================================================================
# File: backend/models/events.py (NEW FILE)
# ==============================================================================
from sqlalchemy import Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from ..database import Base
from datetime import datetime

class Mela(Base):
    __tablename__ = "melas"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id"), nullable=False)
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id"), nullable=False)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    mela_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    location: Mapped[str] = mapped_column(String, nullable=False)
    territory: Mapped[str] = mapped_column(String, nullable=False)
    participants_count: Mapped[int] = mapped_column(Integer, nullable=False)
    photo_url: Mapped[str | None] = mapped_column(String)

class BrandingActivity(Base):
    __tablename__ = "branding_activities"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id"), nullable=False)
    ba_id: Mapped[int] = mapped_column(ForeignKey("business_areas.id"), nullable=False)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    location_type: Mapped[str] = mapped_column(String, nullable=False)
    location_name: Mapped[str | None] = mapped_column(String)
    retailer_code: Mapped[str | None] = mapped_column(String)
    photo_urls: Mapped[str | None] = mapped_column(String)

class SpecialEvent(Base):
    __tablename__ = "special_events"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id"), nullable=False)
    ba_id: Mapped[int] = mapped_column(ForeignKey("business_areas.id"), nullable=False)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    event_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    location: Mapped[str] = mapped_column(String, nullable=False)
    event_type: Mapped[str] = mapped_column(String, nullable=False)
    media_urls: Mapped[str | None] = mapped_column(String)

class PressRelease(Base):
    __tablename__ = "press_releases"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id"), nullable=False)
    ba_id: Mapped[int] = mapped_column(ForeignKey("business_areas.id"), nullable=False)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    release_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    media_outlet: Mapped[str] = mapped_column(String, nullable=False)
    clipping_url: Mapped[str | None] = mapped_column(String)