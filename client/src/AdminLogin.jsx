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
    <div className="admin-bg min-h-screen flex items-center justify-center p-3 sm:p-4 overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-[100px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="admin-glass w-full max-w-md p-5 sm:p-8 rounded-2xl relative z-10 shadow-2xl shadow-black"
      >
        <div className="text-center mb-5 sm:mb-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
            className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-purple-800 rounded-2xl mx-auto flex items-center justify-center mb-3 sm:mb-4 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
          >
            <MdAdminPanelSettings className="text-2xl sm:text-3xl text-white" />
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-wider text-white">ADMIN<span className="text-purple-500">PORTAL</span></h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-2 font-medium">Secure System Authentication</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-purple-500/10 border border-purple-500/50 text-purple-500 text-xs sm:text-sm p-2.5 sm:p-3 rounded-xl mb-4 sm:mb-6 text-center">
            {error}
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-3.5 sm:space-y-5">
          <div className="relative">
            <MdPerson className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 text-base sm:text-xl" />
            <input 
              type="text" 
              placeholder="Admin Username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-gray-800 rounded-xl py-2.5 sm:py-3 pl-10 sm:pl-12 pr-4 text-xs sm:text-base text-white focus:outline-none focus:border-purple-500 focus:shadow-[0_0_10px_rgba(168,85,247,0.2)] transition-all"
              required 
            />
          </div>
          <div className="relative">
            <MdLock className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 text-base sm:text-xl" />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-gray-800 rounded-xl py-2.5 sm:py-3 pl-10 sm:pl-12 pr-10 sm:pr-12 text-xs sm:text-base text-white focus:outline-none focus:border-purple-500 focus:shadow-[0_0_10px_rgba(168,85,247,0.2)] transition-all"
              required 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 sm:right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showPassword ? <MdVisibilityOff className="text-base sm:text-xl" /> : <MdVisibility className="text-base sm:text-xl" />}
            </button>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white text-xs sm:text-base font-bold rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all admin-lift disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
