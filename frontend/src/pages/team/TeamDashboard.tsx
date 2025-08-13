// ==============================================================================
// File: frontend/src/pages/team/TeamDashboard.tsx (MODIFIED)
// ==============================================================================
import { useCampaign } from '../../context/CampaignContext';
import { Navigate } from 'react-router-dom';
import { MemberContributionList } from '../../components/dashboards/team/MemberContributionList';
// --- NEW: Import the summary component ---
import { PersonalScoreSummary } from '../../components/dashboards/team/PersonalScoreSummary';

export const TeamDashboard = () => {
    const { selectedCampaign } = useCampaign();
    if (!selectedCampaign) return <Navigate to="/select-campaign" replace />;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">My Team Dashboard</h1>
                <p className="text-lg text-gray-500">Campaign: {selectedCampaign.name}</p>
            </div>
            
            {/* --- NEW: Add the Personal Score Summary for the leader/coordinator --- */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Your Personal Performance</h2>
                <PersonalScoreSummary />
            </div>

            {/* The existing list of team member contributions */}
            <MemberContributionList />
        </div>
    );
};