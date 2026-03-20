import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { LogOut, Download, FileText, X } from 'lucide-react';

interface PatientData {
  _id: string;
  name: string;
  age: number;
  gender: string;
  diagnosis: string;
  precautions: string;
  documents: string[];
}

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchPatientData();
  }, []);

  const fetchPatientData = async () => {
    try {
      const response = await axios.get('/api/patient/me');
      setPatientData(response.data);
    } catch (error) {
      console.error('Error fetching patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (filename: string) => {
    window.open(`/uploads/${filename}`, '_blank');
  };

  const isImageFile = (filename: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  const isPdfFile = (filename: string): boolean => {
    return filename.toLowerCase().endsWith('.pdf');
  };

  const getFileUrl = (filename: string): string => {
    return `/uploads/${filename}`;
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
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div>
                <h1 className="text-2xl font-bold text-primary">My Medical Records</h1>
                <p className="text-xs text-gray-500">Optometry Patient Portal</p>
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : patientData ? (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Name</label>
                  <p className="font-medium">{patientData.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Age</label>
                  <p className="font-medium">{patientData.age}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Gender</label>
                  <p className="font-medium">{patientData.gender}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Medical Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600">Diagnosis</label>
                  <p className="font-medium">{patientData.diagnosis || 'No diagnosis recorded'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Precautions</label>
                  <p className="font-medium">{patientData.precautions || 'No precautions recorded'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Documents & Prescriptions</h2>
              {patientData.documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {patientData.documents.map((doc, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      {isImageFile(doc) ? (
                        <div className="relative group">
                          <img 
                            src={getFileUrl(doc)} 
                            alt={`Document ${index + 1}`}
                            className="w-full h-64 object-cover cursor-pointer hover:opacity-90 transition"
                            onClick={() => setSelectedImage(getFileUrl(doc))}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
                              Click to view full size
                            </span>
                          </div>
                        </div>
                      ) : isPdfFile(doc) ? (
                        <div className="h-64 bg-gray-100 flex flex-col items-center justify-center">
                          <FileText size={64} className="text-red-500 mb-2" />
                          <p className="text-sm text-gray-600">PDF Document</p>
                        </div>
                      ) : (
                        <div className="h-64 bg-gray-100 flex flex-col items-center justify-center">
                          <FileText size={64} className="text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">Document</p>
                        </div>
                      )}
                      <div className="p-3 bg-gray-50 flex items-center justify-between">
                        <span className="text-sm text-gray-700 truncate flex-1">{doc}</span>
                        <button
                          onClick={() => handleDownload(doc)}
                          className="ml-2 flex items-center gap-1 text-primary hover:text-blue-700 text-sm"
                          title="Download"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No documents available</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">No data available</div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-6xl max-h-[90vh] w-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white text-gray-800 p-2 rounded-full hover:bg-gray-200 z-10"
            >
              <X size={24} />
            </button>
            <img 
              src={selectedImage} 
              alt="Full size document"
              className="w-full h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(selectedImage, '_blank');
                }}
                className="bg-white text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2"
              >
                <Download size={18} />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
