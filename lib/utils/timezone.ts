import { DateTime } from 'luxon';
import { getMarsSiteTimezones } from './mars-timezone';

/**
 * Interface for a timezone with display information
 */
export interface TimezoneInfo {
  id: string;
  name: string;
  offset: string;
  city?: string;
  country?: string;
  abbreviation?: string;
  region?: string;
}

/**
 * Get the user's local timezone
 * @returns The local timezone identifier
 */
export function getLocalTimezone(): string {
  return DateTime.local().zoneName || 'UTC';
}

/**
 * Check if a timezone is currently in Daylight Saving Time
 * @param timezone The timezone identifier
 * @returns True if the timezone is in DST
 */
export function isInDST(timezone: string): boolean {
  const now = DateTime.now().setZone(timezone);
  return now.isInDST;
}

/**
 * Get DST transition dates for a timezone in the current year
 * @param timezone The timezone identifier
 * @returns Object containing start and end dates for DST, or null if not applicable
 */
export function getDSTTransitions(timezone: string) {
  const now = DateTime.now().setZone(timezone);
  const year = now.year;
  
  // If the timezone doesn't have DST
  if (!now.zoneName || !DateTime.now().setZone(timezone).zoneName) {
    return null;
  }

  // Try to find DST transitions by checking each month
  let dstStart = null;
  let dstEnd = null;

  // Check each month to find transitions
  for (let month = 1; month <= 12; month++) {
    const firstOfMonth = DateTime.fromObject({ year, month, day: 1 }, { zone: timezone });
    const lastOfMonth = firstOfMonth.endOf('month');
    
    // Check each day in the month
    for (let day = 1; day <= lastOfMonth.day; day++) {
      const currentDay = DateTime.fromObject({ year, month, day }, { zone: timezone });
      const nextDay = currentDay.plus({ days: 1 });
      
      // If DST status changes, we found a transition
      if (currentDay.isInDST !== nextDay.isInDST) {
        if (nextDay.isInDST) {
          dstStart = nextDay;
        } else {
          dstEnd = nextDay;
        }
      }
    }
  }

  return { start: dstStart, end: dstEnd };
}

/**
 * Get a formatted list of all available timezones
 * @returns Array of timezone information objects
 */
export function getAllTimezones(): TimezoneInfo[] {
  try {
    // Comprehensive list of IANA timezone names organized by region
    const zones = [
      // North America
      'America/New_York',      // Eastern Time (US & Canada)
      'America/Chicago',       // Central Time (US & Canada)
      'America/Denver',        // Mountain Time (US & Canada)
      'America/Los_Angeles',   // Pacific Time (US & Canada)
      'America/Anchorage',     // Alaska Time (US)
      'Pacific/Honolulu',      // Hawaii-Aleutian Time (US)

      // Latin America & Caribbean
      'America/Mexico_City',   // Mexico City
      'America/Bogota',        // Bogota, Colombia
      'America/Argentina/Buenos_Aires', // Buenos Aires, Argentina
      'America/Sao_Paulo',     // São Paulo, Brazil
      'America/Santiago',      // Santiago, Chile
      'America/Lima',          // Lima, Peru
      'America/Toronto',       // Toronto, Canada
      'America/Vancouver',     // Vancouver, Canada
      'America/Phoenix',       // Phoenix, Arizona (no DST)

      // Europe
      'Europe/London',         // London, UK
      'Europe/Berlin',         // Central European Time (Berlin, Paris, Rome, Madrid, Amsterdam)
      'Europe/Paris',          // Paris, France
      'Europe/Rome',           // Rome, Italy
      'Europe/Madrid',         // Madrid, Spain
      'Europe/Amsterdam',      // Amsterdam, Netherlands
      'Europe/Athens',         // Eastern European Time (Athens, Bucharest)
      'Europe/Moscow',         // Moscow, Russia
      'Europe/Istanbul',       // Istanbul, Turkey

      // Africa
      'Africa/Casablanca',     // Casablanca, Morocco
      'Africa/Lagos',          // West Africa Time (Lagos, Nigeria)
      'Africa/Johannesburg',   // Central Africa Time (Johannesburg, South Africa)
      'Africa/Nairobi',        // East Africa Time (Nairobi, Kenya)
      'Africa/Cairo',          // Cairo, Egypt

      // Asia
      'Asia/Dubai',            // Dubai, UAE
      'Asia/Kolkata',          // India Standard Time (Mumbai, Delhi, Bangalore)
      'Asia/Bangkok',          // Bangkok, Thailand
      'Asia/Singapore',        // Singapore
      'Asia/Hong_Kong',        // Hong Kong
      'Asia/Tokyo',            // Tokyo, Japan
      'Asia/Seoul',            // Seoul, South Korea
      'Asia/Shanghai',         // Shanghai/Beijing, China
      'Asia/Jakarta',          // Jakarta, Indonesia
      'Asia/Karachi',          // Pakistan Standard Time (Karachi)

      // Australia & Pacific
      'Australia/Sydney',      // Sydney, Australia
      'Australia/Melbourne',   // Melbourne, Australia
      'Australia/Brisbane',    // Brisbane, Australia
      'Australia/Adelaide',    // Adelaide, Australia
      'Australia/Perth',       // Perth, Australia
      'Pacific/Auckland',      // Auckland, New Zealand

      // UTC & Global
      'Etc/UTC',               // Coordinated Universal Time (UTC)
      'Etc/GMT',               // Greenwich Mean Time (GMT)
    ];
    
    // Helper function to get the region from the timezone ID
    const getRegion = (id: string): string => {
      if (id.startsWith('America/')) return 'North America';
      if (id.startsWith('Europe/')) return 'Europe';
      if (id.startsWith('Asia/')) return 'Asia';
      if (id.startsWith('Africa/')) return 'Africa';
      if (id.startsWith('Australia/')) return 'Australia & Pacific';
      if (id.startsWith('Pacific/')) return 'Australia & Pacific';
      if (id.startsWith('Etc/')) return 'UTC & Global';
      if (id.startsWith('Mars/')) return 'Mars';
      return 'Other';
    };
    
    // Get timezone info for all zones
    const timezones = zones.map(tz => {
      try {
        const now = DateTime.now().setZone(tz);
        // Skip invalid timezones or handle with fallback data
        if (!now.isValid) {
          console.warn(`Invalid timezone: ${tz}, using fallback data`);
          return {
            id: tz,
            name: `${tz} (Unknown)`,
            offset: 'Unknown',
            city: tz.split('/').pop()?.replace(/_/g, ' ') || tz,
            country: '',
            abbreviation: 'Unknown',
            region: getRegion(tz)
          };
        }
        
        const offset = now.toFormat('ZZ');
        const parts = tz.split('/');
        const city = parts.length > 1 ? parts[parts.length - 1].replace(/_/g, ' ') : tz;
        const country = parts.length > 1 ? parts[0] : '';
        
        return {
          id: tz,
          name: `${city} (${offset})`,
          offset,
          city,
          country,
          abbreviation: now.toFormat('ZZZZ'),
          region: getRegion(tz)
        };
      } catch (err) {
        console.error(`Error processing timezone ${tz}:`, err);
        // Return fallback data for this timezone
        return {
          id: tz,
          name: `${tz} (Error)`,
          offset: 'Unknown',
          city: tz.split('/').pop()?.replace(/_/g, ' ') || tz,
          country: '',
          abbreviation: 'Error',
          region: getRegion(tz)
        };
      }
    }).filter(Boolean);
    
    // Check if it's April 1st (April Fools' Day)
    const now = DateTime.now();
    const isAprilFools = now.month === 4 && now.day === 1;
    
    // If it's April Fools' Day, add Mars timezones
    if (isAprilFools) {
      const marsTimezones = getMarsSiteTimezones();
      timezones.push(...marsTimezones);
    }
    
    // Define the region order
    const regionOrder = [
      'North America',
      'Europe',
      'Asia',
      'Australia & Pacific',
      'Africa',
      'UTC & Global',
      'Mars',
      'Other'
    ];
    
    // Sort by region first, then by offset within each region
    return timezones.sort((a, b) => {
      // First sort by region based on defined order
      const regionA = a.region as string;
      const regionB = b.region as string;
      const regionCompare = regionOrder.indexOf(regionA) - regionOrder.indexOf(regionB);
      
      if (regionCompare !== 0) {
        return regionCompare;
      }
      
      // Within the same region, sort by offset
      if (a.offset === b.offset) {
        // If same offset, sort by name alphabetically
        return a.name.localeCompare(b.name);
      }
      
      return a.offset.localeCompare(b.offset);
    });
  } catch (error) {
    console.error('Fatal error in getAllTimezones:', error);
    // Return minimal fallback data to prevent application crash
    return [
      {
        id: 'Etc/UTC',
        name: 'UTC (Fallback)',
        offset: '+00:00',
        city: 'UTC',
        country: '',
        abbreviation: 'UTC',
        region: 'UTC & Global'
      }
    ];
  }
}

/**
 * Check if a timezone identifier is valid
 * @param timezone The timezone identifier to check
 * @returns True if the timezone is valid
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    return Boolean(DateTime.now().setZone(timezone).isValid);
  } catch (e) {
    return false;
  }
}

/**
 * Get the current time in a specific timezone
 * @param timezone The timezone identifier
 * @returns Luxon DateTime object for the current time in the specified timezone
 */
export function getCurrentTime(timezone: string): DateTime {
  return DateTime.now().setZone(timezone);
}

/**
 * Format a date for display in a specific timezone
 * @param date The date to format
 * @param timezone The timezone to use
 * @param format The format string (Luxon format)
 * @returns Formatted date string
 */
export function formatInTimezone(date: Date, timezone: string, format: string): string {
  return DateTime.fromJSDate(date).setZone(timezone).toFormat(format);
} 