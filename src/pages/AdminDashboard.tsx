import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { LogOut, Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import PatientForm from '../components/PatientForm';

interface Patient {
  _id: string;
  name: string;
  age: number;
  gender: string;
  diagnosis: string;
  precautions: string;
  username: string;
  documents: string[];
}

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await axios.get('/api/patients');
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (patient: Patient) => {
    setDeleteConfirm(patient);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    
    setDeleting(true);
    try {
      await axios.delete(`/api/patients/${deleteConfirm._id}`);
      setPatients(patients.filter(p => p._id !== deleteConfirm._id));
      setDeleteConfirm(null);
      
      // Show success message
      alert(`Patient "${deleteConfirm.name}" has been deleted successfully.`);
    } catch (error: any) {
      console.error('Error deleting patient:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete patient';
      alert(`Error: ${errorMessage}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPatient(null);
    fetchPatients();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-4">
              <img 
                src="/logo.png" 
                alt="Centurion University Logo" 
                className="h-16 w-16 object-contain"
                onError={(e) => {
                  // Fallback if logo.png doesn't exist
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div>
                <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>
                <p className="text-xs text-gray-500">Optometry Patient Management</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Welcome, {user?.name}</span>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Patient Records</h2>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Patient
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diagnosis</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {patients.map((patient) => (
                  <tr key={patient._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{patient.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{patient.age}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{patient.gender}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{patient.username}</td>
                    <td className="px-6 py-4">{patient.diagnosis || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(patient)}
                          className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition"
                          title="Edit Patient"
                        >
                          <Edit size={16} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(patient)}
                          className="flex items-center gap-1 px-3 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition"
                          title="Delete Patient"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center gap-3 p-6 border-b">
              <AlertTriangle className="text-red-500" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">Delete Patient</h3>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this patient? This action cannot be undone.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p><strong>Name:</strong> {deleteConfirm.name}</p>
                <p><strong>Username:</strong> {deleteConfirm.username}</p>
                <p><strong>Age:</strong> {deleteConfirm.age}</p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete Patient'}
                </button>
                <button
                  onClick={handleDeleteCancel}
                  disabled={deleting}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <PatientForm
          patient={editingPatient}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
