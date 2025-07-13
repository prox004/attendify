// lib/locationService.ts
export interface CollegeLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
}

export interface PresenceEntry {
  id: string;
  userId: string;
  date: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  isOnCampus: boolean;
  collegeLocationId?: string;
  createdAt: string;
}

const STORAGE_KEY = 'attendify_college_location';
const PRESENCE_STORAGE_KEY = 'attendify_presence';

// Calculate distance between two coordinates using Haversine formula
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Check if user is within campus
export const isWithinCampus = (
  userLat: number,
  userLon: number,
  campusLat: number,
  campusLon: number,
  radius: number
): boolean => {
  const distance = calculateDistance(userLat, userLon, campusLat, campusLon);
  return distance <= radius;
};

// Get current location
export const getCurrentLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
};

// College location management
export const saveCollegeLocation = (location: CollegeLocation): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  }
};

export const getCollegeLocation = (): CollegeLocation | null => {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
};

// Presence tracking
export const markPresence = async (userId: string): Promise<PresenceEntry> => {
  const collegeLocation = getCollegeLocation();
  if (!collegeLocation) {
    throw new Error('College location not set');
  }

  const position = await getCurrentLocation();
  const { latitude, longitude } = position.coords;
  
  const isOnCampus = isWithinCampus(
    latitude,
    longitude,
    collegeLocation.latitude,
    collegeLocation.longitude,
    collegeLocation.radius
  );

  const entry: PresenceEntry = {
    id: Date.now().toString(),
    userId,
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
    latitude,
    longitude,
    isOnCampus,
    collegeLocationId: isOnCampus ? collegeLocation.id : undefined,
    createdAt: new Date().toISOString()
  };

  // Save to localStorage (in real app, save to Firebase)
  const existingEntries = getPresenceEntries(userId);
  existingEntries.push(entry);
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(PRESENCE_STORAGE_KEY, JSON.stringify(existingEntries));
  }

  return entry;
};

export const getPresenceEntries = (userId: string): PresenceEntry[] => {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(PRESENCE_STORAGE_KEY);
  const allEntries = stored ? JSON.parse(stored) : [];
  return allEntries.filter((entry: PresenceEntry) => entry.userId === userId);
};

export const getCampusPresencePercentage = (userId: string, days: number = 30): number => {
  const entries = getPresenceEntries(userId);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const recentEntries = entries.filter(entry => 
    new Date(entry.date) >= cutoffDate
  );
  
  if (recentEntries.length === 0) return 0;
  
  const onCampusEntries = recentEntries.filter(entry => entry.isOnCampus);
  return Math.round((onCampusEntries.length / recentEntries.length) * 100);
};
