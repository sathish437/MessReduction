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
import Toast from './components/Toast';

const AdminDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

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
      showNotification(err.response?.data?.message || 'Error loading departments', false);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const showNotification = (msg, isSuccess = true) => {
    setToast({ message: msg, type: isSuccess ? 'success' : 'error' });
    setTimeout(() => setToast(null), 4000);
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
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Departments</h1>
          <p className="page-subtitle">Master department list used across registration, profiles and reports.</p>
        </div>
        <button onClick={handleOpenAddModal} className="btn btn-primary self-start sm:self-auto">
          <MdAdd size={16} /> Add department
        </button>
      </div>

      {/* Filters */}
      <div className="panel p-4">
        <div className="flex items-center gap-2">
          <div className="field-shell flex-1">
            <MdSearch size={16} style={{ color: 'var(--theme-text-faint)' }} />
            <input
              type="text"
              placeholder="Search by code, name or short name"
              className="w-full flex-1 bg-transparent text-[13px] font-medium focus:outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button onClick={fetchDepartments} className="btn btn-secondary h-9 px-3" title="Refresh list">
            <MdRefresh size={16} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Toast Notifications */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Departments Table Card Container */}
      <div className="panel overflow-hidden">
        <div className="select-none overflow-x-auto">
          <table className="data-table min-w-[680px]">
            <thead>
              <tr>
                <th className="w-16">Order</th>
                <th>Code</th>
                <th>Department name</th>
                <th>Short name</th>
                <th>Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan="6">
                      <div className="skeleton my-1.5 h-9 w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredDepts.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <MdSchool size={20} style={{ color: 'var(--color-accent)' }} />
                      </div>
                      <h3 className="text-[14px] font-semibold text-[var(--theme-text-primary)]">No departments found</h3>
                      <p className="max-w-xs text-xs text-[var(--theme-text-secondary)]">
                        No department matches your search. Add a department or clear the search term.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDepts.map((dept) => (
                  <tr key={dept.id}>
                    <td className="font-mono text-[11.5px] font-medium text-[var(--theme-text-secondary)]">
                      {dept.displayOrder ?? 0}
                    </td>
                    <td className="whitespace-nowrap">
                      <span className="font-mono text-[12px] font-semibold text-[var(--theme-text-primary)]">
                        {dept.departmentCode}
                      </span>
                    </td>
                    <td className="text-[13px] font-medium text-[var(--theme-text-primary)]">
                      {dept.departmentName}
                    </td>
                    <td className="text-[12px] font-medium text-[var(--theme-text-secondary)]">
                      {dept.shortName}
                    </td>
                    <td>
                      {dept.isActive ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge badge-danger">Inactive</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(dept)}
                          className="flex h-7 w-7 items-center justify-center rounded-[6px] border transition-colors"
                          style={dept.isActive
                            ? { background: 'var(--color-warning-soft)', borderColor: 'var(--color-warning-border)', color: 'var(--color-warning)' }
                            : { background: 'var(--color-success-soft)', borderColor: 'var(--color-success-border)', color: 'var(--color-success)' }}
                          title={dept.isActive ? 'Deactivate department' : 'Activate department'}
                        >
                          {dept.isActive ? <MdToggleOn size={17} /> : <MdToggleOff size={17} />}
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(dept)}
                          className="flex h-7 w-7 items-center justify-center rounded-[6px] border transition-colors"
                          style={{ background: 'var(--color-info-soft)', borderColor: 'var(--color-info-border)', color: 'var(--color-info)' }}
                          title="Edit department"
                        >
                          <MdEdit size={14} />
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 backdrop-blur-[2px]"
              style={{ background: 'rgba(11, 23, 40, 0.55)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              className="relative w-full max-w-lg overflow-hidden rounded-[var(--radius-lg)]"
              style={{
                background: 'var(--theme-card)',
                border: '1px solid var(--theme-border)',
                boxShadow: 'var(--shadow-modal)'
              }}
            >
              <div className="flex items-start justify-between gap-3 border-b border-[var(--theme-border)] px-6 py-4">
                <div>
                  <h3 className="text-[15px] font-semibold text-[var(--theme-text-primary)]">
                    {editingDept ? 'Edit department' : 'Add department'}
                  </h3>
                  <p className="mt-0.5 text-xs text-[var(--theme-text-secondary)]">
                    Departments appear in student registration and reports.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  aria-label="Close"
                  className="rounded-[var(--radius-sm)] p-1.5 text-[var(--theme-text-faint)] transition-colors hover:bg-[var(--theme-bg-soft)] hover:text-[var(--theme-text-primary)]"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="dept-code" className="field-label">Department code <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                    <input
                      id="dept-code"
                      type="text"
                      placeholder="e.g. CSE, AIDS"
                      required
                      value={formData.departmentCode}
                      onChange={(e) => setFormData({ ...formData, departmentCode: e.target.value.toUpperCase() })}
                      className="w-full font-mono text-[13px] uppercase"
                    />
                  </div>

                  <div>
                    <label htmlFor="dept-short" className="field-label">Short name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                    <input
                      id="dept-short"
                      type="text"
                      placeholder="e.g. CSE"
                      required
                      value={formData.shortName}
                      onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                      className="w-full text-[13px]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="dept-name" className="field-label">Department name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                  <input
                    id="dept-name"
                    type="text"
                    placeholder="e.g. Computer Science and Engineering"
                    required
                    value={formData.departmentName}
                    onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                    className="w-full text-[13px]"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="dept-order" className="field-label">Display order</label>
                    <input
                      id="dept-order"
                      type="number"
                      min="0"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                      className="w-full text-[13px]"
                    />
                  </div>

                  <div>
                    <label htmlFor="dept-active" className="field-label">Status</label>
                    <select
                      id="dept-active"
                      value={formData.isActive ? 'true' : 'false'}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                      className="w-full text-[13px]"
                    >
                      <option value="true">Active (visible)</option>
                      <option value="false">Inactive (hidden)</option>
                    </select>
                  </div>
                </div>

                <div
                  className="flex items-center justify-end gap-2 pt-3.5"
                  style={{ borderTop: '1px solid var(--theme-border)' }}
                >
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn btn-primary">
                    {submitting ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Saving…
                      </>
                    ) : (
                      'Save department'
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
