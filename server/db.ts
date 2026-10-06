import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const dbEmitter = new EventEmitter();

export interface DbUser {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: 'ADMIN' | 'LEAD' | 'MEMBER';
  avatarUrl: string;
  status: 'ACTIVE' | 'AWAY' | 'OFFLINE';
  lastActiveAt?: string;
  createdAt: string;
}

export interface DbSession {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface DbSubtask {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface DbComment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
}

export interface DbActivityLog {
  id: string;
  taskId: string;
  actorId: string;
  actorName: string;
  action: 'CREATED' | 'STATUS_CHANGED' | 'ASSIGNED' | 'PRIORITY_CHANGED' | 'COMMENT_ADDED' | 'SUBTASK_TOGGLED';
  metadata: {
    previousValue?: string;
    newValue?: string;
    field?: string;
    details?: string;
  };
  timestamp: string;
}

export interface DbTask {
  id: string;
  code: string;
  title: string;
  description: string;
  status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reporterId: string;
  reporterName: string;
  assigneeId?: string;
  assigneeName?: string;
  assigneeAvatar?: string;
  dueDate?: string;
  estimatedHours: number;
  spentHours: number;
  tags: string[];
  subtasks: DbSubtask[];
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

interface DatabaseSchema {
  users: DbUser[];
  sessions: DbSession[];
  tasks: DbTask[];
  comments: DbComment[];
  activities: DbActivityLog[];
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

// Helper to hash passwords consistently
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_taskflow_salt_99').digest('hex');
}

// Initial default seed
function getSeedData(): DatabaseSchema {
  const defaultPassword = hashPassword('password123');

  const users: DbUser[] = [
    {
      id: 'usr_01',
      email: 'alex.rivera@company.com',
      passwordHash: defaultPassword,
      fullName: 'Alex Rivera',
      role: 'LEAD',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      status: 'ACTIVE',
      lastActiveAt: new Date().toISOString(),
      createdAt: '2026-09-01T08:00:00.000Z',
    },
    {
      id: 'usr_02',
      email: 'elena.rostova@company.com',
      passwordHash: defaultPassword,
      fullName: 'Elena Rostova',
      role: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
      status: 'ACTIVE',
      lastActiveAt: new Date().toISOString(),
      createdAt: '2026-09-02T08:00:00.000Z',
    },
    {
      id: 'usr_03',
      email: 'marcus.vance@company.com',
      passwordHash: defaultPassword,
      fullName: 'Marcus Vance',
      role: 'MEMBER',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      status: 'AWAY',
      lastActiveAt: new Date().toISOString(),
      createdAt: '2026-09-05T08:00:00.000Z',
    },
    {
      id: 'usr_04',
      email: 'maya.patel@company.com',
      passwordHash: defaultPassword,
      fullName: 'Maya Patel',
      role: 'MEMBER',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      status: 'ACTIVE',
      lastActiveAt: new Date().toISOString(),
      createdAt: '2026-09-10T08:00:00.000Z',
    },
  ];

  const tasks: DbTask[] = [
    {
      id: 'tsk_01',
      code: 'TF-101',
      title: 'Architect real-time sync service with SSE stream fan-out',
      description: 'Implement an event-driven Server-Sent Events broadcast layer that pushes mutations to active browser clients without polling.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      reporterId: 'usr_01',
      reporterName: 'Alex Rivera',
      assigneeId: 'usr_02',
      assigneeName: 'Elena Rostova',
      assigneeAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
      dueDate: '2026-10-12',
      estimatedHours: 14,
      spentHours: 8,
      tags: ['Architecture', 'Realtime', 'Backend'],
      subtasks: [
        { id: 'sub_01', taskId: 'tsk_01', title: 'Define SSE packet format and keep-alive heartbeat', isCompleted: true, completedAt: '2026-10-04T11:00:00.000Z', createdAt: '2026-10-02T10:00:00.000Z' },
        { id: 'sub_02', taskId: 'tsk_01', title: 'Implement client exponential backoff reconnect logic', isCompleted: true, completedAt: '2026-10-05T14:30:00.000Z', createdAt: '2026-10-02T10:00:00.000Z' },
        { id: 'sub_03', taskId: 'tsk_01', title: 'Stress test multi-tab broadcast synchronization', isCompleted: false, createdAt: '2026-10-02T10:00:00.000Z' },
      ],
      commentsCount: 2,
      createdAt: '2026-10-02T09:30:00.000Z',
      updatedAt: '2026-10-06T08:15:00.000Z',
    },
    {
      id: 'tsk_02',
      code: 'TF-102',
      title: 'Integrate zero-pill design token system across Kanban view',
      description: 'Refactor task metadata to use typographic separators (middot, slashes) and replace generic badges with high-contrast, accessible text layouts.',
      status: 'TODO',
      priority: 'MEDIUM',
      reporterId: 'usr_01',
      reporterName: 'Alex Rivera',
      assigneeId: 'usr_04',
      assigneeName: 'Maya Patel',
      assigneeAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      dueDate: '2026-10-15',
      estimatedHours: 8,
      spentHours: 2,
      tags: ['Design System', 'Frontend', 'UI/UX'],
      subtasks: [
        { id: 'sub_04', taskId: 'tsk_02', title: 'Audit all pill containers in board cards', isCompleted: true, completedAt: '2026-10-05T09:00:00.000Z', createdAt: '2026-10-03T09:00:00.000Z' },
        { id: 'sub_05', taskId: 'tsk_02', title: 'Implement text separator standards', isCompleted: false, createdAt: '2026-10-03T09:00:00.000Z' },
      ],
      commentsCount: 1,
      createdAt: '2026-10-03T09:00:00.000Z',
      updatedAt: '2026-10-05T09:00:00.000Z',
    },
    {
      id: 'tsk_03',
      code: 'TF-103',
      title: 'Harden JWT session verification & role authorization matrix',
      description: 'Ensure token expiration enforcement, sanitize authorization headers, and grant administrative access controls for task deletion.',
      status: 'REVIEW',
      priority: 'CRITICAL',
      reporterId: 'usr_02',
      reporterName: 'Elena Rostova',
      assigneeId: 'usr_01',
      assigneeName: 'Alex Rivera',
      assigneeAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      dueDate: '2026-10-08',
      estimatedHours: 10,
      spentHours: 9.5,
      tags: ['Security', 'Auth', 'Compliance'],
      subtasks: [
        { id: 'sub_06', taskId: 'tsk_03', title: 'Create session verification middleware', isCompleted: true, completedAt: '2026-10-04T16:00:00.000Z', createdAt: '2026-10-03T11:00:00.000Z' },
        { id: 'sub_07', taskId: 'tsk_03', title: 'Add RBAC role verification guards for deletion', isCompleted: true, completedAt: '2026-10-05T17:00:00.000Z', createdAt: '2026-10-03T11:00:00.000Z' },
      ],
      commentsCount: 3,
      createdAt: '2026-10-03T11:00:00.000Z',
      updatedAt: '2026-10-06T07:20:00.000Z',
    },
    {
      id: 'tsk_04',
      code: 'TF-104',
      title: 'Automated velocity & throughput metric computation engine',
      description: 'Calculate real-time sprint completion rates, average turnaround time, overdue alerts, and workload distribution per team member.',
      status: 'DONE',
      priority: 'MEDIUM',
      reporterId: 'usr_03',
      reporterName: 'Marcus Vance',
      assigneeId: 'usr_03',
      assigneeName: 'Marcus Vance',
      assigneeAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      dueDate: '2026-10-05',
      estimatedHours: 12,
      spentHours: 11,
      tags: ['Analytics', 'Metrics', 'Reporting'],
      subtasks: [
        { id: 'sub_08', taskId: 'tsk_04', title: 'Aggregate task distributions by status', isCompleted: true, completedAt: '2026-10-04T12:00:00.000Z', createdAt: '2026-10-01T10:00:00.000Z' },
        { id: 'sub_09', taskId: 'tsk_04', title: 'Compute member capacity and hours logged', isCompleted: true, completedAt: '2026-10-05T11:00:00.000Z', createdAt: '2026-10-01T10:00:00.000Z' },
      ],
      commentsCount: 1,
      createdAt: '2026-10-01T10:00:00.000Z',
      updatedAt: '2026-10-05T12:00:00.000Z',
    },
    {
      id: 'tsk_05',
      code: 'TF-105',
      title: 'Configure automated database snapshot and atomic disk sync',
      description: 'Implement synchronous JSON commit locking with directory creation guarantees to prevent data loss on container restart.',
      status: 'DONE',
      priority: 'HIGH',
      reporterId: 'usr_02',
      reporterName: 'Elena Rostova',
      assigneeId: 'usr_02',
      assigneeName: 'Elena Rostova',
      assigneeAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
      dueDate: '2026-10-04',
      estimatedHours: 6,
      spentHours: 5.5,
      tags: ['Database', 'Persistence', 'DevOps'],
      subtasks: [
        { id: 'sub_10', taskId: 'tsk_05', title: 'Write safe atomic write file helper', isCompleted: true, completedAt: '2026-10-04T15:00:00.000Z', createdAt: '2026-10-02T14:00:00.000Z' },
      ],
      commentsCount: 0,
      createdAt: '2026-10-02T14:00:00.000Z',
      updatedAt: '2026-10-04T15:00:00.000Z',
    },
    {
      id: 'tsk_06',
      code: 'TF-106',
      title: 'Mobile touch gesture support for Kanban column reorganization',
      description: 'Optimize drag-and-drop or column selection drop-down on touch screens with minimum 44px hit targets and smooth motion feedback.',
      status: 'BACKLOG',
      priority: 'LOW',
      reporterId: 'usr_03',
      reporterName: 'Marcus Vance',
      assigneeId: 'usr_04',
      assigneeName: 'Maya Patel',
      assigneeAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      dueDate: '2026-10-24',
      estimatedHours: 16,
      spentHours: 0,
      tags: ['Mobile', 'Accessibility', 'Frontend'],
      subtasks: [],
      commentsCount: 0,
      createdAt: '2026-10-04T10:00:00.000Z',
      updatedAt: '2026-10-04T10:00:00.000Z',
    },
  ];

  const comments: DbComment[] = [
    {
      id: 'com_01',
      taskId: 'tsk_01',
      authorId: 'usr_01',
      authorName: 'Alex Rivera',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      content: 'Server-Sent Events endpoint is deployed at `/api/realtime/stream`. Reconnection heartbeat tested at 15s interval.',
      createdAt: '2026-10-04T14:20:00.000Z',
    },
    {
      id: 'com_02',
      taskId: 'tsk_01',
      authorId: 'usr_02',
      authorName: 'Elena Rostova',
      authorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
      content: 'Verified fan-out with 10 concurrent browser sessions; avg broadcast propagation latency is under 35ms.',
      createdAt: '2026-10-05T09:45:00.000Z',
    },
    {
      id: 'com_03',
      taskId: 'tsk_03',
      authorId: 'usr_01',
      authorName: 'Alex Rivera',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      content: 'Role verification middleware now restricts `DELETE /api/tasks/:id` to ADMIN and LEAD roles.',
      createdAt: '2026-10-05T18:10:00.000Z',
    },
  ];

  const activities: DbActivityLog[] = [
    {
      id: 'act_01',
      taskId: 'tsk_01',
      actorId: 'usr_01',
      actorName: 'Alex Rivera',
      action: 'STATUS_CHANGED',
      metadata: { previousValue: 'TODO', newValue: 'IN_PROGRESS', field: 'status' },
      timestamp: '2026-10-04T09:00:00.000Z',
    },
    {
      id: 'act_02',
      taskId: 'tsk_03',
      actorId: 'usr_02',
      actorName: 'Elena Rostova',
      action: 'STATUS_CHANGED',
      metadata: { previousValue: 'IN_PROGRESS', newValue: 'REVIEW', field: 'status' },
      timestamp: '2026-10-05T17:15:00.000Z',
    },
    {
      id: 'act_03',
      taskId: 'tsk_04',
      actorId: 'usr_03',
      actorName: 'Marcus Vance',
      action: 'STATUS_CHANGED',
      metadata: { previousValue: 'REVIEW', newValue: 'DONE', field: 'status' },
      timestamp: '2026-10-05T12:00:00.000Z',
    },
  ];

  return {
    users,
    sessions: [],
    tasks,
    comments,
    activities,
  };
}

class Database {
  private data: DatabaseSchema;
  private taskCounter: number = 107;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[DB] Failed to read database.json, initializing fresh seed', e);
    }

    const initial = getSeedData();
    this.saveData(initial);
    return initial;
  }

  private saveData(dataToSave: DatabaseSchema = this.data): void {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (e) {
      console.error('[DB] Failed to save database.json', e);
    }
  }

  // --- Users & Sessions ---
  public getUsers(): DbUser[] {
    return this.data.users.map(({ passwordHash, ...rest }) => ({
      ...rest,
      passwordHash: '',
    }));
  }

  public getUserById(id: string): DbUser | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): DbUser | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(userData: { email: string; passwordHash: string; fullName: string; role?: 'ADMIN' | 'LEAD' | 'MEMBER' }): DbUser {
    const newUser: DbUser = {
      id: `usr_${crypto.randomUUID().slice(0, 8)}`,
      email: userData.email,
      passwordHash: userData.passwordHash,
      fullName: userData.fullName,
      role: userData.role || 'MEMBER',
      avatarUrl: `https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1534528741775-53994a69daeb' : '1507003211169-0a1dd7228f2d'}?w=150`,
      status: 'ACTIVE',
      lastActiveAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.saveData();
    return newUser;
  }

  public createSession(userId: string): DbSession {
    const session: DbSession = {
      token: `sess_${crypto.randomBytes(24).toString('hex')}`,
      userId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    this.data.sessions.push(session);
    this.saveData();
    return session;
  }

  public getSession(token: string): DbSession | undefined {
    const session = this.data.sessions.find((s) => s.token === token);
    if (!session) return undefined;
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      this.deleteSession(token);
      return undefined;
    }
    return session;
  }

  public deleteSession(token: string): void {
    this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
    this.saveData();
  }

  // --- Tasks ---
  public getTasks(filters?: { status?: string; priority?: string; assigneeId?: string; search?: string; tag?: string }): DbTask[] {
    let result = [...this.data.tasks];

    if (filters) {
      if (filters.status && filters.status !== 'ALL') {
        result = result.filter((t) => t.status === filters.status);
      }
      if (filters.priority && filters.priority !== 'ALL') {
        result = result.filter((t) => t.priority === filters.priority);
      }
      if (filters.assigneeId && filters.assigneeId !== 'ALL') {
        result = result.filter((t) => t.assigneeId === filters.assigneeId);
      }
      if (filters.tag && filters.tag !== 'ALL') {
        result = result.filter((t) => t.tags.includes(filters.tag!));
      }
      if (filters.search && filters.search.trim() !== '') {
        const query = filters.search.toLowerCase();
        result = result.filter(
          (t) =>
            t.title.toLowerCase().includes(query) ||
            t.code.toLowerCase().includes(query) ||
            t.description.toLowerCase().includes(query) ||
            t.tags.some((tag) => tag.toLowerCase().includes(query))
        );
      }
    }

    return result;
  }

  public getTaskById(id: string): DbTask | undefined {
    return this.data.tasks.find((t) => t.id === id);
  }

  public createTask(taskInput: {
    title: string;
    description?: string;
    status?: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    assigneeId?: string;
    dueDate?: string;
    estimatedHours?: number;
    tags?: string[];
    reporter: DbUser;
  }): DbTask {
    const taskId = `tsk_${crypto.randomUUID().slice(0, 8)}`;
    const taskCode = `TF-${this.taskCounter++}`;

    let assignee: DbUser | undefined;
    if (taskInput.assigneeId) {
      assignee = this.getUserById(taskInput.assigneeId);
    }

    const newTask: DbTask = {
      id: taskId,
      code: taskCode,
      title: taskInput.title,
      description: taskInput.description || '',
      status: taskInput.status || 'TODO',
      priority: taskInput.priority || 'MEDIUM',
      reporterId: taskInput.reporter.id,
      reporterName: taskInput.reporter.fullName,
      assigneeId: assignee?.id,
      assigneeName: assignee?.fullName,
      assigneeAvatar: assignee?.avatarUrl,
      dueDate: taskInput.dueDate,
      estimatedHours: taskInput.estimatedHours || 0,
      spentHours: 0,
      tags: taskInput.tags || [],
      subtasks: [],
      commentsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.tasks.unshift(newTask);

    // Record activity
    const activity: DbActivityLog = {
      id: `act_${crypto.randomUUID().slice(0, 8)}`,
      taskId,
      actorId: taskInput.reporter.id,
      actorName: taskInput.reporter.fullName,
      action: 'CREATED',
      metadata: { details: `Task ${taskCode} created` },
      timestamp: new Date().toISOString(),
    };
    this.data.activities.unshift(activity);

    this.saveData();

    // Broadcast real-time event
    dbEmitter.emit('mutation', {
      type: 'task:created',
      payload: newTask,
      timestamp: new Date().toISOString(),
    });

    return newTask;
  }

  public updateTask(
    id: string,
    updates: Partial<DbTask>,
    actor?: DbUser
  ): DbTask | undefined {
    const taskIndex = this.data.tasks.findIndex((t) => t.id === id);
    if (taskIndex === -1) return undefined;

    const currentTask = this.data.tasks[taskIndex];
    let assigneeUpdates = {};

    if (updates.assigneeId !== undefined) {
      if (updates.assigneeId) {
        const assignee = this.getUserById(updates.assigneeId);
        assigneeUpdates = {
          assigneeId: assignee?.id,
          assigneeName: assignee?.fullName,
          assigneeAvatar: assignee?.avatarUrl,
        };
      } else {
        assigneeUpdates = {
          assigneeId: undefined,
          assigneeName: undefined,
          assigneeAvatar: undefined,
        };
      }
    }

    const previousStatus = currentTask.status;
    const updatedTask: DbTask = {
      ...currentTask,
      ...updates,
      ...assigneeUpdates,
      updatedAt: new Date().toISOString(),
    };

    this.data.tasks[taskIndex] = updatedTask;

    // Track activity if status changed or assignee changed
    if (actor) {
      if (updates.status && updates.status !== previousStatus) {
        const activity: DbActivityLog = {
          id: `act_${crypto.randomUUID().slice(0, 8)}`,
          taskId: id,
          actorId: actor.id,
          actorName: actor.fullName,
          action: 'STATUS_CHANGED',
          metadata: {
            previousValue: previousStatus,
            newValue: updates.status,
            field: 'status',
          },
          timestamp: new Date().toISOString(),
        };
        this.data.activities.unshift(activity);
      }
    }

    this.saveData();

    // Broadcast
    const isStatusOnly = updates.status && Object.keys(updates).length === 1;
    dbEmitter.emit('mutation', {
      type: isStatusOnly ? 'task:status_changed' : 'task:updated',
      payload: updatedTask,
      timestamp: new Date().toISOString(),
    });

    return updatedTask;
  }

  public deleteTask(id: string): boolean {
    const exists = this.data.tasks.some((t) => t.id === id);
    if (!exists) return false;

    this.data.tasks = this.data.tasks.filter((t) => t.id !== id);
    this.data.comments = this.data.comments.filter((c) => c.taskId !== id);
    this.data.activities = this.data.activities.filter((a) => a.taskId !== id);
    this.saveData();

    dbEmitter.emit('mutation', {
      type: 'task:deleted',
      payload: { id },
      timestamp: new Date().toISOString(),
    });

    return true;
  }

  // --- Subtasks ---
  public addSubtask(taskId: string, title: string, actor?: DbUser): DbSubtask | undefined {
    const task = this.getTaskById(taskId);
    if (!task) return undefined;

    const subtask: DbSubtask = {
      id: `sub_${crypto.randomUUID().slice(0, 8)}`,
      taskId,
      title,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    task.subtasks.push(subtask);
    task.updatedAt = new Date().toISOString();

    if (actor) {
      this.data.activities.unshift({
        id: `act_${crypto.randomUUID().slice(0, 8)}`,
        taskId,
        actorId: actor.id,
        actorName: actor.fullName,
        action: 'SUBTASK_TOGGLED',
        metadata: { details: `Subtask added: "${title}"` },
        timestamp: new Date().toISOString(),
      });
    }

    this.saveData();

    dbEmitter.emit('mutation', {
      type: 'task:updated',
      payload: task,
      timestamp: new Date().toISOString(),
    });

    return subtask;
  }

  public toggleSubtask(taskId: string, subtaskId: string, actor?: DbUser): DbSubtask | undefined {
    const task = this.getTaskById(taskId);
    if (!task) return undefined;

    const subtask = task.subtasks.find((s) => s.id === subtaskId);
    if (!subtask) return undefined;

    subtask.isCompleted = !subtask.isCompleted;
    subtask.completedAt = subtask.isCompleted ? new Date().toISOString() : undefined;
    task.updatedAt = new Date().toISOString();

    if (actor) {
      this.data.activities.unshift({
        id: `act_${crypto.randomUUID().slice(0, 8)}`,
        taskId,
        actorId: actor.id,
        actorName: actor.fullName,
        action: 'SUBTASK_TOGGLED',
        metadata: {
          details: `Subtask "${subtask.title}" marked as ${subtask.isCompleted ? 'completed' : 'incomplete'}`,
        },
        timestamp: new Date().toISOString(),
      });
    }

    this.saveData();

    dbEmitter.emit('mutation', {
      type: 'task:updated',
      payload: task,
      timestamp: new Date().toISOString(),
    });

    return subtask;
  }

  public deleteSubtask(taskId: string, subtaskId: string): boolean {
    const task = this.getTaskById(taskId);
    if (!task) return false;

    task.subtasks = task.subtasks.filter((s) => s.id !== subtaskId);
    task.updatedAt = new Date().toISOString();
    this.saveData();

    dbEmitter.emit('mutation', {
      type: 'task:updated',
      payload: task,
      timestamp: new Date().toISOString(),
    });

    return true;
  }

  // --- Comments ---
  public getComments(taskId: string): DbComment[] {
    return this.data.comments
      .filter((c) => c.taskId === taskId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public addComment(taskId: string, content: string, author: DbUser): DbComment | undefined {
    const task = this.getTaskById(taskId);
    if (!task) return undefined;

    const comment: DbComment = {
      id: `com_${crypto.randomUUID().slice(0, 8)}`,
      taskId,
      authorId: author.id,
      authorName: author.fullName,
      authorAvatar: author.avatarUrl,
      content,
      createdAt: new Date().toISOString(),
    };

    this.data.comments.push(comment);
    task.commentsCount = (task.commentsCount || 0) + 1;
    task.updatedAt = new Date().toISOString();

    this.data.activities.unshift({
      id: `act_${crypto.randomUUID().slice(0, 8)}`,
      taskId,
      actorId: author.id,
      actorName: author.fullName,
      action: 'COMMENT_ADDED',
      metadata: { details: `Comment added by ${author.fullName}` },
      timestamp: new Date().toISOString(),
    });

    this.saveData();

    dbEmitter.emit('mutation', {
      type: 'comment:added',
      payload: { taskId, comment, task },
      timestamp: new Date().toISOString(),
    });

    return comment;
  }

  // --- Activity Logs ---
  public getActivities(taskId?: string): DbActivityLog[] {
    if (taskId) {
      return this.data.activities.filter((a) => a.taskId === taskId);
    }
    return this.data.activities.slice(0, 20);
  }

  // --- Analytics ---
  public getAnalytics() {
    const tasks = this.data.tasks;
    const now = new Date();

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const reviewTasks = tasks.filter((t) => t.status === 'REVIEW').length;
    const todoTasks = tasks.filter((t) => t.status === 'TODO').length;
    const backlogTasks = tasks.filter((t) => t.status === 'BACKLOG').length;

    const overdueTasks = tasks.filter((t) => {
      if (t.status === 'DONE' || !t.dueDate) return false;
      return new Date(t.dueDate).getTime() < now.getTime();
    }).length;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const totalEstimatedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const totalSpentHours = tasks.reduce((sum, t) => sum + (t.spentHours || 0), 0);

    const priorityDistribution = {
      CRITICAL: tasks.filter((t) => t.priority === 'CRITICAL').length,
      HIGH: tasks.filter((t) => t.priority === 'HIGH').length,
      MEDIUM: tasks.filter((t) => t.priority === 'MEDIUM').length,
      LOW: tasks.filter((t) => t.priority === 'LOW').length,
    };

    const assigneeWorkloads = this.data.users.map((u) => {
      const userTasks = tasks.filter((t) => t.assigneeId === u.id);
      return {
        userId: u.id,
        userName: u.fullName,
        avatarUrl: u.avatarUrl,
        taskCount: userTasks.length,
        completedCount: userTasks.filter((t) => t.status === 'DONE').length,
        estimatedHours: userTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0),
      };
    });

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      reviewTasks,
      todoTasks,
      backlogTasks,
      overdueTasks,
      completionRate,
      totalEstimatedHours,
      totalSpentHours,
      priorityDistribution,
      assigneeWorkloads,
      recentActivities: this.data.activities.slice(0, 15),
    };
  }
}

export const db = new Database();
