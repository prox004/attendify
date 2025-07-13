'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import Navigation from '@/components/Navigation';
import { Toaster, toast } from 'react-hot-toast';
import Papa from 'papaparse';
import { 
  BookOpenIcon, 
  ChartBarIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon, 
  ChevronUpIcon, 
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { Subject, SubjectFormData, SubjectSortOption, SortDirection } from '@/types/subject';
import { addSubject, getSubjects, updateSubject, deleteSubject } from '@/lib/subjectService';
import { useAttendanceContext } from '@/contexts/AttendanceContext';

export default function SubjectsPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const { subjectsWithAttendance, isLoading: attendanceLoading, refreshData } = useAttendanceContext();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SubjectSortOption>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [attendanceFilter, setAttendanceFilter] = useState<string>('all');
  const [creditFilter, setCreditFilter] = useState<string>('all');

  // Add Subject Accordion State
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [csvSubjects, setCsvSubjects] = useState<string[]>([]);
  const [isLoadingCSV, setIsLoadingCSV] = useState(false);
  const [formData, setFormData] = useState<SubjectFormData>({
    name: '',
    code: '',
    instructor: '',
    credit: 3
  });
  const [subjectSearchTerm, setSubjectSearchTerm] = useState('');

  // Subject Card States
  const [editingSubjects, setEditingSubjects] = useState<{ [key: string]: boolean }>({});
  const [editForms, setEditForms] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    if (!loading && !user) {
      router.push('/onboarding');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadSubjects();
    }
  }, [user]);

  // Update local subjects when attendance context changes
  useEffect(() => {
    if (subjectsWithAttendance.length > 0) {
      setSubjects(subjectsWithAttendance);
      setIsLoading(false);
    }
  }, [subjectsWithAttendance]);

  useEffect(() => {
    const loadCSVData = async () => {
      setIsLoadingCSV(true);
      try {
        const response = await fetch('/subject_list.csv');
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          complete: (results) => {
            try {
              const subjects = results.data
                .map((row: any) => row[0])
                .filter((subject: string) => subject && subject.trim().length > 0)
                .map((subject: string) => subject.trim())
                .sort();
              
              setCsvSubjects(subjects);
            } catch (error) {
              console.error('Error parsing CSV:', error);
              setCsvSubjects(['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science'].sort());
            }
          },
          error: (error: any) => {
            console.error('Error loading CSV:', error);
            setCsvSubjects(['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science'].sort());
          },
          header: false,
          skipEmptyLines: true
        });
      } catch (error) {
        console.error('Failed to load CSV subjects:', error);
        setCsvSubjects(['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science'].sort());
      } finally {
        setIsLoadingCSV(false);
      }
    };

    if (isAccordionOpen && csvSubjects.length === 0) {
      loadCSVData();
    }
  }, [isAccordionOpen, csvSubjects.length]);

  const loadSubjects = async () => {
    try {
      setIsLoading(true);
      const loadedSubjects = await getSubjects(user?.uid || null);
      setSubjects(loadedSubjects);
      // Trigger attendance data refresh
      refreshData();
    } catch (error) {
      console.error('Error loading subjects:', error);
      toast.error('Failed to load subjects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const subjectName = subjectSearchTerm.trim() || formData.name.trim();
    if (!subjectName || !formData.code.trim()) return;

    try {
      setIsAddingSubject(true);
      const subjectData = {
        ...formData,
        name: subjectName
      };
      const newSubject = await addSubject(user?.uid || null, subjectData);
      setSubjects(prev => [...prev, newSubject]);
      setFormData({ name: '', code: '', instructor: '', credit: 3 });
      setSubjectSearchTerm('');
      setIsAccordionOpen(false);
      // Refresh attendance data
      refreshData();
      toast.success('Subject added successfully!');
    } catch (error) {
      console.error('Error adding subject:', error);
      toast.error('Failed to add subject');
    } finally {
      setIsAddingSubject(false);
    }
  };

  const handleUpdateSubject = async (subjectId: string, updates: Partial<Subject>) => {
    try {
      await updateSubject(user?.uid || null, subjectId, updates);
      setSubjects(prev => prev.map(s => s.id === subjectId ? { ...s, ...updates } : s));
      setEditingSubjects(prev => ({ ...prev, [subjectId]: false }));
      toast.success('Subject updated successfully!');
    } catch (error) {
      console.error('Error updating subject:', error);
      toast.error('Failed to update subject');
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (window.confirm('Are you sure you want to delete this subject? This action cannot be undone.')) {
      try {
        await deleteSubject(user?.uid || null, subjectId);
        setSubjects(prev => prev.filter(s => s.id !== subjectId));
        toast.success('Subject deleted successfully!');
      } catch (error) {
        console.error('Error deleting subject:', error);
        toast.error('Failed to delete subject');
      }
    }
  };

  const handleMarkAttendance = async (subjectId: string, isPresent: boolean) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const newTotalClasses = subject.totalClasses + 1;
    const newAttendedClasses = subject.attendedClasses + (isPresent ? 1 : 0);
    const newPercentage = Math.round((newAttendedClasses / newTotalClasses) * 100);

    const updates = {
      totalClasses: newTotalClasses,
      attendedClasses: newAttendedClasses,
      percentage: newPercentage,
      lastClass: 'Today'
    };

    await handleUpdateSubject(subjectId, updates);
    toast.success(isPresent ? 'Marked as present!' : 'Marked as absent!');
  };

  const handleSelectSubject = (subjectName: string) => {
    setFormData(prev => ({ ...prev, name: subjectName }));
    setSubjectSearchTerm(subjectName);
  };

  const startEditing = (subject: Subject) => {
    setEditingSubjects(prev => ({ ...prev, [subject.id]: true }));
    setEditForms(prev => ({
      ...prev,
      [subject.id]: {
        name: subject.name,
        code: subject.code,
        instructor: subject.instructor || '',
        credit: subject.credit,
        totalClasses: subject.totalClasses,
        attendedClasses: subject.attendedClasses
      }
    }));
  };

  const cancelEditing = (subjectId: string) => {
    setEditingSubjects(prev => ({ ...prev, [subjectId]: false }));
    setEditForms(prev => {
      const { [subjectId]: removed, ...rest } = prev;
      return rest;
    });
  };

  const saveEdit = async (subjectId: string) => {
    const editForm = editForms[subjectId];
    if (!editForm) return;

    const updates = {
      name: editForm.name,
      code: editForm.code,
      instructor: editForm.instructor,
      credit: editForm.credit,
      totalClasses: editForm.totalClasses,
      attendedClasses: editForm.attendedClasses
    };
    
    await handleUpdateSubject(subjectId, updates);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'good':
        return <CheckCircleIcon className="w-5 h-5 text-blue-600" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />;
      case 'critical':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      default:
        return <CheckCircleIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAndSortedSubjects = subjects
    .filter(subject => {
      // Text search filter
      const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (subject.instructor && subject.instructor.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Attendance filter
      let matchesAttendance = true;
      if (attendanceFilter === 'excellent') matchesAttendance = subject.percentage >= 90;
      else if (attendanceFilter === 'good') matchesAttendance = subject.percentage >= 75 && subject.percentage < 90;
      else if (attendanceFilter === 'warning') matchesAttendance = subject.percentage >= 60 && subject.percentage < 75;
      else if (attendanceFilter === 'critical') matchesAttendance = subject.percentage < 60;
      else if (attendanceFilter === 'at-risk') matchesAttendance = subject.percentage < 75;
      
      // Credit filter
      let matchesCredit = true;
      if (creditFilter !== 'all') {
        matchesCredit = subject.credit === parseInt(creditFilter);
      }
      
      return matchesSearch && matchesAttendance && matchesCredit;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'percentage':
          comparison = a.percentage - b.percentage;
          break;
        case 'credit':
          comparison = a.credit - b.credit;
          break;
        case 'lastClass':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'status':
          const statusOrder = { critical: 0, warning: 1, good: 2, excellent: 3 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const averageAttendance = subjects.length > 0 
    ? Math.round(subjects.reduce((acc, subject) => acc + subject.percentage, 0) / subjects.length)
    : 0;

  const atRiskSubjects = subjects.filter(s => s.percentage < 75).length;

  if (loading || isLoading || attendanceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Toaster position="top-right" />
      
      <div className="hidden md:flex md:w-64 md:flex-col">
        <Navigation />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
              <p className="text-gray-600">Manage your subject-wise attendance</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {/* Add Subject Accordion */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
            <button
              onClick={() => setIsAccordionOpen(!isAccordionOpen)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <PlusIcon className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900">Add New Subject</h3>
                  <p className="text-sm text-gray-600">Choose from our list or enter custom details</p>
                </div>
              </div>
              {isAccordionOpen ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
              )}
            </button>

            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isAccordionOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="p-6 border-t border-gray-200">
                <form onSubmit={handleAddSubject} className="space-y-6">
                  {/* Subject Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Subject Name *
                    </label>
                    
                    <div className="mb-4">
                      {isLoadingCSV ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                          <p className="text-sm text-gray-600 mt-2">Loading subjects...</p>
                        </div>
                      ) : (
                        <div>
                          {/* Combined Search/Input */}
                          <div className="relative mb-2">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search subjects or enter custom name..."
                              value={subjectSearchTerm}
                              onChange={(e) => {
                                setSubjectSearchTerm(e.target.value);
                                setFormData(prev => ({ ...prev, name: e.target.value }));
                              }}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              required
                            />
                          </div>
                          
                          {/* Dropdown with filtered results */}
                          {subjectSearchTerm && (
                            <div className="border border-gray-300 rounded-lg bg-white shadow-sm max-h-40 overflow-y-auto">
                              {csvSubjects
                                .filter(subject => 
                                  subject.toLowerCase().includes(subjectSearchTerm.toLowerCase()) &&
                                  subject.toLowerCase() !== subjectSearchTerm.toLowerCase()
                                )
                                .slice(0, 10) // Limit to 10 results for performance
                                .map((subject, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => handleSelectSubject(subject)}
                                  className="w-full text-left px-4 py-2 hover:bg-indigo-50 border-b border-gray-100 last:border-b-0 transition-colors duration-150 text-gray-700"
                                >
                                  {subject}
                                </button>
                              ))}
                              
                              {/* Show "Add as custom" if no exact match */}
                              {subjectSearchTerm && 
                               !csvSubjects.some(subject => 
                                 subject.toLowerCase() === subjectSearchTerm.toLowerCase()
                               ) && 
                               csvSubjects.filter(subject => 
                                 subject.toLowerCase().includes(subjectSearchTerm.toLowerCase())
                               ).length === 0 && (
                                <div className="px-4 py-2 text-sm text-indigo-600 bg-indigo-50 border-b border-gray-100">
                                  Will add "{subjectSearchTerm}" as custom subject
                                </div>
                              )}
                              
                              {/* Show partial matches info */}
                              {subjectSearchTerm && 
                               !csvSubjects.some(subject => 
                                 subject.toLowerCase() === subjectSearchTerm.toLowerCase()
                               ) && 
                               csvSubjects.filter(subject => 
                                 subject.toLowerCase().includes(subjectSearchTerm.toLowerCase())
                               ).length > 0 && (
                                <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50">
                                  Or press Enter to add "{subjectSearchTerm}" as custom subject
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Subject Code */}
                  <div>
                    <label htmlFor="subjectCode" className="block text-sm font-medium text-gray-700 mb-2">
                      Subject Code *
                    </label>
                    <input
                      type="text"
                      id="subjectCode"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., CS-101, MATH-201"
                      required
                    />
                  </div>

                  {/* Credit */}
                  <div>
                    <label htmlFor="credit" className="block text-sm font-medium text-gray-700 mb-2">
                      Credit Hours *
                    </label>
                    <select
                      id="credit"
                      value={formData.credit}
                      onChange={(e) => setFormData(prev => ({ ...prev, credit: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    >
                      <option value={1}>1 Credit</option>
                      <option value={2}>2 Credits</option>
                      <option value={3}>3 Credits</option>
                      <option value={4}>4 Credits</option>
                      <option value={5}>5 Credits</option>
                      <option value={6}>6 Credits</option>
                    </select>
                  </div>

                  {/* Instructor */}
                  <div>
                    <label htmlFor="instructor" className="block text-sm font-medium text-gray-700 mb-2">
                      Instructor (Optional)
                    </label>
                    <input
                      type="text"
                      id="instructor"
                      value={formData.instructor}
                      onChange={(e) => setFormData(prev => ({ ...prev, instructor: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Dr. Smith, Prof. Johnson"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAccordionOpen(false);
                        setFormData({ name: '', code: '', instructor: '', credit: 3 });
                        setSubjectSearchTerm('');
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!subjectSearchTerm.trim() || !formData.code.trim() || isAddingSubject}
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
                    >
                      {isAddingSubject && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      )}
                      <span>Add Subject</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-indigo-50">
                  <BookOpenIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Subjects</p>
                  <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-50">
                  <ChartBarIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Attendance</p>
                  <p className="text-2xl font-bold text-gray-900">{averageAttendance}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-red-50">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">At Risk</p>
                  <p className="text-2xl font-bold text-gray-900">{atRiskSubjects}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          {subjects.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search subjects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Attendance Filter */}
                <div>
                  <select
                    value={attendanceFilter}
                    onChange={(e) => setAttendanceFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">All Attendance</option>
                    <option value="excellent">Excellent (90%+)</option>
                    <option value="good">Good (75-89%)</option>
                    <option value="warning">Warning (60-74%)</option>
                    <option value="critical">Critical (&lt;60%)</option>
                    <option value="at-risk">At Risk (&lt;75%)</option>
                  </select>
                </div>

                {/* Credit Filter */}
                <div>
                  <select
                    value={creditFilter}
                    onChange={(e) => setCreditFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">All Credits</option>
                    <option value="1">1 Credit</option>
                    <option value="2">2 Credits</option>
                    <option value="3">3 Credits</option>
                    <option value="4">4 Credits</option>
                    <option value="5">5 Credits</option>
                    <option value="6">6 Credits</option>
                  </select>
                </div>

                {/* Sort */}
                <div className="flex items-center space-x-2">
                  <FunnelIcon className="w-5 h-5 text-gray-400" />
                  <select
                    value={`${sortBy}-${sortDirection}`}
                    onChange={(e) => {
                      const [newSortBy, newDirection] = e.target.value.split('-') as [SubjectSortOption, SortDirection];
                      setSortBy(newSortBy);
                      setSortDirection(newDirection);
                    }}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="percentage-desc">Attendance (High to Low)</option>
                    <option value="percentage-asc">Attendance (Low to High)</option>
                    <option value="credit-desc">Credit (High to Low)</option>
                    <option value="credit-asc">Credit (Low to High)</option>
                    <option value="status-asc">Status (Critical First)</option>
                    <option value="status-desc">Status (Excellent First)</option>
                    <option value="lastClass-desc">Recently Updated</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Subjects Grid */}
          {subjects.length === 0 ? (
            <div className="text-center py-12">
              <BookOpenIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No subjects yet</h3>
              <p className="text-gray-600">Add your first subject to start tracking attendance.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredAndSortedSubjects.map((subject) => {
                const isEditing = editingSubjects[subject.id];
                const editForm = editForms[subject.id];

                return (
                  <div key={subject.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${subject.color}`}></div>
                          {isEditing ? (
                            <div className="flex-1">
                              <input
                                type="text"
                                value={editForm?.name || ''}
                                onChange={(e) => setEditForms(prev => ({
                                  ...prev,
                                  [subject.id]: { ...prev[subject.id], name: e.target.value }
                                }))}
                                className="text-lg font-semibold text-gray-900 border border-gray-300 rounded px-2 py-1 w-full mb-1"
                              />
                              <div className="flex space-x-2">
                                <input
                                  type="text"
                                  value={editForm?.code || ''}
                                  onChange={(e) => setEditForms(prev => ({
                                    ...prev,
                                    [subject.id]: { ...prev[subject.id], code: e.target.value }
                                  }))}
                                  className="text-sm text-gray-600 border border-gray-300 rounded px-2 py-1 flex-1"
                                  placeholder="Subject Code"
                                />
                                <select
                                  value={editForm?.credit || 3}
                                  onChange={(e) => setEditForms(prev => ({
                                    ...prev,
                                    [subject.id]: { ...prev[subject.id], credit: parseInt(e.target.value) }
                                  }))}
                                  className="text-sm text-gray-600 border border-gray-300 rounded px-2 py-1"
                                >
                                  <option value={1}>1 Credit</option>
                                  <option value={2}>2 Credits</option>
                                  <option value={3}>3 Credits</option>
                                  <option value={4}>4 Credits</option>
                                  <option value={5}>5 Credits</option>
                                  <option value={6}>6 Credits</option>
                                </select>
                                <input
                                  type="text"
                                  value={editForm?.instructor || ''}
                                  onChange={(e) => setEditForms(prev => ({
                                    ...prev,
                                    [subject.id]: { ...prev[subject.id], instructor: e.target.value }
                                  }))}
                                  className="text-sm text-gray-600 border border-gray-300 rounded px-2 py-1 flex-1"
                                  placeholder="Instructor"
                                />
                              </div>
                            </div>
                          ) : (
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{subject.name}</h3>
                              <p className="text-sm text-gray-600">
                                {subject.code} • {subject.credit} Credits{subject.instructor ? ` • ${subject.instructor}` : ''}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(subject.status)}
                          {!isEditing && (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => startEditing(subject)}
                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-150"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSubject(subject.id)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-150"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          {isEditing && (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => saveEdit(subject.id)}
                                className="p-1 text-green-600 hover:text-green-700 transition-colors duration-150"
                              >
                                <CheckIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => cancelEditing(subject.id)}
                                className="p-1 text-red-600 hover:text-red-700 transition-colors duration-150"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      {/* Attendance Stats */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="text-2xl font-bold text-gray-900">{subject.percentage}%</div>
                          {isEditing ? (
                            <div className="flex space-x-2 mt-2">
                              <div>
                                <label className="block text-xs text-gray-600">Attended</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={editForm?.attendedClasses || 0}
                                  onChange={(e) => setEditForms(prev => ({
                                    ...prev,
                                    [subject.id]: { ...prev[subject.id], attendedClasses: parseInt(e.target.value) || 0 }
                                  }))}
                                  className="w-16 text-sm border border-gray-300 rounded px-1 py-0.5"
                                />
                              </div>
                              <div className="self-end text-gray-600">/</div>
                              <div>
                                <label className="block text-xs text-gray-600">Total</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={editForm?.totalClasses || 0}
                                  onChange={(e) => setEditForms(prev => ({
                                    ...prev,
                                    [subject.id]: { ...prev[subject.id], totalClasses: parseInt(e.target.value) || 0 }
                                  }))}
                                  className="w-16 text-sm border border-gray-300 rounded px-1 py-0.5"
                                />
                              </div>
                              <div className="self-end text-gray-600">classes</div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-600">
                              {subject.attendedClasses} / {subject.totalClasses} classes
                            </div>
                          )}
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(subject.status)}`}>
                          {subject.status}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${subject.color}`}
                            style={{ width: `${subject.percentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Last Class */}
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="w-4 h-4" />
                          <span>Last class: {subject.lastClass || 'No classes yet'}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {!isEditing && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleMarkAttendance(subject.id, true)}
                            className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200"
                          >
                            Mark Present
                          </button>
                          <button
                            onClick={() => handleMarkAttendance(subject.id, false)}
                            className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200"
                          >
                            Mark Absent
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* No search results */}
          {subjects.length > 0 && filteredAndSortedSubjects.length === 0 && (
            <div className="text-center py-12">
              <MagnifyingGlassIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No subjects found</h3>
              <p className="text-gray-600">Try adjusting your search terms.</p>
            </div>
          )}
        </main>
      </div>

      <div className="md:hidden">
        <Navigation className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200" isMobile={true} />
      </div>
    </div>
  );
}
