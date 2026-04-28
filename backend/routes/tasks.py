from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from datetime import datetime, timezone
from database import db
from auth_helpers import get_current_user
from models import TaskInput, TaskUpdate
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/tasks", tags=["tasks"])

async def run_automations(task: dict, changed_fields: dict, user: dict):
    """Execute automation rules when a task is updated."""
    try:
        automations = await db.automations.find({"active": True}, {"_id": 0}).to_list(100)
        for auto in automations:
            if auto.get("project_id") and auto["project_id"] != task.get("project_id"):
                continue
            triggered = False
            if auto["trigger_type"] == "status_change" and "status" in changed_fields:
                if not auto.get("trigger_value") or changed_fields["status"] == auto["trigger_value"]:
                    triggered = True
            elif auto["trigger_type"] == "priority_change" and "priority" in changed_fields:
                if not auto.get("trigger_value") or changed_fields["priority"] == auto["trigger_value"]:
                    triggered = True
            elif auto["trigger_type"] == "assignee_change" and "assignee_id" in changed_fields:
                triggered = True

            if triggered:
                if auto["action_type"] == "change_status":
                    await db.tasks.update_one({"id": task["id"]}, {"$set": {"status": auto["action_value"]}})
                elif auto["action_type"] == "change_priority":
                    await db.tasks.update_one({"id": task["id"]}, {"$set": {"priority": auto["action_value"]}})
                elif auto["action_type"] == "add_comment":
                    await db.comments.insert_one({
                        "id": str(uuid.uuid4()), "task_id": task["id"],
                        "user_id": "system", "user_name": "Automation",
                        "user_email": "", "content": auto["action_value"],
                        "type": "activity",
                        "created_at": datetime.now(timezone.utc).isoformat(),
                    })
                logger.info(f"Automation '{auto['name']}' triggered for task {task['id']}")
    except Exception as e:
        logger.error(f"Automation error: {e}")

@router.get("")
async def get_tasks(project_id: Optional[str] = None, status: Optional[str] = None, user=Depends(get_current_user)):
    query = {}
    if project_id:
        query["project_id"] = project_id
    if status:
        query["status"] = status
    return await db.tasks.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)

@router.post("")
async def create_task(input: TaskInput, project_id: str, user=Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()), "project_id": project_id,
        "title": input.title, "description": input.description,
        "status": input.status, "priority": input.priority,
        "assignee_id": input.assignee_id, "start_date": input.start_date,
        "due_date": input.due_date, "tags": input.tags,
        "parent_task_id": input.parent_task_id, "time_estimate": input.time_estimate,
        "created_by": user["_id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.tasks.insert_one(doc)
    doc.pop("_id", None)
    await db.projects.update_one({"id": project_id}, {"$inc": {"task_count": 1}})
    # Log activity
    await db.comments.insert_one({
        "id": str(uuid.uuid4()), "task_id": doc["id"],
        "user_id": user["_id"], "user_name": user.get("name", ""),
        "user_email": user.get("email", ""), "content": f"created this task",
        "type": "activity", "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return doc

@router.put("/{task_id}")
async def update_task(task_id: str, input: TaskUpdate, user=Depends(get_current_user)):
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    # Get old task for automation comparison
    old_task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    result = await db.tasks.update_one({"id": task_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    # Run automations
    if old_task:
        changed = {k: v for k, v in update_data.items() if k != "updated_at" and old_task.get(k) != v}
        if changed:
            await run_automations(task, changed, user)
            # Log significant changes as activity
            for field, value in changed.items():
                if field in ("status", "priority", "assignee_id"):
                    await db.comments.insert_one({
                        "id": str(uuid.uuid4()), "task_id": task_id,
                        "user_id": user["_id"], "user_name": user.get("name", ""),
                        "user_email": user.get("email", ""),
                        "content": f"changed {field.replace('_', ' ')} to {value}",
                        "type": "activity",
                        "created_at": datetime.now(timezone.utc).isoformat(),
                    })
    return task

@router.delete("/{task_id}")
async def delete_task(task_id: str, user=Depends(get_current_user)):
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if task:
        await db.tasks.delete_one({"id": task_id})
        await db.tasks.delete_many({"parent_task_id": task_id})
        await db.projects.update_one({"id": task["project_id"]}, {"$inc": {"task_count": -1}})
        await db.time_entries.delete_many({"task_id": task_id})
        await db.comments.delete_many({"task_id": task_id})
        await db.attachments.delete_many({"task_id": task_id})
    return {"message": "Task deleted"}
