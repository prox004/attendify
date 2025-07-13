'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { signInWithGoogle } from '@/lib/auth';
import { AcademicCapIcon } from '@heroicons/react/24/solid';

export default function OnboardingPage() {
  const [user, loading] = useAuthState(auth);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard if already logged in
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
      // The useEffect will handle the redirect
    } catch (error) {
      console.error('Sign in failed:', error);
      setIsSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AcademicCapIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendify</h1>
          <p className="text-gray-600">AI-Powered Attendance Tracker</p>
        </div>

        {/* Welcome Message */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Welcome to Smart Attendance Management
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Track your class attendance, get AI-powered insights, and never miss important classes again.
          </p>
        </div>

        {/* Features List */}
        <div className="mb-8 space-y-3 text-left">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-indigo-600 rounded-full mr-3"></div>
            <span className="text-sm text-gray-700">Track attendance by subject</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-indigo-600 rounded-full mr-3"></div>
            <span className="text-sm text-gray-700">AI-powered predictions</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-indigo-600 rounded-full mr-3"></div>
            <span className="text-sm text-gray-700">Visual analytics dashboard</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-indigo-600 rounded-full mr-3"></div>
            <span className="text-sm text-gray-700">Offline support</span>
          </div>
        </div>

        {/* Sign In Button */}
        <button
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200"
        >
          {isSigningIn ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 mt-4">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
