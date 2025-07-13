// lib/attendanceService.ts
import { ref, push, set, remove, get, query, orderByChild, equalTo } from 'firebase/database';
import { database } from './firebase';
import { AttendanceEntry, AttendanceFormData, BulkAttendanceData } from '@/types/attendance';

// Firebase operations
export const addAttendanceToFirebase = async (userId: string, attendanceData: AttendanceFormData): Promise<AttendanceEntry> => {
  const attendanceRef = ref(database, `users/${userId}/attendance`);
  const newEntryRef = push(attendanceRef);
  
  const entry: AttendanceEntry = {
    id: newEntryRef.key!,
    userId,
    subjectId: attendanceData.subjectId,
    subjectName: '', // Will be populated from subject data
    subjectCode: '', // Will be populated from subject data
    date: attendanceData.date,
    status: attendanceData.status,
    ...(attendanceData.notes && { notes: attendanceData.notes }),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await set(newEntryRef, entry);
  return entry;
};

export const getAttendanceFromFirebase = async (userId: string, date?: string): Promise<AttendanceEntry[]> => {
  const attendanceRef = ref(database, `users/${userId}/attendance`);
  
  let attendanceQuery;
  if (date) {
    attendanceQuery = query(attendanceRef, orderByChild('date'), equalTo(date));
  } else {
    attendanceQuery = attendanceRef;
  }
  
  const snapshot = await get(attendanceQuery);
  
  if (snapshot.exists()) {
    const data = snapshot.val();
    return Object.values(data) as AttendanceEntry[];
  }
  
  return [];
};

export const updateAttendanceInFirebase = async (userId: string, entryId: string, updates: Partial<AttendanceEntry>): Promise<void> => {
  const entryRef = ref(database, `users/${userId}/attendance/${entryId}`);
  
  // Remove undefined values to avoid Firebase errors
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, value]) => value !== undefined)
  );
  
  const updatedData = {
    ...cleanUpdates,
    updatedAt: new Date().toISOString()
  };
  
  // Get current data first, then merge with updates
  const snapshot = await get(entryRef);
  if (snapshot.exists()) {
    const currentData = snapshot.val();
    await set(entryRef, { ...currentData, ...updatedData });
  } else {
    await set(entryRef, updatedData);
  }
};

export const deleteAttendanceFromFirebase = async (userId: string, entryId: string): Promise<void> => {
  const entryRef = ref(database, `users/${userId}/attendance/${entryId}`);
  await remove(entryRef);
};

// LocalStorage operations (fallback)
const STORAGE_KEY = 'attendify_attendance';

export const addAttendanceToLocalStorage = (attendanceData: AttendanceFormData): AttendanceEntry => {
  const entries = getAttendanceFromLocalStorage();
  const entry: AttendanceEntry = {
    id: Date.now().toString(),
    userId: 'local',
    subjectId: attendanceData.subjectId,
    subjectName: '',
    subjectCode: '',
    date: attendanceData.date,
    status: attendanceData.status,
    ...(attendanceData.notes && { notes: attendanceData.notes }),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  entries.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  return entry;
};

export const getAttendanceFromLocalStorage = (date?: string): AttendanceEntry[] => {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(STORAGE_KEY);
  const entries = stored ? JSON.parse(stored) : [];
  
  if (date) {
    return entries.filter((entry: AttendanceEntry) => entry.date === date);
  }
  
  return entries;
};

export const updateAttendanceInLocalStorage = (entryId: string, updates: Partial<AttendanceEntry>): void => {
  const entries = getAttendanceFromLocalStorage();
  const index = entries.findIndex(e => e.id === entryId);
  
  if (index !== -1) {
    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    entries[index] = { 
      ...entries[index], 
      ...cleanUpdates, 
      updatedAt: new Date().toISOString() 
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }
};

export const deleteAttendanceFromLocalStorage = (entryId: string): void => {
  const entries = getAttendanceFromLocalStorage();
  const filtered = entries.filter(e => e.id !== entryId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

// Unified API
export const addAttendance = async (userId: string | null, attendanceData: AttendanceFormData): Promise<AttendanceEntry> => {
  if (userId && database) {
    return await addAttendanceToFirebase(userId, attendanceData);
  } else {
    return addAttendanceToLocalStorage(attendanceData);
  }
};

export const getAttendance = async (userId: string | null, date?: string): Promise<AttendanceEntry[]> => {
  if (userId && database) {
    try {
      return await getAttendanceFromFirebase(userId, date);
    } catch (error) {
      console.warn('Firebase error, falling back to localStorage:', error);
      return getAttendanceFromLocalStorage(date);
    }
  } else {
    return getAttendanceFromLocalStorage(date);
  }
};

export const updateAttendance = async (userId: string | null, entryId: string, updates: Partial<AttendanceEntry>): Promise<void> => {
  if (userId && database) {
    try {
      await updateAttendanceInFirebase(userId, entryId, updates);
    } catch (error) {
      console.warn('Firebase error, falling back to localStorage:', error);
      updateAttendanceInLocalStorage(entryId, updates);
    }
  } else {
    updateAttendanceInLocalStorage(entryId, updates);
  }
};

export const deleteAttendance = async (userId: string | null, entryId: string): Promise<void> => {
  if (userId && database) {
    try {
      await deleteAttendanceFromFirebase(userId, entryId);
    } catch (error) {
      console.warn('Firebase error, falling back to localStorage:', error);
      deleteAttendanceFromLocalStorage(entryId);
    }
  } else {
    deleteAttendanceFromLocalStorage(entryId);
  }
};

// Bulk attendance operations
export const addBulkAttendance = async (userId: string | null, bulkData: BulkAttendanceData): Promise<AttendanceEntry[]> => {
  const entries: AttendanceEntry[] = [];
  
  for (const subjectId of bulkData.subjectIds) {
    const attendanceData: AttendanceFormData = {
      subjectId,
      date: bulkData.date,
      status: bulkData.status
    };
    
    const entry = await addAttendance(userId, attendanceData);
    entries.push(entry);
  }
  
  return entries;
};

// Utility functions
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
};

export const parseDate = (dateString: string): Date => {
  return new Date(dateString + 'T00:00:00');
};

export const getAttendanceStats = (entries: AttendanceEntry[]) => {
  const total = entries.length;
  const present = entries.filter(e => e.status === 'present').length;
  const absent = entries.filter(e => e.status === 'absent').length;
  const off = entries.filter(e => e.status === 'off').length;
  
  return {
    total,
    present,
    absent,
    off,
    attendancePercentage: total > 0 ? Math.round((present / (total - off)) * 100) : 0
  };
};
