import { useState, useEffect } from 'react';

/**
 * useMediaQuery hook
 * 
 * A custom React hook that detects if a media query matches.
 * Useful for conditional rendering based on screen size or other media features.
 * 
 * @param query - A valid CSS media query string (e.g. '(max-width: 768px)')
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Default to false on the server or if no window object exists
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Make sure we're in the browser environment
    if (typeof window === 'undefined') {
      return;
    }

    // Create a media query list
    const mediaQuery = window.matchMedia(query);
    
    // Initial check
    setMatches(mediaQuery.matches);

    // Create handler function
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener
    mediaQuery.addEventListener('change', handleChange);
    
    // Clean up
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
} 