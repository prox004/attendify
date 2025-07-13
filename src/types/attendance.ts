// types/attendance.ts
export interface AttendanceEntry {
  id: string;
  userId: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  date: string; // YYYY-MM-DD format
  status: AttendanceStatus;
  timetableEntryId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'off';

export interface DayAttendance {
  date: string;
  entries: AttendanceEntry[];
  timetableEntries: any[]; // Will be populated from timetable data
}

export interface AttendanceFormData {
  subjectId: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface BulkAttendanceData {
  date: string;
  status: AttendanceStatus;
  subjectIds: string[];
}

export const ATTENDANCE_COLORS = {
  present: 'bg-green-100 text-green-800 border-green-200',
  absent: 'bg-red-100 text-red-800 border-red-200',
  off: 'bg-gray-100 text-gray-800 border-gray-200'
};

export const ATTENDANCE_LABELS = {
  present: 'Present',
  absent: 'Absent',
  off: 'Off/Holiday'
};
