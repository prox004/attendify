'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import Navigation from '@/components/Navigation';
import { Toaster, toast } from 'react-hot-toast';
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon, 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Subject } from '@/types/subject';
import { TimetableEntry, TimetableFormData, DayOfWeek, DAYS_OF_WEEK } from '@/types/timetable';
import { getSubjects } from '@/lib/subjectService';
import { 
  addTimetableEntry, 
  getTimetable, 
  updateTimetableEntry, 
  deleteTimetableEntry,
  formatTime,
  calculateDuration,
  checkTimeConflict
} from '@/lib/timetableService';
import TimePicker from '@/components/TimePicker';

export default function TimetablePage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<TimetableFormData>({
    subjectId: '',
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    room: ''
  });

  // Edit state
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TimetableEntry>>({});

  useEffect(() => {
    if (!loading && !user) {
      router.push('/onboarding');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [subjectsData, timetableData] = await Promise.all([
        getSubjects(user?.uid || null),
        getTimetable(user?.uid || null)
      ]);
      setSubjects(subjectsData);
      setTimetableEntries(timetableData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedSubject = subjects.find(s => s.id === formData.subjectId);
    if (!selectedSubject) {
      toast.error('Please select a subject');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      toast.error('End time must be after start time');
      return;
    }

    if (checkTimeConflict(timetableEntries, formData)) {
      toast.error('Time conflict with existing entry');
      return;
    }

    try {
      setIsAddingEntry(true);
      const newEntry = await addTimetableEntry(user?.uid || null, formData, selectedSubject);
      setTimetableEntries(prev => [...prev, newEntry]);
      setFormData({
        subjectId: '',
        day: 'Monday',
        startTime: '09:00',
        endTime: '10:00',
        room: ''
      });
      setShowAddForm(false);
      toast.success('Timetable entry added successfully!');
    } catch (error) {
      console.error('Error adding entry:', error);
      toast.error('Failed to add timetable entry');
    } finally {
      setIsAddingEntry(false);
    }
  };

  const handleUpdateEntry = async (entryId: string) => {
    if (!editForm.startTime || !editForm.endTime) return;

    if (editForm.startTime >= editForm.endTime) {
      toast.error('End time must be after start time');
      return;
    }

    // Check for conflicts excluding current entry
    const otherEntries = timetableEntries.filter(e => e.id !== entryId);
    const tempEntry: TimetableFormData = {
      subjectId: editForm.subjectId || '',
      day: editForm.day || 'Monday',
      startTime: editForm.startTime,
      endTime: editForm.endTime,
      room: editForm.room
    };

    if (checkTimeConflict(otherEntries, tempEntry)) {
      toast.error('Time conflict with existing entry');
      return;
    }

    try {
      await updateTimetableEntry(user?.uid || null, entryId, editForm);
      setTimetableEntries(prev => prev.map(entry => 
        entry.id === entryId ? { ...entry, ...editForm } : entry
      ));
      setEditingEntry(null);
      setEditForm({});
      toast.success('Timetable entry updated successfully!');
    } catch (error) {
      console.error('Error updating entry:', error);
      toast.error('Failed to update timetable entry');
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (window.confirm('Are you sure you want to delete this timetable entry?')) {
      try {
        await deleteTimetableEntry(user?.uid || null, entryId);
        setTimetableEntries(prev => prev.filter(entry => entry.id !== entryId));
        toast.success('Timetable entry deleted successfully!');
      } catch (error) {
        console.error('Error deleting entry:', error);
        toast.error('Failed to delete timetable entry');
      }
    }
  };

  const startEditing = (entry: TimetableEntry) => {
    setEditingEntry(entry.id);
    setEditForm({
      subjectId: entry.subjectId,
      day: entry.day,
      startTime: entry.startTime,
      endTime: entry.endTime,
      room: entry.room
    });
  };

  const cancelEditing = () => {
    setEditingEntry(null);
    setEditForm({});
  };

  const getEntriesForDay = (day: DayOfWeek) => {
    return timetableEntries
      .filter(entry => entry.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  if (loading || isLoading) {
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
              <h1 className="text-2xl font-bold text-gray-900">Timetable</h1>
              <p className="text-gray-600">Your weekly class schedule</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Add Class</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {/* Add Entry Form */}
          {showAddForm && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add New Class</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {subjects.length === 0 ? (
                <div className="text-center py-8">
                  <ExclamationTriangleIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Subjects Found</h4>
                  <p className="text-gray-600 mb-4">You need to add subjects first before creating a timetable.</p>
                  <button
                    onClick={() => router.push('/subjects')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                  >
                    Go to Subjects
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAddEntry} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                    <select
                      value={formData.subjectId}
                      onChange={(e) => setFormData(prev => ({ ...prev, subjectId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    >
                      <option value="">Select a subject</option>
                      {subjects.map(subject => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name} ({subject.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Day *</label>
                    <select
                      value={formData.day}
                      onChange={(e) => setFormData(prev => ({ ...prev, day: e.target.value as DayOfWeek }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {DAYS_OF_WEEK.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Room</label>
                    <input
                      type="text"
                      value={formData.room}
                      onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Room 101, Lab A"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
                    <TimePicker
                      value={formData.startTime}
                      onChange={(time) => setFormData(prev => ({ ...prev, startTime: time }))}
                      placeholder="Select start time"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
                    <TimePicker
                      value={formData.endTime}
                      onChange={(time) => setFormData(prev => ({ ...prev, endTime: time }))}
                      placeholder="Select end time"
                      required
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={isAddingEntry || !formData.subjectId}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      {isAddingEntry && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      )}
                      <span>Add Class</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Timetable Grid */}
          <div className="space-y-6">
            {DAYS_OF_WEEK.map((day) => {
              const dayEntries = getEntriesForDay(day);
              
              return (
                <div key={day} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-indigo-50 px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-indigo-900">{day}</h2>
                  </div>
                  
                  <div className="p-6">
                    {dayEntries.length > 0 ? (
                      <div className="space-y-4">
                        {dayEntries.map((entry) => (
                          <div key={entry.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <ClockIcon className="w-6 h-6 text-indigo-600" />
                              </div>
                            </div>
                            
                            <div className="flex-1">
                              {editingEntry === entry.id ? (
                                <div className="space-y-2">
                                  <div className="grid grid-cols-2 gap-2">
                                    <TimePicker
                                      value={editForm.startTime || entry.startTime}
                                      onChange={(time) => setEditForm(prev => ({ ...prev, startTime: time }))}
                                      placeholder="Start time"
                                      className="text-sm"
                                    />
                                    <TimePicker
                                      value={editForm.endTime || entry.endTime}
                                      onChange={(time) => setEditForm(prev => ({ ...prev, endTime: time }))}
                                      placeholder="End time"
                                      className="text-sm"
                                    />
                                  </div>
                                  <input
                                    type="text"
                                    value={editForm.room || entry.room || ''}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, room: e.target.value }))}
                                    className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                                    placeholder="Room"
                                  />
                                </div>
                              ) : (
                                <div>
                                  <h3 className="text-lg font-medium text-gray-900">{entry.subjectName}</h3>
                                  <p className="text-sm text-gray-600">{entry.subjectCode}</p>
                                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                    <div className="flex items-center space-x-1">
                                      <ClockIcon className="w-4 h-4" />
                                      <span>
                                        {formatTime(entry.startTime)} - {formatTime(entry.endTime)} • {calculateDuration(entry.startTime, entry.endTime)}
                                      </span>
                                    </div>
                                    {entry.room && (
                                      <div className="flex items-center space-x-1">
                                        <MapPinIcon className="w-4 h-4" />
                                        <span>{entry.room}</span>
                                      </div>
                                    )}
                                    {entry.instructor && (
                                      <span>• {entry.instructor}</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-shrink-0 flex items-center space-x-2">
                              {editingEntry === entry.id ? (
                                <>
                                  <button
                                    onClick={() => handleUpdateEntry(entry.id)}
                                    className="p-1 text-green-600 hover:text-green-700 transition-colors duration-150"
                                  >
                                    <CheckIcon className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={cancelEditing}
                                    className="p-1 text-red-600 hover:text-red-700 transition-colors duration-150"
                                  >
                                    <XMarkIcon className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEditing(entry)}
                                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-150"
                                  >
                                    <PencilIcon className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEntry(entry.id)}
                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-150"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No classes scheduled for {day}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      <div className="md:hidden">
        <Navigation className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200" isMobile={true} />
      </div>
    </div>
  );
}
