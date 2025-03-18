import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names with clsx and applies tailwind-merge
 * This utility helps combine conditional classes without conflicts
 * 
 * @param inputs - Class names to be combined
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date object to a string with the specified format
 * 
 * @param date - Date to format
 * @param format - Format string (default: 'HH:mm')
 * @returns Formatted date string
 */
export function formatDate(date: Date, format: string = 'HH:mm'): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  if (format === 'HH:mm') {
    return `${hours}:${minutes}`;
  } else if (format === 'h:mm a') {
    const hour12 = hours === '00' ? 12 : (parseInt(hours) > 12 ? parseInt(hours) - 12 : parseInt(hours));
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  }
  
  return `${hours}:${minutes}`;
}

/**
 * Debounces a function call
 * 
 * @param fn - Function to debounce
 * @param ms - Debounce delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  ms = 300
) {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
}

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds
 * 
 * @param fn - Function to throttle
 * @param wait - Throttle wait time in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait = 300
) {
  let inThrottle: boolean = false;
  let lastFn: ReturnType<typeof setTimeout>;
  let lastTime: number = 0;
  
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      fn.apply(this, args);
      lastTime = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFn);
      lastFn = setTimeout(() => {
        if (Date.now() - lastTime >= wait) {
          fn.apply(this, args);
          lastTime = Date.now();
        }
      }, Math.max(wait - (Date.now() - lastTime), 0));
    }
  };
} 