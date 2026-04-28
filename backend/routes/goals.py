from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from database import db
from auth_helpers import get_current_user
from models import GoalInput
import uuid

router = APIRouter(prefix="/api/goals", tags=["goals"])

@router.get("")
async def get_goals(user=Depends(get_current_user)):
    return await db.goals.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)

@router.post("")
async def create_goal(input: GoalInput, user=Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()), "title": input.title, "description": input.description,
        "target_value": input.target_value, "current_value": input.current_value,
        "unit": input.unit, "due_date": input.due_date,
        "created_by": user["_id"], "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.goals.insert_one(doc)
    doc.pop("_id", None)
    return doc

@router.put("/{goal_id}")
async def update_goal(goal_id: str, input: GoalInput, user=Depends(get_current_user)):
    result = await db.goals.update_one(
        {"id": goal_id},
        {"$set": {"title": input.title, "description": input.description,
                  "target_value": input.target_value, "current_value": input.current_value,
                  "unit": input.unit, "due_date": input.due_date}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    return await db.goals.find_one({"id": goal_id}, {"_id": 0})

@router.delete("/{goal_id}")
async def delete_goal(goal_id: str, user=Depends(get_current_user)):
    await db.goals.delete_one({"id": goal_id})
    return {"message": "Goal deleted"}
