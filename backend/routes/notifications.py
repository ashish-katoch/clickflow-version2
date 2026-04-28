from fastapi import APIRouter, Depends
from database import db
from auth_helpers import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

@router.get("")
async def get_notifications(user=Depends(get_current_user)):
    return await db.notifications.find({"user_id": user["_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)

@router.get("/unread-count")
async def unread_count(user=Depends(get_current_user)):
    count = await db.notifications.count_documents({"user_id": user["_id"], "read": False})
    return {"count": count}

@router.post("/mark-read")
async def mark_all_read(user=Depends(get_current_user)):
    await db.notifications.update_many({"user_id": user["_id"], "read": False}, {"$set": {"read": True}})
    return {"message": "All marked as read"}

@router.post("/{notification_id}/read")
async def mark_one_read(notification_id: str, user=Depends(get_current_user)):
    await db.notifications.update_one({"id": notification_id}, {"$set": {"read": True}})
    return {"message": "Marked as read"}
