import { DateTime } from "luxon";

/**
 * Utility functions for timezone operations in the World Clock application
 */

// Interface for timezone information
export interface TimezoneInfo {
  id: string;
  name: string;
  city: string;
  abbreviation: string;
  offset: number;
  isDST: boolean;
  utcOffset: string;
}

/**
 * Gets the current time in a specific timezone
 * @param timezone The timezone to get the time for
 * @returns DateTime object in the specified timezone
 */
export function getCurrentTimeInTimezone(timezone: string): DateTime {
  return DateTime.now().setZone(timezone);
}

/**
 * Formats a DateTime object according to the specified format
 * @param dateTime The DateTime object to format
 * @param format The format string (Luxon format)
 * @returns Formatted time string
 */
export function formatDateTime(dateTime: DateTime, format: string = "hh:mm a"): string {
  return dateTime.toFormat(format);
}

/**
 * Checks if the provided time is within business hours (9 AM - 5 PM local time)
 * @param dateTime The DateTime object to check
 * @returns Boolean indicating if the time is within business hours
 */
export function isBusinessHours(
  dateTime: DateTime, 
  start: number = 9, 
  end: number = 17
): boolean {
  const hour = dateTime.hour;
  const isWeekday = dateTime.weekday >= 1 && dateTime.weekday <= 5;
  return isWeekday && hour >= start && hour < end;
}

/**
 * Gets the UTC offset string for a timezone (e.g., "+02:00", "-05:00")
 * @param timezone The timezone to get the offset for
 * @returns Formatted UTC offset string
 */
export function getUtcOffset(timezone: string): string {
  const now = DateTime.now().setZone(timezone);
  return now.toFormat("ZZ");
}

/**
 * Checks if a timezone is currently observing Daylight Saving Time
 * @param timezone The timezone to check
 * @returns Boolean indicating if DST is active
 */
export function isDaylightSavingTime(timezone: string): boolean {
  const now = DateTime.now().setZone(timezone);
  return now.isInDST;
}

/**
 * Gets abbreviation for a timezone (e.g., "EST", "PDT")
 * @param timezone The timezone to get the abbreviation for
 * @returns Timezone abbreviation
 */
export function getTimezoneAbbreviation(timezone: string): string {
  const now = DateTime.now().setZone(timezone);
  return now.toFormat("ZZZZ");
}

/**
 * Gets a list of common timezones with their information
 * @returns Array of timezone information objects
 */
export function getCommonTimezones(): TimezoneInfo[] {
  const timezones = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Asia/Tokyo",
    "Australia/Sydney",
    "Pacific/Auckland"
  ];
  
  return timezones.map(tz => {
    const now = DateTime.now().setZone(tz);
    const city = tz.split("/").pop()?.replace("_", " ") || tz;
    
    return {
      id: tz,
      name: tz,
      city,
      abbreviation: getTimezoneAbbreviation(tz),
      offset: now.offset,
      isDST: isDaylightSavingTime(tz),
      utcOffset: getUtcOffset(tz)
    };
  });
} 