// lib/subjectService.ts
import { ref, push, set, remove, get, child } from 'firebase/database';
import { database } from './firebase';
import { Subject, SubjectFormData } from '@/types/subject';

const COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
  'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500'
];

const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

const getAttendanceStatus = (percentage: number): Subject['status'] => {
  if (percentage >= 90) return 'excellent';
  if (percentage >= 80) return 'good';
  if (percentage >= 75) return 'warning';
  return 'critical';
};

// Firebase operations
export const addSubjectToFirebase = async (userId: string, subjectData: SubjectFormData): Promise<Subject> => {
  const subjectsRef = ref(database, `users/${userId}/subjects`);
  const newSubjectRef = push(subjectsRef);
  
  const subject: Subject = {
    id: newSubjectRef.key!,
    ...subjectData,
    totalClasses: 0,
    attendedClasses: 0,
    percentage: 0,
    status: 'good',
    color: getRandomColor(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId
  };

  await set(newSubjectRef, subject);
  return subject;
};

export const getSubjectsFromFirebase = async (userId: string): Promise<Subject[]> => {
  const subjectsRef = ref(database, `users/${userId}/subjects`);
  const snapshot = await get(subjectsRef);
  
  if (snapshot.exists()) {
    const data = snapshot.val();
    return Object.values(data) as Subject[];
  }
  
  return [];
};

export const updateSubjectInFirebase = async (userId: string, subjectId: string, updates: Partial<Subject>): Promise<void> => {
  const subjectRef = ref(database, `users/${userId}/subjects/${subjectId}`);
  const updatedData = {
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  // Calculate attendance status if percentage is being updated
  if (updates.totalClasses !== undefined || updates.attendedClasses !== undefined) {
    const currentSubject = await get(subjectRef);
    if (currentSubject.exists()) {
      const subject = currentSubject.val() as Subject;
      const totalClasses = updates.totalClasses ?? subject.totalClasses;
      const attendedClasses = updates.attendedClasses ?? subject.attendedClasses;
      const percentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;
      
      updatedData.percentage = percentage;
      updatedData.status = getAttendanceStatus(percentage);
    }
  }
  
  await set(subjectRef, { ...updates, ...updatedData });
};

export const deleteSubjectFromFirebase = async (userId: string, subjectId: string): Promise<void> => {
  const subjectRef = ref(database, `users/${userId}/subjects/${subjectId}`);
  await remove(subjectRef);
};

// LocalStorage operations (fallback)
const STORAGE_KEY = 'attendify_subjects';

export const addSubjectToLocalStorage = (subjectData: SubjectFormData): Subject => {
  const subjects = getSubjectsFromLocalStorage();
  const subject: Subject = {
    id: Date.now().toString(),
    ...subjectData,
    totalClasses: 0,
    attendedClasses: 0,
    percentage: 0,
    status: 'good',
    color: getRandomColor(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: 'local'
  };

  subjects.push(subject);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
  return subject;
};

export const getSubjectsFromLocalStorage = (): Subject[] => {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const updateSubjectInLocalStorage = (subjectId: string, updates: Partial<Subject>): void => {
  const subjects = getSubjectsFromLocalStorage();
  const index = subjects.findIndex(s => s.id === subjectId);
  
  if (index !== -1) {
    subjects[index] = { ...subjects[index], ...updates, updatedAt: new Date().toISOString() };
    
    // Calculate attendance status if percentage is being updated
    if (updates.totalClasses !== undefined || updates.attendedClasses !== undefined) {
      const subject = subjects[index];
      const percentage = subject.totalClasses > 0 ? Math.round((subject.attendedClasses / subject.totalClasses) * 100) : 0;
      subjects[index].percentage = percentage;
      subjects[index].status = getAttendanceStatus(percentage);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
  }
};

export const deleteSubjectFromLocalStorage = (subjectId: string): void => {
  const subjects = getSubjectsFromLocalStorage();
  const filtered = subjects.filter(s => s.id !== subjectId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

// Unified API
export const addSubject = async (userId: string | null, subjectData: SubjectFormData): Promise<Subject> => {
  if (userId && database) {
    return await addSubjectToFirebase(userId, subjectData);
  } else {
    return addSubjectToLocalStorage(subjectData);
  }
};

export const getSubjects = async (userId: string | null): Promise<Subject[]> => {
  if (userId && database) {
    try {
      return await getSubjectsFromFirebase(userId);
    } catch (error) {
      console.warn('Firebase error, falling back to localStorage:', error);
      return getSubjectsFromLocalStorage();
    }
  } else {
    return getSubjectsFromLocalStorage();
  }
};

export const updateSubject = async (userId: string | null, subjectId: string, updates: Partial<Subject>): Promise<void> => {
  if (userId && database) {
    try {
      await updateSubjectInFirebase(userId, subjectId, updates);
    } catch (error) {
      console.warn('Firebase error, falling back to localStorage:', error);
      updateSubjectInLocalStorage(subjectId, updates);
    }
  } else {
    updateSubjectInLocalStorage(subjectId, updates);
  }
};

export const deleteSubject = async (userId: string | null, subjectId: string): Promise<void> => {
  if (userId && database) {
    try {
      await deleteSubjectFromFirebase(userId, subjectId);
    } catch (error) {
      console.warn('Firebase error, falling back to localStorage:', error);
      deleteSubjectFromLocalStorage(subjectId);
    }
  } else {
    deleteSubjectFromLocalStorage(subjectId);
  }
};
