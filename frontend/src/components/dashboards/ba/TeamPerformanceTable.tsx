// ==============================================================================
// File: frontend/src/components/dashboards/ba/TeamPerformanceTable.tsx (REFACTORED)
// ==============================================================================
import { useCampaign } from '../../../context/CampaignContext';
import { useAuth } from '../../../context/AuthContext';
import { useApiData } from '../../../hooks/useApiData';
import { Link } from 'react-router-dom';

interface PerformanceData {
  id: number;
  name: string;
  team_name?: string; 
  score: number;
  leader_name?: string;
  coordinator_name?: string;
}

export const TeamPerformanceTable = () => {
  const { selectedCampaign } = useCampaign();
  const { user } = useAuth();
  const endpoint = selectedCampaign && user?.ba_id ? `/api/dashboard/team_performance/${selectedCampaign.id}/${user.ba_id}` : null;
  const { data, loading, error } = useApiData<PerformanceData[]>(endpoint);

  if (loading) return <p>Loading team performance data...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Team Performance Leaderboard</h2>
      {data && data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-200 dark:bg-gray-700 uppercase text-sm">
                <th className="py-3 px-4 text-left">Rank</th>
                <th className="py-3 px-4 text-left">Team Name</th>
                <th className="py-3 px-4 text-left">Team Code</th>
                <th className="py-3 px-4 text-left">Leader / Coordinator</th>
                <th className="py-3 px-4 text-right">Total Score</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={row.id} className="border-b hover:bg-gray-100 dark:hover:bg-gray-700">
                  <td className="py-3 px-4 font-medium">{index + 1}</td>
                  <td className="py-3 px-4 font-bold">
                    {/* Display Team Name with a link */}
                    <Link to={`/management/teams/${row.id}`} className="text-blue-600 hover:underline">
                      {row.team_name || 'Unnamed Team'}
                    </Link>
                  </td>
                  <td className="py-3 px-4 font-bold">
                    <Link to={`/management/teams/${row.id}`} className="text-blue-600 hover:underline">
                      {row.name}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-xs">
                    <div>{row.leader_name} (L)</div>
                    <div>{row.coordinator_name} (C)</div>
                  </td>
                  <td className="py-3 px-4 text-right font-bold">{row.score.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500">No performance data available.</p>
      )}
    </div>
  );
};