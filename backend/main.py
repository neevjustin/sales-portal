# ==============================================================================
# File: backend/main.py (CORRECTED)
# ==============================================================================
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import (
    auth_routes, user_routes, employee_routes, campaign_routes, 
    activity_routes, leaderboard_routes, team_routes, target_routes, 
    upload_routes, dashboard_routes, events_routes, admin_routes
)

app = FastAPI(title="Sales Performance Portal API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174","http://127.0.0.1"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Use the imported modules to access their 'router' variables
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


'''remove comment
@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to the Sales Performance Portal API!"}
'''


#ngok things (delete if not needed)





from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Path to frontend build directory
frontend_dir = Path(__file__).resolve().parent.parent / "frontend" / "dist"
assets_dir = frontend_dir / "assets"

# Double-check the folders exist
if not frontend_dir.exists():
    raise RuntimeError(f"Frontend build directory not found: {frontend_dir}")
if not assets_dir.exists():
    raise RuntimeError(f"Assets directory not found: {assets_dir}")

# Serve static files (JS/CSS/images)
app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

# Serve React SPA index.html fallback
@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    return FileResponse(frontend_dir / "index.html")
