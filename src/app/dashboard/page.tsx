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

  // Prepare chart data with better colors and formatting
  const chartData = subjectsWithAttendance.map((subject, index) => ({
    name: subject.name.length > 12 ? subject.name.substring(0, 12) + '...' : subject.name,
    fullName: subject.name,
    value: subject.actualAttendancePercentage,
    presentClasses: subject.presentClasses,
    totalClasses: subject.totalScheduledClasses,
    color: subject.actualAttendancePercentage >= 90 ? '#059669' : // Emerald-600
           subject.actualAttendancePercentage >= 75 ? '#10B981' : // Emerald-500  
           subject.actualAttendancePercentage >= 60 ? '#F59E0B' : // Amber-500
           subject.actualAttendancePercentage >= 40 ? '#EF4444' : // Red-500
           '#DC2626' // Red-600
  }));

  const COLORS = ['#059669', '#10B981', '#34D399', '#F59E0B', '#FBBF24', '#EF4444', '#DC2626', '#8B5CF6', '#A78BFA', '#06B6D4'];

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
        <header className="bg-white border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    {/* Left: Greeting Section */}
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
        Welcome back, {user.displayName?.split(' ')[0] || 'Student'}!
      </h1>
      <p className="text-sm sm:text-base text-gray-600">
        Here's your attendance overview for today
      </p>
    </div>

    {/* Right: Action Buttons */}
    <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 md:items-center">
      <button 
        onClick={handleMarkPresence}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200"
      >
        <MapPinIcon className="w-5 h-5" />
        <span>Mark Presence</span>
      </button>

      <button 
        onClick={() => setShowAIPredictor(true)}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200"
      >
        <SparklesIcon className="w-5 h-5" />
        <span>AI Insights</span>
      </button>
    </div>
  </div>
</header>


        {/* Main Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 sm:pb-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <div className={`p-2 sm:p-3 rounded-lg ${stat.bgColor} mb-3 sm:mb-0 sm:mr-4`}>
                    <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.textColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{stat.name}</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Attendance Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Subject-wise Attendance</h2>
                <ChartBarIcon className="w-5 h-5 text-gray-400" />
              </div>
              {chartData.length > 0 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color}
                            style={{
                              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                            }}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload[0]) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                                <p className="font-semibold text-gray-900 text-sm">{data.fullName}</p>
                                <p className="text-sm text-gray-600">
                                  Attendance: <span className="font-medium">{data.value}%</span>
                                </p>
                                <p className="text-xs text-gray-500">
                                  {data.presentClasses} / {data.totalClasses} classes
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Custom Legend */}
                  <div className="grid grid-cols-1 gap-2 pt-4 border-t border-gray-100 max-h-32 overflow-y-auto">
                    {chartData.map((entry, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: entry.color }}
                        ></div>
                        <span className="text-sm text-gray-700 truncate flex-1" title={entry.fullName}>
                          {entry.name}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {entry.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Your Subjects</h2>
                <TrophyIcon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {subjectsWithAttendance.length > 0 ? (
                  subjectsWithAttendance
                    .sort((a, b) => b.actualAttendancePercentage - a.actualAttendancePercentage)
                    .map((subject, index) => {
                      const getSubjectColors = (percentage: number) => {
                        if (percentage >= 90) return {
                          dot: 'bg-emerald-500',
                          bg: 'bg-emerald-50',
                          border: 'border-emerald-200',
                          text: 'text-emerald-700',
                          percentage: 'text-emerald-800'
                        };
                        if (percentage >= 75) return {
                          dot: 'bg-green-500',
                          bg: 'bg-green-50',
                          border: 'border-green-200',
                          text: 'text-green-700',
                          percentage: 'text-green-800'
                        };
                        if (percentage >= 60) return {
                          dot: 'bg-amber-500',
                          bg: 'bg-amber-50',
                          border: 'border-amber-200',
                          text: 'text-amber-700',
                          percentage: 'text-amber-800'
                        };
                        if (percentage >= 40) return {
                          dot: 'bg-orange-500',
                          bg: 'bg-orange-50',
                          border: 'border-orange-200',
                          text: 'text-orange-700',
                          percentage: 'text-orange-800'
                        };
                        return {
                          dot: 'bg-red-500',
                          bg: 'bg-red-50',
                          border: 'border-red-200',
                          text: 'text-red-700',
                          percentage: 'text-red-800'
                        };
                      };
                      
                      const colors = getSubjectColors(subject.actualAttendancePercentage);
                      
                      return (
                        <div 
                          key={index} 
                          className={`p-3 sm:p-4 rounded-lg border transition-all duration-200 hover:shadow-sm ${colors.bg} ${colors.border}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${colors.dot}`}></div>
                              <div className="flex-1 min-w-0">
                                <span className={`font-medium ${colors.text} block truncate text-sm sm:text-base`}>
                                  {subject.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {subject.code || 'No code'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right ml-4 flex-shrink-0">
                              <div className={`text-base sm:text-lg font-bold ${colors.percentage}`}>
                                {subject.actualAttendancePercentage}%
                              </div>
                              <div className="text-xs text-gray-500">
                                {subject.presentClasses} / {subject.totalScheduledClasses}
                              </div>
                              {subject.actualAttendancePercentage < 75 && (
                                <div className="text-xs text-red-500 font-medium mt-1">
                                  At Risk
                                </div>
                              )}
                              {subject.actualAttendancePercentage >= 90 && (
                                <div className="text-xs text-emerald-600 font-medium mt-1">
                                  Excellent
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
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
          <div className="mt-6 sm:mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <button 
                onClick={() => router.push('/subjects')}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 p-3 sm:p-4 rounded-lg text-left transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <PlusIcon className="w-5 h-5 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-sm sm:text-base">Manage Subjects</div>
                    <div className="text-xs sm:text-sm text-indigo-600">Add or edit subjects</div>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => router.push('/calendar')}
                className="bg-green-50 hover:bg-green-100 text-green-700 p-3 sm:p-4 rounded-lg text-left transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <ClockIcon className="w-5 h-5 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-sm sm:text-base">Mark Attendance</div>
                    <div className="text-xs sm:text-sm text-green-600">Update today's attendance</div>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => setShowLocationPicker(true)}
                className="bg-purple-50 hover:bg-purple-100 text-purple-700 p-3 sm:p-4 rounded-lg text-left transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <MapPinIcon className="w-5 h-5 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-sm sm:text-base">Set College Location</div>
                    <div className="text-xs sm:text-sm text-purple-600">Configure campus area</div>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => setShowAIPredictor(true)}
                className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 p-3 sm:p-4 rounded-lg text-left transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <SparklesIcon className="w-5 h-5 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-sm sm:text-base">AI Predictions</div>
                    <div className="text-xs sm:text-sm text-yellow-600">Get attendance insights</div>
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
