import React from 'react';
import { useTasks } from '../context/TaskContext.js';
import { useAuth } from '../context/AuthContext.js';
import { Task, TaskStatus, TaskPriority } from '../types/index.js';
import {
  Clock,
  MessageSquare,
  CheckSquare,
  Plus,
  ArrowRight,
  ArrowLeft,
  Calendar,
  AlertCircle,
} from 'lucide-react';

const COLUMNS: { id: TaskStatus; label: string; description: string }[] = [
  { id: 'BACKLOG', label: 'Backlog', description: 'Pending evaluation' },
  { id: 'TODO', label: 'To Do', description: 'Ready to commence' },
  { id: 'IN_PROGRESS', label: 'In Progress', description: 'Actively being developed' },
  { id: 'REVIEW', label: 'Review', description: 'Verification & QA' },
  { id: 'DONE', label: 'Done', description: 'Shipped & deployed' },
];

export const KanbanBoard: React.FC = () => {
  const { tasks, filter, setFilter, moveTaskStatus, setSelectedTaskId, setIsTaskFormOpen, setEditingTask } = useTasks();
  const { users } = useAuth();

  // Apply filters
  const filteredTasks = tasks.filter((t) => {
    if (filter.status && filter.status !== 'ALL' && t.status !== filter.status) return false;
    if (filter.priority && filter.priority !== 'ALL' && t.priority !== filter.priority) return false;
    if (filter.assigneeId && filter.assigneeId !== 'ALL' && t.assigneeId !== filter.assigneeId) return false;
    if (filter.tag && filter.tag !== 'ALL' && !t.tags.includes(filter.tag)) return false;
    if (filter.search && filter.search.trim() !== '') {
      const q = filter.search.toLowerCase();
      const match =
        t.title.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Extract all unique tags
  const allTags = Array.from(new Set(tasks.flatMap((t) => t.tags)));

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      moveTaskStatus(taskId, targetStatus);
    }
  };

  const priorityMeta = (priority: TaskPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return { label: 'Critical', color: 'text-rose-500 font-semibold', dot: 'bg-rose-500' };
      case 'HIGH':
        return { label: 'High', color: 'text-amber-500 font-medium', dot: 'bg-amber-500' };
      case 'MEDIUM':
        return { label: 'Medium', color: 'text-sky-400', dot: 'bg-sky-400' };
      case 'LOW':
        return { label: 'Low', color: 'text-slate-400', dot: 'bg-slate-400' };
    }
  };

  const getNextStatus = (current: TaskStatus): TaskStatus | null => {
    const order: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
    const idx = order.indexOf(current);
    return idx < order.length - 1 ? order[idx + 1] : null;
  };

  const getPrevStatus = (current: TaskStatus): TaskStatus | null => {
    const order: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
    const idx = order.indexOf(current);
    return idx > 0 ? order[idx - 1] : null;
  };

  return (
    <div className="space-y-6">
      {/* Interactive Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          
          {/* Priority filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono">Priority:</span>
            <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded-md border border-slate-800">
              {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setFilter((f) => ({ ...f, priority: p }))}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    filter.priority === p ? 'bg-slate-800 text-white font-medium shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p === 'ALL' ? 'All' : p.charAt(0) + p.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Assignee filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono">Assignee:</span>
            <select
              value={filter.assigneeId || 'ALL'}
              onChange={(e) => setFilter((f) => ({ ...f, assigneeId: e.target.value }))}
              className="bg-slate-900 border border-slate-800 text-slate-200 rounded-md px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Assignees</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Tag filter */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-mono">Tag:</span>
              <select
                value={filter.tag || 'ALL'}
                onChange={(e) => setFilter((f) => ({ ...f, tag: e.target.value }))}
                className="bg-slate-900 border border-slate-800 text-slate-200 rounded-md px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Tags</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reset Filters */}
          {(filter.priority !== 'ALL' || filter.assigneeId !== 'ALL' || filter.tag !== 'ALL' || filter.search) && (
            <button
              onClick={() =>
                setFilter({
                  search: '',
                  status: 'ALL',
                  priority: 'ALL',
                  assigneeId: 'ALL',
                  tag: 'ALL',
                })
              }
              className="text-xs text-indigo-400 hover:text-indigo-300 underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Board Stats Summary */}
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span>{filteredTasks.length} tasks visible</span>
          <span aria-hidden="true">·</span>
          <span>
            {filteredTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0)}h estimated
          </span>
        </div>
      </div>

      {/* 5-Column Kanban Workflow */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);
          const colHours = colTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className="flex flex-col bg-slate-900/70 border border-slate-800 rounded-xl min-h-[550px] transition-colors"
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-sm text-slate-100">{col.label}</h2>
                    <span className="text-xs font-mono text-slate-400">({colTasks.length})</span>
                  </div>
                  <div className="text-[11px] text-slate-400 leading-tight mt-0.5">{col.description}</div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingTask(null);
                    setIsTaskFormOpen(true);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title={`Add task to ${col.label}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Task Cards Container */}
              <div className="p-2 space-y-2.5 flex-1 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center border border-dashed border-slate-800/80 rounded-lg text-slate-400 text-xs text-center p-4">
                    <span>No tasks in this lane</span>
                    <button
                      onClick={() => {
                        setEditingTask(null);
                        setIsTaskFormOpen(true);
                      }}
                      className="mt-2 text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      + Create task
                    </button>
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const pMeta = priorityMeta(task.priority);
                    const completedSubtasks = task.subtasks.filter((s) => s.isCompleted).length;
                    const totalSubtasks = task.subtasks.length;
                    const isOverdue =
                      task.status !== 'DONE' &&
                      task.dueDate &&
                      new Date(task.dueDate).getTime() < Date.now();

                    const next = getNextStatus(task.status);
                    const prev = getPrevStatus(task.status);

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => setSelectedTaskId(task.id)}
                        className="bg-slate-800/90 hover:bg-slate-800 border border-slate-700/70 hover:border-slate-600 rounded-lg p-3 transition-all cursor-pointer shadow-xs group"
                      >
                        {/* Header: Code & Priority (Zero-Pill: Clean unboxed metadata) */}
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                          <span className="font-mono text-indigo-400 font-medium">{task.code}</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${pMeta.dot}`}></span>
                            <span className={pMeta.color}>{pMeta.label}</span>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="font-medium text-slate-100 text-sm leading-snug line-clamp-2 group-hover:text-white mb-2">
                          {task.title}
                        </h3>

                        {/* Description excerpt */}
                        {task.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                            {task.description}
                          </p>
                        )}

                        {/* Tags (Zero-Pill: inline text separated by middot) */}
                        {task.tags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-400 mb-3">
                            {task.tags.map((tag, i) => (
                              <React.Fragment key={tag}>
                                <span className="hover:text-slate-200">#{tag}</span>
                                {i < task.tags.length - 1 && <span aria-hidden="true">·</span>}
                              </React.Fragment>
                            ))}
                          </div>
                        )}

                        {/* Metadata Footer: Assignee, Subtasks, Hours, Due Date */}
                        <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                          {/* Assignee */}
                          <div className="flex items-center gap-2">
                            {task.assigneeAvatar ? (
                              <img
                                src={task.assigneeAvatar}
                                alt={task.assigneeName || 'Assignee'}
                                className="w-5 h-5 rounded-full object-cover"
                                title={`Assigned to ${task.assigneeName}`}
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 text-[10px] flex items-center justify-center font-mono">
                                ?
                              </div>
                            )}
                            <span className="text-[11px] truncate max-w-[80px]">
                              {task.assigneeName ? task.assigneeName.split(' ')[0] : 'Unassigned'}
                            </span>
                          </div>

                          {/* Indicators */}
                          <div className="flex items-center gap-2.5 text-[11px]">
                            {totalSubtasks > 0 && (
                              <span
                                className={`flex items-center gap-1 ${
                                  completedSubtasks === totalSubtasks
                                    ? 'text-emerald-400'
                                    : 'text-slate-400'
                                }`}
                                title={`${completedSubtasks} of ${totalSubtasks} subtasks completed`}
                              >
                                <CheckSquare className="w-3 h-3" />
                                <span>
                                  {completedSubtasks}/{totalSubtasks}
                                </span>
                              </span>
                            )}

                            {task.commentsCount > 0 && (
                              <span className="flex items-center gap-1 text-slate-400" title="Comments">
                                <MessageSquare className="w-3 h-3" />
                                <span>{task.commentsCount}</span>
                              </span>
                            )}

                            {task.estimatedHours > 0 && (
                              <span className="flex items-center gap-1 text-slate-400" title="Target Hours">
                                <Clock className="w-3 h-3" />
                                <span>{task.estimatedHours}h</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Due date and fast stage step buttons */}
                        <div className="mt-2.5 pt-2 border-t border-slate-700/40 flex items-center justify-between text-[11px]">
                          {task.dueDate ? (
                            <div
                              className={`flex items-center gap-1 ${
                                isOverdue ? 'text-rose-400 font-medium' : 'text-slate-400'
                              }`}
                            >
                              {isOverdue ? (
                                <AlertCircle className="w-3 h-3" />
                              ) : (
                                <Calendar className="w-3 h-3" />
                              )}
                              <span>
                                {isOverdue ? 'Overdue · ' : ''}
                                {new Date(task.dueDate).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">No deadline</span>
                          )}

                          {/* Quick transition arrows */}
                          <div className="flex items-center gap-1">
                            {prev && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveTaskStatus(task.id, prev);
                                }}
                                className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                title={`Move backward to ${prev}`}
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}
                            {next && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveTaskStatus(task.id, next);
                                }}
                                className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                title={`Advance to ${next}`}
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Column Footer */}
              <div className="p-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between px-3">
                <span>{colHours}h total</span>
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setIsTaskFormOpen(true);
                  }}
                  className="text-slate-400 hover:text-indigo-400 transition-colors"
                >
                  + Add
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
