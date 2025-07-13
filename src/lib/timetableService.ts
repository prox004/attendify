// lib/timetableService.ts
import { ref, push, set, remove, get, query, orderByChild, equalTo } from 'firebase/database';
import { database } from './firebase';
import { TimetableEntry, TimetableFormData } from '@/types/timetable';
import { Subject } from '@/types/subject';

// Firebase operations
export const addTimetableEntryToFirebase = async (userId: string, entryData: TimetableFormData, subject: Subject): Promise<TimetableEntry> => {
  const timetableRef = ref(database, `users/${userId}/timetable`);
  const newEntryRef = push(timetableRef);
  
  const entry: TimetableEntry = {
    id: newEntryRef.key!,
    subjectId: entryData.subjectId,
    subjectName: subject.name,
    subjectCode: subject.code,
    day: entryData.day,
    startTime: entryData.startTime,
    endTime: entryData.endTime,
    room: entryData.room,
    instructor: subject.instructor,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId
  };

  await set(newEntryRef, entry);
  return entry;
};

export const getTimetableFromFirebase = async (userId: string): Promise<TimetableEntry[]> => {
  const timetableRef = ref(database, `users/${userId}/timetable`);
  const snapshot = await get(timetableRef);
  
  if (snapshot.exists()) {
    const data = snapshot.val();
    return Object.values(data) as TimetableEntry[];
  }
  
  return [];
};

export const updateTimetableEntryInFirebase = async (userId: string, entryId: string, updates: Partial<TimetableEntry>): Promise<void> => {
  const entryRef = ref(database, `users/${userId}/timetable/${entryId}`);
  const updatedData = {
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  await set(entryRef, { ...updates, ...updatedData });
};

export const deleteTimetableEntryFromFirebase = async (userId: string, entryId: string): Promise<void> => {
  const entryRef = ref(database, `users/${userId}/timetable/${entryId}`);
  await remove(entryRef);
};

// LocalStorage operations (fallback)
const STORAGE_KEY = 'attendify_timetable';

export const addTimetableEntryToLocalStorage = (entryData: TimetableFormData, subject: Subject): TimetableEntry => {
  const entries = getTimetableFromLocalStorage();
  const entry: TimetableEntry = {
    id: Date.now().toString(),
    subjectId: entryData.subjectId,
    subjectName: subject.name,
    subjectCode: subject.code,
    day: entryData.day,
    startTime: entryData.startTime,
    endTime: entryData.endTime,
    room: entryData.room,
    instructor: subject.instructor,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: 'local'
  };

  entries.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  return entry;
};

export const getTimetableFromLocalStorage = (): TimetableEntry[] => {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const updateTimetableEntryInLocalStorage = (entryId: string, updates: Partial<TimetableEntry>): void => {
  const entries = getTimetableFromLocalStorage();
  const index = entries.findIndex(e => e.id === entryId);
  
  if (index !== -1) {
    entries[index] = { ...entries[index], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }
};

export const deleteTimetableEntryFromLocalStorage = (entryId: string): void => {
  const entries = getTimetableFromLocalStorage();
  const filtered = entries.filter(e => e.id !== entryId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

// Unified API
export const addTimetableEntry = async (userId: string | null, entryData: TimetableFormData, subject: Subject): Promise<TimetableEntry> => {
  if (userId && database) {
    return await addTimetableEntryToFirebase(userId, entryData, subject);
  } else {
    return addTimetableEntryToLocalStorage(entryData, subject);
  }
};

export const getTimetable = async (userId: string | null): Promise<TimetableEntry[]> => {
  if (userId && database) {
    try {
      return await getTimetableFromFirebase(userId);
    } catch (error) {
      console.warn('Firebase error, falling back to localStorage:', error);
      return getTimetableFromLocalStorage();
    }
  } else {
    return getTimetableFromLocalStorage();
  }
};

export const updateTimetableEntry = async (userId: string | null, entryId: string, updates: Partial<TimetableEntry>): Promise<void> => {
  if (userId && database) {
    try {
      await updateTimetableEntryInFirebase(userId, entryId, updates);
    } catch (error) {
      console.warn('Firebase error, falling back to localStorage:', error);
      updateTimetableEntryInLocalStorage(entryId, updates);
    }
  } else {
    updateTimetableEntryInLocalStorage(entryId, updates);
  }
};

export const deleteTimetableEntry = async (userId: string | null, entryId: string): Promise<void> => {
  if (userId && database) {
    try {
      await deleteTimetableEntryFromFirebase(userId, entryId);
    } catch (error) {
      console.warn('Firebase error, falling back to localStorage:', error);
      deleteTimetableEntryFromLocalStorage(entryId);
    }
  } else {
    deleteTimetableEntryFromLocalStorage(entryId);
  }
};

// Utility functions
export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export const calculateDuration = (startTime: string, endTime: string): string => {
  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);
  const diffMs = end.getTime() - start.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  if (diffHours < 1) {
    const diffMinutes = Math.round(diffHours * 60);
    return `${diffMinutes} min`;
  } else if (diffHours === 1) {
    return '1 hour';
  } else {
    return `${diffHours} hours`;
  }
};

export const checkTimeConflict = (entries: TimetableEntry[], newEntry: TimetableFormData): boolean => {
  const dayEntries = entries.filter(entry => entry.day === newEntry.day);
  
  for (const entry of dayEntries) {
    const existingStart = new Date(`2000-01-01T${entry.startTime}:00`);
    const existingEnd = new Date(`2000-01-01T${entry.endTime}:00`);
    const newStart = new Date(`2000-01-01T${newEntry.startTime}:00`);
    const newEnd = new Date(`2000-01-01T${newEntry.endTime}:00`);
    
    // Check for overlap
    if (
      (newStart >= existingStart && newStart < existingEnd) ||
      (newEnd > existingStart && newEnd <= existingEnd) ||
      (newStart <= existingStart && newEnd >= existingEnd)
    ) {
      return true;
    }
  }
  
  return false;
};
