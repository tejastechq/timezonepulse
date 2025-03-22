import { DateTime } from 'luxon';
import { Timezone as TimezoneItem } from '@/store/timezoneStore';

// Define the TimezoneRegion interface
interface TimezoneRegion {
  id: string;
  name: string;
  lat: number;
  lng: number;
  coordinates: [number, number];
}

// Comprehensive timezone mapping with major cities
// This provides a good balance of coverage without requiring server-side data
export const TIMEZONE_REGIONS: TimezoneRegion[] = [
  // North America
  { id: 'America/Los_Angeles', name: 'Los Angeles', lat: 34.05, lng: -118.24, coordinates: [34.05, -118.24] },
  { id: 'America/Vancouver', name: 'Vancouver', lat: 49.28, lng: -123.12, coordinates: [49.28, -123.12] },
  { id: 'America/Denver', name: 'Denver', lat: 39.74, lng: -104.99, coordinates: [39.74, -104.99] },
  { id: 'America/Phoenix', name: 'Phoenix', lat: 33.45, lng: -112.07, coordinates: [33.45, -112.07] },
  { id: 'America/Chicago', name: 'Chicago', lat: 41.88, lng: -87.63, coordinates: [41.88, -87.63] },
  { id: 'America/Mexico_City', name: 'Mexico City', lat: 19.43, lng: -99.13, coordinates: [19.43, -99.13] },
  { id: 'America/New_York', name: 'New York', lat: 40.71, lng: -74.01, coordinates: [40.71, -74.01] },
  { id: 'America/Toronto', name: 'Toronto', lat: 43.65, lng: -79.38, coordinates: [43.65, -79.38] },
  { id: 'America/Halifax', name: 'Halifax', lat: 44.65, lng: -63.58, coordinates: [44.65, -63.58] },
  
  // South America
  { id: 'America/Santiago', name: 'Santiago', lat: -33.45, lng: -70.67, coordinates: [-33.45, -70.67] },
  { id: 'America/Sao_Paulo', name: 'São Paulo', lat: -23.55, lng: -46.63, coordinates: [-23.55, -46.63] },
  { id: 'America/Buenos_Aires', name: 'Buenos Aires', lat: -34.61, lng: -58.38, coordinates: [-34.61, -58.38] },
  { id: 'America/Lima', name: 'Lima', lat: -12.05, lng: -77.04, coordinates: [-12.05, -77.04] },
  
  // Europe
  { id: 'Europe/London', name: 'London', lat: 51.51, lng: -0.13, coordinates: [51.51, -0.13] },
  { id: 'Europe/Lisbon', name: 'Lisbon', lat: 38.72, lng: -9.13, coordinates: [38.72, -9.13] },
  { id: 'Europe/Dublin', name: 'Dublin', lat: 53.35, lng: -6.26, coordinates: [53.35, -6.26] },
  { id: 'Europe/Paris', name: 'Paris', lat: 48.85, lng: 2.35, coordinates: [48.85, 2.35] },
  { id: 'Europe/Madrid', name: 'Madrid', lat: 40.42, lng: -3.70, coordinates: [40.42, -3.70] },
  { id: 'Europe/Rome', name: 'Rome', lat: 41.90, lng: 12.50, coordinates: [41.90, 12.50] },
  { id: 'Europe/Berlin', name: 'Berlin', lat: 52.52, lng: 13.40, coordinates: [52.52, 13.40] },
  { id: 'Europe/Amsterdam', name: 'Amsterdam', lat: 52.37, lng: 4.89, coordinates: [52.37, 4.89] },
  { id: 'Europe/Zurich', name: 'Zurich', lat: 47.38, lng: 8.54, coordinates: [47.38, 8.54] },
  { id: 'Europe/Stockholm', name: 'Stockholm', lat: 59.33, lng: 18.06, coordinates: [59.33, 18.06] },
  { id: 'Europe/Helsinki', name: 'Helsinki', lat: 60.17, lng: 24.94, coordinates: [60.17, 24.94] },
  { id: 'Europe/Warsaw', name: 'Warsaw', lat: 52.23, lng: 21.01, coordinates: [52.23, 21.01] },
  { id: 'Europe/Athens', name: 'Athens', lat: 37.98, lng: 23.73, coordinates: [37.98, 23.73] },
  { id: 'Europe/Istanbul', name: 'Istanbul', lat: 41.01, lng: 28.97, coordinates: [41.01, 28.97] },
  { id: 'Europe/Moscow', name: 'Moscow', lat: 55.75, lng: 37.62, coordinates: [55.75, 37.62] },
  
  // Africa
  { id: 'Africa/Lagos', name: 'Lagos', lat: 6.45, lng: 3.40, coordinates: [6.45, 3.40] },
  { id: 'Africa/Cairo', name: 'Cairo', lat: 30.04, lng: 31.24, coordinates: [30.04, 31.24] },
  { id: 'Africa/Johannesburg', name: 'Johannesburg', lat: -26.20, lng: 28.05, coordinates: [-26.20, 28.05] },
  { id: 'Africa/Nairobi', name: 'Nairobi', lat: -1.29, lng: 36.82, coordinates: [-1.29, 36.82] },
  { id: 'Africa/Casablanca', name: 'Casablanca', lat: 33.57, lng: -7.59, coordinates: [33.57, -7.59] },
  
  // Asia
  { id: 'Asia/Dubai', name: 'Dubai', lat: 25.20, lng: 55.27, coordinates: [25.20, 55.27] },
  { id: 'Asia/Riyadh', name: 'Riyadh', lat: 24.71, lng: 46.67, coordinates: [24.71, 46.67] },
  { id: 'Asia/Karachi', name: 'Karachi', lat: 24.86, lng: 67.01, coordinates: [24.86, 67.01] },
  { id: 'Asia/Mumbai', name: 'Mumbai', lat: 19.08, lng: 72.88, coordinates: [19.08, 72.88] },
  { id: 'Asia/Kolkata', name: 'New Delhi', lat: 28.61, lng: 77.21, coordinates: [28.61, 77.21] },
  { id: 'Asia/Dhaka', name: 'Dhaka', lat: 23.76, lng: 90.39, coordinates: [23.76, 90.39] },
  { id: 'Asia/Bangkok', name: 'Bangkok', lat: 13.75, lng: 100.50, coordinates: [13.75, 100.50] },
  { id: 'Asia/Jakarta', name: 'Jakarta', lat: -6.21, lng: 106.85, coordinates: [-6.21, 106.85] },
  { id: 'Asia/Singapore', name: 'Singapore', lat: 1.35, lng: 103.82, coordinates: [1.35, 103.82] },
  { id: 'Asia/Hong_Kong', name: 'Hong Kong', lat: 22.32, lng: 114.17, coordinates: [22.32, 114.17] },
  { id: 'Asia/Shanghai', name: 'Shanghai', lat: 31.23, lng: 121.47, coordinates: [31.23, 121.47] },
  { id: 'Asia/Seoul', name: 'Seoul', lat: 37.57, lng: 126.98, coordinates: [37.57, 126.98] },
  { id: 'Asia/Tokyo', name: 'Tokyo', lat: 35.68, lng: 139.76, coordinates: [35.68, 139.76] },
  
  // Oceania
  { id: 'Australia/Perth', name: 'Perth', lat: -31.95, lng: 115.86, coordinates: [-31.95, 115.86] },
  { id: 'Australia/Adelaide', name: 'Adelaide', lat: -34.93, lng: 138.60, coordinates: [-34.93, 138.60] },
  { id: 'Australia/Melbourne', name: 'Melbourne', lat: -37.81, lng: 144.96, coordinates: [-37.81, 144.96] },
  { id: 'Australia/Sydney', name: 'Sydney', lat: -33.87, lng: 151.21, coordinates: [-33.87, 151.21] },
  { id: 'Australia/Brisbane', name: 'Brisbane', lat: -27.47, lng: 153.03, coordinates: [-27.47, 153.03] },
  { id: 'Pacific/Auckland', name: 'Auckland', lat: -36.85, lng: 174.76, coordinates: [-36.85, 174.76] },
  { id: 'Pacific/Fiji', name: 'Fiji', lat: -17.71, lng: 178.06, coordinates: [-17.71, 178.06] },
  { id: 'Pacific/Honolulu', name: 'Honolulu', lat: 21.31, lng: -157.86, coordinates: [21.31, -157.86] }
];

// Timezone boundaries for major regions (approximate)
// These are simplified polygons representing approximate timezone boundaries
export const TIMEZONE_BOUNDARIES: Record<string, { name: string; color: string; boundaries: number[][] }> = {
  // North America
  'America/Los_Angeles': {
    name: 'Pacific Time',
    color: '#3b82f6', // blue
    boundaries: [
      [-135, 60], [-135, 30], [-125, 30], [-120, 32], [-118, 32.5], [-117, 32.5], [-116, 33], 
      [-115, 33.5], [-114.5, 35], [-114, 38], [-114, 42], [-117, 49], [-120, 52], [-125, 55], [-135, 60]
    ]
  },
  'America/Denver': {
    name: 'Mountain Time',
    color: '#10b981', // green
    boundaries: [
      [-114, 60], [-114, 42], [-114, 38], [-114.5, 35], [-115, 33.5], [-114, 32], [-107, 31], 
      [-105, 30], [-103, 30], [-103, 49], [-103, 60], [-114, 60]
    ]
  },
  'America/Chicago': {
    name: 'Central Time',
    color: '#f59e0b', // amber
    boundaries: [
      [-103, 60], [-103, 49], [-103, 30], [-101, 28], [-99, 26], [-97, 25.5], [-95, 26], 
      [-92, 28], [-90, 29], [-88, 30], [-88, 36], [-89, 41], [-89, 49], [-89, 60], [-103, 60]
    ]
  },
  'America/New_York': {
    name: 'Eastern Time',
    color: '#8b5cf6', // purple
    boundaries: [
      [-89, 60], [-89, 49], [-89, 41], [-88, 36], [-88, 30], [-83, 27], [-82, 26], [-80, 25], 
      [-76, 25], [-76, 31], [-75, 35], [-75, 45], [-77, 47], [-77, 60], [-89, 60]
    ]
  },
  
  // Europe
  'Europe/London': {
    name: 'GMT/UTC',
    color: '#ef4444', // red
    boundaries: [
      [-12, 65], [-12, 48], [-8, 40], [-2, 36], [0, 36], [2, 42], [2, 50], [1, 53],
      [0, 55], [-2, 58], [-5, 60], [-8, 62], [-12, 65]
    ]
  },
  'Europe/Paris': {
    name: 'Central European Time',
    color: '#f97316', // orange
    boundaries: [
      [2, 70], [2, 50], [2, 42], [0, 36], [4, 36], [8, 36], [14, 38], [19, 40], 
      [22, 45], [22, 52], [20, 58], [14, 65], [8, 70], [2, 70]
    ]
  },
  'Europe/Moscow': {
    name: 'Moscow Time',
    color: '#0ea5e9', // sky blue
    boundaries: [
      [22, 70], [22, 52], [22, 45], [26, 40], [30, 40], [36, 40], [40, 40], 
      [45, 45], [48, 50], [48, 58], [42, 65], [35, 70], [22, 70]
    ]
  },
  
  // Asia
  'Asia/Tokyo': {
    name: 'Japan Standard Time',
    color: '#ec4899', // pink
    boundaries: [
      [127, 34], [130, 30], [132, 30], [134, 31], [136, 32], [138, 33], [140, 34], 
      [142, 35], [145, 40], [147, 44], [145, 48], [141, 47], [137, 44], [133, 40], [130, 36], [127, 34]
    ]
  },
  'Asia/Shanghai': {
    name: 'China Standard Time',
    color: '#a855f7', // purple
    boundaries: [
      [73, 55], [73, 45], [75, 35], [80, 28], [85, 25], [90, 22], [95, 20], [100, 18], 
      [105, 18], [110, 18], [115, 20], [120, 22], [125, 30], [130, 35], [130, 40],
      [125, 45], [120, 50], [115, 52], [110, 55], [90, 55], [80, 55], [73, 55]
    ]
  },
  'Asia/Kolkata': {
    name: 'Indian Standard Time',
    color: '#14b8a6', // teal
    boundaries: [
      [68, 40], [68, 30], [70, 22], [72, 15], [75, 8], [80, 8], [85, 10], 
      [90, 14], [92, 18], [92, 22], [90, 28], [85, 33], [80, 36], [72, 38], [68, 40]
    ]
  },
  
  // Australia
  'Australia/Sydney': {
    name: 'Eastern Australia Time',
    color: '#06b6d4', // cyan
    boundaries: [
      [141, -45], [141, -38], [142, -34], [145, -30], [148, -28], [150, -28], [153, -28], 
      [155, -30], [155, -34], [153, -38], [150, -40], [148, -42], [145, -44], [141, -45]
    ]
  },
  
  // Additional
  'America/Sao_Paulo': {
    name: 'Brasilia Time',
    color: '#84cc16', // lime 
    boundaries: [
      [-60, -20], [-55, -15], [-50, -10], [-45, -8], [-40, -10], [-35, -15], 
      [-35, -25], [-40, -30], [-45, -33], [-50, -33], [-55, -30], [-60, -25], [-60, -20]
    ]
  },
  'Africa/Cairo': {
    name: 'Eastern European Time',
    color: '#d946ef', // fuchsia
    boundaries: [
      [22, 38], [22, 32], [25, 28], [30, 22], [35, 22], [38, 24], [38, 30], 
      [35, 34], [30, 36], [25, 38], [22, 38]
    ]
  }
};

// Rename our custom local interface to avoid conflict
export interface TimezoneData {
  id: string;
  name: string;
  offset: string;
  isDST: boolean;
  city?: string;
  country?: string;
  abbreviation?: string;
  isNightTime?: boolean;
  isWorkHours?: boolean;
  center?: { lat: number; lng: number };
}

/**
 * Converts degrees to radians
 */
export function deg2rad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculates the distance between two coordinates using the Haversine formula
 */
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

/**
 * Helper function to calculate distance between coordinates using simple euclidean distance
 */
function calculateEuclideanDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2));
}

/**
 * Gets timezone ID for given coordinates using a simple distance-based approach
 * 
 * @param lat - Latitude coordinate
 * @param lng - Longitude coordinate
 * @returns The timezone ID or null if not found
 */
export function getTimezoneForCoordinates(lat: number, lng: number): string | null {
  // IMPORTANT: This function expects coordinates in [lat, lng] format
  
  // Normalize coordinates to handle edge cases
  const normalizedLng = ((lng + 180) % 360) - 180; // Ensure longitude is in range -180 to 180
  const normalizedLat = Math.max(-85, Math.min(85, lat)); // Clamp latitude to valid range

  // Find the closest timezone region based on coordinates
  let closestRegion: TimezoneRegion | null = null;
  let minDistance = Infinity;
  
  for (const region of TIMEZONE_REGIONS) {
    // Calculate distance between input coordinates and region coordinates
    // IMPORTANT: Compare lat with lat and lng with lng
    const distance = calculateDistance(normalizedLat, normalizedLng, region.lat, region.lng);
    
    if (distance < minDistance) {
      minDistance = distance;
      closestRegion = region;
    }
  }
  
  return closestRegion ? closestRegion.id : null;
}

/**
 * Converts a polygon array of points to an SVG path string
 * 
 * @param polygon - Array of [lng, lat] coordinates
 * @returns SVG path string (e.g., "M10,20 L30,40 L50,60 Z")
 */
export function polygonToPath(polygon: number[][]): string {
  if (!polygon || !Array.isArray(polygon) || polygon.length === 0) {
    console.warn('Invalid polygon data passed to polygonToPath');
    return '';
  }
  
  try {
    // Validate all points first
    const validPolygon = polygon.filter(point => 
      Array.isArray(point) && 
      point.length === 2 && 
      Number.isFinite(point[0]) && 
      Number.isFinite(point[1]) &&
      Math.abs(point[1]) <= 90 && 
      Math.abs(point[0]) <= 180
    );
    
    if (validPolygon.length < 3) {
      console.warn('Not enough valid points in polygon data (need at least 3)');
      return '';
    }
    
    // Start with a Move command to the first point
    // For SVG paths, order is [x,y] which for maps means [lng,lat]
    let path = `M${validPolygon[0][0]},${validPolygon[0][1]}`;
    
    // Add Line commands for the rest of the points
    for (let i = 1; i < validPolygon.length; i++) {
      path += ` L${validPolygon[i][0]},${validPolygon[i][1]}`;
    }
    
    // Close the path by returning to the start point
    path += ` Z`;
    
    // Verify the path is valid
    if (path.includes('NaN') || path.includes('undefined')) {
      console.error('Generated path contains invalid values:', path);
      return '';
    }
    
    return path;
  } catch (error) {
    console.error('Error converting polygon to path:', error);
    return '';
  }
}

/**
 * Gets the boundary polygon for a timezone
 * @param timezoneId - The IANA timezone identifier
 * @returns Boundary points as [lng, lat] pairs for mapping, or null if not defined
 */
export function getTimezoneBoundary(timezoneId: string): [number, number][] | null {
  if (!timezoneId) {
    console.warn('Invalid timezoneId provided to getTimezoneBoundary');
    return null;
  }
  
  // Helper function to normalize boundary coordinates
  const normalizeBoundary = (boundary: number[][]): [number, number][] => {
    // Filter out invalid points and ensure [lng, lat] format
    return boundary
      .filter(point => 
        Array.isArray(point) && 
        point.length === 2 && 
        Number.isFinite(point[0]) && 
        Number.isFinite(point[1]) &&
        Math.abs(point[1]) <= 90 && 
        Math.abs(point[0]) <= 180
      )
      .map(([lng, lat]) => [lng, lat] as [number, number]);
  };
  
  // Check if we have an exact match
  if (TIMEZONE_BOUNDARIES[timezoneId]) {
    console.log(`Found exact boundary match for ${timezoneId}`);
    return normalizeBoundary(TIMEZONE_BOUNDARIES[timezoneId].boundaries);
  }
  
  console.log(`No exact boundary match for ${timezoneId}, looking for related regions`);
  
  // Handle timezone aliases and related zones
  // For regions that don't have explicit boundaries, map to parent regions
  if (timezoneId.startsWith('America/')) {
    // US timezones
    if (timezoneId === 'America/Los_Angeles' || timezoneId === 'America/Vancouver') {
      return normalizeBoundary(TIMEZONE_BOUNDARIES['America/Los_Angeles'].boundaries);
    }
    
    if (timezoneId === 'America/Denver' || timezoneId === 'America/Phoenix') {
      return normalizeBoundary(TIMEZONE_BOUNDARIES['America/Denver'].boundaries);
    }
    
    if (timezoneId === 'America/Chicago' || timezoneId === 'America/Mexico_City') {
      return normalizeBoundary(TIMEZONE_BOUNDARIES['America/Chicago'].boundaries);
    }
    
    if (timezoneId === 'America/New_York' || timezoneId === 'America/Toronto' || timezoneId === 'America/Halifax') {
      return normalizeBoundary(TIMEZONE_BOUNDARIES['America/New_York'].boundaries);
    }
  }
  
  // European timezones
  if (timezoneId.startsWith('Europe/')) {
    if (timezoneId === 'Europe/London' || timezoneId === 'Europe/Dublin' || timezoneId === 'Europe/Lisbon') {
      return normalizeBoundary(TIMEZONE_BOUNDARIES['Europe/London'].boundaries);
    }
    
    if (['Europe/Paris', 'Europe/Madrid', 'Europe/Rome', 'Europe/Berlin', 'Europe/Amsterdam', 
         'Europe/Zurich', 'Europe/Stockholm', 'Europe/Warsaw'].includes(timezoneId)) {
      return normalizeBoundary(TIMEZONE_BOUNDARIES['Europe/Paris'].boundaries);
    }
    
    if (timezoneId === 'Europe/Moscow') {
      return normalizeBoundary(TIMEZONE_BOUNDARIES['Europe/Moscow'].boundaries);
    }
  }
  
  // Asian timezones
  if (timezoneId.startsWith('Asia/')) {
    if (timezoneId === 'Asia/Tokyo' || timezoneId === 'Asia/Seoul') {
      return normalizeBoundary(TIMEZONE_BOUNDARIES['Asia/Tokyo'].boundaries);
    }
    
    if (timezoneId === 'Asia/Shanghai' || timezoneId === 'Asia/Hong_Kong' || timezoneId === 'Asia/Singapore') {
      return normalizeBoundary(TIMEZONE_BOUNDARIES['Asia/Shanghai'].boundaries);
    }
    
    if (timezoneId === 'Asia/Kolkata' || timezoneId === 'Asia/Dhaka') {
      return normalizeBoundary(TIMEZONE_BOUNDARIES['Asia/Kolkata'].boundaries);
    }
  }
  
  // Australian timezones
  if (timezoneId.startsWith('Australia/')) {
    if (timezoneId === 'Australia/Sydney' || timezoneId === 'Australia/Melbourne' || timezoneId === 'Australia/Brisbane') {
      return normalizeBoundary(TIMEZONE_BOUNDARIES['Australia/Sydney'].boundaries);
    }
  }
  
  console.log(`No boundary found for ${timezoneId} after trying all mappings`);
  return null;
}

/**
 * Gets the color associated with a timezone for consistent visualization
 * @param timezoneId - The IANA timezone identifier
 * @returns CSS color string
 */
export function getTimezoneColor(timezoneId: string | null | undefined): string {
  // Safety check - if timezoneId is not a valid string, return a default color
  if (!timezoneId || typeof timezoneId !== 'string') {
    console.warn('Invalid timezone ID passed to getTimezoneColor:', timezoneId);
    return '#6B7280'; // Default gray color
  }
  
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
    
    // Default color for other American timezones
    return '#3b82f6'; // blue
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
    
    // Default color for other European timezones
    return '#f97316'; // orange
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
    
    // Default color for other Asian timezones
    return '#a855f7'; // purple
  }
  
  // Australian timezones
  if (timezoneId.startsWith('Australia/')) {
    if (timezoneId === 'Australia/Sydney' || timezoneId === 'Australia/Melbourne' || timezoneId === 'Australia/Brisbane') {
      return TIMEZONE_BOUNDARIES['Australia/Sydney'].color;
    }
    
    // Default color for other Australian timezones
    return '#06b6d4'; // cyan
  }
  
  // Pacific timezones
  if (timezoneId.startsWith('Pacific/')) {
    return '#0ea5e9'; // sky blue
  }
  
  // African timezones
  if (timezoneId.startsWith('Africa/')) {
    return '#d946ef'; // fuchsia
  }
  
  console.log(`No specific color for timezone: ${timezoneId}, using default`);
  // Return a default color if we couldn't match any region
  return '#6B7280'; // gray
}

/**
 * Finds the closest timezone region to the given coordinates
 */
export function findClosestTimezone(lat: number, lng: number): string {
  // IMPORTANT: This function expects coordinates in [lat, lng] format
  // Make sure any calling code provides coordinates in this order
  
  let closestTimezone = 'UTC';
  let minDistance = Infinity;
  
  const point = [lat, lng];
  const timezones = Object.keys(TIMEZONE_REGIONS);
  
  timezones.forEach((timezone) => {
    // Get the timezone region
    const region = TIMEZONE_REGIONS.find(r => r.id === timezone);
    
    // Skip timezones without proper coordinates
    if (!region || !region.coordinates) return;
    
    // Get timezone coordinates
    const tzCoords = region.coordinates;
    
    // Calculate distance to this timezone's central point
    const distance = calculateDistance(
      point[0], 
      point[1],
      tzCoords[0],
      tzCoords[1]
    );
    
    // Check if this is the closest so far
    if (distance < minDistance) {
      minDistance = distance;
      closestTimezone = timezone;
    }
  });
  
  return closestTimezone;
}

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
export const getTimezoneInfo = (timezoneId: string): TimezoneData | null => {
  const region = TIMEZONE_REGIONS.find(r => r.id === timezoneId);
  if (!region) return null;
  
  const now = DateTime.now().setZone(timezoneId);
  const isDST = now.isInDST;
  const offsetHours = now.offset / 60; // Convert to hours
  const offset = `${offsetHours >= 0 ? '+' : ''}${offsetHours}`;
  
  return {
    id: timezoneId,
    name: region.name,
    offset,
    isDST
  };
};

/**
 * Calculates if a coordinate is within boundary hours (like business hours)
 * 
 * @param timezone - Timezone object
 * @param startHour - Starting hour (0-23)
 * @param endHour - Ending hour (0-23)
 * @returns Whether the current time in that timezone is within the hours
 */
export function isWithinHours(timezone: TimezoneData, startHour: number, endHour: number): boolean {
  // Use the timezone id to get the current time in that timezone
  const dateTime = DateTime.now().setZone(timezone.id);
  const hour = dateTime.hour;
  
  return hour >= startHour && hour < endHour;
}

/**
 * Checks if the current time in a timezone is considered "business hours" (9 AM - 5 PM)
 * 
 * @param timezone - Timezone object
 * @returns Whether the current time in that timezone is within business hours
 */
export function isWorkHours(timezone: TimezoneData): boolean {
  // Use the timezone id to get the current time in that timezone
  const dateTime = DateTime.now().setZone(timezone.id);
  const hour = dateTime.hour;
  
  return hour >= 9 && hour < 17;
}

/**
 * Checks if the current time in a timezone is considered "night" (7 PM - 7 AM)
 * 
 * @param timezone - Timezone object
 * @returns Whether the current time in that timezone is night time
 */
export function isNightTime(timezone: TimezoneData): boolean {
  // Use the timezone id to get the current time in that timezone
  const dateTime = DateTime.now().setZone(timezone.id);
  const hour = dateTime.hour;
  
  return hour >= 19 || hour < 7;
}

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
 * Gets formatted timezone data for display
 * 
 * @param timezoneId - Timezone identifier (e.g., "America/New_York")
 * @returns A TimezoneData object or null if there was an error
 */
export function getTimezoneData(timezoneId: string): TimezoneData | null {
  try {
    // Safety check for null or undefined timezoneId
    if (!timezoneId) {
      console.warn('Null or undefined timezoneId passed to getTimezoneData');
      return null;
    }

    // Find the region data for this timezone ID
    const region = TIMEZONE_REGIONS.find(r => r.id === timezoneId);
    
    // Create a date in the specified timezone
    const date = new Date();
    const options = { timeZone: timezoneId, hour12: false };
    
    // Check if the timezone is in DST
    const now = DateTime.now().setZone(timezoneId);
    const isDST = now.isInDST;
    
    // Extract timezone offset from the date
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezoneId,
      timeZoneName: 'shortOffset'
    });
    
    const offsetMatch = formatter.format(date).match(/GMT([+-]\d+)/);
    const offset = offsetMatch ? offsetMatch[1] : '+00:00';
    
    // Extract timezone abbreviation
    const abbreviationFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezoneId,
      timeZoneName: 'short'
    });
    
    const parts = abbreviationFormatter.formatToParts(date);
    const abbreviation = parts.find(part => part.type === 'timeZoneName')?.value || '';
    
    // Check if it's nighttime in this timezone
    const hours = new Date(date.toLocaleString('en-US', options)).getHours();
    const isNightTime = hours < 6 || hours >= 18;
    
    // Check if it's work hours (9 AM to 5 PM local time)
    const isWorkHours = hours >= 9 && hours < 17;
    
    // Parse timezone ID to get city and possible country
    const parts2 = timezoneId.split('/');
    let city = parts2[parts2.length - 1].replace(/_/g, ' ');
    let country = parts2[0];
    
    if (parts2.length > 1) {
      country = parts2[0] === 'Etc' ? 'UTC' : parts2[0];
    }
    
    // Add coordinates from the TIMEZONE_REGIONS data
    let center = undefined;
    if (region) {
      center = { 
        lat: region.lat, 
        lng: region.lng 
      };
    } else {
      // Try to find a related timezone that might have coordinates
      for (const tz of TIMEZONE_REGIONS) {
        if (tz.id.includes(parts2[parts2.length - 1]) || 
            (parts2.length > 1 && tz.id.includes(parts2[parts2.length - 2]))) {
          console.log(`Using coordinates from similar timezone ${tz.id} for ${timezoneId}`);
          center = { 
            lat: tz.lat, 
            lng: tz.lng 
          };
          break;
        }
      }
      
      if (!center) {
        console.warn(`No coordinates found for timezone: ${timezoneId}`);
      }
    }
    
    // Return formatted timezone data with center coordinates if available
    return {
      id: timezoneId,
      name: `${city}, ${country}`,
      city,
      country,
      offset: offset,
      abbreviation,
      isNightTime,
      isWorkHours,
      isDST,
      center // This will be undefined if no coordinates were found
    };
  } catch (error) {
    console.error('Error getting timezone data:', error);
    return null;
  }
}

/**
 * Gets timezone data from map coordinates
 * 
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns A Timezone object or null if not found or error
 */
export function getTimezoneFromMapCoordinates(lat: number, lng: number): TimezoneData | null {
  // IMPORTANT: This function expects coordinates in [lat, lng] format
  // Make sure any calling code provides coordinates in this order
  
  // Get the timezone ID for these coordinates
  const tzId = getTimezoneForCoordinates(lat, lng);
  
  if (!tzId) {
    return null;
  }
  
  // Get the full timezone data
  return getTimezoneData(tzId);
}

/**
 * Checks if a timezone is in daylight saving time
 * 
 * @param timezone - Timezone object
 * @returns Whether the timezone is currently in DST
 */
export function isDaylightSavingTime(timezone: TimezoneData): boolean {
  const dateTime = DateTime.now().setZone(timezone.id);
  return dateTime.isInDST;
}

/**
 * Gets a color based on time of day in a timezone
 * 
 * @param timezone - Timezone object
 * @returns A color string (hex or CSS color)
 */
export function getTimeBasedColor(timezone: TimezoneData): string {
  const dateTime = DateTime.now().setZone(timezone.id);
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

/**
 * Get related timezones that should share the same boundary and color
 * @param timezoneId The IANA timezone identifier
 * @returns Array of related timezone IDs
 */
export function getRelatedTimezones(timezoneId: string): string[] {
  // Map of timezone relationships
  const timezoneMap: Record<string, string[]> = {
    // North America
    'America/Los_Angeles': ['America/Vancouver', 'America/Tijuana', 'America/Dawson', 'America/Whitehorse'],
    'America/Denver': ['America/Phoenix', 'America/Edmonton', 'America/Yellowknife', 'America/Boise'],
    'America/Chicago': ['America/Mexico_City', 'America/Winnipeg', 'America/Regina', 'America/Monterrey'],
    'America/New_York': ['America/Toronto', 'America/Montreal', 'America/Detroit', 'America/Halifax', 'America/Indiana/Indianapolis'],
    
    // Europe
    'Europe/London': ['Europe/Dublin', 'Europe/Lisbon', 'Atlantic/Reykjavik', 'Africa/Casablanca'],
    'Europe/Paris': ['Europe/Berlin', 'Europe/Madrid', 'Europe/Rome', 'Europe/Amsterdam', 'Europe/Brussels', 
                     'Europe/Vienna', 'Europe/Stockholm', 'Europe/Zurich', 'Europe/Warsaw', 'Europe/Prague', 
                     'Europe/Budapest', 'Europe/Copenhagen'],
    'Europe/Moscow': ['Europe/Kiev', 'Europe/Minsk', 'Europe/Tallinn', 'Europe/Riga', 'Europe/Vilnius'],
    
    // Asia
    'Asia/Tokyo': ['Asia/Seoul', 'Asia/Pyongyang', 'Pacific/Palau'],
    'Asia/Shanghai': ['Asia/Hong_Kong', 'Asia/Macau', 'Asia/Taipei', 'Asia/Singapore', 'Asia/Kuala_Lumpur', 
                      'Asia/Manila', 'Asia/Brunei'],
    'Asia/Kolkata': ['Asia/Colombo', 'Asia/Kathmandu', 'Asia/Dhaka', 'Asia/Thimphu'],
    
    // Australia
    'Australia/Sydney': ['Australia/Melbourne', 'Australia/Brisbane', 'Australia/Hobart', 'Pacific/Auckland'],
    
    // Additional
    'America/Sao_Paulo': ['America/Rio_de_Janeiro', 'America/Fortaleza', 'America/Argentina/Buenos_Aires'],
    'Africa/Cairo': ['Asia/Beirut', 'Asia/Jerusalem', 'Asia/Damascus', 'Europe/Athens', 'Europe/Istanbul']
  };
  
  // Check each key in our map to see if the provided timezoneId is related
  for (const [mainZone, relatedZones] of Object.entries(timezoneMap)) {
    // If the timezone matches the main zone or is in the related zones
    if (timezoneId === mainZone || relatedZones.includes(timezoneId)) {
      // Return the main zone and all related zones
      return [mainZone, ...relatedZones];
    }
  }
  
  // If no relationships found, just return the timezone itself
  return [timezoneId];
}

/**
 * Determines if the given time is within business hours (9AM-5PM) in the specified timezone
 * 
 * @param timezoneId - Timezone identifier (e.g., 'America/New_York')
 * @param date - Date object to check (defaults to current time)
 * @returns Whether the time is within business hours
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
 * Gets timezone data from timezone ID
 * 
 * @param id - Timezone ID (e.g., "America/New_York")
 * @returns TimezoneData object or null if not found
 */
export function getTimezoneFromId(id: string): TimezoneData | null {
  try {
    return getTimezoneData(id);
  } catch (error) {
    console.error(`Error getting timezone data for ID ${id}:`, error);
    return null;
  }
}

/**
 * Utility function to swap coordinate formats between [lng, lat] and [lat, lng]
 * This helps prevent confusion between coordinate formats
 * 
 * @param coordinates - The coordinates to swap in format [x, y]
 * @returns The swapped coordinates in format [y, x]
 */
export function swapCoordinates(coordinates: [number, number]): [number, number] {
  return [coordinates[1], coordinates[0]];
}

/**
 * Normalize coordinates to valid ranges
 * 
 * @param lng - Longitude value to normalize
 * @param lat - Latitude value to normalize
 * @returns Normalized [lng, lat] coordinates
 */
export function normalizeCoordinates(lng: number, lat: number): [number, number] {
  // Ensure longitude is in range -180 to 180
  const normalizedLng = ((lng + 180) % 360) - 180;
  
  // Clamp latitude to valid range (-85 to 85)
  const normalizedLat = Math.max(-85, Math.min(85, lat));
  
  return [normalizedLng, normalizedLat];
} 