// ===== File: frontend/src/pages/ba/BaDashboard.tsx (MODIFIED) =====

import { useCampaign } from '../../context/CampaignContext';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { TeamPerformanceTable } from '../../components/dashboards/ba/TeamPerformanceTable';
import { KpiCard } from '../../components/ui/KpiCard';
import { RankKpiCard } from '../../components/ui/RankKpiCard'; // <-- Import new component
import { useApiData } from '../../hooks/useApiData';
import { LeaderboardSnapshot } from '../../components/dashboards/shared/LeaderboardSnapshot';

interface KpiData {
  name: string;
  achieved: number;
  target: number;
}

// --- ADD THIS NEW INTERFACE ---
interface RankData {
  rank: number;
  total: number;
}

const KPI_CONFIG: { [key: string]: { color: string } } = {
  "MNP": { color: "bg-blue-500" },
  "SIM Sales": { color: "bg-green-500" },
  "4G SIM Upgradation": { color: "bg-yellow-500" },
  "BNU connections": { color: "bg-purple-500" },
  "Urban connections": { color: "bg-indigo-500" },
};

export const BaDashboard = () => {
    const { selectedCampaign } = useCampaign();
    const { user } = useAuth();
    
    const kpiEndpoint = selectedCampaign && user?.ba_id 
        ? `/api/dashboard/ba_kpis/${selectedCampaign.id}/${user.ba_id}` 
        : null;
    
    // --- ADD THIS NEW DATA FETCHING HOOK ---
    const rankEndpoint = selectedCampaign && user?.ba_id
        ? `/api/dashboard/ba_rank/${selectedCampaign.id}/${user.ba_id}`
        : null;
    
    const { data: kpis, loading: kpisLoading, error: kpisError } = useApiData<KpiData[]>(kpiEndpoint);
    const { data: rankData, loading: rankLoading, error: rankError } = useApiData<RankData>(rankEndpoint);
    // --- END OF ADDITION ---

    if (!selectedCampaign) return <Navigate to="/select-campaign" replace />;

    const isLoading = kpisLoading || rankLoading;
    const error = kpisError || rankError;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">BA Performance Dashboard</h1>
                <p className="text-lg text-gray-500">Campaign: {selectedCampaign.name}</p>
            </div>
            
            {isLoading && <div className="p-4 text-center">Loading Dashboard Data...</div>}
            {error && <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}

            {!isLoading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                    {/* --- ADD THIS NEW RANK CARD --- */}
                    {rankData && (
                        <div className="xl:col-span-1">
                            <RankKpiCard
                                rank={rankData.rank}
                                total={rankData.total}
                                title="Your BA Rank"
                            />
                        </div>
                    )}
                    
                    {/* --- UPDATE THE GRID SPAN FOR KPI CARDS --- */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        {kpis && kpis.map(kpi => (
                            <KpiCard 
                                key={kpi.name}
                                title={kpi.name}
                                achieved={kpi.achieved}
                                target={kpi.target}
                                colorClass={KPI_CONFIG[kpi.name]?.color || 'bg-gray-500'}
                            />
                        ))}
                    </div>
                </div>
            )}
            
            <TeamPerformanceTable />
            
            <div>
                <h2 className="text-2xl font-bold mb-4">Employee Leaderboard Snapshot (Your BA)</h2>
                <LeaderboardSnapshot ba_id={user?.ba_id || null} />
            </div>
        </div>
    );
};
