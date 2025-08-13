// ===== File: frontend/src/components/management/TeamManagementView.tsx (CORRECTED) =====

import { useEffect, useState, useMemo } from 'react';
import { Navigate, Link } from 'react-router-dom';
import apiClient from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCampaign } from '../../context/CampaignContext';
import { Upload, Download } from 'lucide-react';
import { CreateTeamModal } from './CreateTeamModal';
import { UploadTeamModal } from './UploadTeamModal';

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

    const handleDownload = async () => {
        try {
            const response = await apiClient.get('/api/upload/teams/template', {
                responseType: 'blob', // Important: tells axios to expect a binary file
            });
            
            // Create a URL for the blob data
            const url = window.URL.createObjectURL(new Blob([response.data]));
            
            // Create a temporary link element to trigger the download
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'bsnl_team_upload_template.xlsx'); // File name
            document.body.appendChild(link);
            link.click();
            
            // Clean up the temporary link and URL
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Failed to download template", error);
            alert("Could not download the template file. Please try again.");
        }
    };

    useEffect(() => { fetchTeams(); }, [selectedCampaign, user]);

    // Filter out the BA's own admin team (e.g., TVM_00) from the display list
    const operationalTeams = useMemo(() => {
        return teams.filter(team => team.team_code && !team.team_code.endsWith('_00'));
    }, [teams]);

    if (!selectedCampaign) return <Navigate to="/select-campaign" replace />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-2xl font-bold">Manage Teams & Members</h2>
                <div className="flex gap-2">

                    <button onClick={handleDownload} className="flex items-center justify-center px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg">
                        <Download size={20} className="mr-2" />
                        Download Excel Template
                    </button>

                    
                    <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg">
                        <Upload size={20} className="mr-2" />
                        Upload Excel
                    </button>
                </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">Your Operational Teams</h3>
                {loading ? <p>Loading teams...</p> : (
                    <div className="space-y-4">
                        {operationalTeams.length > 0 ? (
                            operationalTeams.map(team => (
                                <div key={team.id} className="p-4 border dark:border-gray-700 rounded-lg flex justify-between items-center">
                                     <div>
                                        <p className="font-bold text-lg">{team.name}</p>
                                        <p className="text-sm text-gray-500">{team.team_code}</p>
                                     </div>
                                    <Link to={`/management/teams/${team.id}`} className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 font-bold py-2 px-4 rounded text-sm no-underline">
                                        Manage Members
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center p-4">
                                No operational teams found. Use the "Upload Excel" button to perform a clean install of your teams.
                            </p>
                        )}
                    </div>
                )}
            </div>

            <CreateTeamModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onTeamCreated={fetchTeams} />
            <UploadTeamModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onUploadSuccess={fetchTeams} />
        </div>
    );
};