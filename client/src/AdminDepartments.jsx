import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdSearch, MdAdd, MdEdit, MdToggleOn, MdToggleOff,
  MdSchool, MdRefresh, MdCheckCircle, MdCancel
} from 'react-icons/md';
import {
  getAllDepartments,
  createDepartment,
  updateDepartment,
  toggleDepartmentStatus
} from './api/departmentService';

const AdminDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    departmentCode: '',
    departmentName: '',
    shortName: '',
    description: '',
    displayOrder: 0,
    isActive: true
  });

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllDepartments({ search });
      if (Array.isArray(data)) {
        setDepartments(data);
      } else if (data && data.content) {
        setDepartments(data.content);
      } else {
        setDepartments([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading departments');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const showNotification = (msg, isSuccess = true) => {
    if (isSuccess) {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setError(msg);
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleOpenAddModal = () => {
    setEditingDept(null);
    setFormData({
      departmentCode: '',
      departmentName: '',
      shortName: '',
      description: '',
      displayOrder: departments.length + 1,
      isActive: true
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (dept) => {
    setEditingDept(dept);
    setFormData({
      departmentCode: dept.departmentCode || '',
      departmentName: dept.departmentName || '',
      shortName: dept.shortName || '',
      description: dept.description || '',
      displayOrder: dept.displayOrder || 0,
      isActive: dept.isActive !== false
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (editingDept) {
        await updateDepartment(editingDept.id, formData);
        showNotification(`Department '${formData.departmentCode}' updated successfully.`);
      } else {
        await createDepartment(formData);
        showNotification(`Department '${formData.departmentCode}' added successfully.`);
      }
      setShowModal(false);
      fetchDepartments();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Operation failed';
      showNotification(msg, false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (dept) => {
    const newStatus = !dept.isActive;
    try {
      await toggleDepartmentStatus(dept.id, newStatus);
      showNotification(`Department '${dept.departmentCode}' ${newStatus ? 'activated' : 'deactivated'}.`);
      fetchDepartments();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update status', false);
    }
  };

  const filteredDepts = departments.filter(d => 
    d.departmentCode?.toLowerCase().includes(search.toLowerCase()) ||
    d.departmentName?.toLowerCase().includes(search.toLowerCase()) ||
    d.shortName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full space-y-4 min-w-0 w-full text-[var(--color-text-primary)]">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <MdSchool className="text-purple-500" />
            Academic Departments
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Manage master departments used across student registration, profiles, and reports.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="relative flex-1 md:w-64">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" size={18} />
            <input 
              type="text"
              placeholder="Search code, name..."
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl pl-9 pr-3 py-2 text-xs md:text-sm focus:outline-none focus:border-purple-500 transition-all shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            onClick={fetchDepartments}
            className="p-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-primary-bg)] text-[var(--color-text-secondary)] transition-colors cursor-pointer shadow-sm"
            title="Refresh list"
          >
            <MdRefresh size={18} />
          </button>

          <button 
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl text-xs md:text-sm font-semibold shadow-sm transition-all cursor-pointer"
          >
            <MdAdd size={18} />
            Add Department
          </button>
        </div>
      </div>

      {/* Toast Notifications */}
      {successMsg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-green-500/10 border border-green-500/30 text-green-400 text-xs md:text-sm rounded-xl flex items-center gap-2">
          <MdCheckCircle size={18} />
          <span>{successMsg}</span>
        </motion.div>
      )}

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs md:text-sm rounded-xl flex items-center gap-2">
          <MdCancel size={18} />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Departments Table Card */}
      <div className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm overflow-hidden flex flex-col min-w-0">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-primary-bg)] text-[var(--color-text-secondary)] font-semibold uppercase tracking-wider text-[10px] md:text-xs">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Department Name</th>
                <th className="px-4 py-3">Short Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-[var(--color-text-secondary)]">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading departments...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredDepts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-[var(--color-text-secondary)] font-medium">
                    No departments found matching your search.
                  </td>
                </tr>
              ) : (
                filteredDepts.map((dept) => (
                  <tr key={dept.id} className="hover:bg-[var(--color-primary-bg)]/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-[var(--color-text-secondary)]">
                      {dept.displayOrder ?? 0}
                    </td>
                    <td className="px-4 py-3 font-bold font-mono text-[var(--color-text-primary)]">
                      {dept.departmentCode}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[var(--color-text-primary)]">
                      {dept.departmentName}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)] font-medium">
                      {dept.shortName}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-bold uppercase ${
                        dept.isActive ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dept.isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {dept.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(dept)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            dept.isActive 
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20' 
                              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                          title={dept.isActive ? "Deactivate Department" : "Activate Department"}
                        >
                          {dept.isActive ? <MdToggleOn size={20} /> : <MdToggleOff size={20} />}
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(dept)}
                          className="p-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 rounded-lg transition-all cursor-pointer"
                          title="Edit Department"
                        >
                          <MdEdit size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 md:p-6 w-full max-w-lg shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)]">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                  {editingDept ? 'Edit Department' : 'Add New Department'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Department Code *</label>
                    <input
                      type="text"
                      placeholder="e.g. CSE, AIDS"
                      required
                      value={formData.departmentCode}
                      onChange={(e) => setFormData({ ...formData, departmentCode: e.target.value.toUpperCase() })}
                      className="bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs md:text-sm font-bold uppercase focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Short Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. CSE"
                      required
                      value={formData.shortName}
                      onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                      className="bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs md:text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Department Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science and Engineering"
                    required
                    value={formData.departmentName}
                    onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                    className="bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs md:text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Display Order</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                      className="bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs md:text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Active Status</label>
                    <select
                      value={formData.isActive ? 'true' : 'false'}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                      className="bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs md:text-sm focus:outline-none focus:border-purple-500"
                    >
                      <option value="true">Active (Visible)</option>
                      <option value="false">Inactive (Hidden)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-xl text-xs md:text-sm font-semibold hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl text-xs md:text-sm font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      'Save Department'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDepartments;
