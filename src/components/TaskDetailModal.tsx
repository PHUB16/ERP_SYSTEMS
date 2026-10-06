import React, { useState, useEffect } from 'react';
import { useTasks } from '../context/TaskContext.js';
import { useAuth } from '../context/AuthContext.js';
import { TaskPriority, TaskStatus, Comment } from '../types/index.js';
import {
  X,
  Clock,
  Send,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Tag,
  CheckCircle2,
} from 'lucide-react';

export const TaskDetailModal: React.FC = () => {
  const {
    tasks,
    selectedTaskId,
    setSelectedTaskId,
    updateTask,
    deleteTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    addComment,
    logTime,
  } = useTasks();
  const { currentUser, users } = useAuth();

  const task = tasks.find((t) => t.id === selectedTaskId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [hoursToAdd, setHoursToAdd] = useState('1');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
    }
  }, [task]);

  // Fetch comments when task is opened
  useEffect(() => {
    if (!selectedTaskId) return;

    let isMounted = true;
    async function loadComments() {
      setIsLoadingComments(true);
      try {
        const res = await fetch(`/api/tasks/${selectedTaskId}/comments`);
        const json = await res.json();
        if (isMounted && json.success) {
          setComments(json.data);
        }
      } catch (err) {
        console.warn('Failed loading comments', err);
      } finally {
        if (isMounted) setIsLoadingComments(false);
      }
    }

    loadComments();
    return () => {
      isMounted = false;
    };
  }, [selectedTaskId]);

  if (!task) return null;

  const handleTitleBlur = () => {
    if (title.trim() && title !== task.title) {
      updateTask(task.id, { title: title.trim() });
    }
  };

  const handleDescriptionBlur = () => {
    if (description !== task.description) {
      updateTask(task.id, { description });
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    await addSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const content = newComment.trim();
    setNewComment('');
    await addComment(task.id, content);

    // Refresh comments immediately
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`);
      const json = await res.json();
      if (json.success) setComments(json.data);
    } catch {
      // ignore
    }
  };

  const handleLogHours = async () => {
    const val = parseFloat(hoursToAdd);
    if (!isNaN(val) && val > 0) {
      await logTime(task.id, val);
    }
  };

  const completedSubtasks = task.subtasks.filter((s) => s.isCompleted).length;
  const isOverdue =
    task.status !== 'DONE' && task.dueDate && new Date(task.dueDate).getTime() < Date.now();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full my-8 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <span className="font-mono text-indigo-400 font-semibold text-sm">{task.code}</span>
            <span className="text-slate-500">/</span>
            <span className="text-xs text-slate-400">Created by {task.reporterName}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={async () => {
                if (confirm(`Are you sure you want to delete ${task.code}?`)) {
                  await deleteTask(task.id);
                }
              }}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 p-1.5 rounded hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
            <button
              onClick={() => setSelectedTaskId(null)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 overflow-y-auto flex-1">
          
          {/* Main Column: Title, Description, Subtasks, Comments */}
          <div className="lg:col-span-2 p-6 space-y-6">
            
            {/* Title Input */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                className="w-full bg-transparent text-lg font-semibold text-slate-100 border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none pb-1 transition-colors"
                placeholder="Task title..."
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase font-mono tracking-wider">
                Description & Specifications
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                rows={4}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder="Add rich requirements or context here..."
              />
            </div>

            {/* Subtasks Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-200 uppercase font-mono tracking-wider">
                    Subtasks Checklist ({completedSubtasks}/{task.subtasks.length})
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              {task.subtasks.length > 0 && (
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{
                      width: `${(completedSubtasks / task.subtasks.length) * 100}%`,
                    }}
                  ></div>
                </div>
              )}

              {/* Checklist items */}
              <div className="space-y-2">
                {task.subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/80 group"
                  >
                    <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={sub.isCompleted}
                        onChange={() => toggleSubtask(task.id, sub.id)}
                        className="rounded border-slate-700 text-indigo-600 focus:ring-0 focus:outline-none"
                      />
                      <span className={sub.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}>
                        {sub.title}
                      </span>
                    </label>
                    <button
                      onClick={() => deleteSubtask(task.id, sub.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Subtask Input */}
              <form onSubmit={handleAddSubtask} className="flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Add a new checklist item..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  className="flex-1 bg-slate-950/60 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>
            </div>

            {/* Comments Thread */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-200 uppercase font-mono tracking-wider">
                Discussion Stream ({comments.length})
              </span>

              {isLoadingComments ? (
                <div className="text-xs text-slate-400 py-3">Loading discussion...</div>
              ) : comments.length === 0 ? (
                <div className="text-xs text-slate-400 py-2">No comments yet. Start the conversation.</div>
              ) : (
                <div className="space-y-3 max-h-56 overflow-y-auto">
                  {comments.map((c) => (
                    <div key={c.id} className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-lg">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <img
                            src={c.authorAvatar}
                            alt={c.authorName}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span className="text-xs font-medium text-slate-200">{c.authorName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(c.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 whitespace-pre-wrap">{c.content}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment Input */}
              <form onSubmit={handlePostComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder={
                    currentUser ? `Comment as ${currentUser.fullName}...` : 'Write a comment...'
                  }
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 bg-slate-950/60 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="bg-indigo-600 disabled:opacity-50 hover:bg-indigo-500 text-white text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Metadata Properties Sidebar */}
          <div className="p-6 space-y-5 bg-slate-950/20 text-xs">
            
            {/* Status */}
            <div>
              <label className="block text-slate-400 uppercase font-mono text-[11px] mb-1.5">
                Workflow Status
              </label>
              <select
                value={task.status}
                onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="BACKLOG">Backlog</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-slate-400 uppercase font-mono text-[11px] mb-1.5">
                Priority Level
              </label>
              <select
                value={task.priority}
                onChange={(e) => updateTask(task.id, { priority: e.target.value as TaskPriority })}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-slate-400 uppercase font-mono text-[11px] mb-1.5">
                Assignee
              </label>
              <select
                value={task.assigneeId || ''}
                onChange={(e) => updateTask(task.id, { assigneeId: e.target.value || undefined })}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-slate-400 uppercase font-mono text-[11px] mb-1.5">
                Due Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={task.dueDate || ''}
                  onChange={(e) => updateTask(task.id, { dueDate: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                />
              </div>
              {isOverdue && (
                <div className="flex items-center gap-1 text-rose-400 mt-1 text-[11px]">
                  <AlertCircle className="w-3 h-3" />
                  <span>This task is past its deadline</span>
                </div>
              )}
            </div>

            {/* Time Tracking */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <label className="block text-slate-400 uppercase font-mono text-[11px]">
                Time Tracking
              </label>
              <div className="flex items-center justify-between text-slate-300">
                <span>Logged: <strong className="text-white">{task.spentHours || 0}h</strong></span>
                <span>Estimate: <strong className="text-white">{task.estimatedHours || 0}h</strong></span>
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={hoursToAdd}
                  onChange={(e) => setHoursToAdd(e.target.value)}
                  className="w-16 bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs"
                />
                <button
                  type="button"
                  onClick={handleLogHours}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded px-2.5 py-1 text-xs flex items-center justify-center gap-1"
                >
                  <Clock className="w-3 h-3" />
                  <span>+ Log Hours</span>
                </button>
              </div>
            </div>

            {/* Tags */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <label className="block text-slate-400 uppercase font-mono text-[11px]">
                Tags & Categories
              </label>
              <div className="flex flex-wrap gap-1">
                {task.tags.map((tag) => (
                  <span key={tag} className="text-slate-300 font-mono text-[11px]">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
