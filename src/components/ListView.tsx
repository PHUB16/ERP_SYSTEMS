import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext.js';
import { Task, TaskPriority, TaskStatus } from '../types/index.js';
import { ArrowUpDown, Calendar, MessageSquare, AlertCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const ListView: React.FC = () => {
  const { tasks, filter, moveTaskStatus, setSelectedTaskId, deleteTask } = useTasks();
  const { currentUser } = useAuth();
  const [sortField, setSortField] = useState<'dueDate' | 'priority' | 'status' | 'code'>('code');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const filteredTasks = tasks.filter((t) => {
    if (filter.status && filter.status !== 'ALL' && t.status !== filter.status) return false;
    if (filter.priority && filter.priority !== 'ALL' && t.priority !== filter.priority) return false;
    if (filter.assigneeId && filter.assigneeId !== 'ALL' && t.assigneeId !== filter.assigneeId) return false;
    if (filter.tag && filter.tag !== 'ALL' && !t.tags.includes(filter.tag)) return false;
    if (filter.search && filter.search.trim() !== '') {
      const q = filter.search.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const priorityWeight: Record<TaskPriority, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  const statusWeight: Record<TaskStatus, number> = {
    BACKLOG: 1,
    TODO: 2,
    IN_PROGRESS: 3,
    REVIEW: 4,
    DONE: 5,
  };

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'priority') {
      comparison = priorityWeight[b.priority] - priorityWeight[a.priority];
    } else if (sortField === 'status') {
      comparison = statusWeight[a.status] - statusWeight[b.status];
    } else if (sortField === 'dueDate') {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      comparison = dateA - dateB;
    } else {
      comparison = a.code.localeCompare(b.code);
    }
    return sortAsc ? comparison : -comparison;
  });

  const handleSort = (field: 'dueDate' | 'priority' | 'status' | 'code') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getPriorityStyle = (priority: TaskPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return 'text-rose-500 font-semibold';
      case 'HIGH':
        return 'text-amber-500 font-medium';
      case 'MEDIUM':
        return 'text-sky-400';
      case 'LOW':
        return 'text-slate-400';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Table Top Bar */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Tasks List</h2>
          <div className="text-xs text-slate-400">
            {sortedTasks.length} tasks matched
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-mono border-b border-slate-800">
            <tr>
              <th
                onClick={() => handleSort('code')}
                className="py-3 px-4 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  <span>Task Code</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Title & Details</th>
              <th
                onClick={() => handleSort('status')}
                className="py-3 px-4 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  <span>Workflow Status</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('priority')}
                className="py-3 px-4 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  <span>Priority</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Assignee</th>
              <th
                onClick={() => handleSort('dueDate')}
                className="py-3 px-4 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  <span>Due Date</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Hours</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {sortedTasks.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  No tasks matching the current filter.
                </td>
              </tr>
            ) : (
              sortedTasks.map((task) => {
                const completedSubs = task.subtasks.filter((s) => s.isCompleted).length;
                const isOverdue =
                  task.status !== 'DONE' &&
                  task.dueDate &&
                  new Date(task.dueDate).getTime() < Date.now();

                return (
                  <tr
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="hover:bg-slate-800/60 cursor-pointer transition-colors"
                  >
                    {/* Code */}
                    <td className="py-3 px-4 font-mono font-medium text-indigo-400">
                      {task.code}
                    </td>

                    {/* Title */}
                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-medium text-slate-100 hover:text-white truncate">
                        {task.title}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                        {task.subtasks.length > 0 && (
                          <span>
                            {completedSubs}/{task.subtasks.length} subtasks
                          </span>
                        )}
                        {task.commentsCount > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {task.commentsCount}
                            </span>
                          </>
                        )}
                        {task.tags.length > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{task.tags.join(', ')}</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={task.status}
                        onChange={(e) => moveTaskStatus(task.id, e.target.value as TaskStatus)}
                        className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-indigo-500 font-mono"
                      >
                        <option value="BACKLOG">Backlog</option>
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="REVIEW">Review</option>
                        <option value="DONE">Done</option>
                      </select>
                    </td>

                    {/* Priority (Zero-Pill: Clean unboxed typography) */}
                    <td className="py-3 px-4 font-mono">
                      <span className={getPriorityStyle(task.priority)}>
                        {task.priority}
                      </span>
                    </td>

                    {/* Assignee */}
                    <td className="py-3 px-4">
                      {task.assigneeName ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={task.assigneeAvatar}
                            alt={task.assigneeName}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span className="text-slate-300">{task.assigneeName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Due Date */}
                    <td className="py-3 px-4 font-mono">
                      {task.dueDate ? (
                        <div
                          className={`flex items-center gap-1 ${
                            isOverdue ? 'text-rose-400 font-medium' : 'text-slate-300'
                          }`}
                        >
                          {isOverdue && <AlertCircle className="w-3 h-3" />}
                          <span>{task.dueDate}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Hours */}
                    <td className="py-3 px-4 font-mono text-slate-400">
                      <span>{task.spentHours || 0}</span> / <span>{task.estimatedHours || 0}h</span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={async () => {
                          if (confirm(`Delete task ${task.code}?`)) {
                            await deleteTask(task.id);
                          }
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
