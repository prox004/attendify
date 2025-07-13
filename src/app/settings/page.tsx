'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { signOut } from '@/lib/auth';
import Navigation from '@/components/Navigation';
import {
  Cog6ToothIcon,
  UserCircleIcon,
  BellIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon,
  MoonIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/onboarding');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/onboarding');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const settingsGroups = [
    {
      title: 'Account',
      settings: [
        {
          name: 'Profile',
          description: 'Manage your account information',
          icon: UserCircleIcon,
          action: () => console.log('Profile settings')
        },
        {
          name: 'Notifications',
          description: 'Configure notification preferences',
          icon: BellIcon,
          action: () => console.log('Notification settings')
        }
      ]
    },
    {
      title: 'Preferences',
      settings: [
        {
          name: 'Theme',
          description: 'Choose your preferred theme',
          icon: MoonIcon,
          action: () => console.log('Theme settings')
        },
        {
          name: 'Language',
          description: 'Select your language',
          icon: GlobeAltIcon,
          action: () => console.log('Language settings')
        }
      ]
    },
    {
      title: 'Security & Privacy',
      settings: [
        {
          name: 'Privacy Settings',
          description: 'Control your privacy preferences',
          icon: ShieldCheckIcon,
          action: () => console.log('Privacy settings')
        }
      ]
    },
    {
      title: 'Support',
      settings: [
        {
          name: 'Help & Support',
          description: 'Get help and contact support',
          icon: InformationCircleIcon,
          action: () => console.log('Help settings')
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="hidden md:flex md:w-64 md:flex-col">
        <Navigation />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Manage your preferences and account</p>
            </div>
            <Cog6ToothIcon className="w-8 h-8 text-indigo-600" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {/* User Profile Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center space-x-4">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                  <UserCircleIcon className="w-10 h-10 text-indigo-600" />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">
                  {user.displayName || 'User'}
                </h2>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-sm text-gray-500">
                  Joined {new Date(user.metadata.creationTime || '').toLocaleDateString()}
                </p>
              </div>
              <button className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg transition-all duration-200">
                Edit Profile
              </button>
            </div>
          </div>

          {/* Settings Groups */}
          <div className="space-y-6">
            {settingsGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">{group.title}</h3>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {group.settings.map((setting, settingIndex) => (
                    <button
                      key={settingIndex}
                      onClick={setting.action}
                      className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-all duration-200 text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <setting.icon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{setting.name}</div>
                          <div className="text-sm text-gray-600">{setting.description}</div>
                        </div>
                      </div>
                      <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* App Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">App Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Version</span>
                <span className="text-gray-900">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Build</span>
                <span className="text-gray-900">2025.01.13</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Developer</span>
                <span className="text-gray-900">Attendify Team</span>
              </div>
            </div>
          </div>

          {/* Sign Out */}
          <div className="mt-8">
            <button
              onClick={handleSignOut}
              className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-medium py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </main>
      </div>

      <div className="md:hidden">
        <Navigation className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200" isMobile={true} />
      </div>
    </div>
  );
}
