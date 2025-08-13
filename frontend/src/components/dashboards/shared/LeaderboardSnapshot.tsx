// ===== File: frontend/src/components/dashboards/shared/LeaderboardSnapshot.tsx (NEW FILE) =====

import { useState, useEffect } from 'react';
import { useCampaign } from '../../../context/CampaignContext';
import { Trophy } from 'lucide-react';
import apiClient from '../../../services/api';

interface LeaderboardEntry {
  employee_id: number;
  employee_name: string;
  total_score: number;
}

// This component is designed to be safely embedded in any dashboard
export const LeaderboardSnapshot = ({ ba_id }: { ba_id: number | null }) => {
    const { selectedCampaign } = useCampaign();
    const [previewData, setPreviewData] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!selectedCampaign || !ba_id) return;

        const fetchPreview = async () => {
            setLoading(true);
            try {
                // Fetch the employee leaderboard filtered by the specific BA
                const response = await apiClient.get(
                    `/api/leaderboard/employee/${selectedCampaign.id}?ba_id=${ba_id}`
                );
                // Get the top 5 employees
                setPreviewData(response.data.slice(0, 5));
            } catch (error) {
                console.error("Failed to fetch BA leaderboard snapshot", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPreview();
    }, [selectedCampaign, ba_id]);

    if (loading) return <div className="p-4">Loading preview...</div>;

    return (
        <div className="p-4 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
            {previewData.length > 0 ? (
                <ul className="space-y-3">
                    {previewData.map((item, index) => (
                        <li key={item.employee_id} className="flex justify-between items-center py-1">
                            <span className="flex items-center">
                                {index < 3 ? (
                                    <Trophy size={16} className="mr-2 text-yellow-500" />
                                ) : (
                                    <span className="w-6 mr-2 text-center">{index + 1}</span>
                                )} 
                                {item.employee_name}
                            </span>
                            <span className="font-bold">{item.total_score} pts</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500">No performance data yet for any employee in this BA.</p>
            )}
        </div>
    );
};