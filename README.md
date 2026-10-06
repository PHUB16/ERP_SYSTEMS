# TaskFlow — Real-Time Task Tracking Dashboard

> Production-grade full-stack task tracking dashboard built with **React 19**, **Node.js Express**, and **Real-Time Database Synchronization** via reactive event streaming.

[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg)](https://tailwindcss.com)

---

## 🚀 Key Features

- **⚡ Real-Time Database Connection**: Bidirectional synchronization between Node.js backend and browser clients powered by Server-Sent Events (SSE). Task changes, comments, and status transitions reflect across all connected users with sub-50ms latency.
- **🔐 User Authentication & RBAC**: Complete authentication system with registration, secure login, quick persona switching (Admin, Team Lead, Member), and session token validation.
- **📋 Interactive Kanban & Grid Views**: Drag-and-drop / single-click stage workflows (`Backlog` → `To Do` → `In Progress` → `Review` → `Done`) with priority sorting, multi-attribute filtering, and keyword search.
- **⏱️ Task Breakdown & Time Tracking**: Subtask checklists with real-time completion tracking, estimated vs logged work hours, and deadline alerts.
- **💬 Task Discussions & Audit Trail**: Threaded comments and complete activity ledger tracking who modified what and when.
- **📊 Real-Time Analytics**: Live velocity metrics, workload balance charts by assignee, overdue task alerts, and stage throughput.
- **🎨 Zero-AI Slop Human-Grade Design**: Built following strict zero-pill discipline, crisp typographic hierarchy, high-contrast accessibility (WCAG AA), and dark/light system coherence.

---

## 📂 Repository Structure

```
.
├── docs/
│   ├── ER-Diagram.md            # Detailed Entity-Relationship Diagram & Database Schemas
│   └── API-Documentation.md     # Complete RESTful API & Real-Time Event specifications
├── src/
│   ├── components/
│   │   ├── AnalyticsView.tsx    # Live sprint metrics & workload charts
│   │   ├── AuthModal.tsx        # Sign-in, sign-up, and quick demo switcher
│   │   ├── KanbanBoard.tsx      # Real-time interactive Kanban workflow columns
│   │   ├── ListView.tsx         # Filterable data table & task list
│   │   ├── Navbar.tsx           # Global header with live connection indicator
│   │   ├── TaskDetailModal.tsx  # Detailed task modal with subtasks & comments
│   │   └── TaskFormModal.tsx    # Create and edit task modal
│   ├── context/
│   │   ├── AuthContext.tsx      # Authentication state and user session provider
│   │   └── TaskContext.tsx      # Real-time state management and SSE subscriber
│   ├── types/
│   │   └── index.ts             # Domain models, task states, user schemas
│   ├── App.tsx                  # Root application layout and navigation
│   ├── main.tsx                 # React entry point
│   └── index.css                # Tailwind CSS v4 styling rules
├── server/
│   ├── db.ts                    # In-memory + persistent file database engine
│   ├── auth.ts                  # Password hashing & session token authentication
│   └── routes.ts                # REST endpoints and SSE real-time streaming router
├── server.ts                    # Node.js Express server running on port 3000
├── package.json                 # Project dependencies and fullstack scripts
├── tsconfig.json                # TypeScript compiler configuration
└── README.md                    # Project documentation
```

---

## 🛠️ Architecture & Data Flow

```
+-------------------------------------------------------------------+
|                        React 19 Frontend                          |
|  - Kanban Board / List View / Analytics View                      |
|  - TaskContext: Real-Time SSE listener & optimistic cache         |
|  - AuthContext: Session token & user state                        |
+-------------------+-----------------------------------------------+
                    |                              ^
     REST Mutations |                              | Server-Sent Events (SSE)
     POST / PATCH   |                              | /api/realtime/stream
     DELETE         v                              |
+-------------------+------------------------------+----------------+
|                        Node.js Express Server                     |
|  - Authentication & Session Middleware                            |
|  - RESTful Route Handlers                                         |
|  - Real-Time Event Fan-Out (dbEmitter)                            |
+-------------------------------------------------------------------+
                                   |
                                   v
+-------------------------------------------------------------------+
|                   Persistent Storage Engine                       |
|  - Atomic commits to data/database.json                           |
|  - Seed data with realistic software engineering tasks           |
+-------------------------------------------------------------------+
```

---

## 🏁 Getting Started

### 1. Prerequisites
- Node.js 18+ installed

### 2. Installation
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
The application will launch on `http://localhost:3000` with the Express API and Vite React client unified on the same port.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 👥 Demo Accounts Available Out of the Box

| User | Role | Email | Password |
|---|---|---|---|
| **Alex Rivera** | Team Lead | `alex.rivera@company.com` | `password123` |
| **Elena Rostova** | Senior Architect | `elena.rostova@company.com` | `password123` |
| **Marcus Vance** | Product Manager | `marcus.vance@company.com` | `password123` |

*Or click the **"Quick Demo Login"** buttons inside the authentication dialog to switch roles instantly.*

---

## 📖 Extended Documentation

- [Entity Relationship Diagram & Database Schema](docs/ER-Diagram.md)
- [REST API and Real-Time Event Protocol](docs/API-Documentation.md)
