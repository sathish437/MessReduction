import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MdSearch, MdFilterList, 
  MdDelete, MdEdit, MdVisibility, MdMoreVert 
} from 'react-icons/md';
import apiClient from './api/apiClient';

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortBy, setSortBy] = useState('studentId');
  const [sortDir, setSortDir] = useState('desc');
  
  // Student Details Modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // CRUD State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', emailId: '', registerNo: '', rollNo: '', phoneNo: '', dob: '', department: '', gender: '', currentYear: ''
  });




  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.studentId) {
        await apiClient.put(`/api/admin/students/${formData.studentId}`, formData);
      } else {
        await apiClient.post('/api/admin/students', formData);
      }
      setShowForm(false);
      fetchStudents();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving student');
    }
  };

  const handleDeleteOne = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await apiClient.delete(`/api/admin/students/${id}`);
        fetchStudents();
      } catch (error) {
        alert('Error deleting student');
      }
    }
  };

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size, search, sortBy, sortDir };
      if (selectedDept) params.department = selectedDept;
      if (selectedGender) params.gender = selectedGender;
      if (selectedYear) params.year = selectedYear;

      const response = await apiClient.get('/api/admin/students', { params });
      setStudents(response.data.content);
      setTotalPages(response.data.totalPages);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [page, size, search, sortBy, sortDir, selectedDept, selectedGender, selectedYear]);

  useEffect(() => {
    // Debounce search
    const delayDebounceFn = setTimeout(() => {
      fetchStudents();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [fetchStudents]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(students.map(s => s.studentId));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} students?`)) {
      try {
        await apiClient.post('/api/admin/students/bulk-delete', selectedIds);
        setSelectedIds([]);
        fetchStudents();
      } catch (error) {
      }
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 min-w-0 w-full">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">Students</h2>
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="relative flex-1 md:w-64">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" size={20} />
            <input 
              type="text"
              placeholder="Search Name, Reg No, Roll No, Phone, Email, Dept..."
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all duration-300 shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <select 
              value={selectedDept}
              onChange={(e) => { setSelectedDept(e.target.value); setPage(0); }}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all duration-300 shadow-sm"
            >
              <option value="">All Depts</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="MECH">MECH</option>
              <option value="CIVIL">CIVIL</option>
              <option value="MECHATRONICS">MECHATRONICS</option>
            </select>

            <select 
              value={selectedGender}
              onChange={(e) => { setSelectedGender(e.target.value); setPage(0); }}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all duration-300 shadow-sm"
            >
              <option value="">All Genders</option>
              <option value="MALE">MALE</option>
              <option value="FEMALE">FEMALE</option>
            </select>

            <select 
              value={selectedYear}
              onChange={(e) => { setSelectedYear(e.target.value); setPage(0); }}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all duration-300 shadow-sm"
            >
              <option value="">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>

          <button 
            onClick={() => {
              setFormData({ name: '', emailId: '', registerNo: '', rollNo: '', phoneNo: '', dob: '', department: '', gender: '', currentYear: '' });
              setShowForm(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-[var(--color-text-primary)] rounded-xl text-sm font-medium shadow-lg shadow-[0_4px_15px_rgba(147,51,234,0.4)] transition-all admin-lift">
            + Add Student
          </button>
        </div>
      </div>

      {/* Bulk Actions Banner */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-900/30 border border-red-500/50 rounded-xl p-3 flex items-center justify-between"
          >
            <span className="text-sm font-medium">{selectedIds.length} students selected</span>
            <div className="flex gap-2">
              <button onClick={handleBulkDelete} className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg text-sm transition-colors">
                <MdDelete size={16} /> Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Data Table */}
      <div className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden flex flex-col shadow-lg shadow-black/50 min-w-0 w-full">
        <div className="overflow-x-auto flex-1 relative">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[var(--color-primary-bg)] sticky top-0 z-10 shadow-sm border-b border-[var(--color-border)]">
              <tr>
                <th className="px-4 py-3 sticky left-0 bg-[var(--color-primary-bg)] z-20 w-12">
                  <input 
                    type="checkbox" 
                    className="rounded bg-[var(--color-surface)] border-gray-600 text-purple-500 focus:ring-purple-500 cursor-pointer"
                    onChange={handleSelectAll}
                    checked={students.length > 0 && selectedIds.length === students.length}
                  />
                </th>
                <th className="px-4 py-3 cursor-pointer hover:text-[var(--color-text-primary)] transition-colors" onClick={() => handleSort('registerNo')}>Reg No {sortBy === 'registerNo' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                <th className="px-4 py-3 cursor-pointer hover:text-[var(--color-text-primary)] transition-colors" onClick={() => handleSort('name')}>Name {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                <th className="px-4 py-3 cursor-pointer hover:text-[var(--color-text-primary)] transition-colors" onClick={() => handleSort('department')}>Dept {sortBy === 'department' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                <th className="px-4 py-3 cursor-pointer hover:text-[var(--color-text-primary)] transition-colors" onClick={() => handleSort('year')}>Year {sortBy === 'year' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                <th className="px-4 py-3 cursor-pointer hover:text-[var(--color-text-primary)] transition-colors" onClick={() => handleSort('phoneNo')}>Phone</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y border-[var(--color-border)]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-[var(--color-text-secondary)]">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading students...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-[var(--color-text-secondary)]">No students found.</td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.studentId} className="hover:bg-[var(--color-card)] transition-all duration-300 group hover:-translate-y-[1px] hover:shadow-[0_4px_15px_rgba(0,0,0,0.1)] relative z-0 hover:z-10">
                    <td className="px-4 py-3 sticky left-0 bg-[var(--color-surface)] group-hover:bg-[var(--color-card)] z-10 transition-colors">
                      <input 
                        type="checkbox" 
                        className="rounded bg-black border-gray-600 text-purple-500 focus:ring-purple-500 cursor-pointer"
                        checked={selectedIds.includes(student.studentId)}
                        onChange={() => handleSelectOne(student.studentId)}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{student.registerNo}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-card)] flex items-center justify-center text-xs font-bold text-[var(--color-text-primary)]">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div>{student.name}</div>
                          <div className="text-xs text-[var(--color-text-secondary)]">{student.emailId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-md bg-[var(--color-card)] text-xs font-medium text-[var(--color-text-primary)]">
                        {student.department}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {student.currentYear ? `${student.currentYear}${student.currentYear === 1 ? 'st' : student.currentYear === 2 ? 'nd' : student.currentYear === 3 ? 'rd' : 'th'} Year` : '-'}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">{student.phoneNo}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setSelectedStudent(student); setShowDetails(true); }}
                          className="p-1.5 hover:bg-gray-700 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                          title="View Details"
                        >
                          <MdVisibility size={18} />
                        </button>
                        <button 
                          onClick={() => { setFormData(student); setShowForm(true); }}
                          className="p-1.5 hover:bg-gray-700 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                        >
                          <MdEdit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteOne(student.studentId)}
                          className="p-1.5 hover:bg-red-500/20 rounded-lg text-[var(--color-text-secondary)] hover:text-purple-500 transition-colors"
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
        <div className="border-t border-[var(--color-border)] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[var(--color-primary-bg)] min-w-0 w-full">
          <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
            <span>Rows per page:</span>
            <select 
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-1 outline-none focus:border-purple-500"
              value={size}
              onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button 
              className="px-3 py-1 border border-[var(--color-border)] rounded hover:bg-[var(--color-card)] disabled:opacity-50 transition-colors text-sm"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              Previous
            </button>
            <span className="text-sm px-2">Page {page + 1} of {Math.max(1, totalPages)}</span>
            <button 
              className="px-3 py-1 border border-[var(--color-border)] rounded hover:bg-[var(--color-card)] disabled:opacity-50 transition-colors text-sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages - 1}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      
      {/* Student Details Dialog placeholder */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="admin-card w-full max-w-4xl max-h-[90vh] rounded-2xl border border-[var(--color-border)] overflow-hidden flex flex-col shadow-2xl"
          >
            <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-primary-bg)]">
              <h3 className="text-xl font-bold">Student Details</h3>
              <button onClick={() => setShowDetails(false)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-purple-500 font-bold mb-2">Personal Information</h4>
                  <p><span className="text-[var(--color-text-secondary)]">Name:</span> {selectedStudent?.name}</p>
                  <p><span className="text-[var(--color-text-secondary)]">Email:</span> {selectedStudent?.emailId}</p>
                  <p><span className="text-[var(--color-text-secondary)]">Phone:</span> {selectedStudent?.phoneNo}</p>
                  <p><span className="text-[var(--color-text-secondary)]">DOB:</span> {selectedStudent?.dob}</p>
                  <p><span className="text-[var(--color-text-secondary)]">Gender:</span> {selectedStudent?.gender}</p>
                </div>
                <div>
                  <h4 className="text-purple-500 font-bold mb-2">Academic Information</h4>
                  <p><span className="text-[var(--color-text-secondary)]">Register No:</span> {selectedStudent?.registerNo}</p>
                  <p><span className="text-[var(--color-text-secondary)]">Roll No:</span> {selectedStudent?.rollNo}</p>
                  <p><span className="text-[var(--color-text-secondary)]">Department:</span> {selectedStudent?.department}</p>
                  <p><span className="text-[var(--color-text-secondary)]">Year:</span> {selectedStudent?.currentYear}</p>
                </div>
              </div>

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
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all duration-300" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Email</label>
                  <input required type="email" value={formData.emailId} onChange={e => setFormData({...formData, emailId: e.target.value})} className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all duration-300" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Register No</label>
                  <input required type="text" value={formData.registerNo} onChange={e => setFormData({...formData, registerNo: e.target.value})} className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all duration-300" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Roll No</label>
                  <input required type="text" value={formData.rollNo} onChange={e => setFormData({...formData, rollNo: e.target.value})} className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all duration-300" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Phone No</label>
                  <input required type="text" value={formData.phoneNo} onChange={e => setFormData({...formData, phoneNo: e.target.value})} className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all duration-300" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-1">DOB</label>
                  <input required type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all duration-300" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Department</label>
                  <select required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all duration-300">
                    <option value="">Select Dept</option>
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                    <option value="MECHATRONICS">MECHATRONICS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Gender</label>
                  <select required value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all duration-300">
                    <option value="">Select Gender</option>
                    <option value="MALE">MALE</option>
                    <option value="FEMALE">FEMALE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Year</label>
                  <select required value={formData.currentYear} onChange={e => setFormData({...formData, currentYear: e.target.value})} className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all duration-300">
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
                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-[var(--color-text-primary)] rounded-lg transition-colors font-medium">Save Student</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminStudents;
