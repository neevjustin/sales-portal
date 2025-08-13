// ==============================================================================
// File: frontend/src/components/management/UploadTeamModal.tsx (NEW FILE)
// ==============================================================================
import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { useCampaign } from '../../context/CampaignContext';
import apiClient from '../../services/api';

interface UploadTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export const UploadTeamModal = ({ isOpen, onClose, onUploadSuccess }: UploadTeamModalProps) => {
    const { user } = useAuth();
    const { selectedCampaign } = useCampaign();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file || !user?.ba_id || !selectedCampaign?.id) return;
        setIsUploading(true);
        setError('');
        setMessage('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await apiClient.post(`/api/upload/teams/${user.ba_id}?campaign_id=${selectedCampaign.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setMessage(response.data.message);
            onUploadSuccess();
        } catch (err: any) {
            setError(err.response?.data?.detail || "An error occurred during upload.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Upload Teams from Excel">
            <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Upload an Excel file (.xlsx) with columns in the following order: 
                    `Team Code`, `Team Name`, `Team Leader Name`, `Team Coordinator Name`, `Team Leader HR No`, `Team Coordinator HR No`.
                </p>
                <div>
                    <label className="block text-sm font-medium">Excel File</label>
                    <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="mt-1 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700"/>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                {message && <p className="text-green-500 text-sm">{message}</p>}
                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                    <button onClick={handleUpload} disabled={!file || isUploading} className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-green-300">
                        {isUploading ? 'Uploading...' : 'Upload & Process'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};