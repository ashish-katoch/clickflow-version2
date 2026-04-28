from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from database import db
from auth_helpers import get_current_user
from models import AttachmentInput
import uuid

router = APIRouter(prefix="/api/attachments", tags=["attachments"])

@router.get("")
async def get_attachments(task_id: str, user=Depends(get_current_user)):
    return await db.attachments.find({"task_id": task_id}, {"_id": 0}).sort("created_at", -1).to_list(50)

@router.post("")
async def create_attachment(input: AttachmentInput, user=Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "task_id": input.task_id,
        "file_name": input.file_name,
        "file_url": input.file_url,
        "file_size": input.file_size,
        "file_type": input.file_type,
        "uploaded_by": user["_id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.attachments.insert_one(doc)
    doc.pop("_id", None)
    # Log activity
    await db.comments.insert_one({
        "id": str(uuid.uuid4()), "task_id": input.task_id,
        "user_id": user["_id"], "user_name": user.get("name", ""),
        "user_email": user.get("email", ""),
        "content": f"attached {input.file_name}",
        "type": "activity",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return doc

@router.delete("/{attachment_id}")
async def delete_attachment(attachment_id: str, user=Depends(get_current_user)):
    att = await db.attachments.find_one({"id": attachment_id}, {"_id": 0})
    if not att:
        raise HTTPException(status_code=404, detail="Attachment not found")
    await db.attachments.delete_one({"id": attachment_id})
    return {"message": "Attachment deleted"}
