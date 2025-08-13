# ==============================================================================
# File: backend/main.py (Production Ready with Automated Scoring)
# Description: Main application file for the FastAPI backend. Includes an
# automated scheduler to run the score recalculation job every 5 minutes.
# ==============================================================================
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import (
    auth_routes, user_routes, employee_routes, campaign_routes, 
    activity_routes, leaderboard_routes, team_routes, target_routes, 
    upload_routes, dashboard_routes, events_routes, admin_routes
)
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# --- NEW: Import scheduler and necessary components for the automated job ---
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from .database import SessionLocal
from .scoring_engine import recalculate_all_scores
from .models import Campaign
# --- END OF NEW IMPORTS ---

app = FastAPI(title="Sales Performance Portal API", version="2")

# --- NEW: Instantiate the scheduler ---
scheduler = AsyncIOScheduler()

def scoring_job():
    """
    The function that the scheduler will run. It gets a new database session,
    finds the active campaign (assumed to be ID 1), and runs the full score 
    recalculation. This function runs in a separate thread, so it needs its
    own database session.
    """
    db = SessionLocal()
    try:
        print("--- Running scheduled scoring job ---")
        # For this project, we assume the "Freedom Fiesta" campaign has an ID of 1.
        # In a future version with multiple campaigns, you might add an 'is_active'
        # flag to the Campaign model to find the correct one.
        active_campaign = db.query(Campaign).filter_by(id=1).first()
        if active_campaign:
            recalculate_all_scores(db, campaign_id=active_campaign.id)
            print(f"--- Scoring job completed for campaign '{active_campaign.name}' ---")
        else:
            print("--- No active campaign found (ID=1), skipping scoring job ---")
    except Exception as e:
        print(f"--- ERROR in scheduled scoring job: {e} ---")
    finally:
        db.close()

# --- NEW: Add the startup event to configure and start the scheduler ---
@app.on_event("startup")
async def startup_event():
    # Schedule the scoring_job to run every 5 minutes.
    # The job is given a unique ID to prevent duplicates.
    scheduler.add_job(scoring_job, 'interval', minutes=5, id="scoring_job_5min")
    scheduler.start()
    print("Scheduler started. Scoring job will run automatically every 5 minutes.")

# --- NEW: Add the shutdown event to gracefully stop the scheduler ---
@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()
    print("Scheduler shut down.")

# --- Standard Middleware and Route Inclusions ---

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174","http://127.0.0.1"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router, prefix="/api/auth", tags=["1. Authentication"])
app.include_router(user_routes.router, prefix="/api/users", tags=["2. Users"])
app.include_router(employee_routes.router, prefix="/api/employees", tags=["3. Employees"])
app.include_router(campaign_routes.router, prefix="/api/campaigns", tags=["4. Campaigns"])
app.include_router(activity_routes.router, prefix="/api/activities", tags=["5. Activities"])
app.include_router(leaderboard_routes.router, prefix="/api/leaderboard", tags=["6. Leaderboard"])
app.include_router(team_routes.router, prefix="/api/teams", tags=["7. Team Management"])
app.include_router(target_routes.router, prefix="/api/targets", tags=["8. Target Management"])
app.include_router(upload_routes.router, prefix="/api/upload", tags=["9. Bulk Upload"]) 
app.include_router(dashboard_routes.router, prefix="/api/dashboard", tags=["10. Dashboard Data"]) 
app.include_router(events_routes.router, prefix="/api/events", tags=["11. Event Logging"])
app.include_router(admin_routes.router, prefix="/api/admin", tags=["12. Admin Utilities"])

# --- Static File Serving for Frontend ---

# Define the path to the frontend build directory
frontend_dir = Path(__file__).resolve().parent.parent / "frontend" / "dist"
assets_dir = frontend_dir / "assets"

# Mount static files (JS, CSS) only if the frontend has been built
if frontend_dir.exists() and assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_react_app(full_path: str):
        """
        Serves the index.html for any path not matching an API route,
        allowing the React Router to handle frontend navigation.
        """
        index_path = frontend_dir / "index.html"
        if index_path.exists():
            return FileResponse(index_path)
        # This fallback is for cases where the build exists but index.html is missing
        return {"message": "Frontend index.html not found."}
else:
    # If the frontend build directory doesn't exist, just serve the API root message
    @app.get("/", tags=["Root"])
    def read_root():
        return {"message": "Welcome to the Sales Performance Portal API! (Frontend not found)"}
