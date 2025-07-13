'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import Navigation from '@/components/Navigation';
import { useAttendanceContext } from '@/contexts/AttendanceContext';
import { Toaster, toast } from 'react-hot-toast';
import {
  AcademicCapIcon,
  ChartBarIcon,
  ClockIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  MapPinIcon,
  BellIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  MinusCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatTime } from '@/lib/timetableService';
import { addAttendance, formatDate } from '@/lib/attendanceService';
import { AttendanceStatus } from '@/types/attendance';
import LocationPicker from '@/components/LocationPicker';
import AIPredictorModal from '@/components/AIPredictorModal';
import { CollegeLocation } from '@/lib/locationService';

export default function DashboardPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const { subjectsWithAttendance, timetableEntries, isLoading: attendanceLoading } = useAttendanceContext();
  
  // State for features
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showAIPredictor, setShowAIPredictor] = useState(false);
  const [showClassPrompt, setShowClassPrompt] = useState(false);
  const [currentClass, setCurrentClass] = useState<any>(null);
  const [collegeLocation, setCollegeLocation] = useState<CollegeLocation | null>(null);
  const [campusPresence, setCampusPresence] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/onboarding');
    }
  }, [user, loading, router]);

  // Load college location and campus presence
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const { getCollegeLocation, getCampusPresencePercentage } = require('@/lib/locationService');
      const location = getCollegeLocation();
      setCollegeLocation(location);
      
      if (user) {
        const presence = getCampusPresencePercentage(user.uid);
        setCampusPresence(presence);
      }
    }
  }, [user]);

  // Check for current class
  useEffect(() => {
    const checkCurrentClass = () => {
      if (!timetableEntries.length) return;
      
      const now = new Date();
      const currentDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      
      const todayClasses = timetableEntries.filter(entry => entry.day === currentDay);
      
      for (const classEntry of todayClasses) {
        const startTime = classEntry.startTime;
        const endTime = classEntry.endTime;
        
        if (currentTime >= startTime && currentTime <= endTime) {
          setCurrentClass(classEntry);
          setShowClassPrompt(true);
          break;
        }
      }
    };

    checkCurrentClass();
    // Check every minute
    const interval = setInterval(checkCurrentClass, 60000);
    return () => clearInterval(interval);
  }, [timetableEntries]);

  const handleClassAttendance = async (status: AttendanceStatus) => {
    if (!currentClass || !user) return;
    
    try {
      await addAttendance(user.uid, {
        subjectId: currentClass.subjectId,
        date: formatDate(new Date()),
        status
      });
      
      toast.success(`Attendance marked as ${status}`);
      setShowClassPrompt(false);
      setCurrentClass(null);
    } catch (error) {
      toast.error('Failed to mark attendance');
    }
  };

  const handleMarkPresence = async () => {
    if (!user) return;
    
    try {
      const { markPresence } = require('@/lib/locationService');
      await markPresence(user.uid);
      
      // Update campus presence
      const { getCampusPresencePercentage } = require('@/lib/locationService');
      const newPresence = getCampusPresencePercentage(user.uid);
      setCampusPresence(newPresence);
      
      toast.success('Campus presence marked!');
    } catch (error) {
      toast.error('Failed to mark presence: ' + (error as Error).message);
    }
  };

  if (loading || attendanceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Calculate real statistics
  const totalSubjects = subjectsWithAttendance.length;
  const averageAttendance = totalSubjects > 0 
    ? Math.round(subjectsWithAttendance.reduce((sum, subject) => sum + subject.actualAttendancePercentage, 0) / totalSubjects)
    : 0;
  
  // Calculate classes this week (Monday to Sunday)
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() - now.getDay() + 7); // Sunday
  
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const thisWeekClasses = timetableEntries.filter(entry => weekDays.includes(entry.day)).length;
  
  const bestSubject = subjectsWithAttendance.length > 0 
    ? subjectsWithAttendance.reduce((best, current) => 
        current.actualAttendancePercentage > best.actualAttendancePercentage ? current : best
      )
    : null;
  
  const atRiskSubjects = subjectsWithAttendance.filter(subject => subject.actualAttendancePercentage < 75).length;

  // Stats for dashboard cards
  const stats = [
    {
      name: 'Overall Attendance',
      value: `${averageAttendance}%`,
      icon: AcademicCapIcon,
      color: 'bg-green-500',
      textColor: averageAttendance >= 75 ? 'text-green-600' : 'text-red-600',
      bgColor: averageAttendance >= 75 ? 'bg-green-50' : 'bg-red-50'
    },
    {
      name: 'Campus Presence',
      value: `${campusPresence}%`,
      icon: MapPinIcon,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      name: 'Classes This Week',
      value: thisWeekClasses.toString(),
      icon: ClockIcon,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      name: 'At Risk Subjects',
      value: atRiskSubjects.toString(),
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  // Prepare chart data
  const chartData = subjectsWithAttendance.map(subject => ({
    name: subject.name,
    value: subject.actualAttendancePercentage,
    color: subject.actualAttendancePercentage >= 75 ? '#10B981' : subject.actualAttendancePercentage >= 60 ? '#F59E0B' : '#EF4444'
  }));

  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Toaster position="top-right" />
      
      {/* Class Attendance Prompt */}
      {showClassPrompt && currentClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <BellIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Class in Progress</h3>
                  <p className="text-gray-600">{currentClass.subjectName}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <ClockIcon className="w-4 h-4" />
                  <span>{formatTime(currentClass.startTime)} - {formatTime(currentClass.endTime)}</span>
                </div>
                {currentClass.room && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                    <MapPinIcon className="w-4 h-4" />
                    <span>{currentClass.room}</span>
                  </div>
                )}
              </div>
              
              <p className="text-gray-700 mb-6 text-center">Are you attending this class?</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleClassAttendance('present')}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  <span>Present</span>
                </button>
                <button
                  onClick={() => handleClassAttendance('absent')}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                >
                  <XCircleIcon className="w-5 h-5" />
                  <span>Absent</span>
                </button>
                <button
                  onClick={() => handleClassAttendance('off')}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  <MinusCircleIcon className="w-5 h-5" />
                  <span>Holiday/Off</span>
                </button>
              </div>
              
              <button
                onClick={() => setShowClassPrompt(false)}
                className="w-full mt-4 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Remind me later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <Navigation />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user.displayName?.split(' ')[0] || 'Student'}!
              </h1>
              <p className="text-gray-600">
                Here's your attendance overview for today
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleMarkPresence}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200"
              >
                <MapPinIcon className="w-5 h-5" />
                <span>Mark Presence</span>
              </button>
              <button 
                onClick={() => setShowAIPredictor(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200"
              >
                <SparklesIcon className="w-5 h-5" />
                <span>AI Insights</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Attendance Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Subject-wise Attendance</h2>
                <ChartBarIcon className="w-5 h-5 text-gray-400" />
              </div>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Attendance']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8">
                  <ChartBarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No attendance data available</p>
                  <button
                    onClick={() => router.push('/subjects')}
                    className="mt-2 text-indigo-600 hover:text-indigo-700"
                  >
                    Add subjects to get started
                  </button>
                </div>
              )}
            </div>

            {/* Subject List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Your Subjects</h2>
                <TrophyIcon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                {subjectsWithAttendance.length > 0 ? (
                  subjectsWithAttendance
                    .sort((a, b) => b.actualAttendancePercentage - a.actualAttendancePercentage)
                    .map((subject, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            subject.actualAttendancePercentage >= 75 ? 'bg-green-500' :
                            subject.actualAttendancePercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <span className="font-medium text-gray-900">{subject.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {subject.actualAttendancePercentage}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {subject.presentClasses} / {subject.totalScheduledClasses} classes
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8">
                    <AcademicCapIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No subjects added yet</p>
                    <button
                      onClick={() => router.push('/subjects')}
                      className="mt-2 text-indigo-600 hover:text-indigo-700"
                    >
                      Add your first subject
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                onClick={() => router.push('/subjects')}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 p-4 rounded-lg text-left transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <PlusIcon className="w-5 h-5" />
                  <div>
                    <div className="font-medium">Manage Subjects</div>
                    <div className="text-sm text-indigo-600">Add or edit subjects</div>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => router.push('/calendar')}
                className="bg-green-50 hover:bg-green-100 text-green-700 p-4 rounded-lg text-left transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <ClockIcon className="w-5 h-5" />
                  <div>
                    <div className="font-medium">Mark Attendance</div>
                    <div className="text-sm text-green-600">Update today's attendance</div>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => setShowLocationPicker(true)}
                className="bg-purple-50 hover:bg-purple-100 text-purple-700 p-4 rounded-lg text-left transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <MapPinIcon className="w-5 h-5" />
                  <div>
                    <div className="font-medium">Set College Location</div>
                    <div className="text-sm text-purple-600">Configure campus area</div>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => setShowAIPredictor(true)}
                className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 p-4 rounded-lg text-left transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <SparklesIcon className="w-5 h-5" />
                  <div>
                    <div className="font-medium">AI Predictions</div>
                    <div className="text-sm text-yellow-600">Get attendance insights</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <Navigation className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200" isMobile={true} />
      </div>

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <LocationPicker
          isOpen={showLocationPicker}
          onClose={() => setShowLocationPicker(false)}
          onSave={(location: CollegeLocation) => {
            setCollegeLocation(location);
            setShowLocationPicker(false);
          }}
        />
      )}

      {/* AI Predictor Modal */}
      {showAIPredictor && (
        <AIPredictorModal
          isOpen={showAIPredictor}
          onClose={() => setShowAIPredictor(false)}
          subjects={subjectsWithAttendance}
        />
      )}
    </div>
  );
}
