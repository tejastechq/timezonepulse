import { useState, useEffect } from 'react';

/**
 * Custom hook for time updates that minimizes re-renders
 * Returns a Date object that updates at the specified interval
 * 
 * @param interval Milliseconds between updates (default: 1000ms)
 * @returns Current Date object
 */
export default function useTimeUpdate(interval = 1000) {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, interval);
    
    return () => clearInterval(timer);
  }, [interval]);
  
  return time;
} 