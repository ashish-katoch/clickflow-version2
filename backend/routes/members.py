from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from database import db
from auth_helpers import get_current_user

router = APIRouter(prefix="/api/members", tags=["members"])

@router.get("")
async def get_members(user=Depends(get_current_user)):
    all_users = []
    async for u in db.users.find({}, {"password_hash": 0}):
        all_users.append({
            "id": str(u["_id"]), "email": u["email"],
            "name": u.get("name", ""), "role": u.get("role", "member"),
            "avatar_url": u.get("avatar_url", ""), "created_at": u.get("created_at", ""),
        })
    return all_users

@router.put("/{member_id}/role")
async def update_member_role(member_id: str, role: str, user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can change roles")
    if role not in ["admin", "member", "viewer"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    await db.users.update_one({"_id": ObjectId(member_id)}, {"$set": {"role": role}})
    return {"message": "Role updated"}
