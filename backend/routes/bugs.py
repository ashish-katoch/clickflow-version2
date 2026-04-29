from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from datetime import datetime, timezone
from database import db, get_next_key
from auth_helpers import get_current_user
from models import BugInput, BugUpdate
import uuid

router = APIRouter(prefix="/api/bugs", tags=["bugs"])

@router.get("")
async def get_bugs(project_id: Optional[str] = None, assignee_id: Optional[str] = None, status: Optional[str] = None, priority: Optional[str] = None, user=Depends(get_current_user)):
    query = {}
    if project_id:
        query["project_id"] = project_id
    if assignee_id:
        query["assignee_id"] = assignee_id
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    return await db.bugs.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)

@router.get("/all")
async def get_all_bugs(user=Depends(get_current_user)):
    bugs = await db.bugs.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for b in bugs:
        proj = await db.projects.find_one({"id": b["project_id"]}, {"_id": 0, "name": 1, "key": 1, "color": 1})
        b["project"] = proj
    return bugs

@router.post("")
async def create_bug(input: BugInput, project_id: str, user=Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    key = await get_next_key(project_id, project["key"])
    doc = {
        "id": str(uuid.uuid4()), "project_id": project_id, "key": key,
        "title": input.title, "description": input.description,
        "status": input.status, "priority": input.priority,
        "assignee_id": input.assignee_id, "attachments": [],
        "created_by": user["_id"],
        "created_by_name": user.get("name", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "comment_count": 0,
    }
    await db.bugs.insert_one(doc)
    doc.pop("_id", None)
    # Log "reported" activity
    await db.comments.insert_one({
        "id": str(uuid.uuid4()), "entity_id": doc["id"], "entity_type": "bug",
        "user_id": user["_id"], "user_name": user.get("name", ""),
        "content": "reported this bug", "type": "activity",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    if input.assignee_id and input.assignee_id != user["_id"]:
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()), "user_id": input.assignee_id,
            "type": "bug_assigned", "message": f"Bug {key}: {input.title} assigned to you",
            "link": f"/project/{project_id}/bugs", "read": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    return doc

@router.put("/{bug_id}")
async def update_bug(bug_id: str, input: BugUpdate, user=Depends(get_current_user)):
    old = await db.bugs.find_one({"id": bug_id}, {"_id": 0})
    if not old:
        raise HTTPException(status_code=404, detail="Bug not found")
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.bugs.update_one({"id": bug_id}, {"$set": update_data})
    # Log status change activity
    if "status" in update_data and update_data["status"] != old.get("status"):
        await db.comments.insert_one({
            "id": str(uuid.uuid4()), "entity_id": bug_id, "entity_type": "bug",
            "user_id": user["_id"], "user_name": user.get("name", ""),
            "content": f"changed status to {update_data['status'].replace('_', ' ').title()}",
            "type": "activity", "created_at": datetime.now(timezone.utc).isoformat(),
        })
        target = old.get("assignee_id") or old.get("created_by")
        if target and target != user["_id"]:
            await db.notifications.insert_one({
                "id": str(uuid.uuid4()), "user_id": target,
                "type": "status_changed", "message": f"{old['key']} status changed to {update_data['status']}",
                "link": f"/project/{old['project_id']}/bugs", "read": False,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
    # Log assignee change activity
    if "assignee_id" in update_data and update_data["assignee_id"] != old.get("assignee_id"):
        if update_data["assignee_id"]:
            assignee_user = await db.users.find_one({"_id": __import__('bson').ObjectId(update_data["assignee_id"])})
            assignee_name = assignee_user.get("name", "someone") if assignee_user else "someone"
            await db.comments.insert_one({
                "id": str(uuid.uuid4()), "entity_id": bug_id, "entity_type": "bug",
                "user_id": user["_id"], "user_name": user.get("name", ""),
                "content": f"assigned this to {assignee_name}",
                "type": "activity", "created_at": datetime.now(timezone.utc).isoformat(),
            })
    return await db.bugs.find_one({"id": bug_id}, {"_id": 0})

@router.delete("/{bug_id}")
async def delete_bug(bug_id: str, user=Depends(get_current_user)):
    await db.bugs.delete_one({"id": bug_id})
    await db.comments.delete_many({"entity_id": bug_id})
    return {"message": "Bug deleted"}

# ─── Attachments ───
from pydantic import BaseModel

class AttachmentPayload(BaseModel):
    file_name: str
    file_url: str
    file_type: str = "image/png"

@router.post("/{bug_id}/attachments")
async def add_attachment(bug_id: str, payload: AttachmentPayload, user=Depends(get_current_user)):
    bug = await db.bugs.find_one({"id": bug_id}, {"_id": 0})
    if not bug:
        raise HTTPException(status_code=404, detail="Bug not found")
    att = {
        "id": str(uuid.uuid4()),
        "file_name": payload.file_name,
        "file_url": payload.file_url,
        "file_type": payload.file_type,
        "uploaded_by": user["_id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.bugs.update_one({"id": bug_id}, {"$push": {"attachments": att}})
    return att

@router.delete("/{bug_id}/attachments/{attachment_id}")
async def remove_attachment(bug_id: str, attachment_id: str, user=Depends(get_current_user)):
    await db.bugs.update_one({"id": bug_id}, {"$pull": {"attachments": {"id": attachment_id}}})
    return {"message": "Attachment removed"}
