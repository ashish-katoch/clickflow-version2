# ClickFlow - Project Management Tool (ClickUp Clone)

## Original Problem Statement
Build a ClickUp-like project management tool with all paid features including: unlimited users & tasks, multiple views (List, Board, Calendar), advanced dashboards, time tracking, goals & reporting, and role-based permissions.

## Architecture
- **Backend**: FastAPI + MongoDB (motor async driver)
- **Frontend**: React + TailwindCSS + Shadcn UI + Phosphor Icons
- **Auth**: JWT with httpOnly cookies, bcrypt password hashing
- **Design**: Light Swiss theme, Cabinet Grotesk + IBM Plex Sans fonts

## User Personas
1. **Admin** - Full workspace control, member role management
2. **Member** - Create/manage projects, tasks, goals
3. **Viewer** - Read-only access (enforced by role)

## Core Requirements
- JWT authentication (register, login, logout, refresh)
- Projects with CRUD operations
- Tasks with subtasks, priorities, assignees, due dates, tags
- Three views: List, Board (Kanban with drag & drop), Calendar
- Time tracking (start/stop timer)
- Goals with progress tracking
- Dashboard with analytics
- Team member management with role-based permissions

## What's Been Implemented (April 13, 2026)
- [x] JWT Auth with admin seeding, brute force protection
- [x] Projects CRUD with color coding
- [x] Tasks CRUD with full fields (subtasks, priorities, tags, due dates)
- [x] List View (table-like dense rows)
- [x] Board View (Kanban with drag & drop status changes)
- [x] Calendar View (monthly grid with tasks on due dates)
- [x] Task Detail Modal (status, priority, due date, tags, time tracking, subtasks)
- [x] Time Tracking (start/stop from task detail, persistent header widget)
- [x] Dashboard (stats cards, completion rate, status/priority breakdown, recent tasks)
- [x] Goals (CRUD with progress bars)
- [x] Members (list with role management for admins)
- [x] Filters (by status and priority)
- [x] Responsive sidebar navigation

## Testing Results
- Backend: 100% (24/24 API tests passed)
- Frontend: 95% (all major features working)

## Prioritized Backlog
### P0 (Critical)
- All implemented

### P1 (High)
- [ ] Gantt chart view
- [ ] Timeline view
- [ ] Task comments/activity log
- [ ] File attachments on tasks
- [ ] Advanced search across all tasks

### P2 (Medium)
- [ ] Automation rules (when status changes → do X)
- [ ] Advanced reporting/charts
- [ ] Task dependencies
- [ ] Recurring tasks
- [ ] Email notifications
- [ ] Task templates

### P3 (Low)
- [ ] Custom fields on tasks
- [ ] Dark mode
- [ ] Workspace switching
- [ ] Import/export data
- [ ] Mobile-optimized views
