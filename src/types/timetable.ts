// types/timetable.ts
export interface TimetableEntry {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  room?: string;
  instructor?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface TimetableFormData {
  subjectId: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  room?: string;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00'
];
