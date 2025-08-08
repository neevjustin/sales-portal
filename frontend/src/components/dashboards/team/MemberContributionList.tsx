// ==============================================================================
// File: frontend/src/components/dashboards/team/MemberContributionList.tsx (REFACTORED)
// ==============================================================================
import { useCampaign } from '../../../context/CampaignContext';
import { useAuth } from '../../../context/AuthContext';
import { useApiData } from '../../../hooks/useApiData';

interface PerformanceData {
  id: number;
  name: string;
  score: number;
}

export const MemberContributionList = () => {
  const { selectedCampaign } = useCampaign();
  const { user } = useAuth();
  const endpoint = selectedCampaign && user?.team_id ? `/api/dashboard/team_members/${selectedCampaign.id}/${user.team_id}` : null;
  const { data, loading, error } = useApiData<PerformanceData[]>(endpoint);

  if (loading) return <p>Loading team member data...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Member Contributions</h2>
      {data && data.length > 0 ? (
        <ul className="space-y-3">
          {data.map((member, index) => (
            <li key={member.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
              <span className="font-medium">{index + 1}. {member.name}</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{member.score} pts</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No member data available.</p>
      )}
    </div>
  );
};