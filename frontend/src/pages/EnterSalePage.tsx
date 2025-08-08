// ==============================================================================
// File: frontend/src/pages/EnterSalePage.tsx (CORRECTED)
// Description: This version fixes the location capture feature by matching the
// activity name to the one defined in the latest seed_db.py script.
// ==============================================================================
import { useEffect, useState, FormEvent } from 'react';
import apiClient from '../services/api';
import { useCampaign } from '../context/CampaignContext';
import { Navigate } from 'react-router-dom';

interface ActivityType {
  id: number;
  name: string;
}

export const EnterSalePage = ({ onSaleSuccess }: { onSaleSuccess?: () => void; }) => {
  const { selectedCampaign } = useCampaign();
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [selectedType, setSelectedType] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const selectedActivityName = activityTypes.find(t => t.id === parseInt(selectedType))?.name;

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await apiClient.get('/api/activities/types');
        setActivityTypes(response.data);
        if (response.data.length > 0) setSelectedType(response.data[0].id.toString());
      } catch (error) {
        console.error("Failed to fetch activity types", error);
      }
    };
    fetchTypes();
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setMessage({ type: 'error', text: 'Geolocation is not supported by your browser.' });
    } else {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition((position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setIsLocating(false);
        setMessage({ type: 'success', text: 'Location captured!' });
      }, () => {
        setMessage({ type: 'error', text: 'Unable to retrieve your location.' });
        setIsLocating(false);
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!selectedCampaign) {
      setMessage({ type: 'error', text: 'No campaign selected.' });
      return;
    }

    const payload: any = {
      activity_type_id: parseInt(selectedType),
      customer_mobile: customerMobile,
      customer_name: customerName,
      customer_address: customerAddress,
      campaign_id: selectedCampaign.id,
    };

    if (selectedActivityName === 'House Visit') {
      payload.latitude = latitude;
      payload.longitude = longitude;
    }

    try {
      await apiClient.post('/api/activities/', payload);
      setMessage({ type: 'success', text: 'Entry logged successfully!' });
      
      setCustomerMobile('');
      setCustomerName('');
      setCustomerAddress('');
      setLatitude(null);
      setLongitude(null);
      
      if (onSaleSuccess) {
        onSaleSuccess();
      }

    } catch (err: any) {
      if (err.response && err.response.status === 409) {
        setMessage({ type: 'error', text: `Duplicate Entry: ${err.response.data.detail}` });
      } else {
        setMessage({ type: 'error', text: err.response?.data?.detail || 'An error occurred.' });
      }
    }
  };

  if (!selectedCampaign) return <Navigate to="/select-campaign" replace />;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">Enter New Sale / Activity</h1>
      <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Activity Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              {activityTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Customer Mobile</label>
            <input
              type="tel"
              value={customerMobile}
              onChange={(e) => setCustomerMobile(e.target.value)}
              required
              pattern="[0-9]{10}"
              title="Please enter a 10-digit mobile number"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Customer Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              minLength={3}
              title="Please enter a valid customer name (at least 3 characters)"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Customer Address</label>
            <textarea
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          {/* THIS IS THE FIX: The condition now correctly checks for "House Visit" */}
          {selectedActivityName === 'House Visit' && (
            <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-gray-900/50">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                Location (Required for House Visit)
              </label>
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isLocating}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded w-full disabled:bg-indigo-300"
              >
                {isLocating ? 'Getting Location...' : 'Capture Current Location'}
              </button>
              {latitude && longitude && (
                <p className="text-green-600 dark:text-green-400 text-sm mt-2">
                  Location captured: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </p>
              )}
            </div>
          )}

          {message && (
            <div className={`p-4 text-sm rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline text-base"
          >
            Submit Entry
          </button>
        </form>
      </div>
    </div>
  );
};
