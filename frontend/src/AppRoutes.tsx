// ===== File: frontend/src/AppRoutes.tsx (FINAL CORRECTED VERSION) =====

import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import React from 'react';

// --- Page Imports ---
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { CampaignSelectionPage } from './pages/CampaignSelectionPage';
import { DashboardPage } from './pages/DashboardPage';
import { ManagementPortal } from './pages/ManagementPortal';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ActivityLogPage } from './pages/ActivityLogPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { BaDashboard } from './pages/ba/BaDashboard';
import { TeamDashboard } from './pages/team/TeamDashboard';
import { ActivityMenuPage } from './pages/ActivityMenuPage';
import LogCustomerActivity from './pages/LogCustomerActivity';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { LogMelaPage } from './pages/placeholders/LogMelaPage';
import { LogBrandingPage } from './pages/placeholders/LogBrandingPage';
import { LogSpecialEventPage } from './pages/placeholders/LogSpecialEventPage';
import { LogPressReleasePage } from './pages/placeholders/LogPressReleasePage';
const NotFoundPage = () => <div className="p-8 text-center"><h1 className="text-3xl font-bold">404: Page Not Found</h1></div>;

// --- Route Guard Components ---
const ManagementRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const isManager = user?.role === 'admin' 
    || user?.role === 'ba_coordinator' 
    || user?.role === 'team_leader' 
    || user?.role === 'team_coordinator';
  return isManager ? <>{children}</> : <Navigate to="/dashboard" replace />;
};
const EmployeeRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const isEligible = user?.role === 'employee' || user?.role === 'team_leader' || user?.role === 'team_coordinator';
  return isEligible ? <>{children}</> : <Navigate to="/dashboard" replace />;
};
const LogActivityRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const canLogAnything = user?.role !== 'admin';
  return canLogAnything ? <>{children}</> : <Navigate to="/dashboard" replace />;
};


export const AppRoutes = () => {
  const { token, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading Application...</div>;
  }
  
  // This logic block handles all password reset routing
  if (token && user) {
    // If user must reset, force them to the change password page
    if (user.force_password_reset) {
      return (
        <Routes>
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="*" element={<Navigate to="/change-password" replace />} />
        </Routes>
      );
    }
    // If user has ALREADY reset but is still on the change-password URL, redirect them away
    if (!user.force_password_reset && location.pathname === '/change-password') {
      return <Navigate to="/" replace />;
    }
  }

  return (
    <Routes>
      {!token ? (
        <>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        <>
          <Route path="/select-campaign" element={<CampaignSelectionPage />} />
          <Route element={<MainLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/ba/dashboard" element={<BaDashboard />} />
            <Route path="/team/dashboard" element={<TeamDashboard />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/my-logs" element={<ActivityLogPage />} />
            <Route path="/log-activity" element={<LogActivityRoute><ActivityMenuPage /></LogActivityRoute>} />
            <Route path="/log/customer-interaction" element={<EmployeeRoute><LogCustomerActivity /></EmployeeRoute>} />
            <Route path="/log/mela" element={<EmployeeRoute><LogMelaPage /></EmployeeRoute>} />
            <Route path="/log/branding" element={<ManagementRoute><LogBrandingPage /></ManagementRoute>} />
            <Route path="/log/special-event" element={<ManagementRoute><LogSpecialEventPage /></ManagementRoute>} />
            <Route path="/log/press-release" element={<ManagementRoute><LogPressReleasePage /></ManagementRoute>} />
            <Route 
              path="/management/*" 
              element={
                <ManagementRoute>
                  <ManagementPortal />
                </ManagementRoute>
              } 
            />
          </Route>
          <Route path="/" element={<Navigate to="/select-campaign" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </>
      )}
    </Routes>
  );
};