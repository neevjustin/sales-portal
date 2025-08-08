// ==============================================================================
// File: frontend/src/components/management/BaTargetManagementView.tsx (NEW FILE)
// Description: Admin-only view to set targets for each Business Area.
// ==============================================================================
import { useEffect, useState, useMemo } from 'react';
import apiClient from '../../services/api';
import { useCampaign } from '../../context/CampaignContext';
import { Save } from 'lucide-react';

// Define the shape of the data we'll be working with
interface BusinessArea {
  id: number;
  name: string;
}

interface ActivityType {
  id: number;
  name: string;
}

interface BaTarget {
  ba_id: number;
  activity_type_id: number;
  target_value: number;
}

export const BaTargetManagementView = () => {
    // State for holding business areas, activity types, and the targets themselves
    const [businessAreas, setBusinessAreas] = useState<BusinessArea[]>([]);
    const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
    const [targets, setTargets] = useState<Record<string, number>>({});
    
    // State for UI feedback
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const { selectedCampaign } = useCampaign();

    // Memoize the list of activities that can have targets to prevent recalculation
    const targetableActivities = useMemo(() => {
        const targetNames = ["MNP", "SIM Sales", "4G SIM Upgradation", "BNU connections", "Urban connections"];
        return activityTypes.filter(at => targetNames.includes(at.name));
    }, [activityTypes]);

    // Fetch all necessary data when the component mounts or campaign changes
    useEffect(() => {
        if (!selectedCampaign) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Use Promise.all to fetch data in parallel for better performance
                const [baRes, activityTypesRes, targetsRes] = await Promise.all([
                    apiClient.get('/api/teams/business-areas/'),
                    apiClient.get('/api/activities/types'),
                    apiClient.get(`/api/targets/by_circle/${selectedCampaign.id}`)
                ]);

                setBusinessAreas(baRes.data);
                setActivityTypes(activityTypesRes.data);
                
                // Format the existing targets into a lookup object for easy access
                const initialTargets: Record<string, number> = {};
                targetsRes.data.forEach((t: BaTarget) => {
                    initialTargets[`${t.ba_id}-${t.activity_type_id}`] = t.target_value;
                });
                setTargets(initialTargets);

            } catch (error) {
                setMessage({ type: 'error', text: 'Failed to load initial target data.' });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedCampaign]);

    // Handle changes to the input fields
    const handleTargetChange = (baId: number, activityTypeId: number, value: string) => {
        const numValue = parseInt(value, 10);
        setTargets(prev => ({
            ...prev,
            [`${baId}-${activityTypeId}`]: isNaN(numValue) ? 0 : numValue,
        }));
    };

    // Save all targets to the backend
    const handleSaveTargets = async () => {
        if (!selectedCampaign) return;
        setIsSaving(true);
        setMessage(null);

        // Convert the state object into the array format the API expects
        const payload = Object.entries(targets).map(([key, value]) => {
            const [ba_id, activity_type_id] = key.split('-').map(Number);
            return { ba_id, activity_type_id, target_value: value, campaign_id: selectedCampaign.id };
        });

        try {
            await apiClient.post('/api/targets/batch_ba', payload);
            setMessage({ type: 'success', text: 'All BA targets saved successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred while saving targets.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div>Loading BA Target Management...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-bold">Set Business Area Targets</h2>
                <button 
                    onClick={handleSaveTargets} 
                    disabled={isSaving} 
                    className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md disabled:bg-blue-300"
                >
                    <Save size={20} className="mr-2" />
                    {isSaving ? 'Saving...' : 'Save All Targets'}
                </button>
            </div>

            {message && (
                <div className={`p-3 text-sm rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-sm">
                            <th className="py-3 px-6 text-left">Business Area</th>
                            {targetableActivities.map(at => (
                                <th key={at.id} className="py-3 px-6 text-center">{at.name}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 dark:text-gray-300 text-sm">
                        {businessAreas && Array.isArray(businessAreas) && businessAreas.map(ba => (
                            <tr key={ba.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">
                                <td className="py-3 px-6 text-left font-semibold">{ba.name}</td>
                                {targetableActivities.map(at => (
                                    <td key={at.id} className="py-3 px-6 text-center">
                                        <input 
                                            type="number" 
                                            min="0" 
                                            value={targets[`${ba.id}-${at.id}`] || ''} 
                                            onChange={(e) => handleTargetChange(ba.id, at.id, e.target.value)} 
                                            className="w-24 text-center bg-white dark:bg-gray-700 border rounded-md p-1"
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {businessAreas.length === 0 && <p className="p-4 text-center">No Business Areas found. Please contact support.</p>}
            </div>
        </div>
    );
};
