import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X, Upload, File, Trash2 } from 'lucide-react';

interface Patient {
  _id?: string;
  name: string;
  age: number;
  gender: string;
  diagnosis: string;
  precautions: string;
  username: string;
  password?: string;
  documents?: string[];
}

interface PatientFormProps {
  patient: Patient | null;
  onClose: () => void;
}

const PatientForm = ({ patient, onClose }: PatientFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    diagnosis: '',
    precautions: '',
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [prescriptionFiles, setPrescriptionFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prescriptionInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name,
        age: patient.age.toString(),
        gender: patient.gender,
        diagnosis: patient.diagnosis,
        precautions: patient.precautions,
        username: patient.username,
        password: ''
      });
    }
  }, [patient]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadSuccess('');
    }
  };

  const handlePrescriptionSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setPrescriptionFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removePrescriptionFile = (index: number) => {
    setPrescriptionFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !patient?._id) return;

    setUploading(true);
    setError('');
    setUploadSuccess('');

    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('patientId', patient._id);

      await axios.post('/api/upload-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadSuccess(`File "${selectedFile.name}" uploaded successfully!`);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = {
        ...formData,
        age: parseInt(formData.age)
      };

      if (patient?._id) {
        // Update existing patient
        await axios.put(`/api/patients/${patient._id}`, data);
      } else {
        // Create new patient with prescription files
        const formDataToSend = new FormData();
        formDataToSend.append('name', data.name);
        formDataToSend.append('age', data.age.toString());
        formDataToSend.append('gender', data.gender);
        formDataToSend.append('diagnosis', data.diagnosis);
        formDataToSend.append('precautions', data.precautions);
        formDataToSend.append('username', data.username);
        formDataToSend.append('password', data.password);
        
        // Append prescription files
        prescriptionFiles.forEach((file) => {
          formDataToSend.append('prescriptions', file);
        });

        await axios.post('/api/auth/register', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-semibold">
            {patient ? 'Edit Patient' : 'Add New Patient'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              required
              disabled={!!patient}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password {patient && '(leave blank to keep current)'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              required={!patient}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
            <textarea
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precautions</label>
            <textarea
              value={formData.precautions}
              onChange={(e) => setFormData({ ...formData, precautions: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              rows={3}
            />
          </div>

          {/* Prescription Upload Section - Show when adding new patient */}
          {!patient && (
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Prescription Photos (Optional)
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    ref={prescriptionInputRef}
                    type="file"
                    onChange={handlePrescriptionSelect}
                    accept=".pdf,.jpg,.jpeg,.png"
                    multiple
                    className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-primary hover:file:bg-blue-100"
                  />
                </div>

                {prescriptionFiles.length > 0 && (
                  <div className="space-y-2">
                    {prescriptionFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                        <File size={18} className="text-primary" />
                        <span className="text-sm text-gray-700 flex-1">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removePrescriptionFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  Accepted formats: PDF, JPG, JPEG, PNG (Max 10MB per file)
                </p>
              </div>
            </div>
          )}

          {/* Document Upload Section - Only show when editing existing patient */}
          {patient?._id && (
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Document
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-primary hover:file:bg-blue-100"
                  />
                  <button
                    type="button"
                    onClick={handleFileUpload}
                    disabled={!selectedFile || uploading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload size={18} />
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>

                {selectedFile && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <File size={18} className="text-primary" />
                    <span className="text-sm text-gray-700 flex-1">{selectedFile.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}

                {uploadSuccess && (
                  <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm">
                    {uploadSuccess}
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  Accepted formats: PDF, DOC, DOCX, JPG, JPEG, PNG (Max 10MB)
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : patient ? 'Update Patient' : 'Add Patient'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientForm;
