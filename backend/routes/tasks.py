from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from datetime import datetime, timezone
from database import db, get_next_key
from auth_helpers import get_current_user
from models import TaskInput, TaskUpdate
import uuid

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

@router.get("")
async def get_tasks(project_id: Optional[str] = None, assignee_id: Optional[str] = None, status: Optional[str] = None, user=Depends(get_current_user)):
    query = {}
    if project_id:
        query["project_id"] = project_id
    if assignee_id:
        query["assignee_id"] = assignee_id
    if status:
        query["status"] = status
    return await db.tasks.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)

@router.get("/my")
async def get_my_tasks(user=Depends(get_current_user)):
    tasks = await db.tasks.find({"assignee_id": user["_id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    for t in tasks:
        proj = await db.projects.find_one({"id": t["project_id"]}, {"_id": 0, "name": 1, "key": 1, "color": 1})
        t["project"] = proj
    return tasks

@router.post("")
async def create_task(input: TaskInput, project_id: str, user=Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    key = await get_next_key(project_id, project["key"])
    doc = {
        "id": str(uuid.uuid4()), "project_id": project_id, "key": key,
        "title": input.title, "description": input.description,
        "status": input.status, "priority": input.priority,
        "assignee_id": input.assignee_id, "due_date": input.due_date,
        "created_by": user["_id"],
        "created_by_name": user.get("name", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "comment_count": 0,
    }
    await db.tasks.insert_one(doc)
    doc.pop("_id", None)
    # Log "created" activity
    await db.comments.insert_one({
        "id": str(uuid.uuid4()), "entity_id": doc["id"], "entity_type": "task",
        "user_id": user["_id"], "user_name": user.get("name", ""),
        "content": "created this task", "type": "activity",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    if input.assignee_id and input.assignee_id != user["_id"]:
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()), "user_id": input.assignee_id,
            "type": "task_assigned", "message": f"You were assigned to {key}: {input.title}",
            "link": f"/project/{project_id}/board", "read": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    return doc

@router.put("/{task_id}")
async def update_task(task_id: str, input: TaskUpdate, user=Depends(get_current_user)):
    old = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not old:
        raise HTTPException(status_code=404, detail="Task not found")
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.tasks.update_one({"id": task_id}, {"$set": update_data})
    # Log status change activity
    if "status" in update_data and update_data["status"] != old.get("status"):
        await db.comments.insert_one({
            "id": str(uuid.uuid4()), "entity_id": task_id, "entity_type": "task",
            "user_id": user["_id"], "user_name": user.get("name", ""),
            "content": f"changed status to {update_data['status'].replace('_', ' ').title()}",
            "type": "activity", "created_at": datetime.now(timezone.utc).isoformat(),
        })
        target = old.get("assignee_id") or old.get("created_by")
        if target and target != user["_id"]:
            await db.notifications.insert_one({
                "id": str(uuid.uuid4()), "user_id": target,
                "type": "status_changed", "message": f"{old['key']} status changed to {update_data['status']}",
                "link": f"/project/{old['project_id']}/board", "read": False,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
    # Log assignee change activity
    if "assignee_id" in update_data and update_data["assignee_id"] != old.get("assignee_id"):
        if update_data["assignee_id"]:
            assignee_user = await db.users.find_one({"_id": __import__('bson').ObjectId(update_data["assignee_id"])})
            assignee_name = assignee_user.get("name", "someone") if assignee_user else "someone"
            await db.comments.insert_one({
                "id": str(uuid.uuid4()), "entity_id": task_id, "entity_type": "task",
                "user_id": user["_id"], "user_name": user.get("name", ""),
                "content": f"assigned this to {assignee_name}",
                "type": "activity", "created_at": datetime.now(timezone.utc).isoformat(),
            })
            if update_data["assignee_id"] != user["_id"]:
                await db.notifications.insert_one({
                    "id": str(uuid.uuid4()), "user_id": update_data["assignee_id"],
                    "type": "task_assigned", "message": f"You were assigned to {old['key']}: {old['title']}",
                    "link": f"/project/{old['project_id']}/board", "read": False,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                })
    return await db.tasks.find_one({"id": task_id}, {"_id": 0})

@router.delete("/{task_id}")
async def delete_task(task_id: str, user=Depends(get_current_user)):
    await db.tasks.delete_one({"id": task_id})
    await db.comments.delete_many({"entity_id": task_id})
    return {"message": "Task deleted"}
