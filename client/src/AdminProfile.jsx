import React, { useState } from 'react';
import { MdPerson, MdLock, MdHistory } from 'react-icons/md';
import apiClient from './api/apiClient';

const AdminProfile = () => {
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ text: 'New passwords do not match!', type: 'error' });
      return;
    }
    
    setSaving(true);
    try {
      await apiClient.put('/api/admin/profile/password', {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword
      });
      setMessage({ text: 'Password updated successfully!', type: 'success' });
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({ text: 'Failed to update password.', type: 'error' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    }
  };

  // Mocked activity log data
  const activities = [
    { id: 1, action: "Force Approved request #405", time: "10 mins ago" },
    { id: 2, action: "Updated System Settings (Cut-off Time)", time: "2 hours ago" },
    { id: 3, action: "Bulk Deleted 12 student records", time: "Yesterday" },
    { id: 4, action: "Logged in to Admin Portal", time: "Yesterday" }
  ];

  return (
    <div className="flex flex-col h-full space-y-6">
      <h2 className="text-2xl font-bold">Admin Profile</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Security / Password Change */}
        <div className="admin-card rounded-2xl p-6 border admin-border">
          <div className="flex items-center gap-3 mb-6 border-b admin-border pb-4">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
              <MdLock size={24} />
            </div>
            <h3 className="text-xl font-bold">Change Password</h3>
          </div>

          {message.text && (
            <div className={`mb-6 p-4 rounded-xl border ${message.type === 'success' ? 'bg-green-900/20 border-green-500/50 text-green-400' : 'bg-red-900/20 border-red-500/50 text-red-400'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Old Password</label>
              <input 
                required 
                type="password" 
                name="oldPassword" 
                value={passwords.oldPassword} 
                onChange={handleChange} 
                className="w-full bg-[#161616] border admin-border rounded-xl px-4 py-2.5 text-sm focus:border-red-500 outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">New Password</label>
              <input 
                required 
                type="password" 
                name="newPassword" 
                value={passwords.newPassword} 
                onChange={handleChange} 
                className="w-full bg-[#161616] border admin-border rounded-xl px-4 py-2.5 text-sm focus:border-red-500 outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Confirm New Password</label>
              <input 
                required 
                type="password" 
                name="confirmPassword" 
                value={passwords.confirmPassword} 
                onChange={handleChange} 
                className="w-full bg-[#161616] border admin-border rounded-xl px-4 py-2.5 text-sm focus:border-red-500 outline-none" 
              />
            </div>
            <button 
              type="submit" 
              disabled={saving}
              className="w-full mt-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium shadow-lg shadow-red-600/20 transition-all admin-lift"
            >
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Audit Log (Mocked) */}
        <div className="admin-card rounded-2xl p-6 border admin-border flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6 border-b admin-border pb-4">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
              <MdHistory size={24} />
            </div>
            <h3 className="text-xl font-bold">Recent Activity</h3>
          </div>
          
          <div className="space-y-6 flex-1">
            {activities.map((act, index) => (
              <div key={act.id} className="relative pl-6">
                {/* Timeline line */}
                {index !== activities.length - 1 && (
                  <div className="absolute left-[7px] top-4 bottom-[-16px] w-[2px] bg-red-500/20"></div>
                )}
                {/* Timeline dot */}
                <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-red-500 bg-[#161616]"></div>
                
                <p className="text-gray-200 font-medium">{act.action}</p>
                <p className="text-xs text-gray-500 mt-1">{act.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
