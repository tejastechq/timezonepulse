/**
 * Timezone utilities for the TimeZonePulse application
 * 
 * This file provides helper functions for working with timezones,
 * including calculations for business hours, UTC offsets, and
 * DST (Daylight Saving Time) detection.
 */

import { DateTime } from 'luxon';
import type { Timezone } from '@/store/timezoneStore';

/**
 * Format a time for a specific timezone
 * @param time Time to format (defaults to now)
 * @param timezone IANA timezone name (e.g., 'America/New_York')
 * @param format Format string
 */
export function formatTimeForTimezone(time = new Date(), timezone: string, format = 'hh:mm a'): string {
  try {
    return DateTime.fromJSDate(time).setZone(timezone).toFormat(format);
  } catch (error) {
    console.error(`Error formatting time for timezone ${timezone}:`, error);
    return '';
  }
}

/**
 * Get current time in a specific timezone
 * @param timezone IANA timezone name
 */
export function getCurrentTimeInTimezone(timezone: string): Date {
  try {
    return DateTime.now().setZone(timezone).toJSDate();
  } catch (error) {
    console.error(`Error getting current time for timezone ${timezone}:`, error);
    return new Date();
  }
}

/**
 * Check if a time is within business hours (9 AM - 5 PM) in a specific timezone
 * @param time Time to check (defaults to now)
 * @param timezone IANA timezone name
 */
export function isWithinBusinessHours(time = new Date(), timezone: string): boolean {
  try {
    const localTime = DateTime.fromJSDate(time).setZone(timezone);
    const hour = localTime.hour;
    return hour >= 9 && hour < 17;
  } catch (error) {
    console.error(`Error checking business hours for timezone ${timezone}:`, error);
    return false;
  }
}

/**
 * Get timezone abbreviation (e.g., EST, PST)
 * @param timezone IANA timezone name
 */
export function getTimezoneAbbreviation(timezone: string): string {
  try {
    return DateTime.now().setZone(timezone).toFormat('ZZZZ');
  } catch (error) {
    console.error(`Error getting abbreviation for timezone ${timezone}:`, error);
    return '';
  }
}

/**
 * Get timezone offset in hours (e.g., +5, -8)
 * @param timezone IANA timezone name
 */
export function getTimezoneOffset(timezone: string): number {
  try {
    // Luxon stores offset in minutes, convert to hours
    return DateTime.now().setZone(timezone).offset / 60;
  } catch (error) {
    console.error(`Error getting offset for timezone ${timezone}:`, error);
    return 0;
  }
}

/**
 * Converts a time from one timezone to another
 * @param time Time to convert (defaults to now)
 * @param fromTimezone Source timezone
 * @param toTimezone Target timezone
 */
export function convertTime(time = new Date(), fromTimezone: string, toTimezone: string): Date {
  try {
    return DateTime.fromJSDate(time)
      .setZone(fromTimezone)
      .setZone(toTimezone)
      .toJSDate();
  } catch (error) {
    console.error(
      `Error converting time from ${fromTimezone} to ${toTimezone}:`,
      error
    );
    return new Date();
  }
}

/**
 * Checks if the current time is within business hours for a given timezone
 * Business hours are defined as 9:00 to 17:00 local time
 */
export const isBusinessHours = (timezone: string): boolean => {
  const now = DateTime.now().setZone(timezone);
  const hour = now.hour;
  return hour >= 9 && hour < 17;
};

/**
 * Gets the UTC offset for a timezone in hours as a string
 * e.g., "+02:00" or "-05:00"
 */
export const getUtcOffset = (timezone: string): string => {
  const now = DateTime.now().setZone(timezone);
  return now.toFormat('Z');
};

/**
 * Checks if a timezone is currently observing Daylight Saving Time
 */
export const isDaylightSavingTime = (timezone: string): boolean => {
  const now = DateTime.now().setZone(timezone);
  return now.isInDST;
};

/**
 * Returns a list of common business hour timezones
 */
export const getCommonTimezones = (): Timezone[] => {
  return [
    {
      id: 'America/New_York',
      name: 'Eastern Time',
      city: 'New York',
      country: 'United States',
      offset: '-5',
      abbreviation: 'ET'
    },
    {
      id: 'America/Los_Angeles',
      name: 'Pacific Time',
      city: 'Los Angeles',
      country: 'United States',
      offset: '-8',
      abbreviation: 'PT'
    },
    {
      id: 'Europe/London',
      name: 'Greenwich Mean Time',
      city: 'London',
      country: 'United Kingdom',
      offset: '0',
      abbreviation: 'GMT'
    },
    {
      id: 'Asia/Tokyo',
      name: 'Japan Standard Time',
      city: 'Tokyo',
      country: 'Japan',
      offset: '9',
      abbreviation: 'JST'
    }
  ];
};

/**
 * Formats a date for a specific timezone
 */
export const formatDateForTimezone = (
  date: Date,
  timezone: string,
  format: string = 'HH:mm:ss'
): string => {
  return DateTime.fromJSDate(date).setZone(timezone).toFormat(format);
};
