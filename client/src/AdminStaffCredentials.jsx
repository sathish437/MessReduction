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
          badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
          icon: <MdShield size={16} />
        };
      case 'DeputyWarden':
        return {
          title: 'Deputy Warden',
          sub: `${staff.gender || ''} • Year ${staff.year || 'N/A'}`.trim(),
          badgeClass: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
          icon: <MdSupervisorAccount size={16} />
        };
      case 'Office':
        return {
          title: 'Office Staff',
          sub: 'Administrative',
          badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
          icon: <MdBusinessCenter size={16} />
        };
      case 'ADMIN':
        return {
          title: 'Administrator',
          sub: 'Full Access',
          badgeClass: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
          icon: <MdShield size={16} />
        };
      default:
        return {
          title: staff.role,
          sub: '',
          badgeClass: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
          icon: <MdPerson size={16} />
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 w-full">
        <div>
          <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight flex items-center gap-2 text-[var(--color-text-primary)]">
            <div className="p-1.5 sm:p-2 rounded-xl bg-purple-600/10 text-purple-500 border border-purple-500/20 shadow-sm">
              <MdVpnKey className="text-lg sm:text-xl" />
            </div>
            <span>Staff Credentials</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 ml-1">
              {staffList.length} Accounts
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] font-medium mt-0.5">
            Manage login credentials and authentication usernames for all hostel staff accounts.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 shadow-soft flex flex-col sm:flex-row items-center gap-2.5 w-full">
        <div className="relative flex-1 w-full">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" size={18} />
          <input
            type="text"
            placeholder="Search username, role, email..."
            className="w-full h-9 sm:h-10 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg sm:rounded-xl pl-9 pr-3 text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]/70 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="h-9 sm:h-10 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg sm:rounded-xl px-2.5 text-xs sm:text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-purple-500 flex-1 sm:flex-none cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Administrator</option>
            <option value="Warden">Associate Warden</option>
            <option value="DeputyWarden">Deputy Warden</option>
            <option value="Office">Office Staff</option>
          </select>

          <button
            onClick={fetchStaff}
            className="w-9 sm:w-10 h-9 sm:h-10 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg sm:rounded-xl hover:bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer flex items-center justify-center shrink-0"
            title="Refresh list"
          >
            <MdRefresh size={18} />
          </button>
        </div>
      </div>

      {/* MOBILE CARD VIEW (Visible only on small screens < md) */}
      <div className="block md:hidden space-y-2.5">
        {loading ? (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-8 text-center text-[var(--color-text-secondary)]">
            <div className="w-7 h-7 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <span className="text-xs font-medium">Loading credentials...</span>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 text-center text-xs text-[var(--color-text-secondary)]">
            No accounts found matching your criteria.
          </div>
        ) : (
          filteredStaff.map((staff) => {
            const roleInfo = getRoleBadge(staff);
            return (
              <div
                key={staff.id}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-3 shadow-soft space-y-2.5 transition-all"
              >
                {/* Card Header: Role & Edit Button */}
                <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)]/60 pb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold ${roleInfo.badgeClass}`}>
                      {roleInfo.icon}
                      {roleInfo.title}
                    </span>
                    {roleInfo.sub && (
                      <span className="text-[10px] text-[var(--color-text-secondary)] font-semibold bg-[var(--color-primary-bg)] px-1.5 py-0.5 rounded border border-[var(--color-border)]">
                        {roleInfo.sub}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleOpenEdit(staff)}
                    className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0 active:scale-95 transition-all"
                  >
                    <MdEdit size={13} />
                    <span>Edit</span>
                  </button>
                </div>

                {/* Card Body: Username & Password */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[var(--color-primary-bg)] rounded-lg p-2 border border-[var(--color-border)]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] block">Username</span>
                    <span className="font-mono font-bold text-[var(--color-text-primary)] truncate block mt-0.5">
                      {staff.username}
                    </span>
                  </div>
                  <div className="bg-[var(--color-primary-bg)] rounded-lg p-2 border border-[var(--color-border)]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] block">Password</span>
                    <span className="font-mono text-purple-400 tracking-widest block mt-0.5">
                      ••••••••
                    </span>
                  </div>
                </div>

                {/* Contact Info (if available) */}
                {(staff.gmail || staff.phoneNo) && (
                  <div className="pt-1 flex flex-col gap-1 text-[11px] text-[var(--color-text-secondary)]">
                    {staff.gmail && (
                      <div className="flex items-center gap-1.5 truncate">
                        <MdEmail size={12} className="text-purple-400 shrink-0" />
                        <span className="truncate">{staff.gmail}</span>
                      </div>
                    )}
                    {staff.phoneNo && (
                      <div className="flex items-center gap-1.5 font-mono text-[10px]">
                        <MdPhone size={12} className="text-emerald-400 shrink-0" />
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

      {/* DESKTOP TABLE VIEW (Visible only on medium & large screens >= md) */}
      <div className="hidden md:flex bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-soft overflow-hidden flex-col min-w-0 w-full">
        <div className="overflow-x-auto select-none w-full">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead className="bg-[var(--color-primary-bg)] border-b border-[var(--color-border)] text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              <tr>
                <th className="px-4 py-3.5">Staff Role</th>
                <th className="px-4 py-3.5">Username</th>
                <th className="px-4 py-3.5">Password</th>
                <th className="px-4 py-3.5">Contact Details</th>
                <th className="px-4 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-[var(--color-text-secondary)] font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading staff credentials...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-[var(--color-text-secondary)] font-medium">
                    No staff accounts found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const roleInfo = getRoleBadge(staff);
                  return (
                    <tr key={staff.id} className="hover:bg-[var(--color-card)]/50 transition-colors">
                      {/* Role */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold ${roleInfo.badgeClass}`}>
                            {roleInfo.icon}
                            {roleInfo.title}
                          </span>
                          {roleInfo.sub && (
                            <span className="text-[11px] text-[var(--color-text-secondary)] font-medium">
                              ({roleInfo.sub})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Username */}
                      <td className="px-4 py-3.5 font-bold font-mono text-[var(--color-text-primary)]">
                        <span className="px-2.5 py-1 rounded-lg bg-[var(--color-primary-bg)] border border-[var(--color-border)] inline-block">
                          {staff.username}
                        </span>
                      </td>

                      {/* Masked Password */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)] font-mono text-sm tracking-widest bg-[var(--color-primary-bg)]/60 px-2.5 py-1 rounded-lg border border-[var(--color-border)]/70 w-fit">
                          <MdLock size={14} className="text-purple-400/80" />
                          <span>••••••••</span>
                        </div>
                      </td>

                      {/* Contact Details */}
                      <td className="px-4 py-3.5 text-xs text-[var(--color-text-secondary)] space-y-0.5">
                        {staff.gmail && (
                          <div className="flex items-center gap-1.5 font-medium truncate max-w-[220px]" title={staff.gmail}>
                            <MdEmail size={13} className="text-purple-400 shrink-0" />
                            <span className="truncate">{staff.gmail}</span>
                          </div>
                        )}
                        {staff.phoneNo && (
                          <div className="flex items-center gap-1.5 font-mono text-[11px]">
                            <MdPhone size={13} className="text-emerald-400 shrink-0" />
                            <span>{staff.phoneNo}</span>
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleOpenEdit(staff)}
                          className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 rounded-xl transition-all inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer active:scale-95 shadow-sm"
                          title="Edit Staff Credentials"
                        >
                          <MdEdit size={14} />
                          <span>Edit</span>
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
                className="fixed inset-0 bg-black/75 backdrop-blur-xs"
              />

              {/* Modal Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 15 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl text-[var(--color-text-primary)] z-10 my-auto flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden"
              >
                {/* Fixed Modal Header */}
                <div className="flex justify-between items-center p-4 sm:p-5 border-b border-[var(--color-border)] shrink-0 bg-[var(--color-surface)]">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-600/10 text-purple-400 border border-purple-600/20">
                      <MdLock size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] leading-tight">
                        Edit Staff Credentials
                      </h3>
                      <p className="text-[11px] sm:text-xs text-[var(--color-text-secondary)] mt-0.5">
                        Update username, password, or contact details
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    disabled={saving}
                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors p-1.5 rounded-lg hover:bg-[var(--color-primary-bg)] cursor-pointer"
                  >
                    <MdClose size={20} />
                  </button>
                </div>

                {/* Form Container with Scrollable Body & Sticky Footer */}
                <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                  {/* Scrollable Form Content */}
                  <div className="overflow-y-auto p-4 sm:p-5 space-y-3.5 flex-1 min-h-0">
                    {/* Staff Role (Non-editable) */}
                    <div className="flex flex-col gap-1 text-left">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                        Staff Role
                      </label>
                      <div className="bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getRoleBadge(editingStaff).icon}
                          <span className="font-bold text-xs sm:text-sm text-[var(--color-text-primary)]">
                            {getRoleBadge(editingStaff).title}
                          </span>
                        </div>
                        {getRoleBadge(editingStaff).sub && (
                          <span className="text-[10px] font-semibold text-[var(--color-text-secondary)] bg-[var(--color-surface)] px-2 py-0.5 rounded-md border border-[var(--color-border)]">
                            {getRoleBadge(editingStaff).sub}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[var(--color-text-secondary)]">
                        Role permissions are fixed and cannot be changed here.
                      </span>
                    </div>

                    {/* Username Input */}
                    <div className="flex flex-col gap-1 text-left">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                        Username *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.username}
                        onChange={(e) => {
                          setFormData({ ...formData, username: e.target.value });
                          if (formErrors.username) setFormErrors({ ...formErrors, username: '' });
                        }}
                        placeholder="e.g. warden"
                        className={`bg-[var(--color-primary-bg)] border rounded-xl px-3 py-2 text-xs sm:text-sm font-mono font-bold text-[var(--color-text-primary)] focus:outline-none transition-all ${
                          formErrors.username
                            ? 'border-rose-500 ring-2 ring-rose-500/20'
                            : 'border-[var(--color-border)] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                        }`}
                      />
                      {formErrors.username && (
                        <span className="text-[11px] font-semibold text-rose-500">
                          {formErrors.username}
                        </span>
                      )}
                    </div>

                    {/* Contact Details (Email & Phone) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="flex flex-col gap-1 text-left">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-1">
                          <MdEmail size={13} className="text-purple-400" />
                          Email / Gmail
                        </label>
                        <input
                          type="email"
                          value={formData.gmail}
                          onChange={(e) => {
                            setFormData({ ...formData, gmail: e.target.value });
                            if (formErrors.gmail) setFormErrors({ ...formErrors, gmail: '' });
                          }}
                          placeholder="e.g. staff@gmail.com"
                          className={`bg-[var(--color-primary-bg)] border rounded-xl px-3 py-2 text-xs sm:text-sm text-[var(--color-text-primary)] focus:outline-none transition-all ${
                            formErrors.gmail
                              ? 'border-rose-500 ring-2 ring-rose-500/20'
                              : 'border-[var(--color-border)] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                          }`}
                        />
                        {formErrors.gmail && (
                          <span className="text-[11px] font-semibold text-rose-500">
                            {formErrors.gmail}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 text-left">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-1">
                          <MdPhone size={13} className="text-emerald-400" />
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={formData.phoneNo}
                          onChange={(e) => setFormData({ ...formData, phoneNo: e.target.value })}
                          placeholder="e.g. +919876543210"
                          className="bg-[var(--color-primary-bg)] border border-[var(--color-border)] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl px-3 py-2 text-xs sm:text-sm text-[var(--color-text-primary)] focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* New Password Input */}
                    <div className="flex flex-col gap-1 text-left">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => {
                            setFormData({ ...formData, password: e.target.value });
                            if (formErrors.password) setFormErrors({ ...formErrors, password: '' });
                          }}
                          placeholder="Leave blank to keep unchanged"
                          className={`w-full bg-[var(--color-primary-bg)] border rounded-xl pl-3 pr-9 py-2 text-xs sm:text-sm text-[var(--color-text-primary)] focus:outline-none transition-all ${
                            formErrors.password
                              ? 'border-rose-500 ring-2 ring-rose-500/20'
                              : 'border-[var(--color-border)] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-1 cursor-pointer"
                        >
                          {showPassword ? <MdVisibilityOff size={16} /> : <MdVisibility size={16} />}
                        </button>
                      </div>
                      {formErrors.password && (
                        <span className="text-[11px] font-semibold text-rose-500">
                          {formErrors.password}
                        </span>
                      )}
                    </div>

                    {/* Confirm Password Input */}
                    {formData.password && (
                      <div className="flex flex-col gap-1 text-left">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                          Confirm Password *
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={formData.confirmPassword}
                            onChange={(e) => {
                              setFormData({ ...formData, confirmPassword: e.target.value });
                              if (formErrors.confirmPassword) setFormErrors({ ...formErrors, confirmPassword: '' });
                            }}
                            placeholder="Re-enter new password"
                            className={`w-full bg-[var(--color-primary-bg)] border rounded-xl pl-3 pr-9 py-2 text-xs sm:text-sm text-[var(--color-text-primary)] focus:outline-none transition-all ${
                              formErrors.confirmPassword
                                ? 'border-rose-500 ring-2 ring-rose-500/20'
                                : 'border-[var(--color-border)] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-1 cursor-pointer"
                          >
                            {showConfirmPassword ? <MdVisibilityOff size={16} /> : <MdVisibility size={16} />}
                          </button>
                        </div>
                        {formErrors.confirmPassword && (
                          <span className="text-[11px] font-semibold text-rose-500">
                            {formErrors.confirmPassword}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Security Note */}
                    <div className="p-2.5 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-xl text-[10px] text-[var(--color-text-secondary)] leading-relaxed">
                      <span className="font-bold text-purple-400">Security Note:</span> All passwords are automatically encrypted via BCrypt. Leave password empty to keep existing password unchanged.
                    </div>
                  </div>

                  {/* Sticky Modal Actions at Bottom */}
                  <div className="flex justify-end gap-2 p-3 sm:p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)] shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      disabled={saving}
                      className="px-3.5 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-xl text-xs sm:text-sm font-semibold hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-purple-500/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        'Save Changes'
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
