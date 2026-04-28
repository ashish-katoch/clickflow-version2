"""
ClickFlow - Pydantic Models & MongoDB Schema Documentation
All request/response models + documented collection schemas.

MongoDB Collection Schemas:
══════════════════════════

users {
    _id:            ObjectId (auto)
    email:          string (unique, lowercase)
    password_hash:  string (bcrypt)
    name:           string
    role:           "admin" | "member" | "viewer"
    avatar_url:     string
    created_at:     string (ISO datetime)
}

projects {
    _id:            ObjectId (auto)
    id:             string (uuid)
    name:           string
    description:    string
    color:          string (hex)
    created_by:     string (user id)
    created_at:     string (ISO datetime)
    task_count:     int
}

tasks {
    _id:            ObjectId (auto)
    id:             string (uuid)
    project_id:     string (project uuid)
    title:          string
    description:    string
    status:         "todo" | "in_progress" | "in_review" | "done"
    priority:       "none" | "low" | "medium" | "high" | "urgent"
    assignee_id:    string | null (user id)
    start_date:     string | null (ISO date, for Gantt)
    due_date:       string | null (ISO date)
    tags:           [string]
    parent_task_id: string | null (for subtasks)
    time_estimate:  int (minutes)
    created_by:     string (user id)
    created_at:     string (ISO datetime)
    updated_at:     string (ISO datetime)
}

time_entries {
    _id:            ObjectId (auto)
    id:             string (uuid)
    task_id:        string (task uuid)
    user_id:        string (user id)
    description:    string
    start_time:     string (ISO datetime)
    end_time:       string | null (ISO datetime)
    duration:       int (seconds)
}

goals {
    _id:            ObjectId (auto)
    id:             string (uuid)
    title:          string
    description:    string
    target_value:   float
    current_value:  float
    unit:           "percent" | "tasks" | "hours" | "points"
    due_date:       string | null (ISO date)
    created_by:     string (user id)
    created_at:     string (ISO datetime)
}

comments {
    _id:            ObjectId (auto)
    id:             string (uuid)
    task_id:        string (task uuid)
    user_id:        string (user id)
    user_name:      string
    user_email:     string
    content:        string
    type:           "comment" | "activity"
    created_at:     string (ISO datetime)
}

attachments {
    _id:            ObjectId (auto)
    id:             string (uuid)
    task_id:        string (task uuid)
    file_name:      string
    file_url:       string (storage URL or base64 data URI)
    file_size:      int (bytes)
    file_type:      string (MIME type)
    uploaded_by:    string (user id)
    created_at:     string (ISO datetime)
}

automations {
    _id:            ObjectId (auto)
    id:             string (uuid)
    project_id:     string | null (null = all projects)
    name:           string
    trigger_type:   "status_change" | "priority_change" | "assignee_change" | "due_date_passed"
    trigger_value:  string | null (e.g. "done" for status_change)
    action_type:    "change_status" | "change_priority" | "change_assignee" | "add_comment"
    action_value:   string (e.g. "in_review" for change_status)
    active:         bool
    created_by:     string (user id)
    created_at:     string (ISO datetime)
}

login_attempts {
    _id:            ObjectId (auto)
    identifier:     string (ip:email)
    count:          int
    locked_until:   string (ISO datetime)
}
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
    description: str = ""
    color: str = "#3b82f6"

# ─── Tasks ───
class TaskInput(BaseModel):
    title: str
    description: str = ""
    status: str = "todo"
    priority: str = "none"
    assignee_id: Optional[str] = None
    start_date: Optional[str] = None
    due_date: Optional[str] = None
    tags: List[str] = []
    parent_task_id: Optional[str] = None
    time_estimate: int = 0

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[str] = None
    start_date: Optional[str] = None
    due_date: Optional[str] = None
    tags: Optional[List[str]] = None
    time_estimate: Optional[int] = None

# ─── Time Entries ───
class TimeEntryInput(BaseModel):
    task_id: str
    description: str = ""

# ─── Goals ───
class GoalInput(BaseModel):
    title: str
    description: str = ""
    target_value: float = 100
    current_value: float = 0
    unit: str = "percent"
    due_date: Optional[str] = None

# ─── Comments ───
class CommentInput(BaseModel):
    task_id: str
    content: str

# ─── Attachments ───
class AttachmentInput(BaseModel):
    task_id: str
    file_name: str
    file_url: str
    file_size: int = 0
    file_type: str = "application/octet-stream"

# ─── Automations ───
class AutomationInput(BaseModel):
    project_id: Optional[str] = None
    name: str
    trigger_type: str  # status_change, priority_change, assignee_change, due_date_passed
    trigger_value: Optional[str] = None
    action_type: str   # change_status, change_priority, change_assignee, add_comment
    action_value: str
    active: bool = True

# ─── Members ───
class MemberInvite(BaseModel):
    email: str
    role: str = "member"
