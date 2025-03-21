import { DateTime } from 'luxon';
import { Timezone } from '@/store/timezoneStore';

// Comprehensive timezone mapping with major cities
// This provides a good balance of coverage without requiring server-side data
export const TIMEZONE_REGIONS = [
  // North America
  { id: 'America/Los_Angeles', name: 'Los Angeles', lat: 34.05, lng: -118.24 },
  { id: 'America/Vancouver', name: 'Vancouver', lat: 49.28, lng: -123.12 },
  { id: 'America/Denver', name: 'Denver', lat: 39.74, lng: -104.99 },
  { id: 'America/Phoenix', name: 'Phoenix', lat: 33.45, lng: -112.07 },
  { id: 'America/Chicago', name: 'Chicago', lat: 41.88, lng: -87.63 },
  { id: 'America/Mexico_City', name: 'Mexico City', lat: 19.43, lng: -99.13 },
  { id: 'America/New_York', name: 'New York', lat: 40.71, lng: -74.01 },
  { id: 'America/Toronto', name: 'Toronto', lat: 43.65, lng: -79.38 },
  { id: 'America/Halifax', name: 'Halifax', lat: 44.65, lng: -63.58 },
  
  // South America
  { id: 'America/Santiago', name: 'Santiago', lat: -33.45, lng: -70.67 },
  { id: 'America/Sao_Paulo', name: 'São Paulo', lat: -23.55, lng: -46.63 },
  { id: 'America/Buenos_Aires', name: 'Buenos Aires', lat: -34.61, lng: -58.38 },
  { id: 'America/Lima', name: 'Lima', lat: -12.05, lng: -77.04 },
  
  // Europe
  { id: 'Europe/London', name: 'London', lat: 51.51, lng: -0.13 },
  { id: 'Europe/Lisbon', name: 'Lisbon', lat: 38.72, lng: -9.13 },
  { id: 'Europe/Dublin', name: 'Dublin', lat: 53.35, lng: -6.26 },
  { id: 'Europe/Paris', name: 'Paris', lat: 48.85, lng: 2.35 },
  { id: 'Europe/Madrid', name: 'Madrid', lat: 40.42, lng: -3.70 },
  { id: 'Europe/Rome', name: 'Rome', lat: 41.90, lng: 12.50 },
  { id: 'Europe/Berlin', name: 'Berlin', lat: 52.52, lng: 13.40 },
  { id: 'Europe/Amsterdam', name: 'Amsterdam', lat: 52.37, lng: 4.89 },
  { id: 'Europe/Zurich', name: 'Zurich', lat: 47.38, lng: 8.54 },
  { id: 'Europe/Stockholm', name: 'Stockholm', lat: 59.33, lng: 18.06 },
  { id: 'Europe/Helsinki', name: 'Helsinki', lat: 60.17, lng: 24.94 },
  { id: 'Europe/Warsaw', name: 'Warsaw', lat: 52.23, lng: 21.01 },
  { id: 'Europe/Athens', name: 'Athens', lat: 37.98, lng: 23.73 },
  { id: 'Europe/Istanbul', name: 'Istanbul', lat: 41.01, lng: 28.97 },
  { id: 'Europe/Moscow', name: 'Moscow', lat: 55.75, lng: 37.62 },
  
  // Africa
  { id: 'Africa/Lagos', name: 'Lagos', lat: 6.45, lng: 3.40 },
  { id: 'Africa/Cairo', name: 'Cairo', lat: 30.04, lng: 31.24 },
  { id: 'Africa/Johannesburg', name: 'Johannesburg', lat: -26.20, lng: 28.05 },
  { id: 'Africa/Nairobi', name: 'Nairobi', lat: -1.29, lng: 36.82 },
  { id: 'Africa/Casablanca', name: 'Casablanca', lat: 33.57, lng: -7.59 },
  
  // Asia
  { id: 'Asia/Dubai', name: 'Dubai', lat: 25.20, lng: 55.27 },
  { id: 'Asia/Riyadh', name: 'Riyadh', lat: 24.71, lng: 46.67 },
  { id: 'Asia/Karachi', name: 'Karachi', lat: 24.86, lng: 67.01 },
  { id: 'Asia/Mumbai', name: 'Mumbai', lat: 19.08, lng: 72.88 },
  { id: 'Asia/Kolkata', name: 'New Delhi', lat: 28.61, lng: 77.21 },
  { id: 'Asia/Dhaka', name: 'Dhaka', lat: 23.76, lng: 90.39 },
  { id: 'Asia/Bangkok', name: 'Bangkok', lat: 13.75, lng: 100.50 },
  { id: 'Asia/Jakarta', name: 'Jakarta', lat: -6.21, lng: 106.85 },
  { id: 'Asia/Singapore', name: 'Singapore', lat: 1.35, lng: 103.82 },
  { id: 'Asia/Hong_Kong', name: 'Hong Kong', lat: 22.32, lng: 114.17 },
  { id: 'Asia/Shanghai', name: 'Shanghai', lat: 31.23, lng: 121.47 },
  { id: 'Asia/Seoul', name: 'Seoul', lat: 37.57, lng: 126.98 },
  { id: 'Asia/Tokyo', name: 'Tokyo', lat: 35.68, lng: 139.76 },
  
  // Oceania
  { id: 'Australia/Perth', name: 'Perth', lat: -31.95, lng: 115.86 },
  { id: 'Australia/Adelaide', name: 'Adelaide', lat: -34.93, lng: 138.60 },
  { id: 'Australia/Melbourne', name: 'Melbourne', lat: -37.81, lng: 144.96 },
  { id: 'Australia/Sydney', name: 'Sydney', lat: -33.87, lng: 151.21 },
  { id: 'Australia/Brisbane', name: 'Brisbane', lat: -27.47, lng: 153.03 },
  { id: 'Pacific/Auckland', name: 'Auckland', lat: -36.85, lng: 174.76 },
  { id: 'Pacific/Fiji', name: 'Fiji', lat: -17.71, lng: 178.06 },
  { id: 'Pacific/Honolulu', name: 'Honolulu', lat: 21.31, lng: -157.86 }
];

// Timezone boundaries for major regions (approximate)
// These are simplified polygons representing approximate timezone boundaries
export const TIMEZONE_BOUNDARIES = {
  // North America
  'America/Los_Angeles': {
    name: 'Pacific Time',
    color: '#3b82f6', // blue
    boundaries: [
      [-125, 49], [-125, 32], [-117, 32], [-114.5, 32.5], [-114, 35], [-114, 49], [-125, 49]
    ]
  },
  'America/Denver': {
    name: 'Mountain Time',
    color: '#10b981', // green
    boundaries: [
      [-114, 49], [-114, 35], [-114.5, 32.5], [-109, 31.5], [-105, 31.5], [-103, 32], [-103, 49], [-114, 49]
    ]
  },
  'America/Chicago': {
    name: 'Central Time',
    color: '#f59e0b', // amber
    boundaries: [
      [-103, 49], [-103, 32], [-101, 30], [-97, 26], [-95, 26], [-90, 29], [-89, 31], [-89, 49], [-103, 49]
    ]
  },
  'America/New_York': {
    name: 'Eastern Time',
    color: '#8b5cf6', // purple
    boundaries: [
      [-89, 49], [-89, 31], [-90, 29], [-85, 30], [-81, 25], [-78, 25], [-75, 36], [-75, 45], [-80, 49], [-89, 49]
    ]
  },
  
  // Europe
  'Europe/London': {
    name: 'GMT/UTC',
    color: '#ef4444', // red
    boundaries: [
      [-10, 60], [-10, 50], [-5, 45], [0, 43], [2, 43], [2, 50], [2, 60], [-10, 60]
    ]
  },
  'Europe/Paris': {
    name: 'Central European Time',
    color: '#f97316', // orange
    boundaries: [
      [2, 60], [2, 43], [3, 43], [8, 43], [13, 42], [15, 42], [15, 50], [15, 60], [2, 60]
    ]
  },
  'Europe/Moscow': {
    name: 'Moscow Time',
    color: '#0ea5e9', // sky blue
    boundaries: [
      [30, 60], [30, 45], [35, 45], [40, 45], [40, 60], [30, 60]
    ]
  },
  
  // Asia
  'Asia/Tokyo': {
    name: 'Japan Standard Time',
    color: '#ec4899', // pink
    boundaries: [
      [129, 46], [129, 30], [132, 30], [140, 33], [146, 38], [146, 46], [129, 46]
    ]
  },
  'Asia/Shanghai': {
    name: 'China Standard Time',
    color: '#a855f7', // purple
    boundaries: [
      [73, 53], [73, 18], [80, 18], [104, 18], [120, 18], [128, 30], [135, 40], [135, 53], [73, 53]
    ]
  },
  'Asia/Kolkata': {
    name: 'Indian Standard Time',
    color: '#14b8a6', // teal
    boundaries: [
      [68, 36], [68, 8], [74, 8], [88, 8], [97, 15], [97, 36], [68, 36]
    ]
  },
  
  // Australia
  'Australia/Sydney': {
    name: 'Australian Eastern Time',
    color: '#22c55e', // green
    boundaries: [
      [141, -28], [141, -39], [148, -39], [154, -35], [154, -28], [150, -22], [141, -28]
    ]
  },
  
  // Additional regions
  'America/Sao_Paulo': {
    name: 'Brasilia Time',
    color: '#fbbf24', // yellow-500
    boundaries: [
      [-58, 5], [-58, -33], [-48, -33], [-35, -18], [-35, 0], [-50, 5], [-58, 5]
    ]
  },
  'Africa/Cairo': {
    name: 'Eastern European Time',
    color: '#d946ef', // fuchsia
    boundaries: [
      [22, 37], [22, 24], [35, 24], [35, 37], [22, 37]
    ]
  }
};

/**
 * Gets the boundary polygon for a timezone
 * @param timezoneId - The IANA timezone identifier
 * @returns Boundary points as [lng, lat] pairs for mapping, or null if not defined
 */
export function getTimezoneBoundary(timezoneId: string): [number, number][] | null {
  // Check if we have an exact match
  if (TIMEZONE_BOUNDARIES[timezoneId]) {
    return TIMEZONE_BOUNDARIES[timezoneId].boundaries.map(([lng, lat]) => [lng, lat] as [number, number]);
  }
  
  // Handle timezone aliases and related zones
  // For regions that don't have explicit boundaries, map to parent regions
  if (timezoneId.startsWith('America/')) {
    // US timezones
    if (timezoneId === 'America/Los_Angeles' || timezoneId === 'America/Vancouver') {
      return TIMEZONE_BOUNDARIES['America/Los_Angeles'].boundaries.map(([lng, lat]) => [lng, lat] as [number, number]);
    }
    
    if (timezoneId === 'America/Denver' || timezoneId === 'America/Phoenix') {
      return TIMEZONE_BOUNDARIES['America/Denver'].boundaries.map(([lng, lat]) => [lng, lat] as [number, number]);
    }
    
    if (timezoneId === 'America/Chicago' || timezoneId === 'America/Mexico_City') {
      return TIMEZONE_BOUNDARIES['America/Chicago'].boundaries.map(([lng, lat]) => [lng, lat] as [number, number]);
    }
    
    if (timezoneId === 'America/New_York' || timezoneId === 'America/Toronto' || timezoneId === 'America/Halifax') {
      return TIMEZONE_BOUNDARIES['America/New_York'].boundaries.map(([lng, lat]) => [lng, lat] as [number, number]);
    }
  }
  
  // European timezones
  if (timezoneId.startsWith('Europe/')) {
    if (timezoneId === 'Europe/London' || timezoneId === 'Europe/Dublin' || timezoneId === 'Europe/Lisbon') {
      return TIMEZONE_BOUNDARIES['Europe/London'].boundaries.map(([lng, lat]) => [lng, lat] as [number, number]);
    }
    
    if (['Europe/Paris', 'Europe/Madrid', 'Europe/Rome', 'Europe/Berlin', 'Europe/Amsterdam', 
         'Europe/Zurich', 'Europe/Stockholm', 'Europe/Warsaw'].includes(timezoneId)) {
      return TIMEZONE_BOUNDARIES['Europe/Paris'].boundaries.map(([lng, lat]) => [lng, lat] as [number, number]);
    }
    
    if (timezoneId === 'Europe/Moscow') {
      return TIMEZONE_BOUNDARIES['Europe/Moscow'].boundaries.map(([lng, lat]) => [lng, lat] as [number, number]);
    }
  }
  
  // Asian timezones
  if (timezoneId.startsWith('Asia/')) {
    if (timezoneId === 'Asia/Tokyo' || timezoneId === 'Asia/Seoul') {
      return TIMEZONE_BOUNDARIES['Asia/Tokyo'].boundaries.map(([lng, lat]) => [lng, lat] as [number, number]);
    }
    
    if (timezoneId === 'Asia/Shanghai' || timezoneId === 'Asia/Hong_Kong' || timezoneId === 'Asia/Singapore') {
      return TIMEZONE_BOUNDARIES['Asia/Shanghai'].boundaries.map(([lng, lat]) => [lng, lat] as [number, number]);
    }
    
    if (timezoneId === 'Asia/Kolkata' || timezoneId === 'Asia/Dhaka') {
      return TIMEZONE_BOUNDARIES['Asia/Kolkata'].boundaries.map(([lng, lat]) => [lng, lat] as [number, number]);
    }
  }
  
  // Australian timezones
  if (timezoneId.startsWith('Australia/')) {
    if (timezoneId === 'Australia/Sydney' || timezoneId === 'Australia/Melbourne' || timezoneId === 'Australia/Brisbane') {
      return TIMEZONE_BOUNDARIES['Australia/Sydney'].boundaries.map(([lng, lat]) => [lng, lat] as [number, number]);
    }
  }
  
  return null;
}

/**
 * Gets the color associated with a timezone for consistent visualization
 * @param timezoneId - The IANA timezone identifier
 * @returns CSS color string
 */
export function getTimezoneColor(timezoneId: string): string {
  // Check if we have a direct match
  if (TIMEZONE_BOUNDARIES[timezoneId]) {
    return TIMEZONE_BOUNDARIES[timezoneId].color;
  }
  
  // Handle aliases using the same logic as getTimezoneBoundary
  if (timezoneId.startsWith('America/')) {
    if (timezoneId === 'America/Los_Angeles' || timezoneId === 'America/Vancouver') {
      return TIMEZONE_BOUNDARIES['America/Los_Angeles'].color;
    }
    
    if (timezoneId === 'America/Denver' || timezoneId === 'America/Phoenix') {
      return TIMEZONE_BOUNDARIES['America/Denver'].color;
    }
    
    if (timezoneId === 'America/Chicago' || timezoneId === 'America/Mexico_City') {
      return TIMEZONE_BOUNDARIES['America/Chicago'].color;
    }
    
    if (timezoneId === 'America/New_York' || timezoneId === 'America/Toronto' || timezoneId === 'America/Halifax') {
      return TIMEZONE_BOUNDARIES['America/New_York'].color;
    }
  }
  
  // European timezones
  if (timezoneId.startsWith('Europe/')) {
    if (timezoneId === 'Europe/London' || timezoneId === 'Europe/Dublin' || timezoneId === 'Europe/Lisbon') {
      return TIMEZONE_BOUNDARIES['Europe/London'].color;
    }
    
    if (['Europe/Paris', 'Europe/Madrid', 'Europe/Rome', 'Europe/Berlin', 'Europe/Amsterdam', 
         'Europe/Zurich', 'Europe/Stockholm', 'Europe/Warsaw'].includes(timezoneId)) {
      return TIMEZONE_BOUNDARIES['Europe/Paris'].color;
    }
    
    if (timezoneId === 'Europe/Moscow') {
      return TIMEZONE_BOUNDARIES['Europe/Moscow'].color;
    }
  }
  
  // Asian timezones
  if (timezoneId.startsWith('Asia/')) {
    if (timezoneId === 'Asia/Tokyo' || timezoneId === 'Asia/Seoul') {
      return TIMEZONE_BOUNDARIES['Asia/Tokyo'].color;
    }
    
    if (timezoneId === 'Asia/Shanghai' || timezoneId === 'Asia/Hong_Kong' || timezoneId === 'Asia/Singapore') {
      return TIMEZONE_BOUNDARIES['Asia/Shanghai'].color;
    }
    
    if (timezoneId === 'Asia/Kolkata' || timezoneId === 'Asia/Dhaka') {
      return TIMEZONE_BOUNDARIES['Asia/Kolkata'].color;
    }
  }
  
  // Australian timezones
  if (timezoneId.startsWith('Australia/')) {
    if (timezoneId === 'Australia/Sydney' || timezoneId === 'Australia/Melbourne' || timezoneId === 'Australia/Brisbane') {
      return TIMEZONE_BOUNDARIES['Australia/Sydney'].color;
    }
  }
  
  // Default color if no match found
  return '#6b7280'; // gray-500
}

/**
 * Finds the closest timezone region to the given coordinates
 */
export const findClosestTimezone = (lat: number, lng: number): string => {
  let closestRegion = TIMEZONE_REGIONS[0];
  let minDistance = Number.MAX_VALUE;
  
  for (const region of TIMEZONE_REGIONS) {
    const distance = Math.sqrt(
      Math.pow(region.lat - lat, 2) + 
      Math.pow(region.lng - lng, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestRegion = region;
    }
  }
  
  return closestRegion.id;
};

/**
 * Calculate the day/night terminator points for the current time
 * Returns an array of [lat, lng] points for drawing the terminator line
 */
export const calculateDayNightTerminator = (date = new Date()): [number, number][] => {
  // Calculation based on solar position algorithms
  // Adapted from https://github.com/mourner/suncalc
  
  const RAD = Math.PI / 180;
  const DEG = 180 / Math.PI;
  
  // Relative to current date
  const julianDay = date.valueOf() / 86400000 - 0.5 + 2440588;
  const julianCentury = (julianDay - 2451545) / 36525;
  
  // Solar declination angle
  const meanLongitude = (280.46646 + julianCentury * (36000.76983 + julianCentury * 0.0003032)) % 360;
  const meanAnomaly = 357.52911 + julianCentury * (35999.05029 - 0.0001537 * julianCentury);
  const excentricityEarth = 0.016708634 - julianCentury * (0.000042037 + 0.0000001267 * julianCentury);
  const equationOfCenter = Math.sin(meanAnomaly * RAD) * (1.914602 - julianCentury * (0.004817 + 0.000014 * julianCentury))
                      + Math.sin(2 * meanAnomaly * RAD) * (0.019993 - 0.000101 * julianCentury)
                      + Math.sin(3 * meanAnomaly * RAD) * 0.000289;
  
  const sunLongitude = (meanLongitude + equationOfCenter) % 360;
  
  const obliquityEcliptic = 23 + (26 + (21.448 - julianCentury * (46.815 + julianCentury * (0.00059 - julianCentury * 0.001813))) / 60) / 60;
  const correctedObliquity = obliquityEcliptic + 0.00256 * Math.cos((125.04 - 1934.136 * julianCentury) * RAD);
  
  const declination = Math.asin(Math.sin(correctedObliquity * RAD) * Math.sin(sunLongitude * RAD)) * DEG;
  
  // Hour angle at the terminator (solar elevation = -0.83°)
  const sinSolarElevation = Math.sin(-0.83 * RAD);
  
  // Generate points for the terminator line
  const points: [number, number][] = [];
  
  for (let lat = -90; lat <= 90; lat += 2) {
    const sinLat = Math.sin(lat * RAD);
    const cosLat = Math.cos(lat * RAD);
    const sinDec = Math.sin(declination * RAD);
    const cosDec = Math.cos(declination * RAD);
    
    const cosHa = (sinSolarElevation - sinLat * sinDec) / (cosLat * cosDec);
    
    // If abs(cosHa) > 1, the sun never rises/sets at this latitude at this time of year
    if (Math.abs(cosHa) > 1) continue;
    
    // Convert hour angle to longitude
    const hourAngle = Math.acos(cosHa) * DEG;
    
    // Get the longitude of the terminator at this latitude 
    // Calculate UTC time (in hours) of the calculation
    const utcTime = (date.getUTCHours() + date.getUTCMinutes() / 60) % 24;
    
    // Longitude of the terminator
    let lng = 180 - hourAngle - 15 * utcTime;
    if (lng > 180) lng -= 360;
    if (lng < -180) lng += 360;
    
    points.push([lat, lng]);
  }
  
  return points;
};

/**
 * Determines if a point is in daylight based on the current time
 */
export const isPointInDaylight = (lat: number, lng: number, date = new Date()): boolean => {
  // Calculation based on solar position
  const RAD = Math.PI / 180;
  
  // Convert time to Julian date
  const julianDay = date.valueOf() / 86400000 - 0.5 + 2440588;
  const julianCentury = (julianDay - 2451545) / 36525;
  
  // Solar declination angle calculation
  const meanLongitude = (280.46646 + julianCentury * (36000.76983 + julianCentury * 0.0003032)) % 360;
  const meanAnomaly = 357.52911 + julianCentury * (35999.05029 - 0.0001537 * julianCentury);
  const equationOfCenter = Math.sin(meanAnomaly * RAD) * (1.914602 - julianCentury * (0.004817 + 0.000014 * julianCentury))
                      + Math.sin(2 * meanAnomaly * RAD) * (0.019993 - 0.000101 * julianCentury)
                      + Math.sin(3 * meanAnomaly * RAD) * 0.000289;
  
  const sunLongitude = (meanLongitude + equationOfCenter) % 360;
  
  const obliquityEcliptic = 23 + (26 + (21.448 - julianCentury * (46.815 + julianCentury * (0.00059 - julianCentury * 0.001813))) / 60) / 60;
  const correctedObliquity = obliquityEcliptic + 0.00256 * Math.cos((125.04 - 1934.136 * julianCentury) * RAD);
  
  const declination = Math.asin(Math.sin(correctedObliquity * RAD) * Math.sin(sunLongitude * RAD)) * (180 / Math.PI);
  
  // Calculate the hour angle (longitude difference between observer and sun)
  const utcTime = (date.getUTCHours() + date.getUTCMinutes() / 60) % 24;  
  const hourAngle = (utcTime * 15 - 180 + lng) * RAD;
  
  // Solar elevation calculation
  const sinLat = Math.sin(lat * RAD);
  const cosLat = Math.cos(lat * RAD);
  const sinDec = Math.sin(declination * RAD);
  const cosDec = Math.cos(declination * RAD);
  const cosHourAngle = Math.cos(hourAngle);
  
  const solarElevation = Math.asin(sinLat * sinDec + cosLat * cosDec * cosHourAngle) * (180 / Math.PI);
  
  // Solar elevation > -0.83 means it's daytime
  // The 0.83 degrees accounts for atmospheric refraction and the sun's diameter
  return solarElevation > -0.83;
};

/**
 * Get timezone info for a given timezone
 */
export const getTimezoneInfo = (timezoneId: string): Timezone | null => {
  const region = TIMEZONE_REGIONS.find(r => r.id === timezoneId);
  if (!region) return null;
  
  const now = DateTime.now().setZone(timezoneId);
  const isDST = now.isInDST;
  const offset = now.offset / 60; // Convert to hours
  
  return {
    id: timezoneId,
    name: region.name,
    offset,
    isDST
  };
};

/**
 * Determines if the given time is within business hours (9AM-5PM) in the specified timezone
 */
export const isBusinessHours = (timezoneId: string, date = new Date()): boolean => {
  const localTime = DateTime.fromJSDate(date).setZone(timezoneId);
  const hour = localTime.hour;
  const dayOfWeek = localTime.weekday;
  
  // Check if weekend (6 = Saturday, 7 = Sunday in Luxon)
  if (dayOfWeek === 6 || dayOfWeek === 7) {
    return false;
  }
  
  // Check if within 9 AM - 5 PM local time
  return hour >= 9 && hour < 17;
};

/**
 * Format a timezone offset as a string (+/-HH:MM)
 */
export const formatTimezoneOffset = (offsetHours: number): string => {
  const sign = offsetHours >= 0 ? '+' : '-';
  const absOffset = Math.abs(offsetHours);
  const hours = Math.floor(absOffset);
  const minutes = Math.round((absOffset - hours) * 60);
  
  return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

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