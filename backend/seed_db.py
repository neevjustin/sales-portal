# ===== File: backend/seed_db.py (CORRECTED) =====

from datetime import datetime
from .database import SessionLocal, engine, Base
from .models import *
from .auth import get_password_hash

def seed_database():
    print("Seeding database with corrected team assignments...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # --- 1. Create Campaign, Activity Types, and BAs ---
        campaign = Campaign(name="Freedom Fiesta", start_date=datetime(2025, 8, 1), end_date=datetime(2025, 8, 31))
        db.add(campaign); db.commit(); db.refresh(campaign)

        activity_type_names = [
            "MNP", "SIM Sales", "4G SIM Upgradation", "No of Melas", 
            "No of Houses visited", "Special Events", "Employee involvement",
            "Branding & Visibility", "BNU leads", "BNU connections", 
            "Urban leads", "Urban connections", "FTTH Connection", "House Visit"
        ]
        for name in activity_type_names:
            db.add(ActivityType(name=name))
        db.commit()
        print("✅ Activity types created.")

        tvm_ba = BusinessArea(name="TVM", full_name="Thiruvananthapuram")
        ekm_ba = BusinessArea(name="EKM", full_name="Ernakulam")
        db.add_all([tvm_ba, ekm_ba]); db.commit(); db.refresh(tvm_ba); db.refresh(ekm_ba)
        print("✅ Business Areas created.")

        # --- 2. Create Teams ---
        
        # --- START OF FIX ---
        # Create dedicated teams for Admin/BA Coordinator roles
        team_tvm_admin = Team(name="TVM Admin", team_code="TVM_00", campaign_id=campaign.id, ba_id=tvm_ba.id)
        team_ekm_admin = Team(name="EKM Admin", team_code="EKM_00", campaign_id=campaign.id, ba_id=ekm_ba.id)
        # --- END OF FIX ---

        # Create operational teams
        team_titans = Team(name="TVM Titans", team_code="TVM_01", campaign_id=campaign.id, ba_id=tvm_ba.id)
        team_avengers = Team(name="TVM Avengers", team_code="TVM_02", campaign_id=campaign.id, ba_id=tvm_ba.id)
        team_strikers = Team(name="EKM Strikers", team_code="EKM_01", campaign_id=campaign.id, ba_id=ekm_ba.id)
        db.add_all([team_tvm_admin, team_ekm_admin, team_titans, team_avengers, team_strikers]); db.commit()
        db.refresh(team_tvm_admin); db.refresh(team_ekm_admin); db.refresh(team_titans); db.refresh(team_avengers); db.refresh(team_strikers)
        print("✅ Teams created.")

        # --- 3. Create Employees and Users ---
        print("Creating test users (password for all is 'pwd')...")
        pwd = get_password_hash("pwd")

        def create_user(name, code, role, team, username):
            emp = Employee(name=name, employee_code=code, role=role, team_id=team.id)
            db.add(emp); db.commit(); db.refresh(emp)
            user = User(username=username, password_hash=pwd, role=role, employee_id=emp.id)
            db.add(user)
            return emp

        # --- START OF FIX ---
        # Assign Admin and BA Coordinators to their dedicated admin teams
        admin_emp = create_user("Admin User", "ADMIN001", "admin", team_tvm_admin, "admin")
        ba_tvm_emp = create_user("BA Coordinator TVM", "BA_TVM_01", "ba_coordinator", team_tvm_admin, "ba_tvm")
        ba_ekm_emp = create_user("BA Coordinator EKM", "BA_EKM_01", "ba_coordinator", team_ekm_admin, "ba_ekm")
        # --- END OF FIX ---

        # Team: TVM Titans (Now only contains its actual members)
        create_user("Leader Titans", "TL_TVM01", "team_leader", team_titans, "leader_titans")
        create_user("Member Titans", "TM_TVM01", "employee", team_titans, "member_titans")

        # Team: TVM Avengers
        create_user("Leader Avengers", "TL_TVM02", "team_leader", team_avengers, "leader_avengers")
        create_user("Coordinator Avengers", "TC_TVM02", "team_coordinator", team_avengers, "coord_avengers")
        create_user("Member One Avengers", "TM1_TVM02", "employee", team_avengers, "member1_avengers")
        create_user("Member Two Avengers", "TM2_TVM02", "employee", team_avengers, "member2_avengers")

        # Team: EKM Strikers
        create_user("Leader Strikers", "TL_EKM01", "team_leader", team_strikers, "leader_strikers")
        create_user("Coordinator Strikers", "TC_EKM01", "team_coordinator", team_strikers, "coord_strikers")
        create_user("Member One Strikers", "TM1_EKM01", "employee", team_strikers, "member1_strikers")
        create_user("Member Two Strikers", "TM2_EKM01", "employee", team_strikers, "member2_strikers")

        db.commit()
        print("✅ All specified users and employees created.")
        print("✅ Database seeding complete!")

    except Exception as e:
        print(f"❌ An error occurred during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == '__main__':
    seed_database()