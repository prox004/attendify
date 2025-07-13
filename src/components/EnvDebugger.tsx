'use client';

import { useState } from 'react';

export default function EnvDebugger() {
  const [showDebug, setShowDebug] = useState(false);

  const envVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];

  const missingVars = envVars.filter(varName => !process.env[varName]);
  const hasAllVars = missingVars.length === 0;

  if (hasAllVars) {
    return null; // Don't show if everything is working
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-red-800 font-medium">Environment Setup Required</h3>
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="text-red-600 hover:text-red-800"
          >
            {showDebug ? 'Hide' : 'Debug'}
          </button>
        </div>
        
        <p className="text-red-700 text-sm mt-2">
          Missing Firebase configuration. Please restart your dev server.
        </p>

        {showDebug && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-red-800">Missing Variables:</h4>
            <ul className="text-xs text-red-700 space-y-1">
              {missingVars.map(varName => (
                <li key={varName} className="font-mono">❌ {varName}</li>
              ))}
            </ul>
            
            <div className="mt-3 text-xs text-red-600">
              <p className="font-medium">To fix:</p>
              <ol className="list-decimal list-inside space-y-1 mt-1">
                <li>Stop the dev server (Ctrl+C)</li>
                <li>Check .env.local exists in project root</li>
                <li>Restart: npm run dev</li>
                <li>Refresh this page</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
