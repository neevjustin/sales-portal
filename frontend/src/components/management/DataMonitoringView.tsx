// ==============================================================================
// File: frontend/src/components/management/DataMonitoringView.tsx (NEW FILE)
// ==============================================================================
import { useEffect, useState } from 'react';
import apiClient from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Filter } from 'lucide-react';

interface Activity {
    id: number;
    logged_at: string;
    customer_mobile: string;
    employee: { name: string };
    team: { name: string };
    activity_type: { name: string };
}

export const DataMonitoringView = () => {
    const { user } = useAuth();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ start_date: '', end_date: '' });

    useEffect(() => {
        if (!user?.ba_id) return;
        fetchActivities();
    }, [user]);

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.start_date) params.append('start_date', filters.start_date);
            if (filters.end_date) params.append('end_date', filters.end_date);
            const response = await apiClient.get(`/api/activities/monitor?${params.toString()}`);
            setActivities(response.data);
        } catch (error) { console.error("Failed to fetch activities", error);
        } finally { setLoading(false); }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchActivities();
    };

    return (
        <div className="space-y-6">
             <h2 className="text-2xl font-bold">Monitor Activities</h2>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <form onSubmit={handleFilterSubmit} className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-full"><label htmlFor="start_date" className="text-sm font-medium">Start Date</label><input type="date" name="start_date" id="start_date" value={filters.start_date} onChange={handleFilterChange} className="mt-1 block w-full border rounded-md"/></div>
                    <div className="w-full"><label htmlFor="end_date" className="text-sm font-medium">End Date</label><input type="date" name="end_date" id="end_date" value={filters.end_date} onChange={handleFilterChange} className="mt-1 block w-full border rounded-md"/></div>
                    <button type="submit" className="w-full sm:w-auto mt-4 sm:mt-0 self-end flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md"><Filter size={20} className="mr-2"/>Apply Filters</button>
                </form>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
                 <table className="min-w-full">
                    <thead><tr className="bg-gray-200 dark:bg-gray-700 uppercase text-sm"><th className="py-3 px-6 text-left">Date & Time</th><th className="py-3 px-6 text-left">Employee</th><th className="py-3 px-6 text-left">Team</th><th className="py-3 px-6 text-left">Activity</th><th className="py-3 px-6 text-left">Customer Mobile</th></tr></thead>
                                        <tbody className="text-gray-600 dark:text-gray-300 text-sm font-light">
                        {loading ? (
                             <tr><td colSpan={5} className="text-center p-4">Loading activities...</td></tr>
                        ) : activities.length > 0 ? (
                            activities.map(act => (
                                <tr key={act.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <td className="py-3 px-6 text-left">{new Date(act.logged_at).toLocaleString()}</td>
                                    {/* Use optional chaining as a safeguard */}
                                    <td className="py-3 px-6 text-left">{act.employee?.name || 'N/A'}</td>
                                    <td className="py-3 px-6 text-left">{act.team?.name || 'N/A'}</td>
                                    <td className="py-3 px-6 text-left">{act.activity_type?.name || 'N/A'}</td>
                                    <td className="py-3 px-6 text-left">{act.customer_mobile}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={5} className="text-center p-4">No activities found for the selected filters.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};