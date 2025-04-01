import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for time updates that minimizes re-renders
 * Returns a Date object that updates at the specified interval
 * 
 * @param interval Milliseconds between updates (default: 1000ms)
 * @returns Current Date object
 */
export default function useTimeUpdate(interval = 1000) {
  // Use a ref to maintain initial time between renders
  const initialTimeRef = useRef<Date>(new Date());
  
  // State to store the current time
  const [time, setTime] = useState<Date>(() => {
    try {
      return new Date();
    } catch (error) {
      console.error('Error creating Date in useTimeUpdate:', error);
      // Return a fallback date if creation fails
      return initialTimeRef.current;
    }
  });
  
  useEffect(() => {
    // Ensure the interval is a positive number
    const safeInterval = Math.max(100, interval);
    
    const timer = setInterval(() => {
      try {
        const now = new Date();
        
        // Verify it's a valid date before updating state
        if (now instanceof Date && !isNaN(now.getTime())) {
          setTime(now);
        } else {
          console.error('Invalid Date created in useTimeUpdate timer');
        }
      } catch (error) {
        console.error('Error updating time in useTimeUpdate:', error);
      }
    }, safeInterval);
    
    return () => clearInterval(timer);
  }, [interval]);
  
  // Ensure we always return a valid Date
  if (!(time instanceof Date) || isNaN(time.getTime())) {
    return initialTimeRef.current;
  }
  
  return time;
} 