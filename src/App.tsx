import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext.js';
import { TaskProvider, useTasks } from './context/TaskContext.js';
import { Navbar } from './components/Navbar.js';
import { KanbanBoard } from './components/KanbanBoard.js';
import { ListView } from './components/ListView.js';
import { AnalyticsView } from './components/AnalyticsView.js';
import { TaskDetailModal } from './components/TaskDetailModal.js';
import { TaskFormModal } from './components/TaskFormModal.js';
import { AuthModal } from './components/AuthModal.js';

const MainDashboard: React.FC = () => {
  const { viewMode } = useTasks();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar onOpenAuth={() => setIsAuthModalOpen(true)} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {viewMode === 'kanban' && <KanbanBoard />}
        {viewMode === 'list' && <ListView />}
        {viewMode === 'analytics' && <AnalyticsView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">TaskFlow Real-Time Engine</span>
            <span aria-hidden="true">·</span>
            <span>Node.js REST API & SSE Pipeline</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Docs: /docs/ER-Diagram.md</span>
            <span aria-hidden="true">·</span>
            <span>API: /docs/API-Documentation.md</span>
          </div>
        </div>
      </footer>

      {/* Modals & Overlays */}
      <TaskDetailModal />
      <TaskFormModal />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <TaskProvider>
        <MainDashboard />
      </TaskProvider>
    </AuthProvider>
  );
}
