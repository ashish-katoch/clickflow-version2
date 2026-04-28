"""MongoDB connection, collection refs, index management."""
from motor.motor_asyncio import AsyncIOMotorClient
import os

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def create_indexes():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.projects.create_index("key", unique=True)
    await db.tasks.create_index("project_id")
    await db.tasks.create_index("assignee_id")
    await db.tasks.create_index("status")
    await db.bugs.create_index("project_id")
    await db.bugs.create_index("assignee_id")
    await db.bugs.create_index("status")
    await db.comments.create_index([("entity_id", 1), ("entity_type", 1)])
    await db.notifications.create_index("user_id")
    await db.notifications.create_index("read")
    await db.counters.create_index("project_id")

async def get_next_key(project_id: str, prefix: str) -> str:
    """Auto-increment task/bug key per project. Returns e.g. 'FE-12'."""
    result = await db.counters.find_one_and_update(
        {"project_id": project_id},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True
    )
    return f"{prefix}-{result['seq']}"

async def close_connection():
    client.close()
