// types/subject.ts
export interface Subject {
  id: string;
  name: string;
  code: string;
  instructor?: string;
  credit: number;
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
  lastClass?: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  color: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface SubjectFormData {
  name: string;
  code: string;
  instructor?: string;
  credit: number;
}

export type SubjectSortOption = 'name' | 'percentage' | 'lastClass' | 'status' | 'credit';
export type SortDirection = 'asc' | 'desc';
