// ==============================================================================
// File: frontend/src/pages/team/TeamDashboard.tsx (MODIFIED)
// ==============================================================================
import { useCampaign } from '../../context/CampaignContext';
import { Navigate } from 'react-router-dom';
import { MemberContributionList } from '../../components/dashboards/team/MemberContributionList';

export const TeamDashboard = () => {
    const { selectedCampaign } = useCampaign();
    if (!selectedCampaign) return <Navigate to="/select-campaign" replace />;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">My Team Dashboard</h1>
                <p className="text-lg text-gray-500">Campaign: {selectedCampaign.name}</p>
            </div>
             {/* We will add Team-specific KPIs here later */}
            <MemberContributionList />
        </div>
    );
};