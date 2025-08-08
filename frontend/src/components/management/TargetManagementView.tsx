// ==============================================================================
// File: frontend/src/components/management/TargetManagementView.tsx (NEW FILE)
// ==============================================================================
import { useEffect, useState, useMemo } from 'react';
import apiClient from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCampaign } from '../../context/CampaignContext';
import { Save } from 'lucide-react';

interface Team { id: number; name: string; }
interface ActivityType { id: number; name: string; }
interface Target { team_id: number; activity_type_id: number; target_value: number; }

export const TargetManagementView = () => {
    const { user } = useAuth();
    const { selectedCampaign } = useCampaign();
    const [teams, setTeams] = useState<Team[]>([]);
    const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
    const [targets, setTargets] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const targetableActivities = useMemo(() => {
        const targetNames = ["MNP", "SIM Sales", "FTTH", "4G SIM Upgradation", "BNU connections", "Urban connections"];
        return activityTypes.filter(at => targetNames.includes(at.name));
    }, [activityTypes]);

    useEffect(() => {
        if (!user?.ba_id || !selectedCampaign) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [teamsRes, activityTypesRes, targetsRes] = await Promise.all([
                    apiClient.get(`/api/teams/by_ba/${user.ba_id}`),
                    apiClient.get('/api/activities/types'),
                    apiClient.get(`/api/targets/by_ba/${user.ba_id}?campaign_id=${selectedCampaign.id}`)
                ]);
                setTeams(teamsRes.data);
                setActivityTypes(activityTypesRes.data);
                const initialTargets: Record<string, number> = {};
                targetsRes.data.forEach((t: Target) => {
                    initialTargets[`${t.team_id}-${t.activity_type_id}`] = t.target_value;
                });
                setTargets(initialTargets);
            } catch (error) { setMessage({ type: 'error', text: 'Failed to load data.' });
            } finally { setLoading(false); }
        };
        fetchData();
    }, [user, selectedCampaign]);

    const handleTargetChange = (teamId: number, activityTypeId: number, value: string) => {
        const numValue = parseInt(value, 10);
        setTargets(prev => ({ ...prev, [`${teamId}-${activityTypeId}`]: isNaN(numValue) ? 0 : numValue, }));
    };

    const handleSaveTargets = async () => {
        if (!selectedCampaign) return;
        setIsSaving(true);
        setMessage(null);
        const payload = Object.entries(targets).map(([key, value]) => {
            const [team_id, activity_type_id] = key.split('-').map(Number);
            return { team_id, activity_type_id, target_value: value, campaign_id: selectedCampaign.id };
        });
        try {
            await apiClient.post('/api/targets/batch', payload);
            setMessage({ type: 'success', text: 'All targets saved successfully!' });
        } catch (error) { setMessage({ type: 'error', text: 'An error occurred while saving.' });
        } finally { setIsSaving(false); }
    };

    if (loading) return <div>Loading target data...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-bold">Set Team Targets</h2>
                <button onClick={handleSaveTargets} disabled={isSaving} className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md disabled:bg-blue-300">
                    <Save size={20} className="mr-2" />
                    {isSaving ? 'Saving...' : 'Save All Targets'}
                </button>
            </div>
            {message && (<div className={`p-3 text-sm rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message.text}</div>)}
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full">
                    <thead><tr className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-sm"><th className="py-3 px-6 text-left">Team Name</th>{targetableActivities.map(at => (<th key={at.id} className="py-3 px-6 text-center">{at.name} Target</th>))}</tr></thead>
                    <tbody className="text-gray-600 dark:text-gray-300 text-sm">
                        {teams.map(team => (<tr key={team.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">
                                <td className="py-3 px-6 text-left font-semibold">{team.name}</td>
                                {targetableActivities.map(at => (<td key={at.id} className="py-3 px-6 text-center">
                                    <input type="number" min="0" value={targets[`${team.id}-${at.id}`] || ''} onChange={(e) => handleTargetChange(team.id, at.id, e.target.value)} className="w-24 text-center bg-white dark:bg-gray-700 border rounded-md"/>
                                </td>))}
                        </tr>))}
                    </tbody>
                </table>
                 {teams.length === 0 && <p className="p-4 text-center">No teams found. Please create a team first.</p>}
            </div>
        </div>
    );
};