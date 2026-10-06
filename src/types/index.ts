export type UserRole = 'ADMIN' | 'LEAD' | 'MEMBER';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl: string;
  status: 'ACTIVE' | 'AWAY' | 'OFFLINE';
  lastActiveAt?: string;
  createdAt: string;
}

export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
}

export interface ActivityLog {
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

export interface Task {
  id: string;
  code: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  reporterId: string;
  reporterName: string;
  assigneeId?: string;
  assigneeName?: string;
  assigneeAvatar?: string;
  dueDate?: string;
  estimatedHours: number;
  spentHours: number;
  tags: string[];
  subtasks: Subtask[];
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export type ViewMode = 'kanban' | 'list' | 'analytics';

export interface TaskFilter {
  search: string;
  status?: TaskStatus | 'ALL';
  priority?: TaskPriority | 'ALL';
  assigneeId?: string | 'ALL';
  tag?: string | 'ALL';
}

export interface AnalyticsData {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  backlogTasks: number;
  reviewTasks: number;
  todoTasks: number;
  overdueTasks: number;
  completionRate: number;
  totalEstimatedHours: number;
  totalSpentHours: number;
  priorityDistribution: Record<TaskPriority, number>;
  assigneeWorkloads: {
    userId: string;
    userName: string;
    avatarUrl: string;
    taskCount: number;
    completedCount: number;
    estimatedHours: number;
  }[];
  recentActivities: ActivityLog[];
}

export interface RealtimeEvent {
  type: 'task:created' | 'task:updated' | 'task:status_changed' | 'task:deleted' | 'subtask:toggled' | 'comment:added' | 'user:presence' | 'system:ping';
  payload: any;
  timestamp: string;
}
