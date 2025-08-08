# ==============================================================================
# File: backend/models/employee.py (MODIFIED)
# ==============================================================================
from sqlalchemy import Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from ..database import Base

class Employee(Base):
    __tablename__ = "employees"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_code: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str | None] = mapped_column(String)
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id"), index=True, nullable=False)
    # The 'role' column is now the single source of truth for the user's function.
    # e.g., 'Admin', 'BA Head', 'Team Leader', 'Team Coordinator', 'Team Member'
    role: Mapped[str | None] = mapped_column(String)
    email: Mapped[str | None] = mapped_column(String, unique=True)
    
    # The is_team_lead column is now redundant and has been removed.

    team = relationship("Team", back_populates="employees")
    user = relationship("User", back_populates="employee", uselist=False, cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="employee", cascade="all, delete-orphan")