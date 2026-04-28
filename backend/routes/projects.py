from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from database import db
from auth_helpers import get_current_user
from models import ProjectInput
import uuid

router = APIRouter(prefix="/api/projects", tags=["projects"])

@router.get("")
async def get_projects(user=Depends(get_current_user)):
    return await db.projects.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)

@router.post("")
async def create_project(input: ProjectInput, user=Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()), "name": input.name, "description": input.description,
        "color": input.color, "created_by": user["_id"],
        "created_at": datetime.now(timezone.utc).isoformat(), "task_count": 0,
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
    await db.comments.delete_many({"task_id": {"$in": [t["id"] async for t in db.tasks.find({"project_id": project_id}, {"id": 1})]}})
    return {"message": "Project deleted"}
