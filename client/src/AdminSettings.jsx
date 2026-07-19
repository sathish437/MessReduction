import React, { useState, useEffect } from 'react';
import { MdSave, MdNotifications, MdSecurity, MdRule } from 'react-icons/md';
import apiClient from './api/apiClient';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    systemActive: true,
    whatsappEnabled: true,
    pushEnabled: false,
    cutOffTime: '17:00',
    maxLeaveDays: 14,
    adminEmail: 'admin@gces.edu'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await apiClient.get('/api/admin/settings');
        setSettings(response.data);
      } catch (err) {
        setMessage('Failed to load settings from server.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await apiClient.put('/api/admin/settings', settings);
      setMessage('Settings updated successfully!');
    } catch (err) {
      setMessage('Failed to update settings.');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">System Settings</h2>
        <button 
          onClick={handleSave} 
          disabled={saving || loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium shadow-lg shadow-red-600/20 transition-all admin-lift"
        >
          <MdSave size={20} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border ${message.includes('success') ? 'bg-green-900/20 border-green-500/50 text-green-400' : 'bg-red-900/20 border-red-500/50 text-red-400'}`}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64 text-gray-400">
           <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mr-3"></div>
           Loading settings...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General System Status */}
        <div className="admin-card rounded-2xl p-6 border admin-border">
          <div className="flex items-center gap-3 mb-6 border-b admin-border pb-4">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
              <MdSecurity size={24} />
            </div>
            <h3 className="text-xl font-bold">Global Toggles</h3>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-200">System Active</p>
                <p className="text-sm text-gray-500">Allow students to submit new forms</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="systemActive" checked={settings.systemActive} onChange={handleChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-200">WhatsApp Notifications</p>
                <p className="text-sm text-gray-500">Send automated WhatsApp alerts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="whatsappEnabled" checked={settings.whatsappEnabled} onChange={handleChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Business Rules */}
        <div className="admin-card rounded-2xl p-6 border admin-border">
          <div className="flex items-center gap-3 mb-6 border-b admin-border pb-4">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
              <MdRule size={24} />
            </div>
            <h3 className="text-xl font-bold">Business Rules</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Daily Cut-off Time</label>
              <input 
                type="time" 
                name="cutOffTime" 
                value={settings.cutOffTime} 
                onChange={handleChange} 
                className="w-full bg-[#161616] border admin-border rounded-xl px-4 py-2.5 text-sm focus:border-red-500 outline-none transition-colors" style={{colorScheme: 'dark'}}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Max Allowed Leave Days (per sem)</label>
              <input 
                type="number" 
                name="maxLeaveDays" 
                value={settings.maxLeaveDays} 
                onChange={handleChange} 
                className="w-full bg-[#161616] border admin-border rounded-xl px-4 py-2.5 text-sm focus:border-red-500 outline-none transition-colors"
              />
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
