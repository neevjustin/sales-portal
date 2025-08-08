// ==============================================================================
// File: frontend/src/context/CampaignContext.tsx (CORRECTED)
// Description: Removed the unused 'useEffect' import to fix the warning.
// ==============================================================================
import { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';

interface Campaign {
  id: number;
  name: string;
}

interface CampaignContextType {
  selectedCampaign: Campaign | null;
  selectCampaign: (campaign: Campaign | null) => void;
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export const CampaignProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const selectCampaign = (campaign: Campaign | null) => {
    setSelectedCampaign(campaign);
  };

  return (
    <CampaignContext.Provider value={{ selectedCampaign, selectCampaign }}>
      {children}
    </CampaignContext.Provider>
  );
};

export const useCampaign = () => {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error('useCampaign must be used within a CampaignProvider');
  }
  return context;
};
