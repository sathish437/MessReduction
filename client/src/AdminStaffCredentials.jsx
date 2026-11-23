import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdSearch, MdRefresh, MdEdit, MdVpnKey, MdLock,
  MdSupervisorAccount, MdShield, MdPerson, MdCheckCircle,
  MdVisibility, MdVisibilityOff, MdClose, MdPhone, MdEmail,
  MdBusinessCenter, MdSchool, MdPeople
} from 'react-icons/md';
import { getStaffCredentials, updateStaffCredential } from './api/staffCredentialService';
import Toast from './components/Toast';

const AdminStaffCredentials = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  const [toast, setToast] = useState(null);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    gmail: '',
    phoneNo: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getStaffCredentials();
      if (Array.isArray(data)) {
        setStaffList(data);
      } else {
        setStaffList([]);
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to load staff credentials', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleOpenEdit = (staff) => {
    setEditingStaff(staff);
    setFormData({
      username: staff.username || '',
      password: '',
      confirmPassword: '',
      gmail: staff.gmail || '',
      phoneNo: staff.phoneNo || ''
    });
    setFormErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowEditModal(true);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.username || !formData.username.trim()) {
      errors.username = 'Username is required and cannot be empty.';
    }

    if (formData.gmail && formData.gmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.gmail.trim())) {
        errors.gmail = 'Please enter a valid email address.';
      }
    }

    if (formData.password) {
      if (formData.password.length < 4) {
        errors.password = 'Password must be at least 4 characters long.';
      }
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match.';
      }
    } else if (formData.confirmPassword) {
      errors.password = 'Please enter a new password.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload = {
        username: formData.username.trim(),
        password: formData.password ? formData.password.trim() : undefined,
        gmail: formData.gmail ? formData.gmail.trim() : undefined,
        phoneNo: formData.phoneNo ? formData.phoneNo.trim() : undefined
      };

      const res = await updateStaffCredential(editingStaff.id, payload);

      // If user changed their own admin username, update stored token to avoid auth lookup failure
      if (res.newToken) {
        localStorage.setItem('auth_token', res.newToken);
        if (res.newUsername) {
          localStorage.setItem('staff_username', res.newUsername);
        }
      }

      showNotification(res.message || 'Staff credentials updated successfully.', 'success');
      setShowEditModal(false);
      fetchStaff();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to update credentials';
      if (errMsg.toLowerCase().includes('already exists')) {
        setFormErrors(prev => ({ ...prev, username: 'Username already exists.' }));
      }
      showNotification(errMsg, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Helper for human-readable role labels
  const getRoleBadge = (staff) => {
    switch (staff.role) {
      case 'Warden':
        return {
          title: 'Associate Warden',
          sub: staff.year ? `Year ${staff.year}` : 'All Years',
          badgeClass: 'badge badge-success',
          icon: <MdShield size={14} />
        };
      case 'DeputyWarden':
        return {
          title: 'Deputy Warden',
          sub: `${staff.gender || ''} • Year ${staff.year || 'N/A'}`.trim(),
          badgeClass: 'badge badge-info',
          icon: <MdSupervisorAccount size={14} />
        };
      case 'Office':
        return {
          title: 'Office Staff',
          sub: 'Administrative',
          badgeClass: 'badge badge-warning',
          icon: <MdBusinessCenter size={14} />
        };
      case 'ADMIN':
        return {
          title: 'Administrator',
          sub: 'Full Access',
          badgeClass: 'badge',
          badgeStyle: { background: 'var(--color-accent-soft)', borderColor: 'var(--color-accent)', color: 'var(--color-accent)' },
          icon: <MdShield size={14} />
        };
      default:
        return {
          title: staff.role,
          sub: '',
          badgeClass: 'badge badge-neutral',
          icon: <MdPerson size={14} />
        };
    }
  };

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const matchesSearch =
        (s.username && s.username.toLowerCase().includes(search.toLowerCase())) ||
        (s.role && s.role.toLowerCase().includes(search.toLowerCase())) ||
        (s.gmail && s.gmail.toLowerCase().includes(search.toLowerCase())) ||
        (s.phoneNo && s.phoneNo.toLowerCase().includes(search.toLowerCase()));

      const matchesRole =
        selectedRoleFilter === 'ALL' || s.role === selectedRoleFilter;

      return matchesSearch && matchesRole;
    });
  }, [staffList, search, selectedRoleFilter]);

  return (
    <div className="flex flex-col h-full space-y-3 sm:space-y-4 min-w-0 w-full text-[var(--color-text-primary)]">
      {/* Toast Notification Container */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Staff credentials</h1>
          <p className="page-subtitle">Login usernames and authentication details for hostel staff accounts.</p>
        </div>
        <span className="badge badge-neutral self-start sm:self-auto">{staffList.length} accounts</span>
      </div>

      {/* Filter and Search Bar */}
      <div className="panel p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="field-shell flex-1">
            <MdSearch size={16} style={{ color: 'var(--theme-text-faint)' }} />
            <input
              type="text"
              placeholder="Search username, role or email"
              className="w-full flex-1 bg-transparent text-[13px] font-medium focus:outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="staff-role-filter">Role</label>
            <select
              id="staff-role-filter"
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="h-9 min-h-0 flex-1 py-0 text-[12px] font-medium sm:flex-none"
            >
              <option value="ALL">All roles</option>
              <option value="ADMIN">Administrator</option>
              <option value="Warden">Associate warden</option>
              <option value="DeputyWarden">Deputy warden</option>
              <option value="Office">Office staff</option>
            </select>

            <button onClick={fetchStaff} className="btn btn-secondary h-9 px-3" title="Refresh list">
              <MdRefresh size={16} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile card view */}
      <div className="block space-y-2.5 md:hidden">
        {loading ? (
          <div className="panel p-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="skeleton mb-2 h-20 w-full" />
            ))}
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="panel">
            <div className="empty-state">
              <div className="empty-state-icon">
                <MdVpnKey size={20} style={{ color: 'var(--color-accent)' }} />
              </div>
              <h3 className="text-[14px] font-semibold text-[var(--theme-text-primary)]">No accounts found</h3>
              <p className="max-w-xs text-xs text-[var(--theme-text-secondary)]">
                No staff account matches the current search or role filter.
              </p>
            </div>
          </div>
        ) : (
          filteredStaff.map((staff) => {
            const roleInfo = getRoleBadge(staff);
            return (
              <div
                key={staff.id}
                className="panel space-y-2.5 p-3"
              >
                <div className="flex items-center justify-between gap-2 border-b border-[var(--theme-border)] pb-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 rounded-[6px] px-2 py-0.5 text-[11px] font-semibold ${roleInfo.badgeClass}`}>
                      {roleInfo.icon}
                      {roleInfo.title}
                    </span>
                    {roleInfo.sub && (
                      <span className="rounded border border-[var(--theme-border)] bg-[var(--theme-card-muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--theme-text-secondary)]">
                        {roleInfo.sub}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleOpenEdit(staff)}
                    className="flex shrink-0 items-center gap-1 rounded-[6px] border px-2.5 py-1 text-[11.5px] font-semibold transition-colors"
                    style={{ background: 'var(--color-accent-soft)', borderColor: 'var(--color-accent-border)', color: 'var(--color-accent)' }}
                  >
                    <MdEdit size={13} /> Edit
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-[var(--radius-sm)] p-2" style={{ background: 'var(--theme-card-muted)', border: '1px solid var(--theme-border)' }}>
                    <span className="section-label">Username</span>
                    <span className="mt-0.5 block truncate font-mono text-[12px] font-semibold text-[var(--theme-text-primary)]">
                      {staff.username}
                    </span>
                  </div>
                  <div className="rounded-[var(--radius-sm)] p-2" style={{ background: 'var(--theme-card-muted)', border: '1px solid var(--theme-border)' }}>
                    <span className="section-label">Password</span>
                    <span className="mt-0.5 block font-mono text-[12px] tracking-[0.18em] text-[var(--theme-text-secondary)]">
                      ••••••••
                    </span>
                  </div>
                </div>

                {(staff.gmail || staff.phoneNo) && (
                  <div className="flex flex-col gap-1 pt-0.5 text-[11px] text-[var(--theme-text-secondary)]">
                    {staff.gmail && (
                      <div className="flex items-center gap-1.5 truncate">
                        <MdEmail size={12} style={{ color: 'var(--theme-text-faint)' }} className="shrink-0" />
                        <span className="truncate">{staff.gmail}</span>
                      </div>
                    )}
                    {staff.phoneNo && (
                      <div className="flex items-center gap-1.5 font-mono text-[10.5px]">
                        <MdPhone size={12} style={{ color: 'var(--theme-text-faint)' }} className="shrink-0" />
                        <span>{staff.phoneNo}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Desktop table view */}
      <div className="panel hidden overflow-hidden md:flex">
        <div className="w-full select-none overflow-x-auto">
          <table className="data-table min-w-[720px]">
            <thead>
              <tr>
                <th>Staff role</th>
                <th>Username</th>
                <th>Password</th>
                <th>Contact details</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan="5">
                      <div className="skeleton my-1.5 h-9 w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <MdVpnKey size={20} style={{ color: 'var(--color-accent)' }} />
                      </div>
                      <h3 className="text-[14px] font-semibold text-[var(--theme-text-primary)]">No accounts found</h3>
                      <p className="max-w-xs text-xs text-[var(--theme-text-secondary)]">
                        No staff account matches the current search or role filter.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const roleInfo = getRoleBadge(staff);
                  return (
                    <tr key={staff.id}>
                      {/* Role */}
                      <td>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 rounded-[6px] px-2.5 py-1 text-[11.5px] font-semibold ${roleInfo.badgeClass}`}>
                            {roleInfo.icon}
                            {roleInfo.title}
                          </span>
                          {roleInfo.sub && (
                            <span className="text-[11px] font-medium text-[var(--theme-text-secondary)]">
                              {roleInfo.sub}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Username */}
                      <td className="whitespace-nowrap">
                        <span className="rounded-[6px] border border-[var(--theme-border)] bg-[var(--theme-card-muted)] px-2.5 py-1 font-mono text-[12px] font-medium text-[var(--theme-text-primary)]">
                          {staff.username}
                        </span>
                      </td>

                      {/* Masked Password */}
                      <td>
                        <div className="flex w-fit items-center gap-1.5 rounded-[6px] border border-[var(--theme-border)] bg-[var(--theme-card-muted)] px-2.5 py-1 font-mono text-[12px] tracking-[0.18em] text-[var(--theme-text-secondary)]">
                          <MdLock size={13} className="shrink-0" style={{ color: 'var(--theme-text-faint)' }} />
                          <span>••••••••</span>
                        </div>
                      </td>

                      {/* Contact Details */}
                      <td className="space-y-0.5 text-[12px] text-[var(--theme-text-secondary)]">
                        {staff.gmail && (
                          <div className="flex max-w-[220px] items-center gap-1.5 truncate font-medium" title={staff.gmail}>
                            <MdEmail size={13} className="shrink-0" style={{ color: 'var(--theme-text-faint)' }} />
                            <span className="truncate">{staff.gmail}</span>
                          </div>
                        )}
                        {staff.phoneNo && (
                          <div className="flex items-center gap-1.5 font-mono text-[11px]">
                            <MdPhone size={13} className="shrink-0" style={{ color: 'var(--theme-text-faint)' }} />
                            <span>{staff.phoneNo}</span>
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="text-center">
                        <button
                          onClick={() => handleOpenEdit(staff)}
                          className="inline-flex items-center gap-1.5 rounded-[6px] border px-3 py-1.5 text-[11.5px] font-semibold transition-colors"
                          style={{ background: 'var(--color-accent-soft)', borderColor: 'var(--color-accent-border)', color: 'var(--color-accent)' }}
                          title="Edit staff credentials"
                        >
                          <MdEdit size={14} /> Edit
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Staff Credentials Modal (Rendered in Portal) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showEditModal && editingStaff && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto select-none">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !saving && setShowEditModal(false)}
                className="fixed inset-0 backdrop-blur-[2px]"
                style={{ background: 'rgba(11, 23, 40, 0.55)' }}
              />

              {/* Modal Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 8 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                role="dialog"
                aria-modal="true"
                className="relative z-10 my-auto flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-[var(--radius-lg)] sm:max-h-[90vh]"
                style={{
                  background: 'var(--theme-card)',
                  border: '1px solid var(--theme-border)',
                  boxShadow: 'var(--shadow-modal)'
                }}
              >
                {/* Fixed Modal Header */}
                <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--theme-border)] px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)]"
                      style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}
                    >
                      <MdLock size={16} />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold leading-tight text-[var(--theme-text-primary)]">
                        Edit staff credentials
                      </h3>
                      <p className="mt-0.5 text-[11.5px] text-[var(--theme-text-secondary)]">
                        Update username, password or contact details
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    disabled={saving}
                    aria-label="Close"
                    className="rounded-[var(--radius-sm)] p-1.5 text-[var(--theme-text-faint)] transition-colors hover:bg-[var(--theme-bg-soft)] hover:text-[var(--theme-text-primary)]"
                  >
                    <MdClose size={18} />
                  </button>
                </div>

                {/* Form Container with Scrollable Body & Sticky Footer */}
                <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                  {/* Scrollable Form Content */}
                  <div className="overflow-y-auto p-4 sm:p-5 space-y-3.5 flex-1 min-h-0">
                    {/* Staff Role (Non-editable) */}
                    <div>
                      <label className="field-label">Staff role</label>
                      <div
                        className="flex items-center justify-between rounded-[var(--radius-sm)] px-3 py-2"
                        style={{ background: 'var(--theme-card-muted)', border: '1px solid var(--theme-border)' }}
                      >
                        <div className="flex items-center gap-2">
                          {getRoleBadge(editingStaff).icon}
                          <span className="text-[13px] font-semibold text-[var(--theme-text-primary)]">
                            {getRoleBadge(editingStaff).title}
                          </span>
                        </div>
                        {getRoleBadge(editingStaff).sub && (
                          <span className="rounded-[5px] border border-[var(--theme-border)] bg-[var(--theme-card)] px-2 py-0.5 text-[10px] font-medium text-[var(--theme-text-secondary)]">
                            {getRoleBadge(editingStaff).sub}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[10.5px] text-[var(--theme-text-faint)]">
                        Role permissions are fixed and cannot be changed here.
                      </p>
                    </div>

                    {/* Username Input */}
                    <div>
                      <label className="field-label" htmlFor="staff-username">Username <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                      <input
                        id="staff-username"
                        type="text"
                        required
                        value={formData.username}
                        onChange={(e) => {
                          setFormData({ ...formData, username: e.target.value });
                          if (formErrors.username) setFormErrors({ ...formErrors, username: '' });
                        }}
                        placeholder="e.g. warden"
                        className="w-full font-mono text-[13px]"
                        style={formErrors.username ? { borderColor: 'var(--color-danger)' } : undefined}
                      />
                      {formErrors.username && (
                        <span className="mt-1 block text-[11px] font-medium" style={{ color: 'var(--color-danger)' }}>
                          {formErrors.username}
                        </span>
                      )}
                    </div>

                    {/* Contact Details (Email & Phone) */}
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <div>
                        <label className="field-label" htmlFor="staff-email">Email</label>
                        <input
                          id="staff-email"
                          type="email"
                          value={formData.gmail}
                          onChange={(e) => {
                            setFormData({ ...formData, gmail: e.target.value });
                            if (formErrors.gmail) setFormErrors({ ...formErrors, gmail: '' });
                          }}
                          placeholder="e.g. staff@gmail.com"
                          className="w-full text-[13px]"
                          style={formErrors.gmail ? { borderColor: 'var(--color-danger)' } : undefined}
                        />
                        {formErrors.gmail && (
                          <span className="mt-1 block text-[11px] font-medium" style={{ color: 'var(--color-danger)' }}>
                            {formErrors.gmail}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="field-label" htmlFor="staff-phone">Phone number</label>
                        <input
                          id="staff-phone"
                          type="tel"
                          value={formData.phoneNo}
                          onChange={(e) => setFormData({ ...formData, phoneNo: e.target.value })}
                          placeholder="e.g. +919876543210"
                          className="w-full font-mono text-[13px]"
                        />
                      </div>
                    </div>

                    {/* New Password Input */}
                    <div>
                      <label className="field-label" htmlFor="staff-password">New password</label>
                      <div className="relative">
                        <input
                          id="staff-password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => {
                            setFormData({ ...formData, password: e.target.value });
                            if (formErrors.password) setFormErrors({ ...formErrors, password: '' });
                          }}
                          placeholder="Leave blank to keep unchanged"
                          className="w-full pr-9 text-[13px]"
                          style={formErrors.password ? { borderColor: 'var(--color-danger)' } : undefined}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--theme-text-faint)] transition-colors hover:text-[var(--theme-text-primary)]"
                        >
                          {showPassword ? <MdVisibilityOff size={16} /> : <MdVisibility size={16} />}
                        </button>
                      </div>
                      {formErrors.password && (
                        <span className="mt-1 block text-[11px] font-medium" style={{ color: 'var(--color-danger)' }}>
                          {formErrors.password}
                        </span>
                      )}
                    </div>

                    {/* Confirm Password Input */}
                    {formData.password && (
                      <div>
                        <label className="field-label" htmlFor="staff-confirm-password">Confirm password <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                        <div className="relative">
                          <input
                            id="staff-confirm-password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={formData.confirmPassword}
                            onChange={(e) => {
                              setFormData({ ...formData, confirmPassword: e.target.value });
                              if (formErrors.confirmPassword) setFormErrors({ ...formErrors, confirmPassword: '' });
                            }}
                            placeholder="Re-enter new password"
                            className="w-full pr-9 text-[13px]"
                            style={formErrors.confirmPassword ? { borderColor: 'var(--color-danger)' } : undefined}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--theme-text-faint)] transition-colors hover:text-[var(--theme-text-primary)]"
                          >
                            {showConfirmPassword ? <MdVisibilityOff size={16} /> : <MdVisibility size={16} />}
                          </button>
                        </div>
                        {formErrors.confirmPassword && (
                          <span className="mt-1 block text-[11px] font-medium" style={{ color: 'var(--color-danger)' }}>
                            {formErrors.confirmPassword}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Security Note */}
                    <div
                      className="rounded-[var(--radius-sm)] px-3 py-2.5 text-[11px] leading-relaxed text-[var(--theme-text-secondary)]"
                      style={{ background: 'var(--theme-card-muted)', border: '1px solid var(--theme-border)' }}
                    >
                      <span className="font-semibold text-[var(--theme-text-primary)]">Security note: </span>
                      Passwords are encrypted with BCrypt. Leave the password field empty to keep the existing password.
                    </div>
                  </div>

                  {/* Sticky Modal Actions at Bottom */}
                  <div
                    className="flex shrink-0 justify-end gap-2 px-5 py-3.5"
                    style={{ borderTop: '1px solid var(--theme-border)', background: 'var(--theme-card-muted)' }}
                  >
                    <button type="button" onClick={() => setShowEditModal(false)} disabled={saving} className="btn btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" disabled={saving} className="btn btn-primary">
                      {saving ? (
                        <>
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          Saving…
                        </>
                      ) : (
                        'Save changes'
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default AdminStaffCredentials;
