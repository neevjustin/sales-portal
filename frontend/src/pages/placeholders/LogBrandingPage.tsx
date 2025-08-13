// ==============================================================================
// File: frontend/src/pages/LogBrandingPage.tsx (Final Code)
// ==============================================================================
import { useState, FormEvent } from 'react';
import apiClient from '../../services/api';
import { useCampaign } from '../../context/CampaignContext';

export const LogBrandingPage = () => {
  const { selectedCampaign } = useCampaign();
  const [locationType, setLocationType] = useState('CSC');
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
      await apiClient.post('/api/events/branding', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage({ type: 'success', text: 'Branding activity logged successfully!' });
      (e.target as HTMLFormElement).reset();
      setLocationType('CSC');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'An error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">Log a Branding Activity</h1>
      <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md mt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-bold">Branding Location Type</label>
            <select name="location_type" value={locationType} onChange={e => setLocationType(e.target.value)} className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:text-gray-200">
              <option value="CSC">Customer Service Center (CSC)</option>
              <option value="OCSC">OCSC</option>
              <option value="Retailer">Retailer Shop</option>
            </select>
          </div>
          
          {(locationType === 'CSC' || locationType === 'OCSC') && (
            <>
              <div>
                <label className="block font-bold">{locationType} Name</label>
                <input type="text" name="location_name" required className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block font-bold">Photos (2-5 required)</label>
                <input type="file" name="photos" accept="image/jpeg,image/png" required multiple className="mt-1 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700"/>
              </div>
            </>
          )}

          {locationType === 'Retailer' && (
             <>
              <div>
                <label className="block font-bold">Retailer Code / C-TopUp Number</label>
                <input type="text" name="retailer_code" required className="w-full p-2 border rounded"/>
              </div>
              <div>
                <label className="block font-bold">Photos (max 2)</label>
                <input type="file" name="photos" accept="image/jpeg,image/png" required multiple className="mt-1 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700"/>
              </div>
            </>
          )}

          {message && <div className={`p-3 rounded ${message.type === 'success' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>{message.text}</div>}
          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 disabled:bg-blue-300">
            {isSubmitting ? 'Submitting...' : 'Submit Branding'}
          </button>
        </form>
      </div>
    </div>
  );
};