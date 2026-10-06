import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Task, TaskFilter, TaskStatus, TaskPriority, ViewMode, AnalyticsData } from '../types/index.js';
import { useAuth } from './AuthContext.js';

interface TaskContextType {
  tasks: Task[];
  isLoading: boolean;
  filter: TaskFilter;
  setFilter: React.Dispatch<React.SetStateAction<TaskFilter>>;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  isTaskFormOpen: boolean;
  setIsTaskFormOpen: (open: boolean) => void;
  editingTask: Task | null;
  setEditingTask: (task: Task | null) => void;
  realtimeStatus: 'connected' | 'connecting' | 'disconnected';
  lastEventTime: string | null;
  liveEventsCount: number;
  recentRealtimeNotifications: { id: string; message: string; timestamp: string }[];
  createTask: (data: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string;
    dueDate?: string;
    estimatedHours?: number;
    tags?: string[];
  }) => Promise<{ success: boolean; data?: Task; error?: string }>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<{ success: boolean; data?: Task; error?: string }>;
  moveTaskStatus: (id: string, newStatus: TaskStatus) => Promise<void>;
  deleteTask: (id: string) => Promise<{ success: boolean; error?: string }>;
  addSubtask: (taskId: string, title: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  addComment: (taskId: string, content: string) => Promise<void>;
  logTime: (taskId: string, hours: number) => Promise<void>;
  analyticsData: AnalyticsData | null;
  refreshTasks: () => Promise<void>;
  reconnectStream: () => void;
}

const initialFilter: TaskFilter = {
  search: '',
  status: 'ALL',
  priority: 'ALL',
  assigneeId: 'ALL',
  tag: 'ALL',
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<TaskFilter>(initialFilter);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  // Real-time state
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [lastEventTime, setLastEventTime] = useState<string | null>(null);
  const [liveEventsCount, setLiveEventsCount] = useState<number>(0);
  const [recentRealtimeNotifications, setRecentRealtimeNotifications] = useState<{ id: string; message: string; timestamp: string }[]>([]);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  // Fetch initial tasks
  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks');
      const json = await res.json();
      if (json.success) {
        setTasks(json.data);
      }
    } catch (err) {
      console.warn('Failed to fetch tasks', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch analytics metrics
  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics');
      const json = await res.json();
      if (json.success) {
        setAnalyticsData(json.data);
      }
    } catch (err) {
      console.warn('Failed to fetch analytics', err);
    }
  }, []);

  const pushNotification = useCallback((message: string) => {
    const item = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      message,
      timestamp: new Date().toLocaleTimeString(),
    };
    setRecentRealtimeNotifications((prev) => [item, ...prev.slice(0, 4)]);
  }, []);

  // Setup Server-Sent Events (SSE) real-time connection
  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setRealtimeStatus('connecting');

    const streamUrl = token ? `/api/realtime/stream?token=${encodeURIComponent(token)}` : '/api/realtime/stream';
    const es = new EventSource(streamUrl);
    eventSourceRef.current = es;

    es.addEventListener('open', () => {
      setRealtimeStatus('connected');
    });

    es.addEventListener('system:connected', () => {
      setRealtimeStatus('connected');
    });

    es.addEventListener('system:ping', () => {
      setLastEventTime(new Date().toISOString());
    });

    es.addEventListener('task:created', (e) => {
      try {
        const payload = JSON.parse(e.data);
        const newTask: Task = payload.payload;
        setTasks((prev) => {
          const exists = prev.some((t) => t.id === newTask.id);
          return exists ? prev : [newTask, ...prev];
        });
        setLiveEventsCount((c) => c + 1);
        setLastEventTime(new Date().toISOString());
        pushNotification(`New task created: ${newTask.code} - ${newTask.title}`);
        fetchAnalytics();
      } catch (err) {
        console.warn('SSE parse error', err);
      }
    });

    es.addEventListener('task:updated', (e) => {
      try {
        const payload = JSON.parse(e.data);
        const updatedTask: Task = payload.payload;
        setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
        setLiveEventsCount((c) => c + 1);
        setLastEventTime(new Date().toISOString());
        pushNotification(`Task updated: ${updatedTask.code}`);
        fetchAnalytics();
      } catch (err) {
        console.warn('SSE parse error', err);
      }
    });

    es.addEventListener('task:status_changed', (e) => {
      try {
        const payload = JSON.parse(e.data);
        const updatedTask: Task = payload.payload;
        setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
        setLiveEventsCount((c) => c + 1);
        setLastEventTime(new Date().toISOString());
        pushNotification(`Task ${updatedTask.code} moved to ${updatedTask.status}`);
        fetchAnalytics();
      } catch (err) {
        console.warn('SSE parse error', err);
      }
    });

    es.addEventListener('task:deleted', (e) => {
      try {
        const payload = JSON.parse(e.data);
        const { id } = payload.payload;
        setTasks((prev) => prev.filter((t) => t.id !== id));
        setLiveEventsCount((c) => c + 1);
        setLastEventTime(new Date().toISOString());
        pushNotification(`Task deleted`);
        fetchAnalytics();
      } catch (err) {
        console.warn('SSE parse error', err);
      }
    });

    es.addEventListener('comment:added', (e) => {
      try {
        const payload = JSON.parse(e.data);
        const { task, comment } = payload.payload;
        if (task) {
          setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
        }
        setLiveEventsCount((c) => c + 1);
        setLastEventTime(new Date().toISOString());
        pushNotification(`New comment from ${comment.authorName}`);
      } catch (err) {
        console.warn('SSE comment parse error', err);
      }
    });

    es.onerror = () => {
      setRealtimeStatus('disconnected');
      es.close();
      eventSourceRef.current = null;
      // Exponential auto reconnect
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        connectSSE();
      }, 4000);
    };
  }, [token, pushNotification, fetchAnalytics]);

  useEffect(() => {
    fetchTasks();
    fetchAnalytics();
    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [fetchTasks, fetchAnalytics, connectSSE]);

  // Actions
  const createTask = async (data: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string;
    dueDate?: string;
    estimatedHours?: number;
    tags?: string[];
  }) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        // Optimistically add
        setTasks((prev) => {
          const exists = prev.some((t) => t.id === json.data.id);
          return exists ? prev : [json.data, ...prev];
        });
        fetchAnalytics();
        return { success: true, data: json.data };
      }
      return { success: false, error: json.error?.message || 'Failed to create task' };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    // Optimistic state update
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)));

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      if (json.success) {
        setTasks((prev) => prev.map((t) => (t.id === id ? json.data : t)));
        fetchAnalytics();
        return { success: true, data: json.data };
      } else {
        // Revert on failure
        fetchTasks();
        return { success: false, error: json.error?.message || 'Update failed' };
      }
    } catch {
      fetchTasks();
      return { success: false, error: 'Network error' };
    }
  };

  const moveTaskStatus = async (id: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t))
    );

    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchAnalytics();
    } catch (e) {
      console.warn('Failed moving task status', e);
      fetchTasks();
    }
  };

  const deleteTask = async (id: string) => {
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (selectedTaskId === id) setSelectedTaskId(null);

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();
      if (json.success) {
        fetchAnalytics();
        return { success: true };
      } else {
        setTasks(previous);
        return { success: false, error: json.error?.message || 'Delete failed' };
      }
    } catch {
      setTasks(previous);
      return { success: false, error: 'Network error' };
    }
  };

  const addSubtask = async (taskId: string, title: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ title }),
      });
      const json = await res.json();
      if (json.success) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, subtasks: [...t.subtasks, json.data] } : t))
        );
      }
    } catch (e) {
      console.warn('Failed to add subtask', e);
    }
  };

  const toggleSubtask = async (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: t.subtasks.map((s) => (s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s)),
        };
      })
    );

    try {
      await fetch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: 'PATCH',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch (e) {
      console.warn('Failed toggling subtask', e);
      fetchTasks();
    }
  };

  const deleteSubtask = async (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: t.subtasks.filter((s) => s.id !== subtaskId),
        };
      })
    );

    try {
      await fetch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch (e) {
      console.warn('Failed deleting subtask', e);
      fetchTasks();
    }
  };

  const addComment = async (taskId: string, content: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content }),
      });
      const json = await res.json();
      if (json.success) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, commentsCount: (t.commentsCount || 0) + 1 } : t))
        );
      }
    } catch (e) {
      console.warn('Failed adding comment', e);
    }
  };

  const logTime = async (taskId: string, hours: number) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/time-log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ hours }),
      });
      const json = await res.json();
      if (json.success) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? json.data : t)));
        fetchAnalytics();
      }
    } catch (e) {
      console.warn('Failed logging time', e);
    }
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        isLoading,
        filter,
        setFilter,
        viewMode,
        setViewMode,
        selectedTaskId,
        setSelectedTaskId,
        isTaskFormOpen,
        setIsTaskFormOpen,
        editingTask,
        setEditingTask,
        realtimeStatus,
        lastEventTime,
        liveEventsCount,
        recentRealtimeNotifications,
        createTask,
        updateTask,
        moveTaskStatus,
        deleteTask,
        addSubtask,
        toggleSubtask,
        deleteSubtask,
        addComment,
        logTime,
        analyticsData,
        refreshTasks: fetchTasks,
        reconnectStream: connectSSE,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
