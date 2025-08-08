// ==============================================================================
// File: frontend/src/components/management/TeamManagementView.tsx (MODIFIED)
// ==============================================================================
import { useEffect, useState } from 'react';
import apiClient from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCampaign } from '../../context/CampaignContext';
import { Navigate, Link } from 'react-router-dom';
import { PlusCircle, Upload } from 'lucide-react';
import { CreateTeamModal } from './CreateTeamModal'; // <-- IMPORT
import { UploadTeamModal } from './UploadTeamModal'; // <-- IMPORT

interface Team { id: number; name: string; team_code: string; }

export const TeamManagementView = () => {
    const { user } = useAuth();
    const { selectedCampaign } = useCampaign();
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const fetchTeams = async () => {
        if (selectedCampaign && user?.ba_id) {
            setLoading(true);
            try {
                const response = await apiClient.get(`/api/teams/by_ba/${user.ba_id}`);
                setTeams(response.data);
            } catch (error) {
                console.error("Failed to fetch teams", error);
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => { fetchTeams(); }, [selectedCampaign, user]);

    if (!selectedCampaign) return <Navigate to="/select-campaign" replace />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-2xl font-bold">Manage Teams</h2>
                <div className="flex gap-2">
                    <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg">
                        <Upload size={20} className="mr-2" />
                        Upload Excel
                    </button>
                    <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg">
                        <PlusCircle size={20} className="mr-2" />
                        Create Team
                    </button>
                </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">Your Teams</h3>
                {loading ? <p>Loading teams...</p> : (
                    <div className="space-y-4">
                        {teams.map(team => (
                            <div key={team.id} className="p-4 border rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-lg">{team.team_code}</p>
                                    <p className="text-sm text-gray-500">{team.name}</p>
                                </div>
                                <Link to={`/management/teams/${team.id}`} className="bg-gray-200 hover:bg-gray-300 font-bold py-2 px-4 rounded text-sm no-underline">
                                    Manage Members
                                </Link>
                            </div>
                        ))}
                        {teams.length === 0 && <p className="text-gray-500">No teams have been created for this campaign in your BA yet.</p>}
                    </div>
                )}
            </div>

            <CreateTeamModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onTeamCreated={fetchTeams} />
            <UploadTeamModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onUploadSuccess={fetchTeams} />
        </div>
    );
};