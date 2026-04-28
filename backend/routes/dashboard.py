from fastapi import APIRouter, Depends
from datetime import datetime, timezone
from database import db
from auth_helpers import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/stats")
async def get_dashboard_stats(user=Depends(get_current_user)):
    total_tasks = await db.tasks.count_documents({})
    todo_tasks = await db.tasks.count_documents({"status": "todo"})
    in_progress = await db.tasks.count_documents({"status": "in_progress"})
    in_review = await db.tasks.count_documents({"status": "in_review"})
    done_tasks = await db.tasks.count_documents({"status": "done"})
    total_projects = await db.projects.count_documents({})
    total_goals = await db.goals.count_documents({})
    total_automations = await db.automations.count_documents({"active": True})

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    today_entries = await db.time_entries.find(
        {"user_id": user["_id"], "start_time": {"$gte": today_start}}, {"_id": 0}
    ).to_list(100)
    total_time_today = sum(e.get("duration", 0) for e in today_entries)

    urgent = await db.tasks.count_documents({"priority": "urgent"})
    high = await db.tasks.count_documents({"priority": "high"})
    medium = await db.tasks.count_documents({"priority": "medium"})
    low = await db.tasks.count_documents({"priority": "low"})

    recent_tasks = await db.tasks.find({}, {"_id": 0}).sort("created_at", -1).to_list(5)

    now_iso = datetime.now(timezone.utc).isoformat()
    overdue = await db.tasks.count_documents({
        "due_date": {"$ne": None, "$lt": now_iso}, "status": {"$ne": "done"}
    })

    return {
        "total_tasks": total_tasks, "todo_tasks": todo_tasks,
        "in_progress": in_progress, "in_review": in_review,
        "done_tasks": done_tasks, "total_projects": total_projects,
        "total_goals": total_goals, "total_automations": total_automations,
        "total_time_today": total_time_today,
        "priority_breakdown": {"urgent": urgent, "high": high, "medium": medium, "low": low},
        "recent_tasks": recent_tasks, "overdue_tasks": overdue,
    }
