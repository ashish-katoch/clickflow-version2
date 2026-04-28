"""
ClickFlow - Database Module
MongoDB connection, collection references, and index management.
Easy to import from any route file.
"""
from motor.motor_asyncio import AsyncIOMotorClient
import os

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ─── Collection References ───
# Usage: from database import db
# Then:  db.users, db.projects, db.tasks, etc.
#
# Collections:
#   users              - User accounts & auth
#   login_attempts     - Brute force protection
#   projects           - Project containers
#   tasks              - Task items (supports subtasks via parent_task_id)
#   time_entries       - Time tracking records
#   goals              - Goal tracking
#   comments           - Task comments / activity log
#   attachments        - File attachment metadata
#   automations        - Automation rules

async def create_indexes():
    """Create MongoDB indexes on startup."""
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.tasks.create_index("project_id")
    await db.tasks.create_index("status")
    await db.tasks.create_index("parent_task_id")
    await db.time_entries.create_index("user_id")
    await db.time_entries.create_index("task_id")
    await db.comments.create_index("task_id")
    await db.comments.create_index("created_at")
    await db.attachments.create_index("task_id")
    await db.automations.create_index("project_id")

async def close_connection():
    client.close()
