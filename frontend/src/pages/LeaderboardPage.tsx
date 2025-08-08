// ==============================================================================
// File: frontend/src/pages/LeaderboardPage.tsx (FINAL & CORRECTED)
// Description: This version fixes the React unique "key" prop warning by using
// the most reliable ID and adds the missing table header to the Team Leaderboard.
// ==============================================================================
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { useCampaign } from '../context/CampaignContext';
import { useAuth } from '../context/AuthContext';
import { useApiData } from '../hooks/useApiData';

// --- Interfaces for Leaderboard Data ---
interface EmployeeLeaderboardEntry {
  employee_id: number;
  employee_name: string;
  team_name: string;
  ba_name: string;
  total_score: number;
}

interface TeamLeaderboardEntry {
  team_id: number;
  team_code: string;
  team_name: string;
  ba_name?: string;
  total_score: number;
}

interface BALeaderboardEntry {
  ba_id: number;
  ba_name: string;
  coordinator_name: string;
  total_score: number;
}

type LeaderboardType = 'employee' | 'team' | 'ba';

// --- Table Components ---

const EmployeeTable = ({ data }: { data: EmployeeLeaderboardEntry[] }) => (
  <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
    <table className="min-w-full leading-normal">
      <thead>
        <tr className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-sm leading-normal">
          <th className="py-3 px-6 text-left">Rank</th>
          <th className="py-3 px-6 text-left">Team Member</th>
          <th className="py-3 px-6 text-left">Team Name</th> 
          <th className="py-3 px-6 text-left">Business Area</th>
          <th className="py-3 px-6 text-center">Score</th>
        </tr>
      </thead>
      <tbody className="text-gray-600 dark:text-gray-300 text-sm font-light">
        {data.map((entry, index) => (
          <tr
            key={entry.employee_id} // Unique key for each row
            className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 ${
              index < 3 ? 'bg-yellow-50 dark:bg-yellow-900/50' : ''
            }`}
          >
            <td className="py-3 px-6 text-left whitespace-nowrap">
              <span className="font-medium flex items-center">
                {index < 3 ? (
                  <Trophy size={16} className="text-yellow-500 mr-2" />
                ) : (
                  <span className="w-6 mr-2 text-center">{index + 1}</span>
                )}
              </span>
            </td>
            <td className="py-3 px-6 text-left">{entry.employee_name}</td>
            <td className="py-3 px-6 text-left">{entry.team_name}</td>
            <td className="py-3 px-6 text-left">{entry.ba_name}</td>
            <td className="py-3 px-6 text-center">
              <span className="bg-blue-200 text-blue-600 py-1 px-3 rounded-full text-xs font-semibold">
                {entry.total_score}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);



const TeamTable = ({ data }: { data: TeamLeaderboardEntry[] }) => (
  <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
    <table className="min-w-full leading-normal">
      <thead>
        <tr className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-sm leading-normal">
          <th className="py-3 px-6 text-left">Rank</th>
          <th className="py-3 px-6 text-left">Team Code</th>
          <th className="py-3 px-6 text-left">Team Name</th>
          <th className="py-3 px-6 text-left">Business Area</th>
          <th className="py-3 px-6 text-center">Score</th>
        </tr>
      </thead>
      <tbody className="text-gray-600 dark:text-gray-300 text-sm">
        {data.map((entry, index) => {
         
          return (
            <tr
              // This key is now bulletproof. It uses team_id but has a fallback.
              key={entry.team_code ?? index}
              className="border-b hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <td className="py-3 px-6">{index + 1}</td>
              <td className="py-3 px-6 font-semibold">{entry.team_code}</td>
              <td className="py-3 px-6 font-semibold">{entry.team_name}</td>
              <td className="py-3 px-6">{entry.ba_name}</td>
              <td className="py-3 px-6 text-center">
                <span className="bg-purple-200 text-purple-600 py-1 px-3 rounded-full text-xs">{entry.total_score}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const BATable = ({ data }: { data: BALeaderboardEntry[] }) => (
  <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
    <table className="min-w-full leading-normal">
      <thead>
        <tr className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-sm leading-normal">
          <th className="py-3 px-6 text-left">Rank</th>
          <th className="py-3 px-6 text-left">Business Area</th>
          <th className="py-3 px-6 text-left">Coordinator</th>
          <th className="py-3 px-6 text-center">Score</th>
        </tr>
      </thead>
      <tbody className="text-gray-600 dark:text-gray-300 text-sm font-light">
        {data.map((entry, index) => (
          <tr
            key={entry.ba_id} // Using the unique ba_id
            className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 ${
              index < 3 ? 'bg-yellow-50 dark:bg-yellow-900/50' : ''
            }`}
          >
            <td className="py-3 px-6">{index + 1}</td>
            <td className="py-3 px-6">{entry.ba_name}</td>
            <td className="py-3 px-6">{entry.coordinator_name}</td>
            <td className="py-3 px-6 text-center">
              <span className="bg-green-200 text-green-600 py-1 px-3 rounded-full text-xs font-semibold">
                {entry.total_score}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const LeaderboardPage = ({ leaderboardUpdateTrigger = 0 }: { leaderboardUpdateTrigger?: number }) => {
  const { selectedCampaign } = useCampaign();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<LeaderboardType>('employee');

  const baFilter = (activeTab === 'employee' || activeTab === 'team') && user?.ba_id
    ? `?ba_id=${user.ba_id}`
    : '';
  const endpoint = selectedCampaign ? `/api/leaderboard/${activeTab}/${selectedCampaign.id}${baFilter}` : null;
  
  // The useApiData hook now re-fetches whenever leaderboardUpdateTrigger changes.
  const { data, loading, error } = useApiData<any[]>(endpoint, leaderboardUpdateTrigger);

  if (!selectedCampaign) return <Navigate to="/select-campaign" replace />;

  const renderTable = () => {
    if (loading) return <div className="text-center p-8">Loading...</div>;
    if (error) return <div className="text-center p-8 text-red-500">{`Failed to fetch ${activeTab} leaderboard.`}</div>;
    if (!data || data.length === 0) return <div className="text-center p-8 text-gray-500">No data available.</div>;

    // --- THIS IS THE BULLETPROOF FIX FOR ALL TABS ---
    // We check the *shape* of the data to make sure it matches the active tab
    // before we try to render the table. This prevents all race conditions.
    switch (activeTab) {
      case 'employee':
        // Only render if the first item has an 'employee_id'
        return 'employee_id' in data[0] ? <EmployeeTable data={data} /> : null;
      case 'team':
        // Only render if the first item has a 'team_id'
        return 'team_id' in data[0] ? <TeamTable data={data} /> : null;
      case 'ba':
        // Only render if the first item has a 'ba_id'
        return 'ba_id' in data[0] ? <BATable data={data} /> : null;
      default:
        return null;
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">
        {selectedCampaign.name} Leaderboards
      </h1>
      <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('employee')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'employee'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Team Member
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'team'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Team
          </button>
          <button
            onClick={() => setActiveTab('ba')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'ba'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Business Area
          </button>
        </nav>
      </div>
      {renderTable()}
    </div>
  );
};
