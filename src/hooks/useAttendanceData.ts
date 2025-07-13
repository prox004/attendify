// hooks/useAttendanceData.ts
import { useState, useEffect, useCallback } from 'react';
import { Subject } from '@/types/subject';
import { AttendanceEntry } from '@/types/attendance';
import { TimetableEntry } from '@/types/timetable';
import { getSubjects } from '@/lib/subjectService';
import { getAttendance } from '@/lib/attendanceService';
import { getTimetable } from '@/lib/timetableService';

export interface SubjectWithAttendance extends Subject {
  attendanceEntries: AttendanceEntry[];
  totalScheduledClasses: number;
  presentClasses: number;
  absentClasses: number;
  offClasses: number;
  actualAttendancePercentage: number;
}

export const useAttendanceData = (userId: string | null) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsWithAttendance, setSubjectsWithAttendance] = useState<SubjectWithAttendance[]>([]);
  const [attendanceEntries, setAttendanceEntries] = useState<AttendanceEntry[]>([]);
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const calculateAttendanceStats = useCallback((
    subject: Subject,
    attendance: AttendanceEntry[],
    timetable: TimetableEntry[]
  ): SubjectWithAttendance => {
    const subjectAttendance = attendance.filter(entry => entry.subjectId === subject.id);
    const subjectTimetable = timetable.filter(entry => entry.subjectId === subject.id);
    
    // Calculate total scheduled classes based on timetable and time passed
    const currentDate = new Date();
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
    const daysDifference = Math.floor((currentDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    const weeksPassed = Math.floor(daysDifference / 7);
    
    const totalScheduledClasses = subjectTimetable.length * weeksPassed;
    
    const presentClasses = subjectAttendance.filter(entry => entry.status === 'present').length;
    const absentClasses = subjectAttendance.filter(entry => entry.status === 'absent').length;
    const offClasses = subjectAttendance.filter(entry => entry.status === 'off').length;
    
    // Calculate percentage excluding off days
    const totalAttendableClasses = totalScheduledClasses - offClasses;
    const actualAttendancePercentage = totalAttendableClasses > 0 
      ? Math.round((presentClasses / totalAttendableClasses) * 100) 
      : 0;

    return {
      ...subject,
      attendanceEntries: subjectAttendance,
      totalScheduledClasses,
      presentClasses,
      absentClasses,
      offClasses,
      actualAttendancePercentage,
      percentage: actualAttendancePercentage, // Update the main percentage field
      totalClasses: totalScheduledClasses,
      attendedClasses: presentClasses
    };
  }, []);

  const loadAllData = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const [subjectsData, attendanceData, timetableData] = await Promise.all([
        getSubjects(userId),
        getAttendance(userId),
        getTimetable(userId)
      ]);

      setSubjects(subjectsData);
      setAttendanceEntries(attendanceData);
      setTimetableEntries(timetableData);

      // Calculate attendance statistics for each subject
      const subjectsWithStats = subjectsData.map(subject =>
        calculateAttendanceStats(subject, attendanceData, timetableData)
      );

      setSubjectsWithAttendance(subjectsWithStats);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading attendance data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, calculateAttendanceStats]);

  const refreshData = useCallback(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    if (userId) {
      loadAllData();
    }
  }, [userId, loadAllData]);

  return {
    subjects,
    subjectsWithAttendance,
    attendanceEntries,
    timetableEntries,
    isLoading,
    lastUpdated,
    refreshData
  };
};
