from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from database import db
from auth_helpers import get_current_user
from models import CommentInput
import uuid

router = APIRouter(prefix="/api/comments", tags=["comments"])

@router.get("")
async def get_comments(task_id: str, user=Depends(get_current_user)):
    """Get all comments and activity for a task."""
    return await db.comments.find({"task_id": task_id}, {"_id": 0}).sort("created_at", 1).to_list(200)

@router.post("")
async def create_comment(input: CommentInput, user=Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "task_id": input.task_id,
        "user_id": user["_id"],
        "user_name": user.get("name", ""),
        "user_email": user.get("email", ""),
        "content": input.content,
        "type": "comment",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.comments.insert_one(doc)
    doc.pop("_id", None)
    return doc

@router.delete("/{comment_id}")
async def delete_comment(comment_id: str, user=Depends(get_current_user)):
    comment = await db.comments.find_one({"id": comment_id}, {"_id": 0})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment["user_id"] != user["_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.comments.delete_one({"id": comment_id})
    return {"message": "Comment deleted"}
