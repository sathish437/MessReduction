import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdSearch, MdAdd, MdPeople,
  MdDelete, MdEdit, MdVisibility
} from 'react-icons/md';
import apiClient from './api/apiClient';
import { getActiveDepartments } from './api/departmentService';
import { useDebounce } from './hooks/useDebounce';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import BulkOperationProgress from './components/BulkOperationProgress';
import useBulkOperation from './hooks/useBulkOperation';

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortBy, setSortBy] = useState('studentId');
  const [activeDepts, setActiveDepts] = useState([]);

  const {
    bulkState,
    isBulkProcessing,
    startBulkOperation,
    completeSuccess,
    completePartial,
    completeFailure,
    closeProgress
  } = useBulkOperation();

  useEffect(() => {
    getActiveDepartments().then(depts => {
      if (Array.isArray(depts)) {
        setActiveDepts(depts);
      }
    });
  }, []);

  const [sortDir, setSortDir] = useState('desc');

  // Student Details Modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Modal and Form States
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    emailId: '',
    registerNo: '',
    rollNo: '',
    phoneNo: '',
    dob: '',
    department: '',
    gender: '',
    currentYear: ''
  });

  // Action Menu Dropdown State
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  // Toast Notification State
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Confirmation Modal State
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Delete",
    confirmVariant: "danger",
    onConfirm: () => {}
  });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        size,
        sortBy,
        sortDir
      });
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (selectedDept) params.append('department', selectedDept);
      if (selectedGender) params.append('gender', selectedGender);
      if (selectedYear) params.append('year', selectedYear);

      const res = await apiClient.get(`/api/admin/students?${params.toString()}`);
      setStudents(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
    } catch (error) {
      showToast('Error fetching students', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, size, debouncedSearch, selectedDept, selectedGender, selectedYear, sortBy, sortDir]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleDeleteOne = (id) => {
    setConfirmState({
      isOpen: true,
      title: "Delete Student",
      message: "Are you sure you want to delete this student? This action cannot be undone.",
      confirmText: "Delete",
      confirmVariant: "danger",
      onConfirm: () => executeDeleteOne(id)
    });
  };

  const executeDeleteOne = async (id) => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
    try {
      await apiClient.delete(`/api/admin/students/${id}`);
      showToast('Student deleted successfully', 'success');
      fetchStudents();
    } catch (error) {
      showToast('Error deleting student', 'error');
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      emailId: student.emailId,
      registerNo: student.registerNo,
      rollNo: student.rollNo,
      phoneNo: student.phoneNo,
      dob: student.dob,
      department: student.department,
      gender: student.gender,
      currentYear: student.currentYear || ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await apiClient.put(`/api/admin/students/${editingStudent.studentId}`, formData);
        showToast('Student updated successfully', 'success');
      } else {
        await apiClient.post('/api/admin/students', formData);
        showToast('Student created successfully', 'success');
      }
      setShowForm(false);
      setEditingStudent(null);
      fetchStudents();
    } catch (error) {
      showToast(error.response?.data?.message || 'Error saving student', 'error');
    }
  };

  const handleSelectAll = (e) => {
    if (isBulkProcessing) return;
    if (e.target.checked) {
      setSelectedIds(students.map(s => s.studentId));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    if (isBulkProcessing) return;
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0 || isBulkProcessing) return;
    setConfirmState({
      isOpen: true,
      title: "Delete Multiple Students",
      message: `Are you sure you want to delete ${selectedIds.length} selected students? This action cannot be undone.`,
      confirmText: "Delete Students",
      confirmVariant: "danger",
      onConfirm: () => executeBulkDelete()
    });
  };

  const executeBulkDelete = async () => {
    if (selectedIds.length === 0 || isBulkProcessing) return;
    setConfirmState(prev => ({ ...prev, isOpen: false }));
    const idsToDelete = [...selectedIds];
    startBulkOperation('DELETE', idsToDelete.length, 'Deleting Selected Students...');

    try {
      await apiClient.post('/api/admin/students/bulk-delete', idsToDelete);
      setStudents(prev => prev.filter(s => !idsToDelete.includes(s.studentId)));
      setSelectedIds([]);
      completeSuccess(idsToDelete.length, idsToDelete.length);
      showToast('Students deleted successfully', 'success');
      fetchStudents();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error deleting students';
      completeFailure(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 min-w-0 w-full relative">
      {/* Toast Notification Panel */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">Hostel student directory and account records.</p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: '', emailId: '', registerNo: '', rollNo: '', phoneNo: '', dob: '', department: '', gender: '', currentYear: '' });
            setShowForm(true);
          }}
          className="btn btn-primary self-start sm:self-auto"
        >
          <MdAdd size={16} /> Add student
        </button>
      </div>

      {/* Filters */}
      <div className="panel p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="field-shell flex-1 lg:max-w-sm">
            <MdSearch size={16} style={{ color: 'var(--theme-text-faint)' }} />
            <input
              type="text"
              placeholder="Search name, register no, roll no or phone"
              className="w-full flex-1 bg-transparent text-[13px] font-medium focus:outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:ml-auto lg:grid-cols-3">
            <label className="sr-only" htmlFor="student-dept-filter">Department</label>
            <select
              id="student-dept-filter"
              value={selectedDept}
              onChange={(e) => { setSelectedDept(e.target.value); setPage(0); }}
              className="h-9 min-h-0 py-0 text-[12px] font-medium"
            >
              <option value="">All departments</option>
              {activeDepts.length > 0 ? (
                activeDepts.map(d => (
                  <option key={d.id} value={d.departmentCode}>{d.departmentCode}</option>
                ))
              ) : (
                ["CSE", "ECE", "EEE", "MECH", "CIVIL", "MECHATRONICS"].map(code => (
                  <option key={code} value={code}>{code}</option>
                ))
              )}
            </select>

            <label className="sr-only" htmlFor="student-gender-filter">Gender</label>
            <select
              id="student-gender-filter"
              value={selectedGender}
              onChange={(e) => { setSelectedGender(e.target.value); setPage(0); }}
              className="h-9 min-h-0 py-0 text-[12px] font-medium"
            >
              <option value="">All genders</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>

            <label className="sr-only" htmlFor="student-year-filter">Year</label>
            <select
              id="student-year-filter"
              value={selectedYear}
              onChange={(e) => { setSelectedYear(e.target.value); setPage(0); }}
              className="h-9 min-h-0 py-0 text-[12px] font-medium"
            >
              <option value="">All years</option>
              <option value="1">1st year</option>
              <option value="2">2nd year</option>
              <option value="3">3rd year</option>
              <option value="4">4th year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions Banner */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col items-stretch justify-between gap-3 rounded-[var(--radius-lg)] p-3.5 sm:flex-row sm:items-center"
            style={{
              background: 'var(--theme-card)',
              border: '1px solid var(--color-danger-border)',
              boxShadow: 'var(--shadow-raised)'
            }}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-7 min-w-7 items-center justify-center rounded-[6px] px-1.5 text-[11.5px] font-semibold text-white"
                style={{ background: 'var(--color-danger)' }}
              >
                {selectedIds.length}
              </span>
              <span className="text-[12.5px] font-medium text-[var(--theme-text-primary)]">
                {selectedIds.length === 1 ? 'student selected' : 'students selected'}
              </span>
            </div>
            <button onClick={handleBulkDelete} className="btn btn-danger flex-1 sm:flex-none">
              <MdDelete size={16} /> Delete selected
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Data Table Container */}
      <div className="panel overflow-hidden">
        {!loading && students.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <MdPeople size={20} style={{ color: 'var(--color-accent)' }} />
            </div>
            <h3 className="text-[14px] font-semibold text-[var(--theme-text-primary)]">No students found</h3>
            <p className="max-w-xs text-xs text-[var(--theme-text-secondary)]">
              No records match the current filters. Try a different department, year or search term.
            </p>
          </div>
        )}
        <div className={`select-none overflow-x-auto ${!loading && students.length === 0 ? 'hidden' : ''}`}>
          <table className="data-table min-w-[820px]">
            <thead>
              <tr>
                <th className="w-12 text-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer accent-[var(--theme-btn-primary)]"
                    onChange={handleSelectAll}
                    checked={students.length > 0 && selectedIds.length === students.length}
                    aria-label="Select all students"
                  />
                </th>
                {[
                  { key: 'registerNo', label: 'Reg No' },
                  { key: 'name', label: 'Name' },
                  { key: 'department', label: 'Dept' },
                  { key: 'year', label: 'Year' }
                ].map(col => (
                  <th
                    key={col.key}
                    className="cursor-pointer select-none transition-colors hover:text-[var(--theme-text-primary)]"
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}{' '}
                    <span className="text-[10px] text-[var(--theme-text-faint)]">
                      {sortBy === col.key ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                    </span>
                  </th>
                ))}
                <th>Phone</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan="7">
                      <div className="skeleton my-1.5 h-9 w-full" />
                    </td>
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <MdPeople size={20} style={{ color: 'var(--color-accent)' }} />
                      </div>
                      <h3 className="text-[14px] font-semibold text-[var(--theme-text-primary)]">No students found</h3>
                      <p className="max-w-xs text-xs text-[var(--theme-text-secondary)]">
                        No records match the current filters. Try a different department, year or search term.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.studentId}>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 cursor-pointer accent-[var(--theme-btn-primary)]"
                        checked={selectedIds.includes(student.studentId)}
                        onChange={() => handleSelectOne(student.studentId)}
                        aria-label={`Select ${student.name}`}
                      />
                    </td>
                    <td className="whitespace-nowrap">
                      <span className="font-mono text-[11.5px] font-medium text-[var(--theme-text-secondary)]">{student.registerNo}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11.5px] font-semibold"
                          style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}
                        >
                          {student.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-[var(--theme-text-primary)]">{student.name}</p>
                          <p className="truncate text-[11px] text-[var(--theme-text-secondary)]">{student.emailId}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{student.department}</span>
                    </td>
                    <td className="whitespace-nowrap text-[12px] font-medium text-[var(--theme-text-secondary)]">
                      {student.currentYear ? `${student.currentYear}${student.currentYear === 1 ? 'st' : student.currentYear === 2 ? 'nd' : student.currentYear === 3 ? 'rd' : 'th'} year` : '—'}
                    </td>
                    <td className="whitespace-nowrap">
                      <span className="font-mono text-[11.5px] font-medium text-[var(--theme-text-secondary)]">{student.phoneNo}</span>
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => { setSelectedStudent(student); setShowDetails(true); }}
                          className="flex h-7 w-7 items-center justify-center rounded-[6px] border transition-colors"
                          style={{ background: 'var(--color-accent-soft)', borderColor: 'var(--color-accent-border)', color: 'var(--color-accent)' }}
                          title="View details"
                        >
                          <MdVisibility size={15} />
                        </button>
                        <button
                          onClick={() => { setFormData(student); setShowForm(true); }}
                          className="flex h-7 w-7 items-center justify-center rounded-[6px] border transition-colors"
                          style={{ background: 'var(--color-info-soft)', borderColor: 'var(--color-info-border)', color: 'var(--color-info)' }}
                          title="Edit student"
                        >
                          <MdEdit size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteOne(student.studentId)}
                          className="flex h-7 w-7 items-center justify-center rounded-[6px] border transition-colors"
                          style={{ background: 'var(--color-danger-soft)', borderColor: 'var(--color-danger-border)', color: 'var(--color-danger)' }}
                          title="Delete student"
                        >
                          <MdDelete size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-[var(--theme-border)] bg-[var(--theme-card)] px-4 py-3 sm:flex-row">
          <div className="flex items-center gap-2 text-[11.5px] text-[var(--theme-text-secondary)]">
            <span>Rows per page</span>
            <select
              className="h-8 min-h-0 py-0 text-[12px] font-medium"
              style={{ width: 'auto' }}
              value={size}
              onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}
              aria-label="Rows per page"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-secondary h-8 px-3 text-[12px]" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>
              Previous
            </button>
            <span className="text-[11.5px] font-medium text-[var(--theme-text-secondary)]">
              Page <span className="font-semibold text-[var(--theme-text-primary)]">{page + 1}</span> of {Math.max(1, totalPages)}
            </span>
            <button className="btn btn-secondary h-8 px-3 text-[12px]" onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1}>
              Next
            </button>
          </div>
        </div>
      </div>


      {/* Student Details Dialog */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 backdrop-blur-[2px]"
            style={{ background: 'rgba(11, 23, 40, 0.55)' }}
            onClick={() => setShowDetails(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[var(--radius-lg)]"
            style={{
              background: 'var(--theme-card)',
              border: '1px solid var(--theme-border)',
              boxShadow: 'var(--shadow-modal)'
            }}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[var(--theme-border)] px-6 py-4">
              <div>
                <h3 className="text-[15px] font-semibold text-[var(--theme-text-primary)]">Student details</h3>
                <p className="mt-0.5 text-xs text-[var(--theme-text-secondary)]">
                  {selectedStudent?.name || 'Student record'}
                </p>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                aria-label="Close"
                className="rounded-[var(--radius-sm)] p-1.5 text-[var(--theme-text-faint)] transition-colors hover:bg-[var(--theme-bg-soft)] hover:text-[var(--theme-text-primary)]"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Personal Information */}
                <div className="space-y-3">
                  <h4 className="section-label" style={{ color: 'var(--color-accent)' }}>
                    Personal information
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex flex-col justify-between gap-1 border-b border-[var(--theme-border)] pb-2 sm:flex-row sm:items-baseline">
                      <span className="min-w-[100px] text-[10.5px] font-medium uppercase tracking-wide text-[var(--theme-text-faint)]">Name</span>
                      <span className="text-[13px] font-semibold text-[var(--theme-text-primary)]">{selectedStudent?.name || '—'}</span>
                    </div>
                    <div className="flex flex-col justify-between gap-1 border-b border-[var(--theme-border)] pb-2 sm:flex-row sm:items-baseline">
                      <span className="min-w-[100px] text-[10.5px] font-medium uppercase tracking-wide text-[var(--theme-text-faint)]">Email</span>
                      <span className="break-all text-[13px] font-medium text-[var(--theme-text-primary)]">{selectedStudent?.emailId || '—'}</span>
                    </div>
                    <div className="flex flex-col justify-between gap-1 border-b border-[var(--theme-border)] pb-2 sm:flex-row sm:items-baseline">
                      <span className="min-w-[100px] text-[10.5px] font-medium uppercase tracking-wide text-[var(--theme-text-faint)]">Phone</span>
                      <span className="font-mono text-[12.5px] font-medium text-[var(--theme-text-primary)]">{selectedStudent?.phoneNo || '—'}</span>
                    </div>
                    <div className="flex flex-col justify-between gap-1 border-b border-[var(--theme-border)] pb-2 sm:flex-row sm:items-baseline">
                      <span className="min-w-[100px] text-[10.5px] font-medium uppercase tracking-wide text-[var(--theme-text-faint)]">Date of birth</span>
                      <span className="text-[13px] font-medium text-[var(--theme-text-primary)]">{selectedStudent?.dob || '—'}</span>
                    </div>
                    <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
                      <span className="min-w-[100px] text-[10.5px] font-medium uppercase tracking-wide text-[var(--theme-text-faint)]">Gender</span>
                      <span className="text-[13px] font-medium text-[var(--theme-text-primary)]">{selectedStudent?.gender || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div className="space-y-3">
                  <h4 className="section-label" style={{ color: 'var(--color-accent)' }}>
                    Academic information
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex flex-col justify-between gap-1 border-b border-[var(--theme-border)] pb-2 sm:flex-row sm:items-baseline">
                      <span className="min-w-[110px] text-[10.5px] font-medium uppercase tracking-wide text-[var(--theme-text-faint)]">Register no</span>
                      <span className="font-mono text-[12.5px] font-medium text-[var(--theme-text-primary)]">{selectedStudent?.registerNo || '—'}</span>
                    </div>
                    <div className="flex flex-col justify-between gap-1 border-b border-[var(--theme-border)] pb-2 sm:flex-row sm:items-baseline">
                      <span className="min-w-[110px] text-[10.5px] font-medium uppercase tracking-wide text-[var(--theme-text-faint)]">Roll no</span>
                      <span className="font-mono text-[12.5px] font-medium text-[var(--theme-text-primary)]">{selectedStudent?.rollNo || '—'}</span>
                    </div>
                    <div className="flex flex-col justify-between gap-1 border-b border-[var(--theme-border)] pb-2 sm:flex-row sm:items-baseline">
                      <span className="min-w-[110px] text-[10.5px] font-medium uppercase tracking-wide text-[var(--theme-text-faint)]">Department</span>
                      <span className="text-[13px] font-medium text-[var(--theme-text-primary)]">{selectedStudent?.department || '—'}</span>
                    </div>
                    <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
                      <span className="min-w-[110px] text-[10.5px] font-medium uppercase tracking-wide text-[var(--theme-text-faint)]">Year</span>
                      <span className="text-[13px] font-medium text-[var(--theme-text-primary)]">{selectedStudent?.currentYear || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className="flex justify-end px-6 py-3.5"
              style={{ borderTop: '1px solid var(--theme-border)', background: 'var(--theme-card-muted)' }}
            >
              <button onClick={() => setShowDetails(false)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 backdrop-blur-[2px]"
            style={{ background: 'rgba(11, 23, 40, 0.55)' }}
            onClick={() => setShowForm(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[var(--radius-lg)]"
            style={{
              background: 'var(--theme-card)',
              border: '1px solid var(--theme-border)',
              boxShadow: 'var(--shadow-modal)'
            }}
          >
            <div className="flex items-start justify-between gap-3 border-b border-[var(--theme-border)] px-6 py-4">
              <div>
                <h3 className="text-[15px] font-semibold text-[var(--theme-text-primary)]">
                  {formData.studentId ? 'Edit student' : 'Add student'}
                </h3>
                <p className="mt-0.5 text-xs text-[var(--theme-text-secondary)]">
                  {formData.studentId
                    ? 'Update the student record and save your changes.'
                    : 'Create a new student record for the hostel directory.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Close"
                className="rounded-[var(--radius-sm)] p-1.5 text-[var(--theme-text-faint)] transition-colors hover:bg-[var(--theme-bg-soft)] hover:text-[var(--theme-text-primary)]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="field-label" htmlFor="student-name">Name</label>
                  <input id="student-name" required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full text-[13px]" />
                </div>
                <div>
                  <label className="field-label" htmlFor="student-email">Email</label>
                  <input id="student-email" required type="email" value={formData.emailId} onChange={e => setFormData({ ...formData, emailId: e.target.value })} className="w-full text-[13px]" />
                </div>
                <div>
                  <label className="field-label" htmlFor="student-register">Register no</label>
                  <input id="student-register" required type="text" value={formData.registerNo} onChange={e => setFormData({ ...formData, registerNo: e.target.value })} className="w-full font-mono text-[13px]" />
                </div>
                <div>
                  <label className="field-label" htmlFor="student-roll">Roll no</label>
                  <input id="student-roll" required type="text" value={formData.rollNo} onChange={e => setFormData({ ...formData, rollNo: e.target.value })} className="w-full font-mono text-[13px]" />
                </div>
                <div>
                  <label className="field-label" htmlFor="student-phone">Phone no</label>
                  <input id="student-phone" required type="text" value={formData.phoneNo} onChange={e => setFormData({ ...formData, phoneNo: e.target.value })} className="w-full font-mono text-[13px]" />
                </div>
                <div>
                  <label className="field-label" htmlFor="student-dob">Date of birth</label>
                  <input id="student-dob" required type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} className="w-full text-[13px]" />
                </div>
                <div>
                  <label className="field-label" htmlFor="student-department">Department</label>
                  <select id="student-department" required value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} className="w-full text-[13px]">
                    <option value="">Select department</option>
                    {activeDepts.length > 0 ? (
                      activeDepts.map(d => (
                        <option key={d.id} value={d.departmentCode}>{d.departmentCode}</option>
                      ))
                    ) : (
                      ["CSE", "ECE", "EEE", "MECH", "CIVIL", "MECHATRONICS"].map(code => (
                        <option key={code} value={code}>{code}</option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor="student-gender">Gender</label>
                  <select id="student-gender" required value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="w-full text-[13px]">
                    <option value="">Select gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor="student-year">Year</label>
                  <select id="student-year" required value={formData.currentYear} onChange={e => setFormData({ ...formData, currentYear: e.target.value })} className="w-full text-[13px]">
                    <option value="">Select year</option>
                    <option value="1">1st year</option>
                    <option value="2">2nd year</option>
                    <option value="3">3rd year</option>
                    <option value="4">4th year</option>
                  </select>
                </div>
              </div>

              <div
                className="flex items-center justify-end gap-2 pt-3.5"
                style={{ borderTop: '1px solid var(--theme-border)' }}
              >
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {formData.studentId ? 'Save changes' : 'Add student'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        confirmVariant={confirmState.confirmVariant}
        onConfirm={confirmState.onConfirm}
        onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Bulk Operation Progress Modal */}
      <BulkOperationProgress
        isOpen={bulkState.isOpen}
        status={bulkState.status}
        operationType={bulkState.operationType}
        title={bulkState.title}
        total={bulkState.total}
        processed={bulkState.processed}
        successCount={bulkState.successCount}
        failedCount={bulkState.failedCount}
        error={bulkState.error}
        onClose={closeProgress}
      />
    </div>
  );
};

export default AdminStudents;
