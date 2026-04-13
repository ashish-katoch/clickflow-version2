from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import bcrypt
import jwt
import uuid
import secrets
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field
from typing import Optional, List

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ─── Helpers ───
def get_jwt_secret():
    return os.environ["JWT_SECRET"]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    return jwt.encode({"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=60), "type": "access"}, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    return jwt.encode({"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")

def user_response(user: dict) -> dict:
    return {
        "id": str(user["_id"]) if "_id" in user else user.get("id", ""),
        "email": user["email"],
        "name": user.get("name", ""),
        "role": user.get("role", "member"),
        "avatar_url": user.get("avatar_url", ""),
        "created_at": user.get("created_at", ""),
    }

# ─── Pydantic Models ───
class RegisterInput(BaseModel):
    email: str
    password: str
    name: str

class LoginInput(BaseModel):
    email: str
    password: str

class ProjectInput(BaseModel):
    name: str
    description: str = ""
    color: str = "#3b82f6"

class TaskInput(BaseModel):
    title: str
    description: str = ""
    status: str = "todo"
    priority: str = "none"
    assignee_id: Optional[str] = None
    due_date: Optional[str] = None
    tags: List[str] = []
    parent_task_id: Optional[str] = None
    time_estimate: int = 0

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[str] = None
    due_date: Optional[str] = None
    tags: Optional[List[str]] = None
    time_estimate: Optional[int] = None

class GoalInput(BaseModel):
    title: str
    description: str = ""
    target_value: float = 100
    current_value: float = 0
    unit: str = "percent"
    due_date: Optional[str] = None

class TimeEntryInput(BaseModel):
    task_id: str
    description: str = ""

class MemberInvite(BaseModel):
    email: str
    role: str = "member"

# ─── Auth Routes ───
@api_router.post("/auth/register")
async def register(input: RegisterInput, response: Response):
    email = input.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    user_doc = {
        "email": email,
        "password_hash": hash_password(input.password),
        "name": input.name,
        "role": "member",
        "avatar_url": "",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    access = create_access_token(str(result.inserted_id), email)
    refresh = create_refresh_token(str(result.inserted_id))
    set_auth_cookies(response, access, refresh)
    return user_response(user_doc)

@api_router.post("/auth/login")
async def login(input: LoginInput, request: Request, response: Response):
    email = input.email.lower().strip()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    # Brute force check
    attempt = await db.login_attempts.find_one({"identifier": identifier}, {"_id": 0})
    if attempt and attempt.get("count", 0) >= 5:
        lockout_until = attempt.get("locked_until")
        if lockout_until and datetime.now(timezone.utc).isoformat() < lockout_until:
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
        else:
            await db.login_attempts.delete_one({"identifier": identifier})

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(input.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"locked_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}},
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")

    await db.login_attempts.delete_one({"identifier": identifier})
    access = create_access_token(str(user["_id"]), email)
    refresh = create_refresh_token(str(user["_id"]))
    set_auth_cookies(response, access, refresh)
    return user_response(user)

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}

@api_router.get("/auth/me")
async def get_me(user=Depends(get_current_user)):
    return user_response({"_id": user["_id"], **user})

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access = create_access_token(str(user["_id"]), user["email"])
        response.set_cookie(key="access_token", value=access, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
        return user_response(user)
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# ─── Project Routes ───
@api_router.get("/projects")
async def get_projects(user=Depends(get_current_user)):
    projects = await db.projects.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return projects

@api_router.post("/projects")
async def create_project(input: ProjectInput, user=Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "name": input.name,
        "description": input.description,
        "color": input.color,
        "created_by": user["_id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "task_count": 0,
    }
    await db.projects.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/projects/{project_id}")
async def update_project(project_id: str, input: ProjectInput, user=Depends(get_current_user)):
    result = await db.projects.update_one(
        {"id": project_id},
        {"$set": {"name": input.name, "description": input.description, "color": input.color}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    return project

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, user=Depends(get_current_user)):
    await db.projects.delete_one({"id": project_id})
    await db.tasks.delete_many({"project_id": project_id})
    return {"message": "Project deleted"}

# ─── Task Routes ───
@api_router.get("/tasks")
async def get_tasks(project_id: Optional[str] = None, status: Optional[str] = None, user=Depends(get_current_user)):
    query = {}
    if project_id:
        query["project_id"] = project_id
    if status:
        query["status"] = status
    tasks = await db.tasks.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return tasks

@api_router.post("/tasks")
async def create_task(input: TaskInput, project_id: str, user=Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "project_id": project_id,
        "title": input.title,
        "description": input.description,
        "status": input.status,
        "priority": input.priority,
        "assignee_id": input.assignee_id,
        "due_date": input.due_date,
        "tags": input.tags,
        "parent_task_id": input.parent_task_id,
        "time_estimate": input.time_estimate,
        "created_by": user["_id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.tasks.insert_one(doc)
    doc.pop("_id", None)
    # Update project task count
    await db.projects.update_one({"id": project_id}, {"$inc": {"task_count": 1}})
    return doc

@api_router.put("/tasks/{task_id}")
async def update_task(task_id: str, input: TaskUpdate, user=Depends(get_current_user)):
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.tasks.update_one({"id": task_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    return task

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, user=Depends(get_current_user)):
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if task:
        await db.tasks.delete_one({"id": task_id})
        # Also delete subtasks
        await db.tasks.delete_many({"parent_task_id": task_id})
        await db.projects.update_one({"id": task["project_id"]}, {"$inc": {"task_count": -1}})
        # Delete related time entries
        await db.time_entries.delete_many({"task_id": task_id})
    return {"message": "Task deleted"}

# ─── Time Entry Routes ───
@api_router.get("/time-entries")
async def get_time_entries(task_id: Optional[str] = None, user=Depends(get_current_user)):
    query = {"user_id": user["_id"]}
    if task_id:
        query["task_id"] = task_id
    entries = await db.time_entries.find(query, {"_id": 0}).sort("start_time", -1).to_list(200)
    return entries

@api_router.post("/time-entries/start")
async def start_timer(input: TimeEntryInput, user=Depends(get_current_user)):
    # Stop any active timer first
    active = await db.time_entries.find_one({"user_id": user["_id"], "end_time": None}, {"_id": 0})
    if active:
        now = datetime.now(timezone.utc).isoformat()
        start = datetime.fromisoformat(active["start_time"])
        duration = int((datetime.now(timezone.utc) - start).total_seconds())
        await db.time_entries.update_one(
            {"id": active["id"]},
            {"$set": {"end_time": now, "duration": duration}}
        )
    doc = {
        "id": str(uuid.uuid4()),
        "task_id": input.task_id,
        "user_id": user["_id"],
        "description": input.description,
        "start_time": datetime.now(timezone.utc).isoformat(),
        "end_time": None,
        "duration": 0,
    }
    await db.time_entries.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.post("/time-entries/stop")
async def stop_timer(user=Depends(get_current_user)):
    active = await db.time_entries.find_one({"user_id": user["_id"], "end_time": None}, {"_id": 0})
    if not active:
        raise HTTPException(status_code=404, detail="No active timer")
    now = datetime.now(timezone.utc).isoformat()
    start = datetime.fromisoformat(active["start_time"])
    duration = int((datetime.now(timezone.utc) - start).total_seconds())
    await db.time_entries.update_one(
        {"id": active["id"]},
        {"$set": {"end_time": now, "duration": duration}}
    )
    active["end_time"] = now
    active["duration"] = duration
    return active

@api_router.get("/time-entries/active")
async def get_active_timer(user=Depends(get_current_user)):
    active = await db.time_entries.find_one({"user_id": user["_id"], "end_time": None}, {"_id": 0})
    return active

# ─── Goal Routes ───
@api_router.get("/goals")
async def get_goals(user=Depends(get_current_user)):
    goals = await db.goals.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return goals

@api_router.post("/goals")
async def create_goal(input: GoalInput, user=Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "title": input.title,
        "description": input.description,
        "target_value": input.target_value,
        "current_value": input.current_value,
        "unit": input.unit,
        "due_date": input.due_date,
        "created_by": user["_id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.goals.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/goals/{goal_id}")
async def update_goal(goal_id: str, input: GoalInput, user=Depends(get_current_user)):
    result = await db.goals.update_one(
        {"id": goal_id},
        {"$set": {
            "title": input.title,
            "description": input.description,
            "target_value": input.target_value,
            "current_value": input.current_value,
            "unit": input.unit,
            "due_date": input.due_date,
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    goal = await db.goals.find_one({"id": goal_id}, {"_id": 0})
    return goal

@api_router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str, user=Depends(get_current_user)):
    await db.goals.delete_one({"id": goal_id})
    return {"message": "Goal deleted"}

# ─── Dashboard Routes ───
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(user=Depends(get_current_user)):
    total_tasks = await db.tasks.count_documents({})
    todo_tasks = await db.tasks.count_documents({"status": "todo"})
    in_progress = await db.tasks.count_documents({"status": "in_progress"})
    in_review = await db.tasks.count_documents({"status": "in_review"})
    done_tasks = await db.tasks.count_documents({"status": "done"})
    total_projects = await db.projects.count_documents({})
    total_goals = await db.goals.count_documents({})

    # Time tracked today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    today_entries = await db.time_entries.find(
        {"user_id": user["_id"], "start_time": {"$gte": today_start}}, {"_id": 0}
    ).to_list(100)
    total_time_today = sum(e.get("duration", 0) for e in today_entries)

    # Tasks by priority
    urgent = await db.tasks.count_documents({"priority": "urgent"})
    high = await db.tasks.count_documents({"priority": "high"})
    medium = await db.tasks.count_documents({"priority": "medium"})
    low = await db.tasks.count_documents({"priority": "low"})

    # Recent tasks
    recent_tasks = await db.tasks.find({}, {"_id": 0}).sort("created_at", -1).to_list(5)

    # Overdue tasks
    now_iso = datetime.now(timezone.utc).isoformat()
    overdue = await db.tasks.count_documents({
        "due_date": {"$ne": None, "$lt": now_iso},
        "status": {"$ne": "done"}
    })

    return {
        "total_tasks": total_tasks,
        "todo_tasks": todo_tasks,
        "in_progress": in_progress,
        "in_review": in_review,
        "done_tasks": done_tasks,
        "total_projects": total_projects,
        "total_goals": total_goals,
        "total_time_today": total_time_today,
        "priority_breakdown": {"urgent": urgent, "high": high, "medium": medium, "low": low},
        "recent_tasks": recent_tasks,
        "overdue_tasks": overdue,
    }

# ─── Members Routes ───
@api_router.get("/members")
async def get_members(user=Depends(get_current_user)):
    members = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(100)
    # Need to include id from _id
    all_users = []
    async for u in db.users.find({}, {"password_hash": 0}):
        all_users.append({
            "id": str(u["_id"]),
            "email": u["email"],
            "name": u.get("name", ""),
            "role": u.get("role", "member"),
            "avatar_url": u.get("avatar_url", ""),
            "created_at": u.get("created_at", ""),
        })
    return all_users

@api_router.put("/members/{member_id}/role")
async def update_member_role(member_id: str, role: str, user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can change roles")
    if role not in ["admin", "member", "viewer"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    await db.users.update_one({"_id": ObjectId(member_id)}, {"$set": {"role": role}})
    return {"message": "Role updated"}

# ─── Startup ───
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.tasks.create_index("project_id")
    await db.tasks.create_index("status")
    await db.time_entries.create_index("user_id")

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
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Admin user seeded: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Admin password updated")

    # Write test credentials
    os.makedirs("/app/memory", exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write(f"# Test Credentials\n\n## Admin\n- Email: {admin_email}\n- Password: {admin_password}\n- Role: admin\n\n## Auth Endpoints\n- POST /api/auth/register\n- POST /api/auth/login\n- POST /api/auth/logout\n- GET /api/auth/me\n- POST /api/auth/refresh\n")

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
