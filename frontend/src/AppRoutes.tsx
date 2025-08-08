// ==============================================================================
// File: frontend/src/AppRoutes.tsx (Fully Corrected)
// Description: Defines all application routes and ensures correct guards are used
// for all placeholder pages.
// ==============================================================================
import { Routes, Route, Navigate } from 'react-router-dom';
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

// --- Placeholder Page Imports ---
// Make sure you have created these placeholder files in your project
import { LogMelaPage } from './pages/placeholders/LogMelaPage';
import { LogBrandingPage } from './pages/placeholders/LogBrandingPage';
import { LogSpecialEventPage } from './pages/placeholders/LogSpecialEventPage';
import { LogPressReleasePage } from './pages/placeholders/LogPressReleasePage';


const NotFoundPage = () => <div className="p-8 text-center"><h1 className="text-3xl font-bold">404: Page Not Found</h1></div>;

// --- Route Guard Components ---

// For Admins and BA Coordinators
const ManagementRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const isManager = user?.role === 'admin' || user?.role === 'ba_coordinator';
  return isManager ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

// For team-level members (employees, leaders, coordinators)
const EmployeeRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const isEligible = user?.role === 'employee' || user?.role === 'team_leader' || user?.role === 'team_coordinator';
  return isEligible ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

// For anyone who can access the activity menu (all roles except admin)
const LogActivityRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const canLogAnything =
    user?.role === 'employee' ||
    user?.role === 'team_leader' ||
    user?.role === 'team_coordinator' ||
    user?.role === 'ba_coordinator';
  return canLogAnything ? <>{children}</> : <Navigate to="/dashboard" replace />;
};


export const AppRoutes = () => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading Application...</div>;
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
            {/* Main Pages */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/ba/dashboard" element={<BaDashboard />} />
            <Route path="/team/dashboard" element={<TeamDashboard />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/my-logs" element={<ActivityLogPage />} />
            
            {/* Activity Logging Flow */}
            <Route path="/log-activity" element={<LogActivityRoute><ActivityMenuPage /></LogActivityRoute>} />
            
            {/* Team-Level Forms */}
            <Route path="/log/customer-interaction" element={<EmployeeRoute><LogCustomerActivity /></EmployeeRoute>} />
            <Route path="/log/mela" element={<EmployeeRoute><LogMelaPage /></EmployeeRoute>} />
            
            {/* BA-Level Forms (Correctly defined and guarded) */}
            <Route path="/log/branding" element={<ManagementRoute><LogBrandingPage /></ManagementRoute>} />
            <Route path="/log/special-event" element={<ManagementRoute><LogSpecialEventPage /></ManagementRoute>} />
            <Route path="/log/press-release" element={<ManagementRoute><LogPressReleasePage /></ManagementRoute>} />

            {/* Management Portal */}
            <Route 
              path="/management/*" 
              element={
                <ManagementRoute>
                  <ManagementPortal />
                </ManagementRoute>
              } 
            />
          </Route>
          
          {/* Default and Catch-all Routes */}
          <Route path="/" element={<Navigate to="/select-campaign" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </>
      )}
    </Routes>
  );
};
