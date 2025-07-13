'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import Navigation from '@/components/Navigation';
import { Toaster, toast } from 'react-hot-toast';
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  MinusCircleIcon
} from '@heroicons/react/24/outline';
import { Subject } from '@/types/subject';
import { TimetableEntry } from '@/types/timetable';
import { AttendanceEntry, AttendanceStatus, ATTENDANCE_COLORS, ATTENDANCE_LABELS } from '@/types/attendance';
import { getSubjects } from '@/lib/subjectService';
import { getTimetable, formatTime, calculateDuration } from '@/lib/timetableService';
import { getAttendance, addAttendance, updateAttendance, formatDate } from '@/lib/attendanceService';
import { useAttendanceContext } from '@/contexts/AttendanceContext';

export default function CalendarPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const { refreshData } = useAttendanceContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [attendanceEntries, setAttendanceEntries] = useState<AttendanceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDayModal, setShowDayModal] = useState(false);
  const [dayTimetable, setDayTimetable] = useState<TimetableEntry[]>([]);
  const [dayAttendance, setDayAttendance] = useState<AttendanceEntry[]>([]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
      const [subjectsData, timetableData, attendanceData] = await Promise.all([
        getSubjects(user?.uid || null),
        getTimetable(user?.uid || null),
        getAttendance(user?.uid || null)
      ]);
      setSubjects(subjectsData);
      setTimetableEntries(timetableData);
      setAttendanceEntries(attendanceData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const getDayOfWeek = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  const getDateString = (date: Date) => {
    return formatDate(date);
  };

  const getTimetableForDate = (date: Date) => {
    const dayName = getDayOfWeek(date);
    return timetableEntries.filter(entry => entry.day === dayName);
  };

  const getAttendanceForDate = (date: Date) => {
    const dateString = getDateString(date);
    return attendanceEntries.filter(entry => entry.date === dateString);
  };

  const hasEventsOnDate = (date: Date) => {
    const timetable = getTimetableForDate(date);
    return timetable.length > 0;
  };

  const getAttendanceStatusForDate = (date: Date) => {
    const attendance = getAttendanceForDate(date);
    const timetable = getTimetableForDate(date);
    
    if (timetable.length === 0) return null;
    if (attendance.length === 0) return 'unmarked';
    
    const hasPresent = attendance.some(a => a.status === 'present');
    const hasAbsent = attendance.some(a => a.status === 'absent');
    const allOff = attendance.every(a => a.status === 'off');
    
    if (allOff) return 'off';
    if (hasAbsent) return 'partial';
    if (hasPresent) return 'present';
    return 'unmarked';
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const timetable = getTimetableForDate(date);
    const attendance = getAttendanceForDate(date);
    setDayTimetable(timetable);
    setDayAttendance(attendance);
    setShowDayModal(true);
  };

  const handleBulkAttendanceForDay = async (date: Date, status: AttendanceStatus) => {
    try {
      const dateString = getDateString(date);
      const timetable = getTimetableForDate(date);
      const attendance = getAttendanceForDate(date);
      
      if (timetable.length === 0) {
        toast.error('No classes scheduled for this day');
        return;
      }

      const subjectIds = timetable.map(t => t.subjectId);
      
      // Update existing attendance
      for (const entry of attendance) {
        await updateAttendance(user?.uid || null, entry.id, { status });
      }
      
      // Add attendance for subjects not yet marked
      const markedSubjects = attendance.map(a => a.subjectId);
      const unmarkedSubjects = subjectIds.filter(id => !markedSubjects.includes(id));
      
      for (const subjectId of unmarkedSubjects) {
        const subject = subjects.find(s => s.id === subjectId);
        if (subject) {
          const newEntry = await addAttendance(user?.uid || null, {
            subjectId,
            date: dateString,
            status
          });
          
          newEntry.subjectName = subject.name;
          newEntry.subjectCode = subject.code;
          setAttendanceEntries(prev => [...prev, newEntry]);
        }
      }
      
      // Refresh attendance data
      const updatedAttendance = await getAttendance(user?.uid || null);
      setAttendanceEntries(updatedAttendance);
      
      // Refresh global attendance data
      refreshData();
      
      toast.success(`All classes for ${date.toLocaleDateString()} marked as ${ATTENDANCE_LABELS[status].toLowerCase()}`);
    } catch (error) {
      console.error('Error updating bulk attendance:', error);
      toast.error('Failed to update attendance');
    }
  };

  const handleBulkAttendance = async (status: AttendanceStatus) => {
    if (!selectedDate) return;
    
    try {
      const dateString = getDateString(selectedDate);
      const subjectIds = dayTimetable.map(t => t.subjectId);
      
      // Update existing attendance for this date
      const existingAttendance = dayAttendance;
      for (const entry of existingAttendance) {
        await updateAttendance(user?.uid || null, entry.id, { status });
      }
      
      // Add attendance for subjects not yet marked
      const markedSubjects = existingAttendance.map(a => a.subjectId);
      const unmarkedSubjects = subjectIds.filter(id => !markedSubjects.includes(id));
      
      for (const subjectId of unmarkedSubjects) {
        const subject = subjects.find(s => s.id === subjectId);
        if (subject) {
          const newEntry = await addAttendance(user?.uid || null, {
            subjectId,
            date: dateString,
            status
          });
          
          newEntry.subjectName = subject.name;
          newEntry.subjectCode = subject.code;
          setAttendanceEntries(prev => [...prev, newEntry]);
        }
      }
      
      // Update local state
      const updatedAttendance = await getAttendance(user?.uid || null, dateString);
      setDayAttendance(updatedAttendance);
      
      // Refresh global attendance data
      refreshData();
      
      toast.success(`All classes marked as ${ATTENDANCE_LABELS[status].toLowerCase()}`);
    } catch (error) {
      console.error('Error updating bulk attendance:', error);
      toast.error('Failed to update attendance');
    }
  };

  const handleIndividualAttendance = async (subjectId: string, status: AttendanceStatus, date?: Date) => {
    const targetDate = date || selectedDate || new Date();
    
    try {
      const dateString = getDateString(targetDate);
      const targetAttendance = date ? getAttendanceForDate(date) : dayAttendance;
      const existingEntry = targetAttendance.find(a => a.subjectId === subjectId);
      
      if (existingEntry) {
        await updateAttendance(user?.uid || null, existingEntry.id, { status });
        
        if (date) {
          // Update global attendance entries
          setAttendanceEntries(prev => prev.map(a => 
            a.id === existingEntry.id ? { ...a, status } : a
          ));
        } else {
          // Update both day and global attendance
          setDayAttendance(prev => prev.map(a => 
            a.id === existingEntry.id ? { ...a, status } : a
          ));
          setAttendanceEntries(prev => prev.map(a => 
            a.id === existingEntry.id ? { ...a, status } : a
          ));
        }
      } else {
        const subject = subjects.find(s => s.id === subjectId);
        if (subject) {
          const newEntry = await addAttendance(user?.uid || null, {
            subjectId,
            date: dateString,
            status
          });
          
          newEntry.subjectName = subject.name;
          newEntry.subjectCode = subject.code;
          
          if (date) {
            setAttendanceEntries(prev => [...prev, newEntry]);
          } else {
            setDayAttendance(prev => [...prev, newEntry]);
            setAttendanceEntries(prev => [...prev, newEntry]);
          }
        }
      }
      
      // Refresh global attendance data
      refreshData();
      
      toast.success('Attendance updated');
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('Failed to update attendance');
    }
  };

  const renderCurrentMonthCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-3"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const hasEvents = hasEventsOnDate(date);
      const attendanceStatus = getAttendanceStatusForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      
      let dayClasses = 'p-3 text-center text-sm rounded-lg cursor-pointer transition-all duration-200 relative min-h-[3rem] flex flex-col items-center justify-center ';
      
      if (isToday) {
        dayClasses += 'bg-indigo-600 text-white font-semibold ';
      } else {
        dayClasses += 'hover:bg-gray-100 ';
      }
      
      days.push(
        <div
          key={day}
          className={dayClasses}
          onClick={() => handleDateClick(date)}
        >
          <span className="mb-1">{day}</span>
          {hasEvents && (
            <div className="flex justify-center space-x-1">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              {attendanceStatus && attendanceStatus !== 'unmarked' && (
                <div className={`w-1.5 h-1.5 rounded-full ${
                  attendanceStatus === 'present' ? 'bg-green-500' :
                  attendanceStatus === 'partial' ? 'bg-yellow-500' :
                  attendanceStatus === 'off' ? 'bg-gray-500' : 'bg-red-500'
                }`}></div>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map(day => (
            <div key={day} className="p-2 text-sm font-medium text-gray-500 text-center">
              {day}
            </div>
          ))}
          {days}
        </div>
      </div>
    );
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
              <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
              <p className="text-gray-600">View your monthly schedule and mark attendance</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <span className="text-lg font-semibold text-gray-900 min-w-[8rem] text-center">
                  {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                </span>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                Today
              </button>
              <CalendarDaysIcon className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="flex flex-col lg:flex-row h-full">
            {/* Main Calendar Area */}
            <div className="flex-1 p-6">
              {/* Legend */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Legend</h3>
                <div className="flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Classes Scheduled</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Present</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>Partial Attendance</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Absent</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <span>Holiday/Off</span>
                  </div>
                </div>
              </div>

              {/* Monthly Calendar */}
              {renderCurrentMonthCalendar()}
            </div>

            {/* Side Panel */}
            <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 bg-white p-6 overflow-y-auto">
              {/* Quick Actions for Today */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions for Today</h3>
                <p className="text-gray-600 text-sm mb-4">Mark attendance for all classes today</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2">
                  <button
                    onClick={() => handleBulkAttendanceForDay(new Date(), 'present')}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    <CheckCircleIcon className="w-5 h-5" />
                    <span>Mark All Present</span>
                  </button>
                  <button
                    onClick={() => handleBulkAttendanceForDay(new Date(), 'absent')}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    <XCircleIcon className="w-5 h-5" />
                    <span>Mark All Absent</span>
                  </button>
                  <button
                    onClick={() => handleBulkAttendanceForDay(new Date(), 'off')}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    <MinusCircleIcon className="w-5 h-5" />
                    <span>Mark All Off/Holiday</span>
                  </button>
                </div>
              </div>

              {/* Today's Schedule */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Schedule</h3>
                {(() => {
                  const todayTimetable = getTimetableForDate(new Date());
                  const todayAttendance = getAttendanceForDate(new Date());
                  
                  return todayTimetable.length === 0 ? (
                    <div className="text-center py-8">
                      <CalendarDaysIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No classes scheduled for today</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {todayTimetable.map((timetableEntry) => {
                        const attendance = todayAttendance.find(a => a.subjectId === timetableEntry.subjectId);
                        const currentStatus = attendance?.status;
                        
                        return (
                          <div key={timetableEntry.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                              <div>
                                <h4 className="font-medium text-gray-900">{timetableEntry.subjectName}</h4>
                                <p className="text-sm text-gray-600">{timetableEntry.subjectCode}</p>
                              </div>
                              <div className="text-left sm:text-right text-sm text-gray-600">
                                <div className="flex items-center space-x-1">
                                  <ClockIcon className="w-4 h-4" />
                                  <span>
                                    {formatTime(timetableEntry.startTime)} - {formatTime(timetableEntry.endTime)}
                                  </span>
                                </div>
                                {timetableEntry.room && (
                                  <div className="text-xs text-gray-500">{timetableEntry.room}</div>
                                )}
                              </div>
                            </div>

                            {/* Status Display */}
                            {currentStatus && (
                              <div className="mb-3">
                                <span 
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${ATTENDANCE_COLORS[currentStatus]}`}
                                >
                                  {ATTENDANCE_LABELS[currentStatus]}
                                </span>
                              </div>
                            )}

                            {/* Individual Actions */}
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleIndividualAttendance(timetableEntry.subjectId, 'present', new Date())}
                                className={`flex-1 px-3 py-2 text-xs font-medium rounded transition-colors ${
                                  currentStatus === 'present' 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-green-100 hover:bg-green-200 text-green-700'
                                }`}
                              >
                                P
                              </button>
                              <button
                                onClick={() => handleIndividualAttendance(timetableEntry.subjectId, 'absent', new Date())}
                                className={`flex-1 px-3 py-2 text-xs font-medium rounded transition-colors ${
                                  currentStatus === 'absent' 
                                    ? 'bg-red-500 text-white' 
                                    : 'bg-red-100 hover:bg-red-200 text-red-700'
                                }`}
                              >
                                A
                              </button>
                              <button
                                onClick={() => handleIndividualAttendance(timetableEntry.subjectId, 'off', new Date())}
                                className={`flex-1 px-3 py-2 text-xs font-medium rounded transition-colors ${
                                  currentStatus === 'off' 
                                    ? 'bg-gray-500 text-white' 
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }`}
                              >
                                O
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Day Modal */}
      {showDayModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h2>
                <p className="text-gray-600">
                  {dayTimetable.length} {dayTimetable.length === 1 ? 'class' : 'classes'} scheduled
                </p>
              </div>
              <button
                onClick={() => setShowDayModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {dayTimetable.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarDaysIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No classes scheduled for this day</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Bulk Actions */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Mark All As:</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleBulkAttendance('present')}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm transition-colors"
                      >
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>Present</span>
                      </button>
                      <button
                        onClick={() => handleBulkAttendance('absent')}
                        className="flex items-center space-x-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm transition-colors"
                      >
                        <XCircleIcon className="w-4 h-4" />
                        <span>Absent</span>
                      </button>
                      <button
                        onClick={() => handleBulkAttendance('off')}
                        className="flex items-center space-x-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
                      >
                        <MinusCircleIcon className="w-4 h-4" />
                        <span>Off/Holiday</span>
                      </button>
                    </div>
                  </div>

                  {/* Individual Classes */}
                  <div className="space-y-3">
                    {dayTimetable.map((timetableEntry) => {
                      const attendance = dayAttendance.find(a => a.subjectId === timetableEntry.subjectId);
                      const currentStatus = attendance?.status;
                      
                      return (
                        <div key={timetableEntry.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-gray-900">{timetableEntry.subjectName}</h4>
                              <p className="text-sm text-gray-600">{timetableEntry.subjectCode}</p>
                            </div>
                            <div className="text-right text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <ClockIcon className="w-4 h-4" />
                                <span>
                                  {formatTime(timetableEntry.startTime)} - {formatTime(timetableEntry.endTime)}
                                </span>
                              </div>
                              <div>{calculateDuration(timetableEntry.startTime, timetableEntry.endTime)}</div>
                              {timetableEntry.room && (
                                <div className="text-xs text-gray-500">{timetableEntry.room}</div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleIndividualAttendance(timetableEntry.subjectId, 'present')}
                                className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                                  currentStatus === 'present' 
                                    ? 'bg-green-600 text-white' 
                                    : 'bg-green-100 hover:bg-green-200 text-green-700'
                                }`}
                              >
                                <CheckCircleIcon className="w-3 h-3" />
                                <span>Present</span>
                              </button>
                              <button
                                onClick={() => handleIndividualAttendance(timetableEntry.subjectId, 'absent')}
                                className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                                  currentStatus === 'absent' 
                                    ? 'bg-red-600 text-white' 
                                    : 'bg-red-100 hover:bg-red-200 text-red-700'
                                }`}
                              >
                                <XCircleIcon className="w-3 h-3" />
                                <span>Absent</span>
                              </button>
                              <button
                                onClick={() => handleIndividualAttendance(timetableEntry.subjectId, 'off')}
                                className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                                  currentStatus === 'off' 
                                    ? 'bg-gray-600 text-white' 
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }`}
                              >
                                <MinusCircleIcon className="w-3 h-3" />
                                <span>Off</span>
                              </button>
                            </div>
                            
                            {currentStatus && (
                              <div className={`px-2 py-1 rounded-full text-xs font-medium border ${ATTENDANCE_COLORS[currentStatus]}`}>
                                {ATTENDANCE_LABELS[currentStatus]}
                              </div>
                            )}
                          </div>

                          {attendance?.notes && (
                            <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded p-2">
                              <strong>Notes:</strong> {attendance.notes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="md:hidden">
        <Navigation className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200" isMobile={true} />
      </div>
    </div>
  );
}
