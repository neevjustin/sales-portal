// File: frontend/src/pages/LogCustomerActivity.tsx

import { useState, useEffect, FormEvent } from 'react';
import apiClient from '../services/api';
import { useCampaign } from '../context/CampaignContext';
import { Navigate } from 'react-router-dom';

// --- Configuration for making Aadhaar mandatory ---
// Set this to true to make the Aadhaar field required.
const IS_AADHAAR_MANDATORY = false;

// --- Interfaces ---
interface ActivityType {
  id: number;
  name: string;
}
export const LogCustomerActivity = () => {
  const { selectedCampaign } = useCampaign();
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hrNumber, setHrNumber] = useState('');

  // Form state
  const [activityTypeId, setActivityTypeId] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [isLead, setIsLead] = useState(false);
  const [requestedService, setRequestedService] = useState<string | null>(null);
  const [ftthAreaType, setFtthAreaType] = useState<string | null>(null);

  // Fetch activity types on component mount
  useEffect(() => {
    apiClient.get('/api/activities/types').then(res => {
        setActivityTypes(res.data);
        if (res.data.length > 0) setActivityTypeId(res.data[0].id.toString());
    });
  }, []);

  const selectedActivity = activityTypes.find(t => t.id === parseInt(activityTypeId));

  const resetForm = () => {
    setCustomerMobile('');
    setCustomerName('');
    setCustomerAddress('');
    setAadhaarNumber('');
    setIsLead(false);
    setRequestedService(null);
    setFtthAreaType(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const payload = {
      campaign_id: selectedCampaign?.id,
      activity_type_id: parseInt(activityTypeId),
      customer_mobile: customerMobile,
      customer_name: customerName,
      customer_address: customerAddress,
      aadhaar_number: aadhaarNumber || null,
      is_lead: isLead,
      requested_service: requestedService,
      ftth_area_type: ftthAreaType,
      hr_number: hrNumber,
    };

    try {
      await apiClient.post('/api/activities/', payload);
      setMessage({ type: 'success', text: 'Activity logged successfully!' });
      resetForm();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'An error occurred.' });
    }
  };

  if (!selectedCampaign) return <Navigate to="/select-campaign" replace />;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Log Customer Interaction</h1>
      <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* HR Number Field */}
          <div>
            <label className="block font-bold">HR Number</label>
            <input type="text" value={hrNumber} onChange={e => setHrNumber(e.target.value)} required className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block font-bold">Activity Type</label>
            <select 
              value={activityTypeId} 
              onChange={e => setActivityTypeId(e.target.value)} 
              // --- THIS IS THE FIX ---
              className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:text-gray-200"
              // --- END OF FIX ---
            >
              {activityTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
            </select>
          </div>

          {/* Common Fields */}
          <div>
            <label className="block font-bold">Customer Mobile</label>
            <input type="tel" value={customerMobile} onChange={e => setCustomerMobile(e.target.value)} required className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block font-bold">Customer Name</label>
            <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} required className="w-full p-2 border rounded" />
          </div>
           <div>
            <label className="block font-bold">Customer Address</label>
            <textarea value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} required className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block font-bold">Aadhaar Number {IS_AADHAAR_MANDATORY && <span className="text-red-500">*</span>}</label>
            <input type="text" value={aadhaarNumber} onChange={e => setAadhaarNumber(e.target.value)} required={IS_AADHAAR_MANDATORY} className="w-full p-2 border rounded" />
          </div>

          {/* Conditional Fields for House Visit */}
          {selectedActivity?.name === 'House Visit' && (
            <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-gray-900/50 space-y-4 rounded">
              <div>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={isLead} onChange={e => setIsLead(e.target.checked)} />
                  <span>Was a service requested? (Lead)</span>
                </label>
              </div>

              {isLead && (
                <div className="space-y-4">
                  <p className="font-bold">Services of Interest:</p>
                  <label className="flex items-center space-x-2">
                    <input type="radio" name="service" value="MOBILE" onChange={e => setRequestedService(e.target.value)} />
                    <span>Mobile (SIM/MNP)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="radio" name="service" value="FTTH" onChange={e => setRequestedService(e.target.value)} />
                    <span>FTTH</span>
                  </label>

                  {requestedService === 'FTTH' && (
                    <div className="pl-6">
                      <p className="font-bold">FTTH Area Type:</p>
                      <label className="flex items-center space-x-2">
                        <input type="radio" name="ftth_type" value="URBAN" onChange={e => setFtthAreaType(e.target.value)} required />
                        <span>Urban</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="radio" name="ftth_type" value="BNU" onChange={e => setFtthAreaType(e.target.value)} required />
                        <span>BNU (Rural)</span>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* --- Conditional Fields for FTTH Connection --- */}
          {selectedActivity?.name === 'FTTH Connection' && (
             <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-gray-900/50 space-y-4 rounded">
                <p className="font-bold">Connection Type:</p>
                 <label className="flex items-center space-x-2">
                    <input type="radio" name="ftth_type_direct" value="URBAN" onChange={e => setFtthAreaType(e.target.value)} required />
                    <span>Urban</span>
                </label>
                <label className="flex items-center space-x-2">
                    <input type="radio" name="ftth_type_direct" value="BNU" onChange={e => setFtthAreaType(e.target.value)} required />
                    <span>BNU (Rural)</span>
                </label>
             </div>
          )}

          {message && <div className={`p-3 rounded ${message.type === 'success' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>{message.text}</div>}

          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700">Submit Activity</button>
        </form>
      </div>
    </div>
  );
};

export default LogCustomerActivity;