// ==============================================================================
// File: frontend/src/components/management/CreateTeamModal.tsx (CORRECTED)
// Description: This version adds the "Team Name" input field back.
// ==============================================================================
import { useState, FormEvent } from 'react';
import { Modal } from '../ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { useCampaign } from '../../context/CampaignContext';
import apiClient from '../../services/api';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamCreated: () => void;
}

export const CreateTeamModal = ({ isOpen, onClose, onTeamCreated }: CreateTeamModalProps) => {
    const { user } = useAuth();
    const { selectedCampaign } = useCampaign();
    const [teamName, setTeamName] = useState(''); // <-- ADDED BACK
    const [teamCode, setTeamCode] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        if (!selectedCampaign || !user?.ba_id) { 
            setError("Campaign or user BA information is missing.");
            setIsSubmitting(false);
            return; 
        }
        try {
            // Add "name" back to the payload
            await apiClient.post('/api/teams/', { 
                name: teamName, 
                team_code: teamCode, 
                campaign_id: selectedCampaign.id, 
                ba_id: user.ba_id 
            });
            onTeamCreated();
            onClose();
        } catch (err: any) { 
            setError(err.response?.data?.detail || "Failed to create team."); 
        } finally {
            setIsSubmitting(false);
            setTeamName(''); // Reset on close
            setTeamCode('');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create a New Team">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Team Name input field is back */}
                <div>
                    <label htmlFor="teamName" className="block text-sm font-medium">Team Name</label>
                    <input type="text" id="teamName" value={teamName} onChange={e => setTeamName(e.target.value)} required className="mt-1 block w-full border rounded-md p-2 dark:bg-gray-700"/>
                </div>
                <div>
                    <label htmlFor="teamCode" className="block text-sm font-medium">Team Code (e.g., TVM_01)</label>
                    <input type="text" id="teamCode" value={teamCode} onChange={e => setTeamCode(e.target.value)} required pattern="[A-Z]{3}_\d{2}" placeholder="XXX_01" className="mt-1 block w-full border rounded-md p-2 dark:bg-gray-700"/>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-blue-300">
                        {isSubmitting ? 'Creating...' : 'Create Team'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
