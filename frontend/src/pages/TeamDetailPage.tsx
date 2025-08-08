// ==============================================================================
// File: frontend/src/pages/TeamDetailPage.tsx (MODIFIED)
// Description: Fully functional page for managing team members.
// ==============================================================================
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../services/api';
import { ArrowLeft, Trash2, ShieldCheck, UserPlus, UserCheck } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';

// Define data shapes
interface Employee { id: number; name: string; employee_code: string; is_team_lead: boolean; }
interface TeamDetails { id: number; name: string; team_code: string; employees: Employee[]; }

export const TeamDetailPage = () => {
    const { teamId } = useParams<{ teamId: string }>();
    const [team, setTeam] = useState<TeamDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchTeamDetails = async () => {
        if (!teamId) return;
        setLoading(true);
        try {
            const response = await apiClient.get(`/api/teams/${teamId}`);
            setTeam(response.data);
        } catch (error) {
            console.error("Failed to fetch team details", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeamDetails();
    }, [teamId]);

    const handleUnassignMember = async (employeeId: number) => {
        if (window.confirm("Are you sure you want to remove this member from the team?")) {
            try {
                await apiClient.put(`/api/employees/${employeeId}/unassign`);
                fetchTeamDetails(); // Refresh list
            } catch (error) {
                console.error("Failed to unassign member", error);
                alert("Failed to remove member.");
            }
        }
    };

    const handleToggleLead = async (employeeId: number) => {
         try {
            await apiClient.put(`/api/employees/${employeeId}/toggle_lead/${teamId}`);
            fetchTeamDetails(); // Refresh list to show new lead
        } catch (error) {
            console.error("Failed to set team lead", error);
            alert("Failed to change team lead status.");
        }
    }

    if (loading) return <div className="text-center p-8">Loading Team Details...</div>;
    if (!team) return <div className="text-center p-8 text-red-500">Team not found.</div>;

    return (
        <div className="space-y-6">
            <Link to="/management/teams" className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-4">
                <ArrowLeft size={20} className="mr-2" />
                Back to All Teams
            </Link>

            <div>
                <h1 className="text-3xl font-bold">{team.name}</h1>
                <p className="text-lg text-gray-500 dark:text-gray-400">{team.team_code}</p>
            </div>
            
            <div className="flex justify-end">
                <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-colors">
                    <UserPlus size={20} className="mr-2" />
                    Add New Member
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-md">
                 <h2 className="text-xl font-semibold mb-4">Team Members ({team.employees.length})</h2>
                <div className="space-y-4">
                    {team.employees.map(member => (
                        <div key={member.id} className="p-4 border dark:border-gray-700 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between">
                            <div className="flex items-center">
                                {member.is_team_lead 
                                    ? <ShieldCheck size={24} className="text-green-500 mr-4 flex-shrink-0" /> 
                                    : <UserPlus size={24} className="text-gray-400 mr-4 flex-shrink-0" />
                                }
                                <div>
                                    <p className="font-bold text-lg">{member.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{member.employee_code}</p>
                                </div>
                            </div>
                            <div className="flex space-x-1 mt-3 sm:mt-0 self-end">
                                <button onClick={() => handleToggleLead(member.id)} className={`p-2 rounded-md text-gray-500 hover:text-white ${member.is_team_lead ? 'hover:bg-yellow-500' : 'hover:bg-green-500'}`} title={member.is_team_lead ? "Remove as Team Lead" : "Set as Team Lead"}>
                                    <UserCheck size={18} />
                                </button>
                                <button onClick={() => handleUnassignMember(member.id)} className="p-2 text-gray-500 hover:text-white hover:bg-red-600 rounded-md" title="Remove Member from Team">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                     {team.employees.length === 0 && <p className="text-gray-500 dark:text-gray-400">This team has no members yet. Use the 'Add New Member' button to assign employees.</p>}
                </div>
            </div>
            
            <AddMemberModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                teamId={team.id}
                existingMemberIds={team.employees.map(e => e.id)}
                onMemberAdded={fetchTeamDetails}
            />
        </div>
    );
};


// --- Add Member Modal Component ---
interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    teamId: number;
    existingMemberIds: number[];
    onMemberAdded: () => void;
}

const AddMemberModal = ({ isOpen, onClose, teamId, existingMemberIds, onMemberAdded }: AddMemberModalProps) => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Employee[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // This useEffect handles debouncing the search input
    useEffect(() => {
        if (!isOpen) return;

        // Clear previous results when search term is empty
        if (searchTerm.trim() === '') {
            setResults([]);
            return;
        }

        setIsLoading(true);
        const delayDebounceFn = setTimeout(() => {
            if (user?.ba_id && searchTerm) {
                apiClient.get(`/api/employees/unassigned/${user.ba_id}?search=${searchTerm}`)
                    .then(response => {
                        // Filter out employees already in the team
                        setResults(response.data.filter((emp: Employee) => !existingMemberIds.includes(emp.id)));
                    })
                    .catch(err => console.error("Failed to search employees", err))
                    .finally(() => setIsLoading(false));
            }
        }, 500); // Wait 500ms after user stops typing

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, isOpen, user, existingMemberIds]);

    const handleSelectEmployee = (employee: Employee) => {
        setSelectedEmployee(employee);
        setSearchTerm(employee.name); // Populate input with selected name
        setResults([]); // Hide results list
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployee) { alert("Please search for and select an employee."); return; }
        setIsSubmitting(true);
        try {
            await apiClient.put(`/api/employees/${selectedEmployee.id}/assign_team/${teamId}`);
            onMemberAdded();
            onClose();
        } catch (error) {
            alert("An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
            // Reset state for next time modal opens
            setSearchTerm('');
            setSelectedEmployee(null);
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Member to Team">
            <form onSubmit={handleSubmit} className="space-y-1 relative">
                <div>
                    <label htmlFor="employeeSearch" className="block text-sm font-medium">Search by Name or Code</label>
                    <input
                        id="employeeSearch"
                        type="text"
                        value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setSelectedEmployee(null); }}
                        placeholder="Start typing to search..."
                        className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm"
                    />
                </div>
                
                {/* Search Results */}
                {(isLoading || results.length > 0) && (
                    <div className="absolute z-10 w-full bg-white dark:bg-gray-700 border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {isLoading && <div className="p-2 text-gray-500">Searching...</div>}
                        {!isLoading && results.map(emp => (
                            <div
                                key={emp.id}
                                onClick={() => handleSelectEmployee(emp)}
                                className="p-2 hover:bg-blue-500 hover:text-white cursor-pointer"
                            >
                                {emp.name} ({emp.employee_code})
                            </div>
                        ))}
                    </div>
                )}
                
                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                    <button type="submit" disabled={isSubmitting || !selectedEmployee} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-blue-300">
                        {isSubmitting ? 'Adding...' : 'Add Member'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};