import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTasks } from '../context/TaskContext.js';
import {
  LayoutDashboard,
  ListTodo,
  BarChart3,
  Plus,
  Search,
  Wifi,
  WifiOff,
  UserCheck,
  ChevronDown,
  LogOut,
  RotateCw,
} from 'lucide-react';
import { ViewMode } from '../types/index.js';

interface NavbarProps {
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
  const { currentUser, logout, demoLogin } = useAuth();
  const {
    viewMode,
    setViewMode,
    filter,
    setFilter,
    setIsTaskFormOpen,
    realtimeStatus,
    liveEventsCount,
    reconnectStream,
    recentRealtimeNotifications,
  } = useTasks();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showEventsFlyout, setShowEventsFlyout] = useState(false);

  const views: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'kanban', label: 'Kanban', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'list', label: 'List View', icon: <ListTodo className="w-4 h-4" /> },
    { id: 'analytics', label: 'Metrics', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand & Connection Status */}
          <div className="flex items-center gap-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm shadow-indigo-500/20">
                TF
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-base tracking-tight text-white">TaskFlow</span>
                  <span className="text-xs text-slate-400 font-mono">v2.4</span>
                </div>
                <div className="text-[11px] text-slate-400">Reactive Task Engine</div>
              </div>
            </div>

            {/* Real-time Status Indicator */}
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setShowEventsFlyout((v) => !v)}
                className="flex items-center gap-2 py-1 px-2.5 rounded text-xs font-mono bg-slate-800/80 hover:bg-slate-800 text-slate-300 transition-colors border border-slate-700/60"
                title="Real-Time Event Stream Connection Status"
              >
                {realtimeStatus === 'connected' ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-emerald-400 font-medium">Real-Time Sync</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-400">{liveEventsCount} events</span>
                  </>
                ) : realtimeStatus === 'connecting' ? (
                  <>
                    <RotateCw className="w-3 h-3 animate-spin text-amber-400" />
                    <span className="text-amber-400">Connecting...</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-rose-400" />
                    <span className="text-rose-400">Offline</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        reconnectStream();
                      }}
                      className="ml-1 text-[10px] underline hover:text-white"
                    >
                      Retry
                    </button>
                  </>
                )}
              </button>

              {/* Flyout for recent SSE broadcasts */}
              {showEventsFlyout && (
                <div className="absolute left-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-3 z-50 text-xs">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700">
                    <span className="font-semibold text-slate-200">Real-Time Event Log</span>
                    <span className="text-[10px] text-slate-400">{liveEventsCount} total broadcasted</span>
                  </div>
                  {recentRealtimeNotifications.length === 0 ? (
                    <div className="py-3 text-center text-slate-400">Stream listening for mutations...</div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {recentRealtimeNotifications.map((notif) => (
                        <div key={notif.id} className="p-2 bg-slate-900/70 rounded border border-slate-700/50">
                          <div className="text-slate-300 break-words">{notif.message}</div>
                          <div className="text-[10px] text-slate-500 mt-1">{notif.timestamp}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Search & View Switcher */}
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks, codes (TF-101), tags..."
                value={filter.search}
                onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
                className="w-full bg-slate-800/90 border border-slate-700 text-slate-100 placeholder-slate-400 text-sm rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              {filter.search && (
                <button
                  onClick={() => setFilter((f) => ({ ...f, search: '' }))}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* View Segmented Control */}
            <div className="flex items-center p-1 bg-slate-800 rounded-lg border border-slate-700 shrink-0">
              {views.map((v) => {
                const isActive = viewMode === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setViewMode(v.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {v.icon}
                    <span>{v.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Button & User Profile */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsTaskFormOpen(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium py-2 px-3.5 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Task</span>
            </button>

            {/* User Dropdown */}
            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.fullName}
                    className="w-7 h-7 rounded-full object-cover border border-slate-700"
                  />
                  <div className="hidden lg:block text-left">
                    <div className="text-xs font-medium text-slate-200 leading-tight">{currentUser.fullName}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide">{currentUser.role}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-2 z-50 text-xs">
                    <div className="px-3 py-2 border-b border-slate-700">
                      <div className="font-semibold text-slate-100">{currentUser.fullName}</div>
                      <div className="text-slate-400 truncate">{currentUser.email}</div>
                      <div className="mt-1 text-[11px] text-indigo-400 font-mono">Role: {currentUser.role}</div>
                    </div>

                    <div className="py-1">
                      <div className="px-3 py-1 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                        Quick Switch Persona
                      </div>
                      <button
                        onClick={async () => {
                          await demoLogin('LEAD');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-300 flex items-center justify-between"
                      >
                        <span>Alex Rivera</span>
                        <span className="text-[10px] text-indigo-400">LEAD</span>
                      </button>
                      <button
                        onClick={async () => {
                          await demoLogin('ADMIN');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-300 flex items-center justify-between"
                      >
                        <span>Elena Rostova</span>
                        <span className="text-[10px] text-amber-400">ADMIN</span>
                      </button>
                      <button
                        onClick={async () => {
                          await demoLogin('MEMBER');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-300 flex items-center justify-between"
                      >
                        <span>Marcus Vance</span>
                        <span className="text-[10px] text-emerald-400">MEMBER</span>
                      </button>
                    </div>

                    <div className="border-t border-slate-700 pt-1 mt-1">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenAuth();
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-300 flex items-center gap-2"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        <span>Account Credentials</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-rose-400 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium py-2 px-3.5 rounded-lg transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
