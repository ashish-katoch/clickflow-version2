from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from datetime import datetime, timezone
from database import db
from auth_helpers import get_current_user
from models import TimeEntryInput
import uuid

router = APIRouter(prefix="/api/time-entries", tags=["time_entries"])

@router.get("")
async def get_time_entries(task_id: Optional[str] = None, user=Depends(get_current_user)):
    query = {"user_id": user["_id"]}
    if task_id:
        query["task_id"] = task_id
    return await db.time_entries.find(query, {"_id": 0}).sort("start_time", -1).to_list(200)

@router.post("/start")
async def start_timer(input: TimeEntryInput, user=Depends(get_current_user)):
    active = await db.time_entries.find_one({"user_id": user["_id"], "end_time": None}, {"_id": 0})
    if active:
        now = datetime.now(timezone.utc).isoformat()
        start = datetime.fromisoformat(active["start_time"])
        duration = int((datetime.now(timezone.utc) - start).total_seconds())
        await db.time_entries.update_one({"id": active["id"]}, {"$set": {"end_time": now, "duration": duration}})
    doc = {
        "id": str(uuid.uuid4()), "task_id": input.task_id, "user_id": user["_id"],
        "description": input.description, "start_time": datetime.now(timezone.utc).isoformat(),
        "end_time": None, "duration": 0,
    }
    await db.time_entries.insert_one(doc)
    doc.pop("_id", None)
    return doc

@router.post("/stop")
async def stop_timer(user=Depends(get_current_user)):
    active = await db.time_entries.find_one({"user_id": user["_id"], "end_time": None}, {"_id": 0})
    if not active:
        raise HTTPException(status_code=404, detail="No active timer")
    now = datetime.now(timezone.utc).isoformat()
    start = datetime.fromisoformat(active["start_time"])
    duration = int((datetime.now(timezone.utc) - start).total_seconds())
    await db.time_entries.update_one({"id": active["id"]}, {"$set": {"end_time": now, "duration": duration}})
    active["end_time"] = now
    active["duration"] = duration
    return active

@router.get("/active")
async def get_active_timer(user=Depends(get_current_user)):
    return await db.time_entries.find_one({"user_id": user["_id"], "end_time": None}, {"_id": 0})
