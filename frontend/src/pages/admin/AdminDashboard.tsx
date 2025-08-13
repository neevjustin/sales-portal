// File: frontend/src/pages/admin/AdminDashboard.tsx (REFACTORED & ALIGNED)

import { useCampaign } from '../../context/CampaignContext';
import { KpiCard } from '../../components/ui/KpiCard';
import { Navigate } from 'react-router-dom';
import { BaPerformanceTable } from '../../components/dashboards/admin/BaPerformanceTable';
import { useApiData } from '../../hooks/useApiData';

interface KpiData {
  name: string;
  achieved: number;
  target: number;
}

// --- CHANGE: Added config for "4G SIM Upgradation" ---
const KPI_CONFIG: { [key: string]: { color: string } } = {
  "MNP": { color: "bg-blue-500" },
  "SIM Sales": { color: "bg-green-500" },
  "4G SIM Upgradation": { color: "bg-yellow-500" },
  "FTTH Provision Target": { color: "bg-purple-500" },
};
// --- END OF CHANGE ---

export const AdminDashboard = () => {
  const { selectedCampaign } = useCampaign();
  const endpoint = selectedCampaign ? `/api/dashboard/circle_kpis/${selectedCampaign.id}` : null;
  
  const { data: kpis, loading, error } = useApiData<KpiData[]>(endpoint);

  if (!selectedCampaign) return <Navigate to="/select-campaign" replace />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Circle Performance Dashboard</h1>
        <p className="text-lg text-gray-500">Campaign: {selectedCampaign.name}</p>
      </div>
      
      {loading && <div className="text-center p-4">Loading Dashboard Data...</div>}
      {error && <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}

      {!loading && !error && kpis && (
        <>
          {/* --- CHANGE: Grid now accommodates 4 items better --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* --- END OF CHANGE --- */}
            {kpis.length > 0 ? kpis.map(kpi => (
              <KpiCard 
                key={kpi.name}
                title={kpi.name}
                achieved={kpi.achieved}
                target={kpi.target}
                colorClass={KPI_CONFIG[kpi.name]?.color || 'bg-gray-500'}
              />
            )) : <p className="col-span-full text-gray-500">No Circle KPI data available.</p>}
          </div>
          <BaPerformanceTable />
        </>
      )}
    </div>
  );
};