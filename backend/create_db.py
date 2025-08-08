# ==============================================================================
# File: backend/create_db.py (CORRECTED)
# Description: This version imports all new models to ensure the database
# schema is created completely and correctly.
# ==============================================================================
import os
import sys

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, project_root)

from backend.database import Base, engine

# --- THIS IS THE FIX ---
# We must import all the models here so that SQLAlchemy knows about them
# and can create the corresponding tables.
from backend.models import (
    User,
    Campaign,
    ScoringWeight,
    BonusPoint,
    BusinessArea,
    Team,
    Employee,
    ActivityType,
    Activity,
    BATarget,
    TeamTarget,
    Score,
    Mela,
    BrandingActivity,
    SpecialEvent,
    PressRelease
)
# --- END OF FIX ---

def create_database_tables():
    """
    Creates all tables in the database based on the SQLAlchemy models.
    """
    db_path = "backend/sales_portal.db"

    print("Creating database tables...")
    try:
        if os.path.exists(db_path):
            os.remove(db_path)
            print("Existing database file removed.")

        # This command now knows about all your new tables
        Base.metadata.create_all(bind=engine)
        print("All tables created successfully!")

    except Exception as e:
        print(f"An error occurred while creating tables: {e}")

if __name__ == "__main__":
    create_database_tables()