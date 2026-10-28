import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { DailySalesPage } from './pages/DailySalesPage';
import { SummaryPage } from './pages/SummaryPage';
import { StudentsPage } from './pages/StudentsPage';
import { StudentProfilePage } from './pages/StudentProfilePage';
import { CampaignsPage } from './pages/CampaignsPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { CampsPage } from './pages/CampsPage';
import { UsersPage } from './pages/UsersPage';
import { AuditLogsPage } from './pages/AuditLogsPage';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({
  children,
  adminOnly = false,
}) => {
  const { user, isAdmin } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="days/:dayNumber" element={<DailySalesPage />} />
        <Route path="summary" element={<SummaryPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="camps" element={<CampsPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="students/:studentId/history" element={<StudentProfilePage />} />
        <Route path="campaigns" element={<CampaignsPage />} />

        {/* Admin Only Routes */}
        <Route
          path="users"
          element={
            <ProtectedRoute adminOnly>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="audit-logs"
          element={
            <ProtectedRoute adminOnly>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
