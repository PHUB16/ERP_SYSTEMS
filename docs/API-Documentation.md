# TaskFlow API Documentation

Comprehensive reference for the TaskFlow Task Tracking RESTful API and Real-Time Event Streaming Service.

---

## 1. Overview & Conventions

- **Base URL**: `/api` (or `http://localhost:3000/api` in standalone mode)
- **Data Format**: `application/json`
- **Authentication**: Bearer Token in `Authorization: Bearer <session_token>` header
- **Date Format**: ISO 8601 UTC timestamps (e.g., `2026-10-06T16:30:00.000Z`)

### Standard Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Task with ID TF-104 not found",
    "details": {}
  }
}
```

---

## 2. Authentication Endpoints

### 2.1 Register User
**`POST /api/auth/register`**  
Create a new team member account.

**Request Body:**
```json
{
  "email": "sarah.chen@company.com",
  "password": "SecurePassword123!",
  "fullName": "Sarah Chen",
  "role": "MEMBER" // Optional: "ADMIN" | "LEAD" | "MEMBER" (defaults to "MEMBER")
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "token": "sess_8a7df192c0a94e1e",
    "user": {
      "id": "usr_9901",
      "email": "sarah.chen@company.com",
      "fullName": "Sarah Chen",
      "role": "MEMBER",
      "avatarUrl": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      "status": "ACTIVE"
    }
  }
}
```

### 2.2 Login User
**`POST /api/auth/login`**  
Authenticate an existing user.

**Request Body:**
```json
{
  "email": "alex.rivera@company.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "sess_4f8b2c1a0e",
    "user": {
      "id": "usr_01",
      "email": "alex.rivera@company.com",
      "fullName": "Alex Rivera",
      "role": "LEAD",
      "avatarUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      "status": "ACTIVE"
    }
  }
}
```

### 2.3 Quick Demo Login
**`POST /api/auth/demo`**  
Instant switch to pre-configured personas without entering passwords.

**Request Body:**
```json
{
  "role": "LEAD" // "ADMIN" | "LEAD" | "MEMBER"
}
```

### 2.4 Current User Profile
**`GET /api/auth/me`**  
Headers: `Authorization: Bearer <token>`

---

## 3. Tasks Management API

### 3.1 List Tasks
**`GET /api/tasks`**  
Optional Query Parameters:
- `status`: Filter by status (`BACKLOG`, `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`)
- `priority`: Filter by priority (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
- `assigneeId`: Filter by assigned user ID
- `search`: Keyword query on title, code, and description
- `tag`: Filter by tag name

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "tsk_01",
      "code": "TF-101",
      "title": "Architect real-time sync service with fallback polling",
      "description": "Implement SSE broadcast server and client event listener.",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "reporterId": "usr_01",
      "assigneeId": "usr_02",
      "dueDate": "2026-10-14",
      "estimatedHours": 16,
      "spentHours": 8.5,
      "subtasks": [
        { "id": "sub_1", "title": "Define SSE packet schema", "isCompleted": true },
        { "id": "sub_2", "title": "Handle reconnection with backoff", "isCompleted": false }
      ],
      "tags": ["Architecture", "Backend", "Realtime"],
      "commentsCount": 4,
      "createdAt": "2026-10-01T10:00:00.000Z",
      "updatedAt": "2026-10-06T09:15:00.000Z"
    }
  ]
}
```

### 3.2 Create Task
**`POST /api/tasks`**  
Headers: `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Integrate zero-pill design token system",
  "description": "Remove rounded pills and implement crisp typography separators.",
  "status": "TODO",
  "priority": "MEDIUM",
  "assigneeId": "usr_03",
  "dueDate": "2026-10-18",
  "estimatedHours": 6,
  "tags": ["Design System", "Frontend"]
}
```

### 3.3 Update Task / Status Transition
**`PATCH /api/tasks/:id`**  
Update specific fields or transition status (e.g. Kanban column move).

**Request Body:**
```json
{
  "status": "DONE",
  "priority": "CRITICAL"
}
```

### 3.4 Delete Task
**`DELETE /api/tasks/:id`**  
Remove task from tracking board.

---

## 4. Subtasks, Comments & Time Logs

### 4.1 Add Subtask
**`POST /api/tasks/:id/subtasks`**
```json
{
  "title": "Write unit tests for state machine"
}
```

### 4.2 Toggle Subtask
**`PATCH /api/tasks/:id/subtasks/:subtaskId`**
```json
{
  "isCompleted": true
}
```

### 4.3 Add Comment
**`POST /api/tasks/:id/comments`**
```json
{
  "content": "All API endpoints verified with 200ms latency threshold."
}
```

---

## 5. Real-Time Streaming (Server-Sent Events)

### 5.1 Connection Endpoint
**`GET /api/realtime/stream`**  
Headers:
- `Accept: text/event-stream`
- `Cache-Control: no-cache`
- `Connection: keep-alive`
Query: `?token=<session_token>`

### 5.2 Real-Time Event Types

| Event Name | Trigger | Payload |
|---|---|---|
| `task:created` | New task added | Full task object |
| `task:updated` | Title, priority, due date changed | Delta & updated task |
| `task:status_changed` | Dragged to new Kanban column | `{ id, oldStatus, newStatus }` |
| `task:deleted` | Task removed | `{ id }` |
| `subtask:toggled` | Checklist item updated | `{ taskId, subtask }` |
| `comment:added` | User posted a discussion reply | Full comment record |
| `user:presence` | Team member presence ping | `{ userId, status, timestamp }` |
| `system:ping` | 15s keep-alive heartbeat | `{ timestamp }` |

**Example SSE Packet:**
```http
event: task:status_changed
data: {"id":"tsk_01","oldStatus":"IN_PROGRESS","newStatus":"DONE","actor":"Alex Rivera","timestamp":"2026-10-06T09:28:00.000Z"}

```

---

## 6. Analytics & Metrics API

### 6.1 Get Team Dashboard Analytics
**`GET /api/analytics`**  
Returns:
- **Velocity**: Tasks completed vs created per sprint window
- **Status Distribution**: Backlog, In Progress, Review, Done counts
- **Priority Matrix**: Distribution of Critical, High, Medium, Low tasks
- **Workload per Assignee**: Open tasks count & hours allocated
- **Overdue Items**: High-risk tasks past deadline
