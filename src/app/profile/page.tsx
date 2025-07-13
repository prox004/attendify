'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import Navigation from '@/components/Navigation';
import { toast, Toaster } from 'react-hot-toast';
import {
  UserCircleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  CameraIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';

interface UserProfile {
  name: string;
  degree: string;
  fieldOfStudy: string;
  year: string;
  college: string;
  rollNumber: string;
}

export default function ProfilePage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    degree: '',
    fieldOfStudy: '',
    year: '',
    college: '',
    rollNumber: ''
  });

  const [editedProfile, setEditedProfile] = useState<UserProfile>({
    name: '',
    degree: '',
    fieldOfStudy: '',
    year: '',
    college: '',
    rollNumber: ''
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/onboarding');
    }
  }, [user, loading, router]);

  // Load profile data
  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      const loadProfile = () => {
        try {
          const savedProfile = localStorage.getItem(`attendify_profile_${user.uid}`);
          if (savedProfile) {
            const parsedProfile = JSON.parse(savedProfile);
            setProfile(parsedProfile);
            setEditedProfile(parsedProfile);
          } else {
            // Initialize with user's display name if available
            const initialProfile = {
              name: user.displayName || '',
              degree: '',
              fieldOfStudy: '',
              year: '',
              college: '',
              rollNumber: ''
            };
            setProfile(initialProfile);
            setEditedProfile(initialProfile);
          }
        } catch (error) {
          console.error('Error loading profile:', error);
          toast.error('Failed to load profile data');
        }
      };

      loadProfile();
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem(`attendify_profile_${user.uid}`, JSON.stringify(editedProfile));
      
      setProfile(editedProfile);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) return null;

  const yearOptions = [
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year',
    '5th Year',
    'Graduate',
    'Post Graduate'
  ];

  const degreeOptions = [
    'Bachelor of Technology (B.Tech)',
    'Bachelor of Engineering (B.E.)',
    'Bachelor of Science (B.Sc.)',
    'Bachelor of Computer Applications (BCA)',
    'Bachelor of Business Administration (BBA)',
    'Master of Technology (M.Tech)',
    'Master of Engineering (M.E.)',
    'Master of Science (M.Sc.)',
    'Master of Computer Applications (MCA)',
    'Master of Business Administration (MBA)',
    'Bachelor of Medicine (MBBS)',
    'Bachelor of Dental Surgery (BDS)',
    'Bachelor of Laws (LLB)',
    'Other'
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Toaster position="top-right" />
      
      {/* Sidebar Navigation - Hidden on mobile */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <Navigation />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Profile</h1>
              <p className="text-gray-600 text-sm sm:text-base">Manage your personal information</p>
            </div>
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200"
                >
                  <PencilIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCancel}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg flex items-center space-x-1 transition-all duration-200"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Cancel</span>
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center space-x-1 transition-all duration-200 disabled:opacity-50"
                  >
                    <CheckIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 sm:pb-6">
          {/* Profile Picture Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="relative">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-indigo-100 rounded-full flex items-center justify-center">
                    <UserCircleIcon className="w-12 h-12 sm:w-14 sm:h-14 text-indigo-600" />
                  </div>
                )}
                <button className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors">
                  <CameraIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="text-center sm:text-left flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {profile.name || user.displayName || 'User'}
                </h2>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {profile.degree && profile.fieldOfStudy 
                    ? `${profile.degree} in ${profile.fieldOfStudy}`
                    : 'Complete your profile to see your academic info'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
            <div className="flex items-center space-x-2 mb-6">
              <UserCircleIcon className="w-6 h-6 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-lg">
                    {profile.name || 'Not specified'}
                  </p>
                )}
              </div>

              {/* Roll Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Roll Number
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.rollNumber}
                    onChange={(e) => handleInputChange('rollNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter your roll number"
                  />
                ) : (
                  <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-lg">
                    {profile.rollNumber || 'Not specified'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
            <div className="flex items-center space-x-2 mb-6">
              <AcademicCapIcon className="w-6 h-6 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Academic Information</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Degree */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Degree
                </label>
                {isEditing ? (
                  <select
                    value={editedProfile.degree}
                    onChange={(e) => handleInputChange('degree', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select your degree</option>
                    {degreeOptions.map(degree => (
                      <option key={degree} value={degree}>{degree}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-lg">
                    {profile.degree || 'Not specified'}
                  </p>
                )}
              </div>

              {/* Field of Study */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Field of Study
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.fieldOfStudy}
                    onChange={(e) => handleInputChange('fieldOfStudy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Computer Science, Mechanical Engineering"
                  />
                ) : (
                  <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-lg">
                    {profile.fieldOfStudy || 'Not specified'}
                  </p>
                )}
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Year
                </label>
                {isEditing ? (
                  <select
                    value={editedProfile.year}
                    onChange={(e) => handleInputChange('year', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select your year</option>
                    {yearOptions.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-lg">
                    {profile.year || 'Not specified'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Institution Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center space-x-2 mb-6">
              <BuildingOfficeIcon className="w-6 h-6 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Institution Information</h3>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                College/University
              </label>
              {isEditing ? (
                <textarea
                  value={editedProfile.college}
                  onChange={(e) => handleInputChange('college', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="Enter your college or university name and address"
                />
              ) : (
                <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-lg min-h-[80px]">
                  {profile.college || 'Not specified'}
                </p>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <Navigation className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200" isMobile={true} />
      </div>
    </div>
  );
}
