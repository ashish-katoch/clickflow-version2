import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './pages/LoginPage';
import WorkspacePage from './pages/WorkspacePage';
import SprintBoardPage from './pages/SprintBoardPage';
import BugListPage from './pages/BugListPage';
import MyTasksPage from './pages/MyTasksPage';
import AllBugsPage from './pages/AllBugsPage';
import AppSidebar from './components/AppSidebar';
import AppHeader from './components/AppHeader';
import DetailPanel from './components/DetailPanel';

function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen theme-bg"><div className="w-6 h-6 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" /></div>;
  if (user === false) return <Navigate to="/login" replace />;
  return <AppLayout />;
}

function AppLayout() {
  const [detailPanel, setDetailPanel] = useState(null);
  return (
    <div className="flex h-screen w-full theme-bg theme-text overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0 theme-bg-main relative">
        <AppHeader />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet context={{ setDetailPanel, detailPanel }} />
        </main>
        {detailPanel && (
          <>
            <div className="absolute inset-0 z-40" onClick={() => setDetailPanel(null)} />
            <DetailPanel data={detailPanel} onClose={() => setDetailPanel(null)} onUpdate={() => {}} />
          </>
        )}
      </div>
    </div>
  );
}

function LoginPageWrapper() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user && user !== false) return <Navigate to="/" replace />;
  return <LoginPage />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPageWrapper />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<WorkspacePage />} />
              <Route path="/my-tasks" element={<MyTasksPage />} />
              <Route path="/all-bugs" element={<AllBugsPage />} />
              <Route path="/project/:projectId/board" element={<SprintBoardPage />} />
              <Route path="/project/:projectId/bugs" element={<BugListPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
