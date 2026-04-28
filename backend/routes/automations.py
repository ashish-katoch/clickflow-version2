from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from database import db
from auth_helpers import get_current_user
from models import AutomationInput
import uuid

router = APIRouter(prefix="/api/automations", tags=["automations"])

@router.get("")
async def get_automations(project_id: str = None, user=Depends(get_current_user)):
    query = {}
    if project_id:
        query["project_id"] = project_id
    return await db.automations.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)

@router.post("")
async def create_automation(input: AutomationInput, user=Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "project_id": input.project_id,
        "name": input.name,
        "trigger_type": input.trigger_type,
        "trigger_value": input.trigger_value,
        "action_type": input.action_type,
        "action_value": input.action_value,
        "active": input.active,
        "created_by": user["_id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.automations.insert_one(doc)
    doc.pop("_id", None)
    return doc

@router.put("/{automation_id}")
async def update_automation(automation_id: str, input: AutomationInput, user=Depends(get_current_user)):
    result = await db.automations.update_one(
        {"id": automation_id},
        {"$set": {
            "name": input.name, "project_id": input.project_id,
            "trigger_type": input.trigger_type, "trigger_value": input.trigger_value,
            "action_type": input.action_type, "action_value": input.action_value,
            "active": input.active,
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Automation not found")
    return await db.automations.find_one({"id": automation_id}, {"_id": 0})

@router.post("/{automation_id}/toggle")
async def toggle_automation(automation_id: str, user=Depends(get_current_user)):
    auto = await db.automations.find_one({"id": automation_id}, {"_id": 0})
    if not auto:
        raise HTTPException(status_code=404, detail="Automation not found")
    new_active = not auto["active"]
    await db.automations.update_one({"id": automation_id}, {"$set": {"active": new_active}})
    auto["active"] = new_active
    return auto

@router.delete("/{automation_id}")
async def delete_automation(automation_id: str, user=Depends(get_current_user)):
    await db.automations.delete_one({"id": automation_id})
    return {"message": "Automation deleted"}
