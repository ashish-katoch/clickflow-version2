from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from database import db
from auth_helpers import get_current_user
from models import ProjectInput
import uuid

router = APIRouter(prefix="/api/projects", tags=["projects"])

@router.get("")
async def get_projects(user=Depends(get_current_user)):
    projects = []
    async for p in db.projects.find({}, {"_id": 0}):
        p["task_count"] = await db.tasks.count_documents({"project_id": p["id"]})
        p["bug_count"] = await db.bugs.count_documents({"project_id": p["id"]})
        projects.append(p)
    projects.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return projects

@router.get("/{project_id}")
async def get_project(project_id: str, user=Depends(get_current_user)):
    p = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    p["task_count"] = await db.tasks.count_documents({"project_id": project_id})
    p["bug_count"] = await db.bugs.count_documents({"project_id": project_id})
    return p

@router.post("")
async def create_project(input: ProjectInput, user=Depends(get_current_user)):
    key = input.key.upper().strip() if input.key else input.name[:3].upper().strip()
    existing = await db.projects.find_one({"key": key})
    if existing:
        key = key + str(await db.projects.count_documents({}) + 1)
    doc = {
        "id": str(uuid.uuid4()), "name": input.name, "key": key,
        "description": input.description, "color": input.color,
        "members": [user["_id"]], "created_by": user["_id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.projects.insert_one(doc)
    doc.pop("_id", None)
    return doc

@router.put("/{project_id}")
async def update_project(project_id: str, input: ProjectInput, user=Depends(get_current_user)):
    result = await db.projects.update_one(
        {"id": project_id},
        {"$set": {"name": input.name, "description": input.description, "color": input.color}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return await db.projects.find_one({"id": project_id}, {"_id": 0})

@router.delete("/{project_id}")
async def delete_project(project_id: str, user=Depends(get_current_user)):
    await db.projects.delete_one({"id": project_id})
    await db.tasks.delete_many({"project_id": project_id})
    await db.bugs.delete_many({"project_id": project_id})
    return {"message": "Project deleted"}
