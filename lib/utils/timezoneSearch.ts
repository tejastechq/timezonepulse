import { Timezone } from '@/store/timezoneStore';
import { formatMarsTime, getCurrentMarsTime, getMarsTimezoneOffset, getRoverInfo } from './mars-timezone';
import { DateTime } from 'luxon';

// Scoring weights for different match types
const WEIGHTS = {
  EXACT_MATCH: 100,
  STARTS_WITH: 80,
  CONTAINS: 60,
  FUZZY_MATCH: 40,
  RECENTLY_USED: 30,
  POPULAR: 20,
  ROVER_LOCATION: 50, // Higher weight for rover locations
};

// Update the Popular timezones set to include Mars/Jezero for Perseverance rover
const POPULAR_TIMEZONES = new Set([
  // Mars rover location
  'Mars/Jezero',     // Perseverance rover location

  // North America
  'America/New_York',     // Eastern Time (US & Canada)
  'America/Chicago',      // Central Time (US & Canada) 
  'America/Los_Angeles',  // Pacific Time (US & Canada)
  
  // Europe
  'Europe/London',        // London, UK
  'Europe/Berlin',        // Central European Time
  'Europe/Paris',         // Paris, France
  
  // Asia
  'Asia/Dubai',           // Dubai, UAE
  'Asia/Kolkata',         // India Standard Time
  'Asia/Shanghai',        // China Standard Time
  'Asia/Tokyo',           // Japan Standard Time
  'Asia/Singapore',       // Singapore Standard Time
  
  // Australia & Pacific
  'Australia/Sydney',     // Sydney, Australia
  
  // UTC
  'Etc/UTC',              // Coordinated Universal Time
]);

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null)
  );

  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }

  return track[str2.length][str1.length];
}

/**
 * Calculate search score for a timezone based on various factors
 */
export function calculateTimezoneScore(
  timezone: Timezone,
  searchTerm: string,
  recentTimezones: Set<string>
): number {
  let score = 0;
  const searchLower = searchTerm.toLowerCase();
  const fieldsToSearch = [
    timezone.name.toLowerCase(),
    timezone.id.toLowerCase(),
    timezone.city?.toLowerCase() || '',
    timezone.country?.toLowerCase() || '',
    timezone.abbreviation?.toLowerCase() || '',
  ];

  // Check for exact matches
  if (fieldsToSearch.some(field => field === searchLower)) {
    score += WEIGHTS.EXACT_MATCH;
  }

  // Check for starts with matches
  if (fieldsToSearch.some(field => field.startsWith(searchLower))) {
    score += WEIGHTS.STARTS_WITH;
  }

  // Check for contains matches
  if (fieldsToSearch.some(field => field.includes(searchLower))) {
    score += WEIGHTS.CONTAINS;
  }

  // Add fuzzy matching score
  const minDistance = Math.min(
    ...fieldsToSearch.map(field => levenshteinDistance(field, searchLower))
  );
  const fuzzyScore = Math.max(0, WEIGHTS.FUZZY_MATCH * (1 - minDistance / searchLower.length));
  score += fuzzyScore;

  // Add score for recently used timezones
  if (recentTimezones.has(timezone.id)) {
    score += WEIGHTS.RECENTLY_USED;
  }

  // Add score for popular timezones
  if (POPULAR_TIMEZONES.has(timezone.id)) {
    score += WEIGHTS.POPULAR;
  }

  // Boost score for rover locations 
  if (timezone.id === 'Mars/Jezero') {
    score += WEIGHTS.ROVER_LOCATION;
  }

  return score;
}

/**
 * Sort timezones based on search relevance
 */
export function sortTimezonesByRelevance(
  timezones: Timezone[],
  searchTerm: string,
  recentTimezones: Set<string>
): Timezone[] {
  if (!searchTerm.trim()) {
    return timezones;
  }

  return [...timezones].sort((a, b) => {
    const scoreA = calculateTimezoneScore(a, searchTerm, recentTimezones);
    const scoreB = calculateTimezoneScore(b, searchTerm, recentTimezones);
    return scoreB - scoreA;
  });
}

/**
 * Get relative time information for a timezone
 */
export function getTimezoneContext(timezone: Timezone, userTimezone: string): {
  offset: string;
  isBusinessHours: boolean;
  currentTime: string;
  isRoverLocation?: boolean;
  roverInfo?: {
    name: string;
    mission: string;
    landingDate: string;
  } | null;
  isMarsDaytime: boolean;
} {
  try {
    // Special handling for Mars timezones
    if (timezone.id.startsWith('Mars/')) {
      // Get Mars time using our Mars-specific functions
      const marsTime = getCurrentMarsTime(timezone.id);
      const marsOffset = getMarsTimezoneOffset(timezone.id);
      const roverInfo = getRoverInfo(timezone.id);
      
      // Format time in Mars time format
      const currentTime = formatMarsTime(marsTime);
      
      // Extract numeric offset from MTC+XX:XX format
      const match = marsOffset.match(/MTC([+-])(\d+):(\d+)/);
      let offsetStr = 'Mars Time';
      if (match) {
        const sign = match[1];
        const hours = parseInt(match[2], 10);
        const minutes = parseInt(match[3], 10);
        offsetStr = `${sign}${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
      }
      
      // Determine if it's daytime on Mars (7 AM to 7 PM Mars time)
      // This is simplified as Mars has similar day/night cycles to Earth
      const marsHour = marsTime.hour;
      const isMarsDaytime = marsHour >= 7 && marsHour < 19;
      
      // For Mars, we'll use isBusinessHours to indicate daylight hours
      const isBusinessHours = isMarsDaytime;
      
      return {
        offset: offsetStr,
        isBusinessHours,
        currentTime,
        isRoverLocation: !!roverInfo,
        roverInfo: roverInfo ? {
          name: roverInfo.name,
          mission: roverInfo.mission,
          landingDate: roverInfo.landingDate
        } : null,
        isMarsDaytime
      };
    }
    
    // Original handling for Earth timezones
    const now = new Date();
    
    // Handle missing or invalid timezone data with fallbacks
    const safeUserTimezone = userTimezone && typeof userTimezone === 'string' ? userTimezone : 'UTC';
    const safeTimezoneId = timezone && timezone.id && typeof timezone.id === 'string' ? timezone.id : 'UTC';
    
    // Use try-catch for each timezone conversion
    let userTime: Date;
    try {
      userTime = new Date(now.toLocaleString('en-US', { timeZone: safeUserTimezone }));
    } catch (error) {
      console.error(`Error converting to user timezone ${safeUserTimezone}:`, error);
      userTime = new Date();
    }
    
    let tzTime: Date;
    try {
      tzTime = new Date(now.toLocaleString('en-US', { timeZone: safeTimezoneId }));
    } catch (error) {
      console.error(`Error converting to timezone ${safeTimezoneId}:`, error);
      tzTime = new Date();
    }
    
    // Calculate offset in hours
    const offsetMs = tzTime.getTime() - userTime.getTime();
    const offsetHours = Math.round(offsetMs / (1000 * 60 * 60));
    const offsetStr = offsetHours === 0 ? 'Same time' : 
      `${offsetHours > 0 ? '+' : ''}${offsetHours}h`;

    // Check if current time is within business hours (9 AM to 5 PM)
    const hour = tzTime.getHours();
    const isBusinessHours = hour >= 9 && hour < 17;

    // Format current time
    let currentTime: string;
    try {
      currentTime = tzTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      currentTime = 'Unavailable';
    }

    return {
      offset: offsetStr,
      isBusinessHours,
      currentTime,
      isMarsDaytime: false // Earth timezones don't have Mars daytime
    };
  } catch (error) {
    console.error('Error in getTimezoneContext:', error);
    // Return safe fallback values
    return {
      offset: 'Unknown',
      isBusinessHours: false,
      currentTime: 'Unavailable',
      isMarsDaytime: false
    };
  }
}