# ClickFlow - Project Management + QA Bug Tracker

A Linear-style desktop web application for multi-project task management with integrated QA bug tracking. **MERN Stack** (MongoDB, Express, React, Node.js).

## Tech Stack

| Layer    | Technology                                           |
| -------- | ---------------------------------------------------- |
| Frontend | React 19, Tailwind CSS, Shadcn/UI, Lucide Icons     |
| Backend  | Node.js, Express.js, Mongoose ODM                   |
| Database | MongoDB                                              |
| Auth     | JWT (httpOnly cookies) + bcryptjs                    |

## Features

- Sprint Board (Kanban: Backlog / In Progress / Completed)
- QA Bug Tracking (Open → In Progress → Ready for QA → Verified → Closed)
- Cross-Project Views (My Tasks, All Bugs)
- Right Slide-in Detail Panel with inline editing
- Activity Log & Comments
- Light/Dark Theme with localStorage persistence
- Real-time Search across tasks & bugs
- Notifications, Bug Attachments, Role-based access

## Project Structure

```
backend/                      # Express.js API
├── server.js                 # Main app entrypoint
├── package.json              # Node.js dependencies
├── config/
│   └── db.js                 # Mongoose connection
├── middleware/
│   └── auth.js               # JWT auth middleware
├── models/                   # Mongoose schemas
│   ├── User.js
│   ├── Project.js
│   ├── Task.js
│   ├── Bug.js
│   ├── Comment.js
│   ├── Notification.js
│   ├── Counter.js
│   └── LoginAttempt.js
├── routes/                   # Express routers
│   ├── auth.js
│   ├── projects.js
│   ├── tasks.js
│   ├── bugs.js
│   ├── comments.js
│   ├── notifications.js
│   └── members.js
└── .env

frontend/                     # React app
├── src/
│   ├── App.js
│   ├── context/AuthContext.js, ThemeContext.js
│   ├── lib/api.js
│   ├── pages/
│   └── components/
├── package.json
└── .env
```

## Local Setup

### Prerequisites
- Node.js >= 18
- MongoDB running on localhost:27017
- Yarn (for frontend)

### Backend
```bash
cd backend
npm install           # or: yarn install
cp .env.example .env  # Edit if needed
npm start             # or: node server.js
```

### Frontend
```bash
cd frontend
yarn install
cp .env.example .env
yarn start
```

### Environment Variables

**Backend (.env)**
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="clickflow_db"
JWT_SECRET="your-random-secret-key"
ADMIN_EMAIL="admin@clickflow.com"
ADMIN_PASSWORD="admin123"
FRONTEND_URL="http://localhost:3000"
```

**Frontend (.env)**
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user |
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| GET | `/api/tasks?project_id=X` | List tasks |
| GET | `/api/tasks/my` | My tasks |
| POST | `/api/tasks?project_id=X` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| GET | `/api/bugs?project_id=X` | List bugs |
| GET | `/api/bugs/all` | All bugs |
| POST | `/api/bugs?project_id=X` | Report bug |
| PUT | `/api/bugs/:id` | Update bug |
| POST | `/api/bugs/:id/attachments` | Add attachment |
| GET | `/api/comments?entity_id=X` | Get comments |
| POST | `/api/comments` | Add comment |
| GET | `/api/notifications` | Notifications |
| GET | `/api/members` | Team members |

## Mongoose Models

| Model | Collection | Fields |
|-------|-----------|--------|
| User | users | email, password_hash, name, role, avatar_url |
| Project | projects | id, name, key, color, members, created_by |
| Task | tasks | id, project_id, key, title, status, priority, assignee_id, due_date |
| Bug | bugs | id, project_id, key, title, status, priority, assignee_id, attachments |
| Comment | comments | id, entity_id, entity_type, user_id, content, type |
| Notification | notifications | id, user_id, type, message, read |
| Counter | counters | project_id, seq (auto-increment for keys) |
| LoginAttempt | loginattempts | identifier, count, locked_until |

## License

MIT
