// ==============================================================================
// File: frontend/src/pages/LogPressReleasePage.tsx (Final Code)
// ==============================================================================
import { useState, FormEvent } from 'react';
import apiClient from '../../services/api';
import { useCampaign } from '../../context/CampaignContext';

export const LogPressReleasePage = () => {
  const { selectedCampaign } = useCampaign();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData(e.target as HTMLFormElement);
    if (selectedCampaign) {
      formData.append('campaign_id', selectedCampaign.id.toString());
    }
    
    try {
      await apiClient.post('/api/events/press-release', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage({ type: 'success', text: 'Press release logged successfully!' });
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'An error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">Log a Press Release</h1>
      <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md mt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-bold">Date of Press Release</label>
            <input type="date" name="release_date" required className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block font-bold">Name of Newspaper / Media Outlet</label>
            <input type="text" name="media_outlet" required className="w-full p-2 border rounded" placeholder="e.g., Malayala Manorama"/>
          </div>
          <div>
            <label className="block font-bold">Photo of Clipping</label>
            <input type="file" name="clipping" accept="image/jpeg,image/png" required className="mt-1 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700"/>
          </div>
          
          {message && <div className={`p-3 rounded ${message.type === 'success' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>{message.text}</div>}
          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 disabled:bg-blue-300">
            {isSubmitting ? 'Submitting...' : 'Submit Press Release'}
          </button>
        </form>
      </div>
    </div>
  );
};