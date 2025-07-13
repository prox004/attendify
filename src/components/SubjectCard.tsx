'use client';

import { useState } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  ClockIcon, 
  PencilIcon, 
  TrashIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { Subject } from '@/types/subject';

interface SubjectCardProps {
  subject: Subject;
  onUpdate: (subjectId: string, updates: Partial<Subject>) => Promise<void> | void;
  onDelete: (subjectId: string) => Promise<void> | void;
  onMarkAttendance: (subjectId: string, isPresent: boolean) => Promise<void> | void;
}

export default function SubjectCard({ subject, onUpdate, onDelete, onMarkAttendance }: SubjectCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: subject.name,
    code: subject.code,
    instructor: subject.instructor || '',
    totalClasses: subject.totalClasses,
    attendedClasses: subject.attendedClasses
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'good':
        return <CheckCircleIcon className="w-5 h-5 text-blue-600" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />;
      case 'critical':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      default:
        return <CheckCircleIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSaveEdit = async () => {
    const updates = {
      name: editForm.name,
      code: editForm.code,
      instructor: editForm.instructor,
      totalClasses: editForm.totalClasses,
      attendedClasses: editForm.attendedClasses
    };
    
    await onUpdate(subject.id, updates);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditForm({
      name: subject.name,
      code: subject.code,
      instructor: subject.instructor || '',
      totalClasses: subject.totalClasses,
      attendedClasses: subject.attendedClasses
    });
    setIsEditing(false);
  };

  const formatLastClass = (lastClass: string | undefined) => {
    if (!lastClass) return 'No classes yet';
    return lastClass;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${subject.color}`}></div>
            {isEditing ? (
              <div className="flex-1">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="text-lg font-semibold text-gray-900 border border-gray-300 rounded px-2 py-1 w-full mb-1"
                />
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={editForm.code}
                    onChange={(e) => setEditForm(prev => ({ ...prev, code: e.target.value }))}
                    className="text-sm text-gray-600 border border-gray-300 rounded px-2 py-1 flex-1"
                    placeholder="Subject Code"
                  />
                  <input
                    type="text"
                    value={editForm.instructor}
                    onChange={(e) => setEditForm(prev => ({ ...prev, instructor: e.target.value }))}
                    className="text-sm text-gray-600 border border-gray-300 rounded px-2 py-1 flex-1"
                    placeholder="Instructor"
                  />
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{subject.name}</h3>
                <p className="text-sm text-gray-600">
                  {subject.code}{subject.instructor ? ` • ${subject.instructor}` : ''}
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(subject.status)}
            {!isEditing && (
              <div className="flex space-x-1">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-150"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(subject.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-150"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            )}
            {isEditing && (
              <div className="flex space-x-1">
                <button
                  onClick={handleSaveEdit}
                  className="p-1 text-green-600 hover:text-green-700 transition-colors duration-150"
                >
                  <CheckIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-1 text-red-600 hover:text-red-700 transition-colors duration-150"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Attendance Stats */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-2xl font-bold text-gray-900">{subject.percentage}%</div>
            {isEditing ? (
              <div className="flex space-x-2 mt-2">
                <div>
                  <label className="block text-xs text-gray-600">Attended</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.attendedClasses}
                    onChange={(e) => setEditForm(prev => ({ ...prev, attendedClasses: parseInt(e.target.value) || 0 }))}
                    className="w-16 text-sm border border-gray-300 rounded px-1 py-0.5"
                  />
                </div>
                <div className="self-end text-gray-600">/</div>
                <div>
                  <label className="block text-xs text-gray-600">Total</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.totalClasses}
                    onChange={(e) => setEditForm(prev => ({ ...prev, totalClasses: parseInt(e.target.value) || 0 }))}
                    className="w-16 text-sm border border-gray-300 rounded px-1 py-0.5"
                  />
                </div>
                <div className="self-end text-gray-600">classes</div>
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                {subject.attendedClasses} / {subject.totalClasses} classes
              </div>
            )}
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(subject.status)}`}>
            {subject.status}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${subject.color}`}
              style={{ width: `${subject.percentage}%` }}
            ></div>
          </div>
        </div>

        {/* Last Class */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <div className="flex items-center space-x-1">
            <ClockIcon className="w-4 h-4" />
            <span>Last class: {formatLastClass(subject.lastClass)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        {!isEditing && (
          <div className="flex space-x-2">
            <button
              onClick={() => onMarkAttendance(subject.id, true)}
              className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200"
            >
              Mark Present
            </button>
            <button
              onClick={() => onMarkAttendance(subject.id, false)}
              className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200"
            >
              Mark Absent
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
