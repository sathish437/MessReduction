import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdSearch, MdFilterList,
  MdDelete, MdEdit, MdVisibility, MdMoreVert, MdCheckCircle, MdCancel
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
      <div className="flex items-center justify-between gap-3 w-full">
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--color-text-primary)]">Students</h2>
        <button 
          onClick={() => {
            setFormData({ name: '', emailId: '', registerNo: '', rollNo: '', phoneNo: '', dob: '', department: '', gender: '', currentYear: '' });
            setShowForm(true);
          }}
          className="h-10 sm:h-11 px-3.5 sm:px-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-purple-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
        >
          + Add Student
        </button>
      </div>

      {/* Admin Filters Card */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-3 sm:p-4 shadow-soft flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 w-full">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" size={20} />
          <input 
            type="text"
            placeholder="Search Name, Reg No, Roll No, Phone..."
            className="w-full h-10 sm:h-11 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-xl pl-10 pr-4 text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]/70 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-3 sm:flex items-center gap-2 w-full md:w-auto">
          <select 
            value={selectedDept}
            onChange={(e) => { setSelectedDept(e.target.value); setPage(0); }}
            className="h-10 sm:h-11 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-xl px-2 sm:px-3 text-xs sm:text-sm font-semibold text-[var(--color-text-primary)] focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-sm cursor-pointer w-full min-w-0"
          >
            <option value="">All Depts</option>
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

          <select 
            value={selectedGender}
            onChange={(e) => { setSelectedGender(e.target.value); setPage(0); }}
            className="h-10 sm:h-11 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-xl px-2 sm:px-3 text-xs sm:text-sm font-semibold text-[var(--color-text-primary)] focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-sm cursor-pointer w-full min-w-0"
          >
            <option value="">Genders</option>
            <option value="MALE">MALE</option>
            <option value="FEMALE">FEMALE</option>
          </select>

          <select 
            value={selectedYear}
            onChange={(e) => { setSelectedYear(e.target.value); setPage(0); }}
            className="h-10 sm:h-11 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-xl px-2 sm:px-3 text-xs sm:text-sm font-semibold text-[var(--color-text-primary)] focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-sm cursor-pointer w-full min-w-0"
          >
            <option value="">Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions Banner */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-rose-300"
          >
            <span className="text-xs sm:text-sm font-bold">{selectedIds.length} students selected</span>
            <div className="flex gap-2">
              <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer">
                <MdDelete size={18} /> Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Data Table Container */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-soft flex flex-col min-w-0 w-full">
        <div className="overflow-x-auto select-none w-full">
          <table className="w-full text-left text-xs sm:text-sm min-w-[750px] border-collapse">
            <thead className="bg-[var(--color-primary-bg)] border-b border-[var(--color-border)] text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-[var(--color-border)] bg-[var(--color-surface)] text-purple-600 focus:ring-purple-500 cursor-pointer w-4 h-4"
                    onChange={handleSelectAll}
                    checked={students.length > 0 && selectedIds.length === students.length}
                  />
                </th>
                <th className="px-4 py-3.5 cursor-pointer hover:text-[var(--color-text-primary)] transition-colors" onClick={() => handleSort('registerNo')}>Reg No {sortBy === 'registerNo' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                <th className="px-4 py-3.5 cursor-pointer hover:text-[var(--color-text-primary)] transition-colors" onClick={() => handleSort('name')}>Name {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                <th className="px-4 py-3.5 cursor-pointer hover:text-[var(--color-text-primary)] transition-colors" onClick={() => handleSort('department')}>Dept {sortBy === 'department' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                <th className="px-4 py-3.5 cursor-pointer hover:text-[var(--color-text-primary)] transition-colors" onClick={() => handleSort('year')}>Year {sortBy === 'year' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                <th className="px-4 py-3.5 cursor-pointer hover:text-[var(--color-text-primary)] transition-colors" onClick={() => handleSort('phoneNo')}>Phone</th>
                <th className="px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-[var(--color-text-secondary)] font-medium">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading students...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-[var(--color-text-secondary)] font-medium">No students found.</td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.studentId} className="hover:bg-[var(--color-card)]/50 transition-colors">
                    <td className="px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        className="rounded border-[var(--color-border)] bg-[var(--color-surface)] text-purple-600 focus:ring-purple-500 cursor-pointer w-4 h-4"
                        checked={selectedIds.includes(student.studentId)}
                        onChange={() => handleSelectOne(student.studentId)}
                      />
                    </td>
                    <td className="px-4 py-3.5 font-bold font-mono text-[var(--color-text-primary)]">{student.registerNo}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-600/10 border border-purple-600/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-[var(--color-text-primary)]">{student.name}</div>
                          <div className="text-xs text-[var(--color-text-secondary)] font-normal">{student.emailId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-lg bg-[var(--color-primary-bg)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text-primary)]">
                        {student.department}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--color-text-secondary)] font-medium">
                      {student.currentYear ? `${student.currentYear}${student.currentYear === 1 ? 'st' : student.currentYear === 2 ? 'nd' : student.currentYear === 3 ? 'rd' : 'th'} Year` : '-'}
                    </td>
                    <td className="px-4 py-3.5 text-[var(--color-text-secondary)] font-mono text-xs font-semibold">{student.phoneNo}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => { setSelectedStudent(student); setShowDetails(true); }}
                          className="w-9 h-9 bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                          title="View Details"
                        >
                          <MdVisibility size={18} />
                        </button>
                        <button
                          onClick={() => { setFormData(student); setShowForm(true); }}
                          className="w-9 h-9 bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                          title="Edit Student"
                        >
                          <MdEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteOne(student.studentId)}
                          className="w-9 h-9 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                          title="Delete Student"
                        >
                          <MdDelete size={18} />
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
        <div className="border-t border-[var(--color-border)] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[var(--color-surface)] w-full">
          <div className="flex items-center gap-3 text-xs sm:text-sm text-[var(--color-text-secondary)] font-semibold">
            <span>Rows per page:</span>
            <select
              className="bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-xl px-2.5 py-1.5 outline-none focus:border-purple-500 text-xs font-bold text-[var(--color-text-primary)] cursor-pointer"
              value={size}
              onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="px-4 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-primary-bg)] hover:bg-[var(--color-card)] disabled:opacity-50 transition-all text-xs font-bold cursor-pointer"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              Previous
            </button>
            <span className="text-xs sm:text-sm font-bold px-2 text-[var(--color-text-primary)]">Page {page + 1} of {Math.max(1, totalPages)}</span>
            <button
              className="px-4 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-primary-bg)] hover:bg-[var(--color-card)] disabled:opacity-50 transition-all text-xs font-bold cursor-pointer"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages - 1}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Student Details Dialog */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-3xl max-h-[90vh] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-surface)]">
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Student Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-primary-bg)] transition-colors text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-[var(--color-surface)] space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 pb-2 border-b border-[var(--color-border)]">
                    Personal Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-[var(--color-border)]/40">
                      <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider min-w-[100px]">Name</span>
                      <span className="text-sm font-bold text-[var(--color-text-primary)]">{selectedStudent?.name || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-[var(--color-border)]/40">
                      <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider min-w-[100px]">Email</span>
                      <span className="text-sm font-bold text-[var(--color-text-primary)] break-all">{selectedStudent?.emailId || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-[var(--color-border)]/40">
                      <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider min-w-[100px]">Phone</span>
                      <span className="text-sm font-bold text-[var(--color-text-primary)]">{selectedStudent?.phoneNo || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-[var(--color-border)]/40">
                      <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider min-w-[100px]">DOB</span>
                      <span className="text-sm font-bold text-[var(--color-text-primary)]">{selectedStudent?.dob || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-[var(--color-border)]/40">
                      <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider min-w-[100px]">Gender</span>
                      <span className="text-sm font-bold text-[var(--color-text-primary)]">{selectedStudent?.gender || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 pb-2 border-b border-[var(--color-border)]">
                    Academic Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-[var(--color-border)]/40">
                      <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider min-w-[110px]">Register No</span>
                      <span className="text-sm font-bold text-[var(--color-text-primary)]">{selectedStudent?.registerNo || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-[var(--color-border)]/40">
                      <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider min-w-[110px]">Roll No</span>
                      <span className="text-sm font-bold text-[var(--color-text-primary)]">{selectedStudent?.rollNo || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-[var(--color-border)]/40">
                      <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider min-w-[110px]">Department</span>
                      <span className="text-sm font-bold text-[var(--color-text-primary)]">{selectedStudent?.department || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-[var(--color-border)]/40">
                      <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider min-w-[110px]">Year</span>
                      <span className="text-sm font-bold text-[var(--color-text-primary)]">{selectedStudent?.currentYear || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[var(--color-border)] flex justify-end bg-[var(--color-surface)]">
              <button
                onClick={() => setShowDetails(false)}
                className="px-5 py-2 rounded-xl bg-[var(--color-primary-bg)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-purple-500/40 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="admin-card w-full max-w-2xl max-h-[90vh] rounded-2xl border border-[var(--color-border)] overflow-hidden flex flex-col shadow-2xl bg-[var(--color-surface)] shadow-[0_8px_30px_rgba(0,0,0,0.5)] border-[var(--color-border)]"
          >
            <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-primary-bg)]">
              <h3 className="text-xl font-bold">{formData.studentId ? 'Edit Student' : 'Add Student'}</h3>
              <button onClick={() => setShowForm(false)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">✕</button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Name</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:border-purple-500 outline-none transition-all duration-300" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Email</label>
                  <input required type="email" value={formData.emailId} onChange={e => setFormData({ ...formData, emailId: e.target.value })} className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:border-purple-500 outline-none transition-all duration-300" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Register No</label>
                  <input required type="text" value={formData.registerNo} onChange={e => setFormData({ ...formData, registerNo: e.target.value })} className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:border-purple-500 outline-none transition-all duration-300" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Roll No</label>
                  <input required type="text" value={formData.rollNo} onChange={e => setFormData({ ...formData, rollNo: e.target.value })} className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:border-purple-500 outline-none transition-all duration-300" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Phone No</label>
                  <input required type="text" value={formData.phoneNo} onChange={e => setFormData({ ...formData, phoneNo: e.target.value })} className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:border-purple-500 outline-none transition-all duration-300" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-1">DOB</label>
                  <input required type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:border-purple-500 outline-none transition-all duration-300" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Department</label>
                  <select required value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:border-purple-500 outline-none transition-all duration-300">
                    <option value="">Select Dept</option>
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
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Gender</label>
                  <select required value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all duration-300">
                    <option value="">Select Gender</option>
                    <option value="MALE">MALE</option>
                    <option value="FEMALE">FEMALE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Year</label>
                  <select required value={formData.currentYear} onChange={e => setFormData({ ...formData, currentYear: e.target.value })} className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all duration-300">
                    <option value="">Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--color-border)]">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-card)] transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg transition-colors font-medium">Save Student</button>
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
