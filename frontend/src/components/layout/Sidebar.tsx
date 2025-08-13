// ==============================================================================
// File: frontend/src/components/layout/Sidebar.tsx (Corrected)
// ==============================================================================
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { ReactNode } from 'react';
import { LayoutDashboard, PencilLine, Users, ListChecks, X, BarChart } from 'lucide-react';

const NavItem = ({
  to,
  children,
  onClick,
}: {
  to: string;
  children: ReactNode;
  onClick?: () => void;
}) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center px-4 py-2 mt-2 text-gray-600 dark:text-gray-300 transition-colors duration-300 transform rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${
        isActive ? 'bg-gray-300 dark:bg-gray-700 font-semibold' : ''
      }`
    }
  >
    {children}
  </NavLink>
);

export const Sidebar = ({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) => {
  const { user } = useAuth();

  // --- Role-based booleans for clarity ---

  // For high-level management (Portal-wide or BA-wide)
  const isManager = user?.role === 'admin' || user?.role === 'ba_coordinator';
  
  // For team-level leadership
  const isTeamLeadOrCoord = user?.role === 'team_leader' || user?.role === 'team_coordinator';
  
  // For anyone who can log activities (BA Coordinators log BA events, others log team/personal events)
  const canLogActivity =
    user?.role === 'ba_coordinator' || 
    user?.role === 'team_coordinator' ||
    user?.role === 'team_leader' ||
    user?.role === 'employee';

  // --- Dynamic Links based on role ---

  // Determine the correct dashboard link for the user's role
  let dashboardLink = '/dashboard'; // Default for employee
  if (user?.role === 'admin') dashboardLink = '/admin/dashboard';
  else if (user?.role === 'ba_coordinator') dashboardLink = '/ba/dashboard';
  else if (isTeamLeadOrCoord) dashboardLink = '/team/dashboard';

  // Determine the correct management link
  let managementLink: string | null = null;
  if (isManager) {
    // Admins and BA Coordinators get a link to the main management portal
    managementLink = '/management'; 
  } else if (isTeamLeadOrCoord && user?.team_id) {
    // Team Leaders/Coordinators get a direct link to their team's detail page
    managementLink = `/management/teams/${user.team_id}`;
  }

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden ${
          isOpen ? 'block' : 'hidden'
        }`}
        onClick={() => setIsOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 px-4 py-8 bg-white dark:bg-gray-800 border-r dark:border-gray-700 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-center text-blue-600">BSNL</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-600 dark:text-gray-300 lg:hidden"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col justify-between flex-1 mt-6">
          <nav>
            {/* Dashboard Link */}
            <NavItem to={dashboardLink} onClick={() => setIsOpen(false)}>
              <LayoutDashboard className="mr-3" size={20} />
              Dashboard
            </NavItem>

            {/* Leaderboard Link */}
            <NavItem to="/leaderboard" onClick={() => setIsOpen(false)}>
              <BarChart className="mr-3" size={20} />
              Leaderboards
            </NavItem>

            {/* Activity Log Link */}
            <NavItem to="/my-logs" onClick={() => setIsOpen(false)}>
              <ListChecks className="mr-3" size={20} />
              Log History
            </NavItem>

            {/* Log Activity Link (Visible to all except Admin) */}
            {canLogActivity && (
              <NavItem to="/log-activity" onClick={() => setIsOpen(false)}>
                <PencilLine className="mr-3" size={20} />
                Log Activity
              </NavItem>
            )}

            {/* Management / My Team Link (Visible to all except Employee) */}
            {managementLink && (
              <NavItem to={managementLink} onClick={() => setIsOpen(false)}>
                <Users className="mr-3" size={20} />
                {isManager ? 'Management' : 'My Team'}
              </NavItem>
            )}
          </nav>
        </div>
      </aside>
    </>
  );
};
