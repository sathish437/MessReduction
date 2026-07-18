import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MdAdminPanelSettings, MdLock, MdPerson, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import apiClient from './api/apiClient';
import { setStaffAuth } from './services/authService';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/api/staff/login', {
        role: 'ADMIN',
        userName: username,
        password: password
      });

      const { token, role } = response.data;
      
      if (role !== 'ADMIN') {
        setError('Access denied. Admin role required.');
        return;
      }

      setStaffAuth(token, username, role);
      navigate('/admin/dashboard');

    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-bg min-h-screen flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-900/20 rounded-full blur-[100px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="admin-glass w-full max-w-md p-8 rounded-2xl relative z-10 shadow-2xl shadow-black"
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
            className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-800 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
          >
            <MdAdminPanelSettings size={32} className="text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-wider text-white">ADMIN<span className="text-red-500">PORTAL</span></h1>
          <p className="text-gray-400 mt-2 font-medium">Secure System Authentication</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-xl mb-6 text-center">
            {error}
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative">
            <MdPerson className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input 
              type="text" 
              placeholder="Admin Username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-red-500 focus:shadow-[0_0_10px_rgba(220,38,38,0.2)] transition-all"
              required 
            />
          </div>
          <div className="relative">
            <MdLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-gray-800 rounded-xl py-3 pl-12 pr-12 text-white focus:outline-none focus:border-red-500 focus:shadow-[0_0_10px_rgba(220,38,38,0.2)] transition-all"
              required 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
            </button>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all admin-lift disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'AUTHORIZE ACCESS'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
