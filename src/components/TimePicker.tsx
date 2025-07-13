'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, ClockIcon } from '@heroicons/react/24/outline';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function TimePicker({ 
  value, 
  onChange, 
  placeholder = "Select time", 
  className = "",
  required = false 
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState<string>('');
  const [selectedMinute, setSelectedMinute] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Generate hours (1-12 for 12-hour format)
  const hours = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 1;
    return hour.toString().padStart(2, '0');
  });

  // Generate minutes (00, 05, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55)
  const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  // Parse the current value (24-hour format) to set initial state
  useEffect(() => {
    if (value) {
      const [hour24, minute] = value.split(':');
      const hour24Num = parseInt(hour24);
      
      if (hour24Num === 0) {
        setSelectedHour('12');
        setSelectedPeriod('AM');
      } else if (hour24Num <= 12) {
        setSelectedHour(hour24Num.toString().padStart(2, '0'));
        setSelectedPeriod(hour24Num === 12 ? 'PM' : 'AM');
      } else {
        setSelectedHour((hour24Num - 12).toString().padStart(2, '0'));
        setSelectedPeriod('PM');
      }
      
      setSelectedMinute(minute);
    }
  }, [value]);

  // Convert 12-hour format to 24-hour format
  const convertTo24Hour = (hour12: string, minute: string, period: 'AM' | 'PM'): string => {
    let hour24 = parseInt(hour12);
    
    if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    } else if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minute}`;
  };

  // Format display value
  const formatDisplayValue = (time: string): string => {
    if (!time) return '';
    
    const [hour24, minute] = time.split(':');
    const hour24Num = parseInt(hour24);
    
    if (hour24Num === 0) {
      return `12:${minute} AM`;
    } else if (hour24Num <= 11) {
      return `${hour24Num}:${minute} AM`;
    } else if (hour24Num === 12) {
      return `12:${minute} PM`;
    } else {
      return `${hour24Num - 12}:${minute} PM`;
    }
  };

  const handleTimeSelect = () => {
    if (selectedHour && selectedMinute) {
      const time24 = convertTo24Hour(selectedHour, selectedMinute, selectedPeriod);
      onChange(time24);
      setIsOpen(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-left flex items-center justify-between ${className}`}
      >
        <div className="flex items-center space-x-2">
          <ClockIcon className="w-4 h-4 text-gray-400" />
          <span className={value ? 'text-gray-900' : 'text-gray-500'}>
            {value ? formatDisplayValue(value) : placeholder}
          </span>
        </div>
        <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="p-4">
            <div className="grid grid-cols-3 gap-3 mb-4">
              {/* Hour Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Hour</label>
                <select
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Hour</option>
                  {hours.map(hour => (
                    <option key={hour} value={hour}>{hour}</option>
                  ))}
                </select>
              </div>

              {/* Minute Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Minute</label>
                <select
                  value={selectedMinute}
                  onChange={(e) => setSelectedMinute(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Min</option>
                  {minutes.map(minute => (
                    <option key={minute} value={minute}>{minute}</option>
                  ))}
                </select>
              </div>

              {/* AM/PM Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Period</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value as 'AM' | 'PM')}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleTimeSelect}
                disabled={!selectedHour || !selectedMinute}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Set Time
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
