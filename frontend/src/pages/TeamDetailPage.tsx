// ===== File: frontend/src/pages/TeamDetailPage.tsx (CORRECTED) =====

// ===== File: frontend/src/pages/TeamDetailPage.tsx (CORRECTED) =====

import { useEffect, useState, FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../services/api';
import { ArrowLeft, Trash2, ShieldCheck, UserPlus, UserCheck } from 'lucide-react';
import { Modal } from '../components/ui/Modal';

interface Employee { id: number; name: string; employee_code: string; is_team_lead: boolean; }
interface TeamDetails { id: number; name: string; team_code: string; employees: Employee[]; }

export const TeamDetailPage = () => {
    const { teamId } = useParams<{ teamId: string }>();
    const [team, setTeam] = useState<TeamDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchTeamDetails = async () => {
        if (!teamId) {
            setError("No Team ID provided in the URL.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get(`/api/teams/${teamId}`);
            setTeam(response.data);
        } catch (err: any) {
            console.error("Failed to fetch team details", err);
            setError(err.response?.data?.detail || "Could not load team details. The team may not exist.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeamDetails();
    }, [teamId]);

    const handleUnassignMember = async (employeeId: number) => {
        if (window.confirm("Are you sure you want to remove this member?")) {
            try {
                await apiClient.put(`/api/employees/${employeeId}/unassign`);
                fetchTeamDetails();
            } catch {
                alert("Failed to remove member.");
            }
        }
    };

    const handleToggleLead = async (employeeId: number) => {
        try {
            await apiClient.put(`/api/employees/${employeeId}/toggle_lead/${teamId}`);
            fetchTeamDetails();
        } catch {
            alert("Failed to change team lead status.");
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Team Details...</div>;

    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    if (!team) return <div className="p-8 text-center text-red-500">Team not found.</div>;

    return (
        <div className="space-y-6">
            <Link to="/management/teams" className="inline-flex items-center text-blue-600 hover:underline">
                <ArrowLeft size={20} className="mr-2" />
                Back to All Teams
            </Link>

            <div>
                <h1 className="text-3xl font-bold">{team.name}</h1>
                <p className="text-lg text-gray-500">{team.team_code}</p>
            </div>

            <div className="flex justify-end">
                <button onClick={() => setIsModalOpen(true)} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                    <UserPlus size={20} className="mr-2" />
                    Add New Member
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Team Members ({team.employees.length})</h2>
                <div className="space-y-4">
                    {team.employees.map(member => (
                        <div key={member.id} className="p-4 border rounded-lg flex justify-between items-center">
                            <div className="flex items-center">
                                {member.is_team_lead
                                    ? <ShieldCheck size={24} className="text-green-500 mr-4" />
                                    : <UserPlus size={24} className="text-gray-400 mr-4" />}
                                <div>
                                    <p className="font-bold">{member.name}</p>
                                    <p className="text-sm text-gray-500">{member.employee_code}</p>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={() => handleToggleLead(member.id)} title={member.is_team_lead ? "Remove as Team Lead" : "Set as Team Lead"}>
                                    <UserCheck size={18} />
                                </button>
                                <button onClick={() => handleUnassignMember(member.id)} title="Remove Member">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {team.employees.length === 0 && <p className="text-gray-500">This team has no members yet.</p>}
                </div>
            </div>

            <AddMemberModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                teamId={team.id}
                onMemberAdded={fetchTeamDetails}
            />
        </div>
    );
};


// --- AddMemberModal component remains unchanged (same as your old code) ---
interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: number;
  onMemberAdded: () => void;
}

const AddMemberModal = ({ isOpen, onClose, teamId, onMemberAdded }: AddMemberModalProps) => {
  const [hrNumber, setHrNumber] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!hrNumber || !name) {
      setError("Both Name and HR Number are required.");
      return;
    }
    setIsSubmitting(true);
    setError("");

    try {
      await apiClient.post(`/api/teams/${teamId}/add_member`, {
        hr_number: hrNumber,
        name: name,
        role: "employee", // Default role for new members
      });
      onMemberAdded(); // Refresh the member list in the parent component
      onClose(); // Close the modal on success
    } catch (err: any) {
      setError(err.response?.data?.detail || "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setHrNumber("");
      setName("");
      setError("");
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Member to Team">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Member Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., John Doe"
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="hrNumber" className="block text-sm font-medium">
            Member HR Number (Username)
          </label>
          <input
            id="hrNumber"
            type="text"
            value={hrNumber}
            onChange={(e) => setHrNumber(e.target.value)}
            placeholder="Enter the new member's unique HR number"
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm"
            required
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-blue-300"
          >
            {isSubmitting ? "Adding..." : "Add Member"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
