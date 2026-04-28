from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from database import db
from auth_helpers import get_current_user
from models import CommentInput
import uuid

router = APIRouter(prefix="/api/comments", tags=["comments"])

@router.get("")
async def get_comments(entity_id: str, entity_type: str = "task", user=Depends(get_current_user)):
    return await db.comments.find({"entity_id": entity_id, "entity_type": entity_type}, {"_id": 0}).sort("created_at", 1).to_list(200)

@router.post("")
async def create_comment(input: CommentInput, user=Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()), "entity_id": input.entity_id,
        "entity_type": input.entity_type,
        "user_id": user["_id"], "user_name": user.get("name", ""),
        "content": input.content, "type": "comment",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.comments.insert_one(doc)
    doc.pop("_id", None)
    # Increment comment count
    collection = db.tasks if input.entity_type == "task" else db.bugs
    await collection.update_one({"id": input.entity_id}, {"$inc": {"comment_count": 1}})
    # Notification
    entity = await collection.find_one({"id": input.entity_id}, {"_id": 0})
    if entity and entity.get("assignee_id") and entity["assignee_id"] != user["_id"]:
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()), "user_id": entity["assignee_id"],
            "type": "comment_added", "message": f"New comment on {entity.get('key', '')}: {input.content[:50]}",
            "link": "", "read": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    return doc

@router.delete("/{comment_id}")
async def delete_comment(comment_id: str, user=Depends(get_current_user)):
    c = await db.comments.find_one({"id": comment_id}, {"_id": 0})
    if not c:
        raise HTTPException(status_code=404, detail="Not found")
    if c["user_id"] != user["_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    await db.comments.delete_one({"id": comment_id})
    collection = db.tasks if c.get("entity_type") == "task" else db.bugs
    await collection.update_one({"id": c["entity_id"]}, {"$inc": {"comment_count": -1}})
    return {"message": "Deleted"}
