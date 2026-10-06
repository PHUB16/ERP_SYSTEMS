import React from 'react';
import { useTasks } from '../context/TaskContext.js';
import { CheckCircle2, Clock, AlertTriangle, Activity, Users } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { analyticsData, tasks } = useTasks();

  if (!analyticsData) {
    return (
      <div className="p-8 text-center text-slate-400">
        Computing real-time analytics...
      </div>
    );
  }

  const {
    totalTasks,
    completedTasks,
    inProgressTasks,
    overdueTasks,
    completionRate,
    totalEstimatedHours,
    totalSpentHours,
    priorityDistribution,
    assigneeWorkloads,
    recentActivities,
  } = analyticsData;

  return (
    <div className="space-y-6">
      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total & Completion */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Completion Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{completionRate}%</div>
          <div className="mt-2 text-xs text-slate-400">
            {completedTasks} of {totalTasks} tasks completed
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>In Active Progress</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{inProgressTasks}</div>
          <div className="mt-2 text-xs text-slate-400">
            Across active sprints
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full"
              style={{ width: `${totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        {/* Logged vs Estimated Hours */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Hours Logged</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {totalSpentHours}h <span className="text-xs text-slate-400 font-normal">/ {totalEstimatedHours}h est.</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {totalEstimatedHours > 0 ? Math.round((totalSpentHours / totalEstimatedHours) * 100) : 0}% of budget spent
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full"
              style={{
                width: `${
                  totalEstimatedHours > 0
                    ? Math.min(100, (totalSpentHours / totalEstimatedHours) * 100)
                    : 0
                }%`,
              }}
            ></div>
          </div>
        </div>

        {/* Overdue Alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Overdue Tasks</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">{overdueTasks}</div>
          <div className="mt-2 text-xs text-slate-400">
            {overdueTasks === 0 ? 'All deadlines on track' : 'Require immediate priority'}
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full"
              style={{ width: `${totalTasks > 0 ? (overdueTasks / totalTasks) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-100 mb-4">Priority Breakdown</h3>
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="text-rose-400 font-medium">Critical</span>
                <span className="font-mono">{priorityDistribution.CRITICAL}</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full"
                  style={{
                    width: `${totalTasks > 0 ? (priorityDistribution.CRITICAL / totalTasks) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="text-amber-400 font-medium">High</span>
                <span className="font-mono">{priorityDistribution.HIGH}</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full"
                  style={{
                    width: `${totalTasks > 0 ? (priorityDistribution.HIGH / totalTasks) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="text-sky-400 font-medium">Medium</span>
                <span className="font-mono">{priorityDistribution.MEDIUM}</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-sky-400 h-full"
                  style={{
                    width: `${totalTasks > 0 ? (priorityDistribution.MEDIUM / totalTasks) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="text-slate-400">Low</span>
                <span className="font-mono">{priorityDistribution.LOW}</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-slate-500 h-full"
                  style={{
                    width: `${totalTasks > 0 ? (priorityDistribution.LOW / totalTasks) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Member Workloads */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-100">Team Workloads</h3>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-4">
            {assigneeWorkloads.map((member) => (
              <div key={member.userId} className="text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <img
                      src={member.avatarUrl}
                      alt={member.userName}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span className="font-medium text-slate-200">{member.userName}</span>
                  </div>
                  <div className="text-slate-400 font-mono">
                    {member.taskCount} tasks ({member.estimatedHours}h)
                  </div>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full"
                    style={{
                      width: `${
                        totalTasks > 0 ? Math.min(100, (member.taskCount / totalTasks) * 100 * 2) : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-Time Activity Ledger */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-100 mb-4">Live Activity Stream</h3>
          <div className="space-y-3 max-h-72 overflow-y-auto text-xs">
            {recentActivities.length === 0 ? (
              <div className="text-slate-400 text-center py-6">No recorded activity yet.</div>
            ) : (
              recentActivities.map((act) => (
                <div key={act.id} className="pb-2.5 border-b border-slate-800/80 last:border-0">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
                    <span className="font-medium text-slate-300">{act.actorName}</span>
                    <span className="font-mono">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    {act.action === 'STATUS_CHANGED' && (
                      <span>
                        Changed status to <strong className="text-indigo-400">{act.metadata?.newValue}</strong>
                      </span>
                    )}
                    {act.action === 'CREATED' && <span>Created new task record</span>}
                    {act.action === 'COMMENT_ADDED' && <span>Posted a comment update</span>}
                    {act.action === 'SUBTASK_TOGGLED' && (
                      <span>{act.metadata?.details || 'Updated checklist'}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
