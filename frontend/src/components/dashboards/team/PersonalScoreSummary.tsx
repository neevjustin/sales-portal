// ==============================================================================
// File: frontend/src/components/dashboards/team/PersonalScoreSummary.tsx (Final)
// Description: Displays a personal score summary and progress towards team goals.
// Connects to a global store for real-time updates of the total score.
// ==============================================================================
import { useApiData } from '../../../hooks/useApiData';
import { useCampaign } from '../../../context/CampaignContext';
import { Award, Target, TrendingUp } from 'lucide-react';
import { useScoreStore } from '../../../store/scoreStore';
import { useEffect } from 'react';

// --- Interfaces for the API data shape ---
interface PerformanceData {
  id: number;
  name: string;
  score: number;
}

interface PersonalProgress {
  parameter: string;
  achieved: number;
  target: number;
}

interface PersonalScoreSummaryData {
  total_score: number;
  breakdown: PerformanceData[];
  progress: PersonalProgress[];
}

const ProgressBar = ({ achieved, target, parameter }: { achieved: number; target: number; parameter: string }) => {
    const percentage = target > 0 ? Math.min((achieved / target) * 100, 100) : 0;
  
    return (
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-base font-medium text-gray-700 dark:text-gray-300">{parameter}</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{achieved} / {target}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
        </div>
      </div>
    );
};

export const PersonalScoreSummary = () => {
    const { selectedCampaign } = useCampaign();
    const endpoint = selectedCampaign ? `/api/dashboard/my_summary/${selectedCampaign.id}` : null;

    // Get score and initializer from the global store
    const { totalScore, initializeScore } = useScoreStore();

    // Fetch the detailed breakdown and progress data from the API
    const { data, loading, error } = useApiData<PersonalScoreSummaryData>(endpoint);

    // Use an effect to initialize the score when data first loads from the API
    useEffect(() => {
        if (data) {
            // This sets the initial score in the store. It will only run once
            // or if the user refreshes the page, ensuring the score is always
            // in sync with the official backend data on load.
            initializeScore(data.total_score);
        }
    }, [data, initializeScore]);

    if (loading) return <div className="p-4 text-center">Loading Personal Summary...</div>;
    if (error) return <div className="p-4 text-red-500 text-center">Could not load personal summary.</div>;
    if (!data) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Total Score Card */}
            <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col justify-center items-center">
                <Award size={48} className="text-yellow-500" />
                <h3 className="mt-4 text-lg font-semibold text-gray-500 dark:text-gray-400">Your Total Score</h3>
                {/* Display the score from the store for real-time updates, fallback to API data */}
                <p className="text-5xl font-bold text-gray-800 dark:text-gray-200">
                    {totalScore !== null ? totalScore : data.total_score}
                </p>
            </div>

            {/* Score Breakdown Card */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4 flex items-center"><TrendingUp size={24} className="mr-2 text-green-500"/>Score Breakdown</h3>
                {data.breakdown.length > 0 ? (
                    <ul className="space-y-2">
                        {data.breakdown.map((item) => (
                            <li key={item.id} className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                                <span>{item.name}</span>
                                <span className="font-bold text-green-600 dark:text-green-400">{item.score} pts</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">Log an activity to see your score breakdown.</p>
                )}
            </div>

            {/* Progress Towards Team Goals Card */}
            {data.progress.length > 0 && (
                 <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold mb-4 flex items-center"><Target size={24} className="mr-2 text-blue-500"/>Contribution to Team Goals</h3>
                    <div className="space-y-4">
                        {data.progress.map(p => (
                            <ProgressBar key={p.parameter} achieved={p.achieved} target={p.target} parameter={p.parameter} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
