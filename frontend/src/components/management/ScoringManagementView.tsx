// ==============================================================================
// File: frontend/src/components/management/ScoringManagementView.tsx (NEW FILE)
// ==============================================================================
import { useState } from 'react';
import apiClient from '../../services/api';
import { useCampaign } from '../../context/CampaignContext';
import { Calculator } from 'lucide-react';

export const ScoringManagementView = () => {
    const { selectedCampaign } = useCampaign();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleRecalculate = async () => {
        if (!selectedCampaign) {
            setMessage({ type: 'error', text: 'Please select a campaign first.' });
            return;
        }
        if (!window.confirm("Are you sure you want to recalculate all scores for this campaign? This can be a slow process.")) {
            return;
        }

        setIsLoading(true);
        setMessage(null);
        try {
            const response = await apiClient.post(`/api/admin/recalculate-scores/${selectedCampaign.id}`);
            setMessage({ type: 'success', text: response.data.message });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.detail || 'An error occurred.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Scoring Engine Management</h2>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold">Recalculate Campaign Scores</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    This will delete all current scores for the selected campaign and recalculate them based on all logged activities. Use this if you have made changes to the scoring logic or have corrected underlying data.
                </p>
                <div className="mt-4">
                    <button
                        onClick={handleRecalculate}
                        disabled={isLoading}
                        className="flex items-center justify-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg shadow-md disabled:bg-yellow-300"
                    >
                        <Calculator size={20} className="mr-2" />
                        {isLoading ? 'Recalculating...' : `Recalculate Scores for ${selectedCampaign?.name}`}
                    </button>
                </div>
                {message && (
                    <div className={`mt-4 p-3 text-sm rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}
            </div>
        </div>
    );
};