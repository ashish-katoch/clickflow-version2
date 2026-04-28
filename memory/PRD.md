# ClickFlow - Project Management Tool (ClickUp Clone)

## Original Problem Statement
Build a ClickUp-like project management tool with all paid features including: unlimited users & tasks, multiple views (List, Board, Calendar, Gantt, Timeline), advanced dashboards, time tracking, goals & reporting, comments, file attachments, automation rules, and role-based permissions.

## Architecture
- **Backend**: FastAPI + MongoDB (motor async driver) - MODULAR structure
  - `database.py` - MongoDB connection, collection references, indexes
  - `models.py` - All Pydantic schemas + documented MongoDB collection schemas
  - `auth_helpers.py` - JWT tokens, password hashing, user extraction
  - `routes/` - Domain-specific routers (auth, projects, tasks, comments, attachments, automations, goals, time_entries, dashboard, members)
- **Frontend**: React + TailwindCSS + Shadcn UI + Phosphor Icons
- **Auth**: JWT with httpOnly cookies, bcrypt password hashing
- **Design**: Light Swiss theme, Cabinet Grotesk + IBM Plex Sans fonts

## MongoDB Collections (10 total)
users, login_attempts, projects, tasks, time_entries, goals, comments, attachments, automations, password_reset_tokens

## What's Been Implemented
### Phase 1 (Apr 13, 2026)
- [x] JWT Auth (register, login, logout, refresh, admin seeding, brute force)
- [x] Projects CRUD with color coding
- [x] Tasks CRUD (subtasks, priorities, tags, due dates, assignees)
- [x] List View, Board/Kanban View, Calendar View
- [x] Task Detail Modal, Time Tracking, Dashboard, Goals, Members

### Phase 2 (Apr 28, 2026)
- [x] Backend restructured into modular files
- [x] Gantt Chart View (horizontal bars with start_date/due_date)
- [x] Timeline View (date-grouped with overdue markers)
- [x] Comments & Activity Log (auto-logs status/priority changes)
- [x] File Attachments (base64 storage in MongoDB)
- [x] Automation Rules (WHEN→THEN engine, quick templates, toggle on/off)
- [x] start_date field added to tasks

## Testing Results
- Backend: 100% (35/35 API tests passed)
- Frontend: 95% (all major features working)

## Prioritized Backlog
### P1 (High)
- [ ] Connect object storage for file attachments (replace base64)
- [ ] Task dependencies (blocked by / blocking)
- [ ] Advanced search across all tasks
- [ ] Real-time notifications

### P2 (Medium)
- [ ] Recurring tasks
- [ ] Email notifications
- [ ] Task templates
- [ ] Custom fields on tasks
- [ ] Dark mode

### P3 (Low)
- [ ] Workspace switching (multi-tenant)
- [ ] Import/export data
- [ ] Mobile-optimized views
- [ ] Advanced reporting charts
