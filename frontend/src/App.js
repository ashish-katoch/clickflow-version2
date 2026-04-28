import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProjectPage from './pages/ProjectPage';
import GoalsPage from './pages/GoalsPage';
import MembersPage from './pages/MembersPage';
import AutomationsPage from './pages/AutomationsPage';
import AppSidebar from './components/AppSidebar';
import TimeTracker from './components/TimeTracker';
import { MagnifyingGlass, Bell } from '@phosphor-icons/react';

function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500">Loading...</span>
        </div>
      </div>
    );
  }
  if (user === false) return <Navigate to="/login" replace />;
  return <AppLayout />;
}

function AppLayout() {
  const { user } = useAuth();
  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-12 border-b border-slate-200 bg-white flex items-center justify-between px-4 flex-shrink-0" data-testid="top-bar">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <MagnifyingGlass size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              className="text-sm bg-transparent outline-none w-full text-slate-700 placeholder:text-slate-400"
              data-testid="search-input"
            />
          </div>
          <div className="flex items-center gap-3">
            <TimeTracker />
            <button className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors relative" data-testid="notifications-btn">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center" data-testid="user-avatar">
              <span className="text-xs font-semibold text-white">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
            </div>
          </div>
        </header>
        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPageWrapper />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/project/:projectId" element={<ProjectPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/automations" element={<AutomationsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function LoginPageWrapper() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user && user !== false) return <Navigate to="/" replace />;
  return <LoginPage />;
}

export default App;
