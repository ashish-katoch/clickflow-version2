from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import os, logging
from database import create_indexes, close_connection, db
from auth_helpers import hash_password, verify_password
from routes.auth import router as auth_router
from routes.projects import router as projects_router
from routes.tasks import router as tasks_router
from routes.bugs import router as bugs_router
from routes.comments import router as comments_router
from routes.notifications import router as notifications_router
from routes.members import router as members_router

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="ClickFlow API", version="3.0")
app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(tasks_router)
app.include_router(bugs_router)
app.include_router(comments_router)
app.include_router(notifications_router)
app.include_router(members_router)

@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "3.0"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await create_indexes()
    from datetime import datetime, timezone
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@clickflow.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "email": admin_email, "password_hash": hash_password(admin_password),
            "name": "Admin", "role": "admin", "avatar_url": "",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Admin seeded: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
    os.makedirs("/app/memory", exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write(f"# Test Credentials\n\n## Admin\n- Email: {admin_email}\n- Password: {admin_password}\n- Role: admin\n")

@app.on_event("shutdown")
async def shutdown():
    await close_connection()
