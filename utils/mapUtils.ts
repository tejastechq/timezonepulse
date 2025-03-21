import { DateTime } from 'luxon';
import { Timezone } from '@/store/timezoneStore';

// Simple timezone mapping for common regions - this is a basic implementation
// In a production app, you would use a more comprehensive dataset
const TIMEZONE_REGIONS = [
  { id: 'America/Los_Angeles', name: 'Los Angeles', lat: 34.05, lng: -118.24 },
  { id: 'America/Denver', name: 'Denver', lat: 39.74, lng: -104.99 },
  { id: 'America/Chicago', name: 'Chicago', lat: 41.88, lng: -87.63 },
  { id: 'America/New_York', name: 'New York', lat: 40.71, lng: -74.01 },
  { id: 'Europe/London', name: 'London', lat: 51.51, lng: -0.13 },
  { id: 'Europe/Paris', name: 'Paris', lat: 48.85, lng: 2.35 },
  { id: 'Europe/Berlin', name: 'Berlin', lat: 52.52, lng: 13.40 },
  { id: 'Asia/Dubai', name: 'Dubai', lat: 25.20, lng: 55.27 },
  { id: 'Asia/Tokyo', name: 'Tokyo', lat: 35.68, lng: 139.76 },
  { id: 'Asia/Hong_Kong', name: 'Hong Kong', lat: 22.32, lng: 114.17 },
  { id: 'Asia/Singapore', name: 'Singapore', lat: 1.35, lng: 103.82 },
  { id: 'Australia/Sydney', name: 'Sydney', lat: -33.87, lng: 151.21 },
  { id: 'Pacific/Auckland', name: 'Auckland', lat: -36.85, lng: 174.76 }
];

/**
 * Gets timezone ID for given coordinates using a simple distance-based approach
 * 
 * @param lat - Latitude coordinate
 * @param lng - Longitude coordinate
 * @returns The timezone ID or null if not found
 */
export function getTimezoneForCoordinates(lat: number, lng: number): string | null {
  try {
    // Simple distance calculation
    function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
      return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2));
    }
    
    // Find the closest timezone to the given coordinates
    let closestRegion = null;
    let minDistance = Number.MAX_VALUE;
    
    for (const region of TIMEZONE_REGIONS) {
      const distance = calculateDistance(lat, lng, region.lat, region.lng);
      if (distance < minDistance) {
        minDistance = distance;
        closestRegion = region;
      }
    }
    
    return closestRegion ? closestRegion.id : null;
  } catch (error) {
    console.error('Error getting timezone:', error);
    return null;
  }
}

/**
 * Gets formatted timezone data for display
 * 
 * @param tzId - Timezone identifier (e.g., "America/New_York")
 * @returns A Timezone object or null if there was an error
 */
export function getTimezoneData(tzId: string): Timezone | null {
  try {
    // Create a DateTime object in the specified timezone
    const now = DateTime.now().setZone(tzId);
    
    // Format the timezone name to be more readable
    const name = tzId.replace(/_/g, ' ').split('/').pop() || tzId;
    
    // Get the timezone abbreviation
    const abbreviation = now.toFormat('ZZZZ');
    
    // Generate the formatted time string
    const formatted = now.toFormat('h:mm a');
    
    // Create the timezone object
    return {
      id: tzId,
      name,
      abbreviation,
      offset: now.offset,
      datetime: now.toJSDate(),
      formatted,
    };
  } catch (error) {
    console.error('Error formatting timezone data:', error);
    return null;
  }
}

/**
 * Gets timezone data for a point on the map
 * 
 * @param coordinates - [longitude, latitude] coordinates
 * @returns A Timezone object or null if not found or error
 */
export function getTimezoneFromMapCoordinates(coordinates: [number, number]): Timezone | null {
  // Convert coordinates from [longitude, latitude] to [latitude, longitude]
  const [lng, lat] = coordinates;
  
  // Get the timezone ID for these coordinates
  const tzId = getTimezoneForCoordinates(lat, lng);
  
  if (!tzId) {
    return null;
  }
  
  // Get the full timezone data
  return getTimezoneData(tzId);
}

/**
 * Calculates if a coordinate is within boundary hours (like business hours)
 * 
 * @param timezone - Timezone object
 * @param startHour - Starting hour (0-23)
 * @param endHour - Ending hour (0-23)
 * @returns Whether the current time in that timezone is within the hours
 */
export function isWithinHours(timezone: Timezone, startHour: number, endHour: number): boolean {
  const dateTime = DateTime.fromJSDate(timezone.datetime);
  const hour = dateTime.hour;
  
  return hour >= startHour && hour < endHour;
}

/**
 * Checks if a timezone is in daylight saving time
 * 
 * @param timezone - Timezone object
 * @returns Whether the timezone is currently in DST
 */
export function isDaylightSavingTime(timezone: Timezone): boolean {
  const dateTime = DateTime.fromJSDate(timezone.datetime);
  return dateTime.isInDST;
}

/**
 * Gets a color based on time of day in a timezone
 * 
 * @param timezone - Timezone object
 * @returns A color string (hex or CSS color)
 */
export function getTimeBasedColor(timezone: Timezone): string {
  const dateTime = DateTime.fromJSDate(timezone.datetime);
  const hour = dateTime.hour;
  
  // Night (10 PM - 6 AM)
  if (hour >= 22 || hour < 6) {
    return "#1e293b"; // slate-800
  }
  
  // Morning (6 AM - 12 PM)
  if (hour >= 6 && hour < 12) {
    return "#3b82f6"; // blue-500
  }
  
  // Afternoon (12 PM - 5 PM)
  if (hour >= 12 && hour < 17) {
    return "#f97316"; // orange-500
  }
  
  // Evening (5 PM - 10 PM)
  return "#7c3aed"; // violet-600
} 