// components/LocationPicker.tsx
'use client';

import { useState, useEffect } from 'react';
import { MapPinIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CollegeLocation, saveCollegeLocation, getCollegeLocation, getCurrentLocation } from '@/lib/locationService';
import { toast } from 'react-hot-toast';

interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (location: CollegeLocation) => void;
}

export default function LocationPicker({ isOpen, onClose, onSave }: LocationPickerProps) {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [collegeName, setCollegeName] = useState('');
  const [radius, setRadius] = useState(500);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load existing college location if any
      const existingLocation = getCollegeLocation();
      if (existingLocation) {
        setCollegeName(existingLocation.name);
        setRadius(existingLocation.radius);
        setSelectedLocation({
          lat: existingLocation.latitude,
          lng: existingLocation.longitude
        });
      }
      
      // Get current location
      handleGetCurrentLocation();
    }
  }, [isOpen]);

  const handleGetCurrentLocation = async () => {
    try {
      setIsLoading(true);
      const position = await getCurrentLocation();
      const { latitude, longitude } = position.coords;
      setCurrentLocation({ lat: latitude, lng: longitude });
      
      if (!selectedLocation) {
        setSelectedLocation({ lat: latitude, lng: longitude });
      }
    } catch (error) {
      console.error('Error getting location:', error);
      toast.error('Unable to get current location');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!selectedLocation || !collegeName.trim()) {
      toast.error('Please select a location and enter college name');
      return;
    }

    const location: CollegeLocation = {
      id: Date.now().toString(),
      name: collegeName.trim(),
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      radius
    };

    saveCollegeLocation(location);
    onSave(location);
    toast.success('College location saved successfully!');
    onClose();
  };

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Simple click-to-select implementation
    // In a real app, you'd integrate with Google Maps or similar
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert pixel coordinates to lat/lng (simplified)
    if (currentLocation) {
      const newLat = currentLocation.lat + (y - rect.height / 2) * 0.0001;
      const newLng = currentLocation.lng + (x - rect.width / 2) * 0.0001;
      setSelectedLocation({ lat: newLat, lng: newLng });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Set College Location</h2>
            <p className="text-gray-600">Select your college location on the map</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* College Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              College Name *
            </label>
            <input
              type="text"
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your college name"
              required
            />
          </div>

          {/* Radius Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campus Radius (meters)
            </label>
            <input
              type="number"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value) || 500)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              min="100"
              max="2000"
              step="50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Distance from center point to consider as "on campus"
            </p>
          </div>

          {/* Simplified Map Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <div 
              className="w-full h-64 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-crosshair relative overflow-hidden"
              onClick={handleMapClick}
            >
              {isLoading ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Getting your location...</p>
                </div>
              ) : currentLocation ? (
                <div className="text-center">
                  <MapPinIcon className="w-12 h-12 text-indigo-600 mx-auto mb-2" />
                  <p className="text-gray-700 font-medium">Click to select college location</p>
                  <p className="text-sm text-gray-500">
                    Current: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                  </p>
                  {selectedLocation && (
                    <p className="text-sm text-indigo-600 mt-1">
                      Selected: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <button
                    onClick={handleGetCurrentLocation}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 mx-auto"
                  >
                    <MapPinIcon className="w-5 h-5" />
                    <span>Get Current Location</span>
                  </button>
                </div>
              )}
              
              {/* Location markers */}
              {currentLocation && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-blue-500 rounded-full opacity-30 animate-ping"></div>
                </div>
              )}
              
              {selectedLocation && selectedLocation !== currentLocation && (
                <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Note: In production, this would integrate with Google Maps or similar mapping service
            </p>
          </div>

          {/* Current Selection Info */}
          {selectedLocation && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Selected Location</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Latitude: {selectedLocation.lat.toFixed(6)}</p>
                <p>Longitude: {selectedLocation.lng.toFixed(6)}</p>
                <p>Campus Radius: {radius} meters</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedLocation || !collegeName.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <CheckIcon className="w-4 h-4" />
            <span>Save Location</span>
          </button>
        </div>
      </div>
    </div>
  );
}
