// ===== File: frontend/src/pages/ManagementPortal.tsx (FINAL CORRECTED VERSION) =====

import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { TeamManagementView } from '../components/management/TeamManagementView';
import { TargetManagementView } from '../components/management/TargetManagementView';
import { DataMonitoringView } from '../components/management/DataMonitoringView';
import { BaTargetManagementView } from '../components/management/BaTargetManagementView';
import { ScoringManagementView } from '../components/management/ScoringManagementView';
import { TeamDetailPage } from './TeamDetailPage';
import { useAuth } from '../context/AuthContext';

export const ManagementPortal = () => {
    const { user } = useAuth();
    
    const isAdmin = user?.role === 'admin';
    const isBaCoordinator = user?.role === 'ba_coordinator';
    const isTeamLeadOrCoord = user?.role === 'team_leader' || user?.role === 'team_coordinator';

    const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
        `py-2 px-4 whitespace-nowrap border-b-2 font-medium text-sm ${
            isActive 
            ? 'border-blue-500 text-blue-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700'
        }`;
        
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">
                {isTeamLeadOrCoord ? 'My Team Management' : 'Management Portal'}
            </h1>
            <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-6 overflow-x-auto">
                    {isAdmin && (
                        <>
                            {/* --- THIS IS THE FIX: Use absolute paths for Admin links --- */}
                            <NavLink to="/management/ba-targets" className={getNavLinkClass}>BA Targets</NavLink>
                            <NavLink to="/management/scoring" className={getNavLinkClass}>Scoring</NavLink>
                        </>
                    )}
                    {isBaCoordinator && (
                        <>
                            <NavLink to="/management/teams" end className={getNavLinkClass}>Teams & Members</NavLink>
                            <NavLink to="/management/targets" className={getNavLinkClass}>Team Targets</NavLink>
                            <NavLink to="/management/monitoring" className={getNavLinkClass}>Data Monitoring</NavLink>
                        </>
                    )}
                </nav>
            </div>
            
            <Routes>
                {isAdmin && (
                    <>
                        <Route path="ba-targets" element={<BaTargetManagementView />} />
                        <Route path="scoring" element={<ScoringManagementView />} />
                        <Route index element={<Navigate to="ba-targets" replace />} />
                    </>
                )}
                {isBaCoordinator && (
                    <>
                        <Route path="teams" element={<TeamManagementView />} />
                        <Route path="teams/:teamId" element={<TeamDetailPage />} />
                        <Route path="targets" element={<TargetManagementView />} />
                        <Route path="monitoring" element={<DataMonitoringView />} />
                        <Route index element={<Navigate to="teams" replace />} />
                    </>
                )}
                {isTeamLeadOrCoord && (
                    <>
                        <Route path="teams/:teamId" element={<TeamDetailPage />} />
                        <Route index element={
                            user?.team_id 
                            ? <Navigate to={`teams/${user.team_id}`} replace />
                            : <p>You are not assigned to a team.</p>
                        } />
                    </>
                )}
                 <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </div>
    );
};