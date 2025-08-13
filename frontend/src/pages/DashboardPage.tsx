// ==============================================================================
// File: frontend/src/pages/DashboardPage.tsx (MODIFIED)
// ==============================================================================
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCampaign } from '../context/CampaignContext';
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import apiClient from '../services/api';
import { Trophy, List, PencilLine, Users } from 'lucide-react';


import { PersonalScoreSummary } from '../components/dashboards/team/PersonalScoreSummary';

// --- MODIFICATION STARTS HERE: Replace the old LeaderboardPreview ---
const LeaderboardPreview = () => {
    const { selectedCampaign } = useCampaign();
    // State to hold BA leaderboard data
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!selectedCampaign) return;
        const fetchPreview = async () => {
            try {
                // Fetch the BA leaderboard instead of the employee one
                const response = await apiClient.get(`/api/leaderboard/ba/${selectedCampaign.id}`);
                setPreviewData(response.data.slice(0, 5)); // Get top 5 BAs
            } catch (error) { console.error("Failed to fetch BA leaderboard preview", error); } 
            finally { setLoading(false); }
        };
        fetchPreview();
    }, [selectedCampaign]);

    if (loading) return <div className="mt-4 p-4 border dark:border-gray-700 rounded-lg">Loading preview...</div>;

    return (
        <div className="mt-4 p-4 border dark:border-gray-700 rounded-lg">
            {previewData.length > 0 ? (
                <ul className="space-y-2">
                    {previewData.map((item, index) => (
                        // Use ba_id as key and render ba_name
                        <li key={item.ba_id} className="flex justify-between items-center py-1">
                            <span className="flex items-center">
                                {index < 3 ? <Trophy size={16} className="mr-2 text-yellow-500" /> : <span className="w-6 mr-2 text-center">{index + 1}</span>} 
                                {item.ba_name}
                            </span>
                            <span className="font-bold">{item.total_score} pts</span>
                        </li>
                    ))}
                </ul>
            ) : <p>No performance data yet for any Business Area.</p>}
        </div>
    );
};
// --- MODIFICATION ENDS HERE ---


export const DashboardPage = () => {
    const { user } = useAuth();
    const { selectedCampaign } = useCampaign();
    if (!selectedCampaign) return <Navigate to="/select-campaign" replace />;
    const isManager = user?.role === 'admin' || user?.role === 'ba_coordinator';

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-lg text-gray-500 dark:text-gray-400">Campaign: {selectedCampaign.name}</p>
            </div>

             <PersonalScoreSummary />

             
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link to="/leaderboard" className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 flex flex-col items-center text-center">
                    <List size={32} className="text-blue-500"/>
                    <h2 className="mt-4 text-xl font-bold text-blue-600 dark:text-blue-400">View Leaderboards</h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">See rankings by member, team, and BA.</p>
                </Link>
                {user?.role === 'employee' && (
                    <Link to="/log-activity" className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 flex flex-col items-center text-center">
                        <PencilLine size={32} className="text-green-500"/>
                        <h2 className="mt-4 text-xl font-bold text-green-600 dark:text-green-400">Log Activity</h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Log your daily activities and sales.</p>
                    </Link>
                )}
                {isManager && (
                     <Link to="/management/teams" className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 flex flex-col items-center text-center">
                        <Users size={32} className="text-indigo-500"/>
                        <h2 className="mt-4 text-xl font-bold text-indigo-600 dark:text-indigo-400">Manage Portal</h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Manage teams, targets, and monitor data.</p>
                    </Link>
                )}
            </div>
            <div>
               <h2 className="text-2xl font-bold">BA Leaderboard Snapshot</h2>
                <LeaderboardPreview />
            </div>
        </div>
    );
};