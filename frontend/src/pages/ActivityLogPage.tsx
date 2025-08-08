// ==============================================================================
// File: frontend/src/pages/ActivityLogPage.tsx (CORRECTED)
// Description: This version updates the Activity interface to correctly
// include the nested team object, which will make the team code appear.
// ==============================================================================
import { useEffect, useState } from 'react';
import apiClient from '../services/api';

// --- THIS IS THE FIX ---
// The interface now correctly expects a 'team' object with a 'name' property
// (which the backend sends as 'team_code').
interface Activity {
    id: number;
    logged_at: string;
    customer_mobile: string;
    employee?: { name: string };
    team?: { name: string; team_code?: string }; // Updated to include team object
    activity_type: { name: string };
}

export const ActivityLogPage = () => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        apiClient.get('/api/activities/my-logs')
            .then(response => {
                setActivities(response.data);
            })
            .catch(error => console.error("Failed to fetch activity logs", error))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">My Activity Log</h1>
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr className="bg-gray-200 dark:bg-gray-700 uppercase text-sm">
                            <th className="py-3 px-6 text-left">Date & Time</th>
                            <th className="py-3 px-6 text-left">Employee</th>
                            <th className="py-3 px-6 text-left">Team Code</th>
                            <th className="py-3 px-6 text-left">Team</th>
                            <th className="py-3 px-6 text-left">Activity</th>
                            <th className="py-3 px-6 text-left">Customer Mobile</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {loading ? (<tr><td colSpan={5} className="text-center p-4">Loading...</td></tr>)
                        : activities.map(act => (
                            <tr key={act.id} className="border-b hover:bg-gray-100 dark:hover:bg-gray-700">
                                <td className="py-3 px-6">{new Date(act.logged_at).toLocaleString()}</td>
                                <td className="py-3 px-6">{act.employee?.name || 'N/A'}</td>

                                <td className="py-3 px-6">{act.team?.team_code || 'N/A'}</td>
                                <td className="py-3 px-6">{act.team?.name || 'N/A'}</td>
                                <td className="py-3 px-6">{act.activity_type.name}</td>
                                <td className="py-3 px-6">{act.customer_mobile}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
