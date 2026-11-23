import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MdAdminPanelSettings, MdPerson, MdVisibility, MdVisibilityOff, MdLockOutline } from 'react-icons/md';
import { FiAlertCircle } from 'react-icons/fi';
import apiClient from './api/apiClient';
import { setStaffAuth } from './services/authService';
import AuthShell, { AuthCardHeader } from './components/AuthShell';

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
    <AuthShell
      onNavigate={navigate}
      backTo="/"
      backLabel="Portal home"
      maxWidth="410px"
      footerNote="Administration Console"
    >
      <div className="panel p-6 sm:p-7">
        <AuthCardHeader
          eyebrow="Administration"
          title="Administrator sign in"
          subtitle="Secure access for system administrators only."
          icon={<MdAdminPanelSettings size={19} />}
        />

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-[var(--radius-md)] px-3 py-2.5 text-xs font-medium"
            style={{
              background: 'var(--color-danger-soft)',
              border: '1px solid var(--color-danger-border)',
              color: 'var(--color-danger)'
            }}
          >
            <FiAlertCircle className="mt-[1px] shrink-0" size={14} />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="flex w-full flex-col gap-1.5 text-left">
            <label htmlFor="admin-username" className="field-label">
              Administrator username
            </label>
            <div className="field-shell">
              <span className="shrink-0" style={{ color: 'var(--theme-text-faint)' }}>
                <MdPerson size={17} />
              </span>
              <input
                id="admin-username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                className="w-full flex-1 bg-transparent font-medium focus:outline-none"
              />
            </div>
          </div>

          <div className="flex w-full flex-col gap-1.5 text-left">
            <label htmlFor="admin-password" className="field-label">
              Password
            </label>
            <div className="field-shell relative">
              <span className="shrink-0" style={{ color: 'var(--theme-text-faint)' }}>
                <MdLockOutline size={17} />
              </span>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full flex-1 bg-transparent pr-8 font-medium focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 flex items-center justify-center transition-colors"
                style={{ color: 'var(--theme-text-faint)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--theme-text-primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--theme-text-faint)'; }}
              >
                {showPassword ? <MdVisibilityOff size={17} /> : <MdVisibility size={17} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary mt-1 w-full">
            {loading ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Authenticating…
              </>
            ) : (
              'Authorise access'
            )}
          </button>
        </form>

        <div
          className="mt-5 flex items-start gap-2 rounded-[var(--radius-md)] px-3 py-2.5"
          style={{ background: 'var(--theme-bg-soft)', border: '1px solid var(--theme-border)' }}
        >
          <span className="mt-[1px] shrink-0" style={{ color: 'var(--theme-text-faint)' }}>
            <MdAdminPanelSettings size={15} />
          </span>
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
            All administrator activity is logged. Unauthorised access attempts are recorded and
            reported to the college IT cell.
          </p>
        </div>
      </div>
    </AuthShell>
  );
};

export default AdminLogin;
