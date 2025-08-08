// ==============================================================================
// File: frontend/src/components/dashboards/admin/BaPerformanceTable.tsx (REFACTORED)
// ==============================================================================
import { useCampaign } from '../../../context/CampaignContext';
import { useApiData } from '../../../hooks/useApiData';

interface PerformanceData {
  id: number;
  name: string;
  score: number;
  coordinator_name?: string;
}

export const BaPerformanceTable = () => {
  const { selectedCampaign } = useCampaign();
  const endpoint = selectedCampaign ? `/api/dashboard/ba_performance/${selectedCampaign.id}` : null;
  const { data, loading, error } = useApiData<PerformanceData[]>(endpoint);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">BA Performance Leaderboard</h2>

      {loading && <p>Loading BA performance data...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && data && (
        data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-200 dark:bg-gray-700 uppercase text-sm">
                  <th className="py-3 px-4 text-left">Rank</th>
                  <th className="py-3 px-4 text-left">Business Area</th>
                  <th className="py-3 px-4 text-left">BA Head</th>
                  <th className="py-3 px-4 text-right">Total Score</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={row.id} className="border-b hover:bg-gray-100 dark:hover:bg-gray-700">
                    <td className="py-3 px-4 font-medium">{index + 1}</td>
                    <td className="py-3 px-4">{row.name}</td>
                    <td className="py-3 px-4">{row.coordinator_name}</td>
                    <td className="py-3 px-4 text-right font-bold">{row.score.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No performance data available yet for any Business Area.</p>
        )
      )}
    </div>
  );
};
