"""
ClickFlow v3 - MongoDB Models & Schema Documentation
Linear-style Task Manager + QA Bug Tracking

Collections:
  users, login_attempts, projects, tasks, bugs, comments, notifications
"""
from pydantic import BaseModel
from typing import Optional, List

# ─── Auth ───
class RegisterInput(BaseModel):
    email: str
    password: str
    name: str

class LoginInput(BaseModel):
    email: str
    password: str

# ─── Projects ───
class ProjectInput(BaseModel):
    name: str
    key: str = ""
    color: str = "#6366f1"
    description: str = ""

# ─── Tasks (Sprint Board) ───
# Statuses: backlog, in_progress, completed
class TaskInput(BaseModel):
    title: str
    description: str = ""
    status: str = "backlog"
    priority: str = "medium"
    assignee_id: Optional[str] = None
    due_date: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[str] = None
    due_date: Optional[str] = None

# ─── Bugs (QA Tracking) ───
# Statuses: open, in_progress, ready_for_qa, verified, closed
class BugInput(BaseModel):
    title: str
    description: str = ""
    status: str = "open"
    priority: str = "medium"
    assignee_id: Optional[str] = None

class BugUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[str] = None

# ─── Comments ───
class CommentInput(BaseModel):
    entity_id: str
    entity_type: str = "task"
    content: str
