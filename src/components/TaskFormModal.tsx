import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext.js';
import { useAuth } from '../context/AuthContext.js';
import { TaskPriority, TaskStatus } from '../types/index.js';
import { X, Plus, AlertCircle } from 'lucide-react';

export const TaskFormModal: React.FC = () => {
  const { isTaskFormOpen, setIsTaskFormOpen, createTask } = useTasks();
  const { users } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('8');
  const [tagsInput, setTagsInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isTaskFormOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide a task title.');
      return;
    }

    setIsSubmitting(true);
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const result = await createTask({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      assigneeId: assigneeId || undefined,
      dueDate: dueDate || undefined,
      estimatedHours: parseFloat(estimatedHours) || 0,
      tags,
    });

    setIsSubmitting(false);

    if (result.success) {
      setIsTaskFormOpen(false);
      setTitle('');
      setDescription('');
      setTagsInput('');
    } else {
      setError(result.error || 'Failed to create task');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full my-8 shadow-2xl overflow-hidden">
        
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div>
            <h2 className="text-base font-semibold text-slate-100">Create New Task</h2>
            <div className="text-xs text-slate-400">Add a trackable work item to the sprint</div>
          </div>
          <button
            onClick={() => setIsTaskFormOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-slate-300 uppercase font-mono tracking-wider mb-1.5 font-medium">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement reactive notification toaster"
              className="w-full bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-300 uppercase font-mono tracking-wider mb-1.5 font-medium">
              Description & Specifications
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed task breakdown, acceptance criteria, or technical notes..."
              className="w-full bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Status & Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 uppercase font-mono tracking-wider mb-1.5 font-medium">
                Workflow Lane
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-slate-950/60 border border-slate-800 text-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500"
              >
                <option value="BACKLOG">Backlog</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 uppercase font-mono tracking-wider mb-1.5 font-medium">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-slate-950/60 border border-slate-800 text-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          {/* Assignee & Due Date Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 uppercase font-mono tracking-wider mb-1.5 font-medium">
                Assignee
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 text-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 uppercase font-mono tracking-wider mb-1.5 font-medium">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 text-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Estimated Hours & Tags */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 uppercase font-mono tracking-wider mb-1.5 font-medium">
                Estimated Hours
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 text-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 uppercase font-mono tracking-wider mb-1.5 font-medium">
                Tags (Comma-separated)
              </label>
              <input
                type="text"
                placeholder="Backend, Security, UI"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 text-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsTaskFormOpen(false)}
              className="py-2 px-4 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating...' : 'Create Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
