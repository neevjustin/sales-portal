// File: frontend/src/pages/CampaignSelectionPage.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import { useCampaign } from '../context/CampaignContext';
import { useAuth } from '../context/AuthContext';

interface Campaign {
  id: number;
  name: string;
}

export const CampaignSelectionPage = () => {
  const { selectCampaign } = useCampaign();
  const { user, token, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState('');
  
  const handleCampaignSelect = (campaign: Campaign) => {
    selectCampaign(campaign);
    // This redirect logic will be updated in Phase 2
    switch (user?.role) {
      case 'admin': navigate('/admin/dashboard'); break;
      case 'ba_coordinator': navigate('/ba/dashboard'); break;
      case 'team_leader':
      case 'team_coordinator': navigate('/team/dashboard'); break;
      case 'employee':
      default: navigate('/dashboard'); break;
    }
  };

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (isAuthLoading || !token) return;

      try {
        const response = await apiClient.get('/api/campaigns/');
        const fetchedCampaigns: Campaign[] = response.data;

        if (fetchedCampaigns.length === 1) {
          // If only one campaign exists, auto-select and redirect
          handleCampaignSelect(fetchedCampaigns[0]);
        } else if (fetchedCampaigns.length > 1) {
          // If multiple, show the selection screen
          setCampaigns(fetchedCampaigns);
          setIsPageLoading(false);
        } else {
          // If none, show an error
          setError("No active campaigns found. Please contact an administrator.");
          setIsPageLoading(false);
        }
      } catch (error) {
        console.error("Failed to fetch campaigns", error);
        setError("Could not load campaign data.");
        setIsPageLoading(false);
      }
    };

    fetchCampaigns();
  }, [token, isAuthLoading, navigate, user]);

  if (isPageLoading) {
    return <div className="flex items-center justify-center h-screen">Loading Campaigns...</div>;
  }
  
  if (error) {
     return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;
  }

  // This JSX will only render if campaigns.length > 1
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-200">Select a Campaign</h1>
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            onClick={() => handleCampaignSelect(campaign)}
            className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md cursor-pointer hover:shadow-xl hover:scale-105 transition-transform duration-300"
          >
            <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400">{campaign.name}</h2>
          </div>
        ))}
      </div>
    </div>
  );
};