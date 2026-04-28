# ClickFlow v3 - Linear-style Task Manager + QA Bug Tracker

## Problem Statement
Desktop web app for multi-project Task Manager with integrated QA Bug Tracking. Linear-style dark theme, minimal, fast. 3-pane layout: Sidebar | Content | Right Detail Panel.

## Architecture
- **Backend**: FastAPI + MongoDB (modular: database.py, models.py, auth_helpers.py, routes/)
- **Frontend**: React + TailwindCSS + Shadcn UI + Lucide Icons
- **Auth**: JWT httpOnly cookies, bcrypt, admin seeding
- **Design**: Dark zinc-950 theme, Manrope + Inter fonts, indigo accents

## Collections
users, login_attempts, projects, tasks, bugs, comments, notifications, counters

## Implemented (v3.0 - Apr 28, 2026)
- [x] Auth (login/register/logout/refresh)
- [x] Workspace Dashboard (project grid with task/bug counts)
- [x] Project creation with auto-key (e.g. FE, BE)
- [x] Sprint Board (Kanban: Backlog/In Progress/Completed) with drag-drop
- [x] Auto-generated task keys (FE-1, FE-2, etc.)
- [x] QA Bug List with filters (status, priority)
- [x] Bug lifecycle: Open → In Progress → Ready for QA → Verified → Closed
- [x] Right slide-in Detail Panel (inline title edit, status, priority, assignee, description, comments)
- [x] Cross-project My Tasks view
- [x] Cross-project All Bugs view
- [x] Comments system (task + bug support)
- [x] Notifications (task assigned, status changed, comment added)
- [x] Sidebar: Dashboard, My Tasks, All Bugs, Project-aware sub-nav (Sprint Board, QA Bugs)

## Testing: 100% backend (30/30), 95% frontend, 100% integration

## Backlog
- [ ] Project overview (task/bug count, progress bar)
- [ ] Global search functionality
- [ ] @mentions in comments
- [ ] Team member invitation
- [ ] File attachments on bugs
- [ ] Keyboard shortcuts
