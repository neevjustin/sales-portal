// ==============================================================================
// File: frontend/src/pages/LogCustomerActivity.tsx (Final Production Version)
// Description: A comprehensive form for logging customer interactions. It now
// removes the Aadhaar field and provides instant score feedback to the user.
// ==============================================================================
import { useState, useEffect, FormEvent } from 'react';
import apiClient from '../services/api';
import { useCampaign } from '../context/CampaignContext';
import { Navigate } from 'react-router-dom';
import { MapPin, RefreshCw } from 'lucide-react';
import { useScoreStore } from '../store/scoreStore'; // Import the score store

export const LogCustomerActivity = () => {
  // --- Context and State Hooks ---
  const { selectedCampaign } = useCampaign();
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setTotalScore } = useScoreStore(); // Get the setter function from the store

  // --- Form State ---
  const [hrNumber, setHrNumber] = useState('');
  const [activityTypeId, setActivityTypeId] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  // Aadhaar state has been removed.
  const [isLead, setIsLead] = useState(false);
  const [requestedServices, setRequestedServices] = useState({ MOBILE: false, FTTH: false });
  const [ftthAreaType, setFtthAreaType] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string>('');

  interface ActivityType {
    id: number;
    name: string;
  }

  useEffect(() => {
    apiClient.get('/api/activities/types').then(res => {
      setActivityTypes(res.data);
      if (res.data.length > 0) {
        setActivityTypeId(res.data[0].id.toString());
      }
    }).catch(error => {
        console.error("Failed to fetch activity types:", error);
        setMessage({ type: 'error', text: 'Could not load activity types. Please refresh the page.' });
    });
  }, []);

  const selectedActivity = activityTypes.find(t => t.id === parseInt(activityTypeId));

  const resetForm = () => {
    setCustomerMobile('');
    setCustomerName('');
    setCustomerAddress('');
    // setAadhaarNumber(''); // Removed
    setIsLead(false);
    setRequestedServices({ MOBILE: false, FTTH: false });
    setFtthAreaType(null);
    setLatitude(null);
    setLongitude(null);
    setLocationName('');
    setLocationError('');
  };

  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setLocationError('');
    setLocationName('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLatitude(latitude);
        setLongitude(longitude);
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          setLocationName(data?.display_name || 'Address not found.');
        } catch (error) {
          console.error("Reverse geocoding failed:", error);
          setLocationName('Could not fetch address.');
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setLocationError(`Error: ${error.message}`);
        setIsLocating(false);
      }
    );
  };

  const handleServiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setRequestedServices(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (selectedActivity?.name === 'House Visit' && !latitude) {
        setMessage({ type: 'error', text: 'Location capture is required for a House Visit.' });
        return;
    }

    setMessage(null);
    setIsSubmitting(true);

    const services = Object.entries(requestedServices)
      .filter(([, isSelected]) => isSelected)
      .map(([serviceName]) => serviceName)
      .join(',');

    const payload = {
      campaign_id: selectedCampaign?.id,
      activity_type_id: parseInt(activityTypeId),
      customer_mobile: customerMobile,
      customer_name: customerName,
      customer_address: customerAddress,
      // aadhaar_number: null, // Removed
      is_lead: isLead,
      requested_service: services || null,
      ftth_area_type: requestedServices.FTTH ? ftthAreaType : null,
      hr_number: hrNumber,
      latitude: latitude,
      longitude: longitude,
    };

    try {
      const response = await apiClient.post('/api/activities/', payload);
      setMessage({ type: 'success', text: 'Activity logged successfully!' });
      
      // Instantly update the global score state
      setTotalScore(response.data.new_total_score);

      resetForm();
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setMessage({ type: 'error', text: err.response.data.detail });
      } else {
        setMessage({ type: 'error', text: 'An unexpected error occurred.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedCampaign) {
    return <Navigate to="/select-campaign" replace />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Log Customer Interaction</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Enter details for MNP, SIM Sales, House Visits, and FTTH connections.</p>
      
      <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300">HR Number</label>
            <input type="text" value={hrNumber} onChange={e => setHrNumber(e.target.value)} required className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
          </div>
          
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300">Activity Type</label>
            <select 
              value={activityTypeId} 
              onChange={e => setActivityTypeId(e.target.value)} 
              className="mt-1 w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            >
              {activityTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300">Customer Mobile</label>
            <input type="tel" value={customerMobile} onChange={e => setCustomerMobile(e.target.value)} required pattern="[0-9]{10}" title="Enter a 10-digit mobile number" className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
          </div>
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300">Customer Name</label>
            <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} required className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
          </div>
           <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300">Customer Address</label>
            <textarea value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} required className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
          </div>
          
          {/* Aadhaar Number Field has been removed */}

          {selectedActivity?.name === 'House Visit' && (
            <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-gray-900/50 space-y-4 rounded">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-2">Location (Required for House Visit)</label>
                <button type="button" onClick={handleGetLocation} disabled={isLocating} className="w-full flex items-center justify-center p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400">
                  {isLocating ? <RefreshCw className="animate-spin mr-2" size={20}/> : <MapPin className="mr-2" size={20} />}
                  {isLocating ? 'Capturing...' : 'Capture Current Location'}
                </button>
                {locationError && <p className="text-red-500 text-sm mt-2">{locationError}</p>}
                {latitude && longitude && (
                    <div className="mt-2 text-sm text-green-700 dark:text-green-400">
                        <p className="font-semibold">Captured: {latitude.toFixed(5)}, {longitude.toFixed(5)}</p>
                        {locationName && <p>{locationName}</p>}
                    </div>
                )}
              </div>
              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" checked={isLead} onChange={e => setIsLead(e.target.checked)} className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500"/>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Was a service requested? (This marks it as a Lead)</span>
                </label>
              </div>
              {isLead && (
                <div className="space-y-4 pt-2">
                  <p className="font-bold text-gray-700 dark:text-gray-300">Services of Interest (Select all that apply):</p>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" name="MOBILE" checked={requestedServices.MOBILE} onChange={handleServiceChange} className="h-4 w-4 rounded text-blue-600"/>
                    <span>Mobile (SIM/MNP)</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" name="FTTH" checked={requestedServices.FTTH} onChange={handleServiceChange} className="h-4 w-4 rounded text-blue-600"/>
                    <span>FTTH</span>
                  </label>
                  {requestedServices.FTTH && (
                    <div className="pl-6 pt-2">
                      <p className="font-bold text-gray-700 dark:text-gray-300">FTTH Area Type:</p>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input type="radio" name="ftth_type" value="URBAN" onChange={e => setFtthAreaType(e.target.value)} required={requestedServices.FTTH} className="h-4 w-4 text-blue-600"/>
                        <span>Urban</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input type="radio" name="ftth_type" value="BNU" onChange={e => setFtthAreaType(e.target.value)} required={requestedServices.FTTH} className="h-4 w-4 text-blue-600"/>
                        <span>BNU (Rural)</span>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {selectedActivity?.name === 'FTTH Connection' && (
             <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-gray-900/50 space-y-4 rounded">
                <p className="font-bold text-gray-700 dark:text-gray-300">Connection Type:</p>
                 <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="radio" name="ftth_type_direct" value="URBAN" onChange={e => setFtthAreaType(e.target.value)} required className="h-4 w-4 text-green-600"/>
                    <span>Urban</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="radio" name="ftth_type_direct" value="BNU" onChange={e => setFtthAreaType(e.target.value)} required className="h-4 w-4 text-green-600"/>
                    <span>BNU (Rural)</span>
                </label>
             </div>
          )}

          {message && <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}

          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white font-bold py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed">
            {isSubmitting ? 'Submitting...' : 'Submit Activity'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LogCustomerActivity;
