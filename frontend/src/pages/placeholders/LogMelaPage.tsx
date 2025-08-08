// ==============================================================================
// File: frontend/src/pages/placeholders/LogMelaPage.tsx (Updated to Real Form)
// ==============================================================================
import { useState, FormEvent } from 'react';
import apiClient from '../../services/api';
import { useCampaign } from '../../context/CampaignContext';

export const LogMelaPage = () => {
  const { selectedCampaign } = useCampaign();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    if(selectedCampaign) {
      formData.append('campaign_id', selectedCampaign.id.toString());
    }
    
    try {
        await apiClient.post('/api/events/mela', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        setMessage({ type: 'success', text: 'Mela event logged successfully!' });
        (e.target as HTMLFormElement).reset();
    } catch (err: any) {
        setMessage({ type: 'error', text: err.response?.data?.detail || 'An error occurred.' });
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">Log a Mela Event</h1>
      <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md mt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-bold">Mela Date</label>
            <input type="date" name="mela_date" required className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block font-bold">Territory (Franchisee Code)</label>
            <input type="text" name="territory" required className="w-full p-2 border rounded" placeholder="e.g., TVM_FRN_01"/>
          </div>
          <div>
            <label className="block font-bold">Location (Place)</label>
            <input type="text" name="location" required className="w-full p-2 border rounded" placeholder="e.g., East Fort, Trivandrum"/>
          </div>
          <div>
            <label className="block font-bold">Members Participated (Count)</label>
            <input type="number" name="participants_count" min="1" required className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block font-bold">Photo of Mela (JPG, 1 required)</label>
            <input type="file" name="photo" accept="image/jpeg" required className="mt-1 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700"/>
          </div>
          
          {message && <div className={`p-3 rounded ${message.type === 'success' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>{message.text}</div>}
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700">Submit Mela</button>
        </form>
      </div>
    </div>
  );
};