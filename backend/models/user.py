# ==============================================================================
# File: backend/models/user.py
# ==============================================================================
from sqlalchemy import Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from ..database import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_id: Mapped[int | None] = mapped_column(ForeignKey("employees.id"), unique=True, index=True)
    username: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False, default="employee")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    force_password_reset: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    employee = relationship("Employee", back_populates="user")