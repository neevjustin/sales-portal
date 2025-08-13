// ==============================================================================
// File: frontend/src/pages/ActivityLogPage.tsx (Final Version with Delete)
// Description: This version adds an "Actions" column with a delete button,
// allowing authorized users to remove activity entries after confirmation.
// ==============================================================================
import { useEffect, useState } from 'react';
import apiClient from '../services/api';
import { Trash2 } from 'lucide-react'; // Import the trash icon

// --- EDITED: Interface now includes campaign_id ---
interface Activity {
    id: number;
    campaign_id: number; // <-- Added for the delete function
    logged_at: string;
    customer_mobile: string;
    employee?: { name: string };
    team?: { name: string; team_code?: string };
    activity_type: { name: string };
}

export const ActivityLogPage = () => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        apiClient.get('/api/activities/my-logs')
            .then(response => {
                setActivities(response.data);
            })
            .catch(error => {
                console.error("Failed to fetch activity logs", error);
                setError("Could not load activity logs. Please try again later.");
            })
            .finally(() => setLoading(false));
    }, []);

    // --- NEW: Function to handle the deletion of an activity ---
    const handleDeleteActivity = async (activityId: number) => {
        // Show a confirmation dialog to prevent accidental deletions
        if (!window.confirm("Are you sure you want to delete this entry? This action cannot be undone.")) {
            return;
        }

        try {
            // Send the delete request to the backend
            await apiClient.delete(`/api/activities/${activityId}`);
            
            // On success, remove the activity from the local state for an instant UI update
            setActivities(prevActivities => prevActivities.filter(act => act.id !== activityId));

        } catch (err: any) {
            // Display an error message if the deletion fails
            const errorMessage = err.response?.data?.detail || "Failed to delete the activity. You may not have permission.";
            alert(`Error: ${errorMessage}`); // Using alert for simplicity
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Activity Log History</h1>
            {error && <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr className="bg-gray-200 dark:bg-gray-700 uppercase text-sm">
                            <th className="py-3 px-6 text-left">Date & Time</th>
                            <th className="py-3 px-6 text-left">Employee</th>
                            <th className="py-3 px-6 text-left">Team Code</th>
                            <th className="py-3 px-6 text-left">Activity</th>
                            <th className="py-3 px-6 text-left">Customer Mobile</th>
                            <th className="py-3 px-6 text-center">Actions</th> {/* <-- NEW COLUMN */}
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {loading ? (
                            <tr><td colSpan={6} className="text-center p-4">Loading...</td></tr>
                        ) : activities.length === 0 ? (
                            <tr><td colSpan={6} className="text-center p-4 text-gray-500">No activities have been logged yet.</td></tr>
                        ) : activities.map(act => (
                            <tr key={act.id} className="border-b hover:bg-gray-100 dark:hover:bg-gray-700">
                                <td className="py-3 px-6">{new Date(act.logged_at).toLocaleString()}</td>
                                <td className="py-3 px-6">{act.employee?.name || 'N/A'}</td>
                                <td className="py-3 px-6">{act.team?.team_code || 'N/A'}</td>
                                <td className="py-3 px-6">{act.activity_type.name}</td>
                                <td className="py-3 px-6">{act.customer_mobile}</td>
                                {/* --- NEW: Delete button cell --- */}
                                <td className="py-3 px-6 text-center">
                                    <button
                                        onClick={() => handleDeleteActivity(act.id)}
                                        className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"
                                        title="Delete this entry"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};