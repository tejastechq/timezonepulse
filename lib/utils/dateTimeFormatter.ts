import { DateTime } from 'luxon';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * Format date according to the user's date format preference
 * 
 * @param date JavaScript Date object or Luxon DateTime
 * @param format Optional override for the date format 
 * @returns Formatted date string
 */
export function formatDate(date: Date | DateTime, format?: string): string {
  // Get settings from the store
  const store = useSettingsStore.getState();
  
  // Convert to Luxon DateTime if needed
  const dateTime = date instanceof DateTime ? date : DateTime.fromJSDate(date);
  
  // Use provided format or user preference from settings
  const dateFormat = format || store.dateFormat;
  
  // Format the date based on settings
  switch (dateFormat) {
    case 'MM/DD/YYYY':
      return dateTime.toFormat('MM/dd/yyyy');
    case 'DD/MM/YYYY':
      return dateTime.toFormat('dd/MM/yyyy');
    case 'YYYY-MM-DD':
      return dateTime.toFormat('yyyy-MM-dd');
    default:
      return dateTime.toFormat('MM/dd/yyyy');
  }
}

/**
 * Format time according to the user's time format preference
 * 
 * @param date JavaScript Date object or Luxon DateTime
 * @param includeSeconds Whether to include seconds in the time
 * @param format Optional override for the time format ('12h' or '24h')
 * @returns Formatted time string
 */
export function formatTime(
  date: Date | DateTime, 
  includeSeconds?: boolean, 
  format?: '12h' | '24h'
): string {
  // Get settings from the store
  const store = useSettingsStore.getState();
  
  // Convert to Luxon DateTime if needed
  const dateTime = date instanceof DateTime ? date : DateTime.fromJSDate(date);
  
  // Use provided values or user preferences from settings
  const timeFormat = format || store.timeFormat;
  const showSeconds = includeSeconds !== undefined ? includeSeconds : store.showSeconds;
  
  // Format the time based on settings
  if (timeFormat === '12h') {
    return dateTime.toFormat(showSeconds ? 'h:mm:ss a' : 'h:mm a');
  } else {
    return dateTime.toFormat(showSeconds ? 'HH:mm:ss' : 'HH:mm');
  }
}

/**
 * Format date and time according to the user's preferences
 * 
 * @param date JavaScript Date object or Luxon DateTime
 * @param includeSeconds Whether to include seconds in the time
 * @returns Formatted date and time string
 */
export function formatDateTime(date: Date | DateTime, includeSeconds?: boolean): string {
  // Get settings from the store
  const store = useSettingsStore.getState();
  
  // Convert to Luxon DateTime if needed
  const dateTime = date instanceof DateTime ? date : DateTime.fromJSDate(date);
  
  // Format date and time parts separately
  const formattedDate = formatDate(dateTime);
  const formattedTime = formatTime(dateTime, includeSeconds);
  
  // Combine them
  return `${formattedDate} ${formattedTime}`;
}

/**
 * Check if a time is within business hours
 * 
 * @param date JavaScript Date object or Luxon DateTime
 * @param timezone Optional timezone
 * @returns Boolean indicating if time is within business hours
 */
export function isBusinessHours(date: Date | DateTime, timezone?: string): boolean {
  // Get settings from the store
  const store = useSettingsStore.getState();
  
  // Convert to Luxon DateTime with the specified timezone
  const dateTime = date instanceof DateTime 
    ? (timezone ? date.setZone(timezone) : date)
    : (timezone ? DateTime.fromJSDate(date).setZone(timezone) : DateTime.fromJSDate(date));
  
  // Get the hour of the day (0-23)
  const hour = dateTime.hour;
  
  // Check if it's a weekday (1-5 in Luxon is Monday to Friday)
  const isWeekday = dateTime.weekday >= 1 && dateTime.weekday <= 5;
  
  // Check if the time is within business hours and on a weekday
  return isWeekday && 
    hour >= store.businessHoursStart && 
    hour < store.businessHoursEnd;
}

/**
 * Check if a time is within night hours
 * 
 * @param date JavaScript Date object or Luxon DateTime
 * @param timezone Optional timezone
 * @returns Boolean indicating if time is within night hours
 */
export function isNightHours(date: Date | DateTime, timezone?: string): boolean {
  // Get settings from the store
  const store = useSettingsStore.getState();
  
  // Convert to Luxon DateTime with the specified timezone
  const dateTime = date instanceof DateTime 
    ? (timezone ? date.setZone(timezone) : date)
    : (timezone ? DateTime.fromJSDate(date).setZone(timezone) : DateTime.fromJSDate(date));
  
  // Get the hour of the day (0-23)
  const hour = dateTime.hour;

  // Night hours can span across midnight
  if (store.nightHoursStart > store.nightHoursEnd) {
    // Example: 22:00 - 06:00 (10 PM - 6 AM)
    return hour >= store.nightHoursStart || hour < store.nightHoursEnd;
  } else {
    // Example: 00:00 - 06:00 (12 AM - 6 AM)
    return hour >= store.nightHoursStart && hour < store.nightHoursEnd;
  }
}

/**
 * Check if a date is on a weekend
 * 
 * @param date JavaScript Date object or Luxon DateTime
 * @param timezone Optional timezone
 * @returns Boolean indicating if date is on a weekend
 */
export function isWeekend(date: Date | DateTime, timezone?: string): boolean {
  // Convert to Luxon DateTime with the specified timezone
  const dateTime = date instanceof DateTime 
    ? (timezone ? date.setZone(timezone) : date)
    : (timezone ? DateTime.fromJSDate(date).setZone(timezone) : DateTime.fromJSDate(date));
  
  // Check if it's a weekend (6-7 in Luxon is Saturday and Sunday)
  return dateTime.weekday >= 6;
}
