// ==============================================================================
// File: frontend/src/pages/ba/BaDashboard.tsx (MODIFIED)
// ==============================================================================
import { useCampaign } from '../../context/CampaignContext';
import { Navigate } from 'react-router-dom';
import { TeamPerformanceTable } from '../../components/dashboards/ba/TeamPerformanceTable';

export const BaDashboard = () => {
    const { selectedCampaign } = useCampaign();
    if (!selectedCampaign) return <Navigate to="/select-campaign" replace />;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">BA Performance Dashboard</h1>
                <p className="text-lg text-gray-500">Campaign: {selectedCampaign.name}</p>
            </div>
            {/* We will add BA-specific KPIs here later */}
            <TeamPerformanceTable />
        </div>
    );
};