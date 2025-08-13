# ===== File: backend/production_seeder.py (UPDATED) =====

import pandas as pd
from datetime import datetime
from .database import SessionLocal, engine, Base
from .models import *
from .auth import get_password_hash
import os

def seed_production_database():
    """
    Performs a clean install of the production database.
    - Wipes all existing data and creates the schema.
    - Seeds the campaign, activity types, BAs, BA Coordinators, and targets.
    """
    print("--- STARTING PRODUCTION DATABASE SEED ---")
    
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Create Campaign and Activity Types
        campaign = Campaign(name="Freedom Fiesta", start_date=datetime(2025, 8, 1), end_date=datetime(2025, 8, 31))
        db.add(campaign)
        db.commit(); db.refresh(campaign)
        print("✅ Campaign 'Freedom Fiesta' created.")

        activity_type_names = [
            "MNP", "SIM Sales", "4G SIM Upgradation", "BNU connections", "Urban connections",
            "No of Melas", "No of Houses visited", "Special Events", "Employee involvement",
            "Branding & Visibility", "BNU leads", "Urban leads", "FTTH Connection", "House Visit"
        ]
        activity_types = {name: ActivityType(name=name) for name in activity_type_names}
        db.add_all(activity_types.values())
        db.commit()
        print(f"✅ Created {len(activity_types)} activity types.")

        # 2. Read BA data and create BAs, Coordinators, and Targets
        ba_df = pd.read_excel("backend/ba_seed.xlsx")
        print(f"✅ Reading {len(ba_df)} BAs from ba_seed.xlsx.")
        
        # Create a default operational team for test users later
        tvm_ba_row = ba_df[ba_df['ba_code'] == 'TVM']
        if not tvm_ba_row.empty:
            tvm_ba = BusinessArea(name="TVM")
            db.add(tvm_ba)
            db.flush()
            demo_team = Team(name="TVM Titans", team_code="TVM_01", campaign_id=campaign.id, ba_id=tvm_ba.id)
            db.add(demo_team)

        # Process all BAs from the Excel file
        for index, row in ba_df.iterrows():
            ba = BusinessArea(name=row['ba_code']) if row['ba_code'] != "TVM" else tvm_ba
            if row['ba_code'] != "TVM":
                db.add(ba)
                db.flush() 

            admin_team = Team(name=f"{row['ba_code']} Admin", team_code=f"{row['ba_code']}_00", campaign_id=campaign.id, ba_id=ba.id)
            db.add(admin_team)
            db.flush()

            coordinator_employee = Employee(name=row['ba_coordinator_name'], employee_code=str(row['ba_coordinator_hr_no']), role='ba_coordinator', team_id=admin_team.id)
            db.add(coordinator_employee)
            db.flush()

            coordinator_user = User(username=str(row['ba_coordinator_hr_no']), password_hash=get_password_hash("BSNL@2025"), role='ba_coordinator', employee_id=coordinator_employee.id, force_password_reset=True)
            db.add(coordinator_user)

            targets_to_create = [
                BATarget(campaign_id=campaign.id, ba_id=ba.id, activity_type_id=activity_types["SIM Sales"].id, target_value=row['new_sim_target']),
                BATarget(campaign_id=campaign.id, ba_id=ba.id, activity_type_id=activity_types["MNP"].id, target_value=row['mnp_target']),
                BATarget(campaign_id=campaign.id, ba_id=ba.id, activity_type_id=activity_types["4G SIM Upgradation"].id, target_value=row['sim_upgrade_target']),
                BATarget(campaign_id=campaign.id, ba_id=ba.id, activity_type_id=activity_types["BNU connections"].id, target_value=row['ftth_abnu_target']),
                BATarget(campaign_id=campaign.id, ba_id=ba.id, activity_type_id=activity_types["Urban connections"].id, target_value=row['ftth_urban_target']),
            ]
            db.add_all(targets_to_create)
            print(f"  -> Processed BA: {row['ba_code']}")
        
        # Create the global admin user
        alp_admin_team = db.query(Team).filter(Team.team_code == "ALP_00").first()
        if alp_admin_team:
            admin_employee = Employee(name="Admin", employee_code="admin", role="admin", team_id=alp_admin_team.id)
            db.add(admin_employee)
            db.flush()
            admin_user = User(username="admin", password_hash=get_password_hash("pwd"), role="admin", employee_id=admin_employee.id, force_password_reset=False)
            db.add(admin_user)
            print("✅ Global Admin user created.")

        db.commit()
        print("--- PRODUCTION DATABASE SEED COMPLETE ---")

    except FileNotFoundError as e:
        print(f"❌ ERROR: Could not find a required seed file: {e.filename}")
        db.rollback()
    except Exception as e:
        print(f"❌ An error occurred during seeding: {e}")
        db.rollback()
    finally:
        db.close()

# --- NEW, SEPARATE FUNCTION FOR DEMO USERS ---
def seed_demo_users():
    """
    Reads 'test_users.xlsx' and adds the users to the existing database
    without deleting any data. Disables 'force_password_reset' for these users.
    """
    db = SessionLocal()
    try:
        user_df = pd.read_excel("backend/test_users.xlsx")
        print(f"--- Found test_users.xlsx. Seeding {len(user_df)} demo users... ---")
        
        for index, row in user_df.iterrows():
            team = db.query(Team).filter(Team.team_code == row['team_code']).first()
            if not team:
                print(f"⚠️ Warning: Team '{row['team_code']}' not found for user '{row['name']}'. Skipping.")
                continue

            # Check if user already exists
            existing_user = db.query(User).filter(User.username == str(row['hr_number'])).first()
            if existing_user:
                print(f"  -> User '{row['hr_number']}' already exists. Skipping.")
                continue

            employee = Employee(name=row['name'], employee_code=str(row['hr_number']), role=row['role'], team_id=team.id)
            db.add(employee)
            db.flush()

            user = User(
                username=str(row['hr_number']),
                password_hash=get_password_hash(row['password']),
                role=row['role'],
                employee_id=employee.id,
                force_password_reset=False  # Disable forced reset for demos
            )
            db.add(user)
            print(f"  -> Created demo user: {user.username} (Role: {user.role})")

        db.commit()
        print("--- DEMO USER SEEDING COMPLETE ---")
    
    except FileNotFoundError:
        print("--- 'test_users.xlsx' not found. Skipping demo user seeding. ---")
    except Exception as e:
        print(f"❌ An error occurred during demo user seeding: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == '__main__':
    # First, run the main seeder to set up the production environment
    seed_production_database()
    
    # Then, conditionally run the demo user seeder
    seed_demo_users()