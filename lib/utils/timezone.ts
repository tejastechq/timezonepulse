import { DateTime } from 'luxon';

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
  // Luxon doesn't expose ZONE_NAMES directly in newer versions
  // Use a predefined list of common IANA timezone names
  const zones = [
    'Africa/Cairo', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Nairobi',
    'America/Anchorage', 'America/Bogota', 'America/Chicago', 'America/Denver',
    'America/Los_Angeles', 'America/Mexico_City', 'America/New_York', 'America/Phoenix',
    'America/Sao_Paulo', 'America/Toronto', 'America/Vancouver',
    'Asia/Bangkok', 'Asia/Dubai', 'Asia/Hong_Kong', 'Asia/Jakarta', 'Asia/Kolkata',
    'Asia/Seoul', 'Asia/Shanghai', 'Asia/Singapore', 'Asia/Tokyo',
    'Australia/Melbourne', 'Australia/Perth', 'Australia/Sydney',
    'Europe/Amsterdam', 'Europe/Berlin', 'Europe/Istanbul', 'Europe/London',
    'Europe/Madrid', 'Europe/Moscow', 'Europe/Paris', 'Europe/Rome',
    'Pacific/Auckland', 'Pacific/Honolulu',
    'UTC'
  ];
  
  return zones.map(zone => {
    const now = DateTime.now().setZone(zone);
    const offset = now.toFormat('ZZ');
    const parts = zone.split('/');
    const city = parts.length > 1 ? parts[parts.length - 1].replace(/_/g, ' ') : zone;
    const country = parts.length > 1 ? parts[0] : '';
    
    return {
      id: zone,
      name: `${city} (${offset})`,
      offset,
      city,
      country,
      abbreviation: now.toFormat('ZZZZ')
    };
  }).sort((a, b) => {
    // Sort by offset first, then by name
    if (a.offset === b.offset) {
      return a.name.localeCompare(b.name);
    }
    return a.offset.localeCompare(b.offset);
  });
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