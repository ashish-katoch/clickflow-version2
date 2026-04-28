"""
ClickFlow - Project Management Tool
Main application entrypoint.

Modular structure:
  database.py      → MongoDB connection & indexes
  auth_helpers.py  → JWT, password hashing, user extraction
  models.py        → Pydantic schemas + MongoDB collection documentation
  routes/          → Domain-specific route handlers
"""
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import os
import logging

from database import create_indexes, close_connection, db
from auth_helpers import hash_password, verify_password
from routes.auth import router as auth_router
from routes.projects import router as projects_router
from routes.tasks import router as tasks_router
from routes.comments import router as comments_router
from routes.attachments import router as attachments_router
from routes.automations import router as automations_router
from routes.goals import router as goals_router
from routes.time_entries import router as time_entries_router
from routes.dashboard import router as dashboard_router
from routes.members import router as members_router

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="ClickFlow API", version="2.0")

# ─── Include all routers ───
app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(tasks_router)
app.include_router(comments_router)
app.include_router(attachments_router)
app.include_router(automations_router)
app.include_router(goals_router)
app.include_router(time_entries_router)
app.include_router(dashboard_router)
app.include_router(members_router)

# ─── Health check ───
@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "2.0"}

# ─── CORS ───
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Startup ───
@app.on_event("startup")
async def startup():
    await create_indexes()

    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@clickflow.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "role": "admin",
            "avatar_url": "",
            "created_at": __import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat(),
        })
        logger.info(f"Admin user seeded: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Admin password updated")

    # Write test credentials
    os.makedirs("/app/memory", exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write(f"# Test Credentials\n\n## Admin\n- Email: {admin_email}\n- Password: {admin_password}\n- Role: admin\n\n## Auth Endpoints\n- POST /api/auth/register\n- POST /api/auth/login\n- POST /api/auth/logout\n- GET /api/auth/me\n- POST /api/auth/refresh\n\n## New Endpoints\n- GET/POST/DELETE /api/comments?task_id=X\n- GET/POST/DELETE /api/attachments?task_id=X\n- GET/POST/PUT/DELETE /api/automations\n- POST /api/automations/{{id}}/toggle\n")

@app.on_event("shutdown")
async def shutdown():
    await close_connection()
