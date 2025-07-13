// contexts/AttendanceContext.tsx
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useAttendanceData, SubjectWithAttendance } from '@/hooks/useAttendanceData';
import { AttendanceEntry } from '@/types/attendance';
import { TimetableEntry } from '@/types/timetable';
import { Subject } from '@/types/subject';

interface AttendanceContextType {
  subjects: Subject[];
  subjectsWithAttendance: SubjectWithAttendance[];
  attendanceEntries: AttendanceEntry[];
  timetableEntries: TimetableEntry[];
  isLoading: boolean;
  lastUpdated: Date;
  refreshData: () => void;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const useAttendanceContext = () => {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error('useAttendanceContext must be used within an AttendanceProvider');
  }
  return context;
};

interface AttendanceProviderProps {
  children: ReactNode;
}

export const AttendanceProvider: React.FC<AttendanceProviderProps> = ({ children }) => {
  const [user] = useAuthState(auth);
  const attendanceData = useAttendanceData(user?.uid || null);

  return (
    <AttendanceContext.Provider value={attendanceData}>
      {children}
    </AttendanceContext.Provider>
  );
};
