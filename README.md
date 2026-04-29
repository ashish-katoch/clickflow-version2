# ClickFlow - Project Management + QA Bug Tracker

A Linear-style desktop web application for multi-project task management with integrated QA bug tracking. Built with React + FastAPI + MongoDB.

![ClickFlow](https://img.shields.io/badge/ClickFlow-v3.0-indigo)

## Features

- **Sprint Board** - Kanban (Backlog / In Progress / Completed) with drag-and-drop
- **QA Bug Tracking** - Full lifecycle: Open → In Progress → Ready for QA → Verified → Closed
- **Cross-Project Views** - "My Tasks" and "All Bugs" across all projects
- **Right Slide-in Detail Panel** - Inline editing, comments, attachments
- **Activity Log** - Auto-tracked status changes, assignments, comments
- **Light/Dark Theme** - System detection + manual toggle, persisted in localStorage
- **Search** - Real-time search across tasks and bugs
- **Notifications** - Task assigned, status changed, comments added
- **Role-based Access** - Admin, Member, Viewer roles
- **Bug Attachments** - Upload images or paste URLs with preview

---

## Tech Stack

| Layer    | Technology                                           |
| -------- | ---------------------------------------------------- |
| Frontend | React 19, Tailwind CSS, Shadcn/UI, Lucide Icons     |
| Backend  | Python FastAPI, Motor (async MongoDB driver)         |
| Database | MongoDB                                              |
| Auth     | JWT (httpOnly cookies) + bcrypt password hashing     |

---

## Project Structure

```
clickflow/
├── backend/                  # FastAPI backend
│   ├── server.py             # Main app entrypoint
│   ├── database.py           # MongoDB connection & indexes
│   ├── models.py             # Pydantic models + schema docs
│   ├── auth_helpers.py       # JWT, password hashing
│   ├── routes/               # API route handlers
│   │   ├── auth.py           # Login, register, logout
│   │   ├── projects.py       # Project CRUD
│   │   ├── tasks.py          # Task CRUD + automations
│   │   ├── bugs.py           # Bug CRUD + attachments
│   │   ├── comments.py       # Comments & activity log
│   │   ├── notifications.py  # Notification system
│   │   ├── members.py        # Team member management
│   │   └── dashboard.py      # Dashboard stats (optional)
│   ├── requirements.txt      # Python dependencies
│   └── .env                  # Environment variables
│
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── App.js            # Routes + layout
│   │   ├── index.css         # Theme variables + Tailwind
│   │   ├── context/
│   │   │   ├── AuthContext.js # Auth state management
│   │   │   └── ThemeContext.js# Light/dark theme
│   │   ├── lib/
│   │   │   └── api.js        # All API calls
│   │   ├── pages/
│   │   │   ├── LoginPage.js
│   │   │   ├── WorkspacePage.js
│   │   │   ├── SprintBoardPage.js
│   │   │   ├── BugListPage.js
│   │   │   ├── MyTasksPage.js
│   │   │   └── AllBugsPage.js
│   │   └── components/
│   │       ├── AppSidebar.js
│   │       ├── AppHeader.js
│   │       ├── DetailPanel.js
│   │       └── ui/           # Shadcn UI components
│   ├── package.json          # Node dependencies
│   ├── tailwind.config.js
│   └── .env                  # Frontend env vars
│
└── README.md                 # This file
```

---

## Local Setup

### Prerequisites

- **Node.js** >= 18
- **Python** >= 3.10
- **MongoDB** running locally on port 27017
- **Yarn** (package manager)

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd clickflow
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows

# Install dependencies
pip install fastapi uvicorn motor python-dotenv bcrypt pyjwt python-multipart

# Create .env file
cat > .env << EOF
MONGO_URL="mongodb://localhost:27017"
DB_NAME="clickflow_db"
CORS_ORIGINS="*"
JWT_SECRET="your-secret-key-change-this-in-production"
ADMIN_EMAIL="admin@clickflow.com"
ADMIN_PASSWORD="admin123"
FRONTEND_URL="http://localhost:3000"
EOF

# Start the backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Backend will run on **http://localhost:8001**

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
yarn install

# Create .env file
cat > .env << EOF
REACT_APP_BACKEND_URL=http://localhost:8001
EOF

# Start the frontend
yarn start
```

Frontend will run on **http://localhost:3000**

### 4. Open the app

Go to **http://localhost:3000** in your browser.

- Default admin login: `admin@clickflow.com` / `admin123`
- Register new users via the "Need an account? Register here" link

---

## API Endpoints

### Auth
| Method | Endpoint              | Description        |
| ------ | --------------------- | ------------------ |
| POST   | `/api/auth/register`  | Register new user  |
| POST   | `/api/auth/login`     | Login              |
| POST   | `/api/auth/logout`    | Logout             |
| GET    | `/api/auth/me`        | Get current user   |
| POST   | `/api/auth/refresh`   | Refresh token      |

### Projects
| Method | Endpoint                  | Description        |
| ------ | ------------------------- | ------------------ |
| GET    | `/api/projects`           | List all projects  |
| POST   | `/api/projects`           | Create project     |
| PUT    | `/api/projects/:id`       | Update project     |
| DELETE | `/api/projects/:id`       | Delete project     |

### Tasks
| Method | Endpoint                        | Description              |
| ------ | ------------------------------- | ------------------------ |
| GET    | `/api/tasks?project_id=X`       | List tasks (filterable)  |
| GET    | `/api/tasks/my`                 | My assigned tasks        |
| POST   | `/api/tasks?project_id=X`       | Create task              |
| PUT    | `/api/tasks/:id`                | Update task              |
| DELETE | `/api/tasks/:id`                | Delete task              |

### Bugs
| Method | Endpoint                             | Description            |
| ------ | ------------------------------------ | ---------------------- |
| GET    | `/api/bugs?project_id=X`             | List bugs (filterable) |
| GET    | `/api/bugs/all`                      | All bugs cross-project |
| POST   | `/api/bugs?project_id=X`             | Report bug             |
| PUT    | `/api/bugs/:id`                      | Update bug             |
| DELETE | `/api/bugs/:id`                      | Delete bug             |
| POST   | `/api/bugs/:id/attachments`          | Add attachment         |
| DELETE | `/api/bugs/:id/attachments/:att_id`  | Remove attachment      |

### Comments
| Method | Endpoint                              | Description    |
| ------ | ------------------------------------- | -------------- |
| GET    | `/api/comments?entity_id=X&entity_type=task` | Get comments |
| POST   | `/api/comments`                       | Add comment    |
| DELETE | `/api/comments/:id`                   | Delete comment |

### Notifications
| Method | Endpoint                          | Description        |
| ------ | --------------------------------- | ------------------ |
| GET    | `/api/notifications`              | List notifications |
| GET    | `/api/notifications/unread-count` | Unread count       |
| POST   | `/api/notifications/mark-read`    | Mark all read      |

### Members
| Method | Endpoint                      | Description      |
| ------ | ----------------------------- | ---------------- |
| GET    | `/api/members`                | List all members |
| PUT    | `/api/members/:id/role?role=X`| Change role      |

---

## MongoDB Collections

| Collection      | Purpose                          |
| --------------- | -------------------------------- |
| `users`         | User accounts & auth             |
| `login_attempts`| Brute force protection           |
| `projects`      | Project containers               |
| `tasks`         | Sprint board tasks               |
| `bugs`          | QA bug reports                   |
| `comments`      | Comments + activity log          |
| `notifications` | User notifications               |
| `counters`      | Auto-increment for task/bug keys |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable         | Description                    | Example                     |
| ---------------- | ------------------------------ | --------------------------- |
| `MONGO_URL`      | MongoDB connection string      | `mongodb://localhost:27017` |
| `DB_NAME`        | Database name                  | `clickflow_db`              |
| `JWT_SECRET`     | Secret key for JWT tokens      | `your-random-secret`        |
| `ADMIN_EMAIL`    | Default admin email            | `admin@clickflow.com`       |
| `ADMIN_PASSWORD` | Default admin password         | `admin123`                  |
| `FRONTEND_URL`   | Frontend URL for CORS          | `http://localhost:3000`     |

### Frontend (`frontend/.env`)

| Variable                  | Description          | Example                   |
| ------------------------- | -------------------- | ------------------------- |
| `REACT_APP_BACKEND_URL`   | Backend API base URL | `http://localhost:8001`   |

---

## User Roles

| Role    | Permissions                                      |
| ------- | ------------------------------------------------ |
| Admin   | Full access, manage members, change roles        |
| Member  | Create/edit tasks & bugs, comment                |
| Viewer  | Read-only access                                 |

---

## License

MIT
