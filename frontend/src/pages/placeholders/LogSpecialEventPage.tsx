// ==============================================================================
// File: frontend/src/pages/LogSpecialEventPage.tsx (Production Ready)
// ==============================================================================
import { useState, FormEvent } from 'react';
import apiClient from '../../services/api';
import { useCampaign } from '../../context/CampaignContext';

export const LogSpecialEventPage = () => {
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
-
      await apiClient.post('/api/events/special-event', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });


      setMessage({ type: 'success', text: 'Special event logged successfully!' });
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      // Improved error handling to show backend message
      setMessage({ type: 'error', text: err.response?.data?.detail || 'An error occurred while logging the event.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">Log a Special Event</h1>
      <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md mt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-bold">Date of Event</label>
            <input type="date" name="event_date" required className="w-full p-2 border rounded" />
          </div>

          <div>
            <label className="block font-bold">Location</label>
            <input type="text" name="location" required className="w-full p-2 border rounded" placeholder="e.g., Technopark Campus"/>
          </div>
          <div>
            <label className="block font-bold">Type of Event / Description</label>
            <textarea name="event_type" required className="w-full p-2 border rounded" placeholder="e.g., Roadshow for Freedom Plan launch"></textarea>
          </div>
          <div>
            <label className="block font-bold">Photo/Video Evidence</label>
            <input type="file" name="media" accept="image/jpeg,image/png,video/mp4" required multiple className="mt-1 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700"/>
          </div>
          
          {message && <div className={`p-3 rounded ${message.type === 'success' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>{message.text}</div>}
          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 disabled:bg-blue-300">
            {isSubmitting ? 'Submitting...' : 'Submit Event'}
          </button>
        </form>
      </div>
    </div>
  );
};