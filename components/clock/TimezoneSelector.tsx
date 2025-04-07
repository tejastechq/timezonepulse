'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Image from 'next/image';
import { getAllTimezones } from '@/lib/utils/timezone';
// Using react-use for IntersectionObserver hook for simplicity
// Ensure you have installed it: npm install react-use
import { useIntersection } from 'react-use'; 
import { sortTimezonesByRelevance, getTimezoneContext } from '@/lib/utils/timezoneSearch';
import { Timezone } from '@/store/timezoneStore';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, Clock, Briefcase } from 'lucide-react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { DateTime } from 'luxon';

// Define our own useDebounce hook that we'll use consistently
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

interface TimezoneSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (timezone: Timezone) => void;
  excludeTimezones?: string[];
  [key: string]: any; // Allow for additional props like data attributes
}

/**
 * TimezoneSelector Component
 * 
 * A modal dialog for selecting timezones with search functionality,
 * displaying timezone information including current time and business hours.
 * Uses react-window for virtualized rendering of search results.
 */
export default function TimezoneSelector({
  isOpen,
  onClose,
  onSelect,
  excludeTimezones = [],
  ...props
}: TimezoneSelectorProps) {
  const [search, setSearch] = useState('');
  
  // Fix: Use useDebounce directly
  const debouncedSearch = useDebounce(search, 150); 
  
  const BATCH_SIZE = 50; // Number of timezones to load per batch
  const [allTimezones, setAllTimezones] = useState<Timezone[]>([]); // Renamed from timezones
  const [filteredTimezones, setFilteredTimezones] = useState<Timezone[]>([]); // List currently displayed
  const [displayCount, setDisplayCount] = useState(BATCH_SIZE); // Count for progressive loading
  const [isLoadingMore, setIsLoadingMore] = useState(false); // Loading indicator state
  const loadMoreRef = useRef<HTMLDivElement>(null); // Ref for the intersection observer trigger

  const [recentTimezones] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('recentTimezones');
      return new Set(saved ? JSON.parse(saved) : []);
    } catch {
      return new Set();
    }
  });
  const [userTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'UTC';
    }
  });
  const [searchResultsCount, setSearchResultsCount] = useState(0); // Total count or search result count
  const [isLoading, setIsLoading] = useState(true); // Initial loading state
  const [error, setError] = useState<string | null>(null);
  const searchCache = useRef(new Map<string, Timezone[]>()); // Cache for search results

  // Check for reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  // Effect to detect reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    // Add listener for changes
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    try {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } catch (err) {
      // Fallback for older browsers
      return () => {};
    }
  }, []);
  
  // Animation variants with respect for reduced motion preferences
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };
  
  const contentVariants = {
    hidden: { 
      opacity: 0, 
      scale: prefersReducedMotion ? 1 : 0.95,
      y: prefersReducedMotion ? 0 : 10,
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
    },
    exit: {
      opacity: 0,
      scale: prefersReducedMotion ? 1 : 0.98,
      y: prefersReducedMotion ? 0 : -8,
      transition: {
        duration: 0.15,
        ease: [0.32, 0.72, 0, 1] // Custom easing for a nice quick exit
      }
    }
  };
  
  // Transition configuration for entering animation
  const transition = {
    type: 'spring',
    stiffness: 400,
    damping: 30,
    duration: prefersReducedMotion ? 0.1 : 0.25,
  };

  // Overlay transition - faster and optimized for smooth animation
  const overlayTransition = {
    enter: { duration: 0.15, ease: 'easeOut' },
    exit: { duration: 0.1, ease: 'easeIn' }
  };

  // Load all available timezones with error handling
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedTimezones = getAllTimezones()
       .filter(tz => !excludeTimezones.includes(tz.id));

      // Sort the initial list (e.g., Mars first)
      fetchedTimezones.sort((a, b) => {
        const aIsMars = a.id.startsWith('Mars/');
        const bIsMars = b.id.startsWith('Mars/');
        if (aIsMars && !bIsMars) return -1; // a (Mars) comes before b
        if (!aIsMars && bIsMars) return 1;  // b (Mars) comes before a
        // Keep original alphabetical/regional order for non-Mars timezones (or apply another sort if needed)
        // For now, let's assume the original `getAllTimezones` provides a reasonable default sort
        return 0;
      });

      setAllTimezones(fetchedTimezones);
      // Initially display only the first batch
      setFilteredTimezones(fetchedTimezones.slice(0, BATCH_SIZE));
      setDisplayCount(BATCH_SIZE); // Reset display count
      setSearchResultsCount(fetchedTimezones.length); // Keep total count for context
      searchCache.current.clear(); // Clear cache when base timezones change
    } catch (err) {
      setError('Error loading timezones. Please try again.');
      console.error('Error loading timezones:', err);
      setAllTimezones([]);
      setFilteredTimezones([]);
    } finally {
      setIsLoading(false);
    }
  }, [excludeTimezones]); // Dependency array

  // Memoize search results (only runs when searching)
  const memoizedFilteredTimezones = useMemo(() => {
    const searchTerm = debouncedSearch.trim();
    
    // Only perform search/cache logic if there's a search term
    if (!searchTerm) {
      return []; // Return empty, progressive loading handles non-search display
    }

    // Check cache first
    if (searchCache.current.has(searchTerm)) {
      return searchCache.current.get(searchTerm) as Timezone[];
    }

    // If not in cache, perform filtering and sorting on the *full* list
    try {
      const searchLower = searchTerm.toLowerCase();
      const filtered = allTimezones.filter(tz => // Use allTimezones here
        tz.name.toLowerCase().includes(searchLower) ||
        tz.id.toLowerCase().includes(searchLower) ||
        (tz.city && tz.city.toLowerCase().includes(searchLower)) ||
        (tz.country && tz.country.toLowerCase().includes(searchLower)) ||
        (tz.abbreviation && tz.abbreviation.toLowerCase().includes(searchLower))
      );

      // Boost Mars timezones
      const boostedFiltered = filtered.sort((a, b) => {
        const aIsMars = a.id.startsWith('Mars/');
        const bIsMars = b.id.startsWith('Mars/');
        if (aIsMars && !bIsMars) return -1; // a comes first
        if (!aIsMars && bIsMars) return 1;  // b comes first
        return 0; // Keep original relative order otherwise
      });

      // Apply relevance sorting
      const result = sortTimezonesByRelevance(boostedFiltered, searchTerm, recentTimezones);

      // Store result in cache
      searchCache.current.set(searchTerm, result);

      return result;
    } catch (err) {
      console.error('Error filtering or sorting timezones:', err);
      // Optionally clear cache on error or handle differently
      // searchCache.current.delete(searchTerm);
      return []; // Return empty on error
    }
  }, [debouncedSearch, allTimezones, recentTimezones]); // Use allTimezones

  // Effect to update displayed list based on search term or progressive loading
  useEffect(() => {
    const searchTerm = debouncedSearch.trim();
    if (searchTerm) {
      // Use cached search results for the virtualized list
      setFilteredTimezones(memoizedFilteredTimezones);
      setSearchResultsCount(memoizedFilteredTimezones.length);
      setIsLoadingMore(false); // Not loading more when searching
    } else {
      // Use progressively loaded subset for the grouped list
      // Ensure loading state is brief if slicing is fast
      setIsLoadingMore(true); 
      const timer = setTimeout(() => {
        setFilteredTimezones(allTimezones.slice(0, displayCount));
        setSearchResultsCount(allTimezones.length); // Show total count in background
        setIsLoadingMore(false);
      }, 50); // Short delay
       return () => clearTimeout(timer);
    }
  }, [debouncedSearch, memoizedFilteredTimezones, allTimezones, displayCount]);

  // Intersection Observer Logic
  const intersection = useIntersection(loadMoreRef, {
    root: null, // viewport
    rootMargin: '200px', // Load when 200px away from viewport bottom
    threshold: 0,
  });

  useEffect(() => {
    const searchTerm = debouncedSearch.trim();
    // Trigger load more only when:
    // 1. Not searching
    // 2. Observer is intersecting
    // 3. Not already loading more
    // 4. There are more items to load
    if (!searchTerm && intersection?.isIntersecting && !isLoadingMore && displayCount < allTimezones.length) {
      setIsLoadingMore(true);
      const newDisplayCount = Math.min(displayCount + BATCH_SIZE, allTimezones.length);
      // Update displayCount after a short delay to allow loading indicator to show
      // The other useEffect will handle updating filteredTimezones and setting isLoadingMore back to false
      setTimeout(() => {
          setDisplayCount(newDisplayCount);
      }, 300); // Adjust delay as needed
    }
  }, [intersection, debouncedSearch, isLoadingMore, displayCount, allTimezones.length, BATCH_SIZE]); // Added BATCH_SIZE

  // Handle timezone selection
  const handleSelect = useCallback((timezone: Timezone) => {
    try {
      // Update recent timezones
      const updatedRecent = new Set(recentTimezones);
      updatedRecent.add(timezone.id);
      if (updatedRecent.size > 10) {
        const firstItem = updatedRecent.values().next().value;
        if (firstItem) {
          updatedRecent.delete(firstItem);
        }
      }
      localStorage.setItem('recentTimezones', JSON.stringify(Array.from(updatedRecent)));
      
      onSelect(timezone);
    } catch (err) {
      console.error('Error selecting timezone:', err);
    }
  }, [onSelect, recentTimezones]);

  // Render an item in the virtualized list
  const renderListItem = useCallback(({ index, style }: ListChildComponentProps) => {
    try {
      const timezone = filteredTimezones[index];
      if (!timezone) return null;
      
      const context = getTimezoneContext(timezone, userTimezone);

      return (
        <div style={style}>
          <button
            onClick={() => handleSelect(timezone)}
            className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 
                      transition-colors duration-150 focus:outline-none focus:ring-2 
                      focus:ring-primary-500`}
            role="option"
            aria-selected="false"
            id={`timezone-option-${timezone.id}`}
            tabIndex={0}
            data-timezone-id={timezone.id}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleSelect(timezone);
                e.preventDefault();
              }
            }}
          >
                                  <div className="font-medium text-gray-900 dark:text-white flex items-center justify-between gap-2">
                                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                                      <span className="truncate">
                                        {/* Replace emoji with image */}
                                        {timezone.id === 'Mars/Jezero' && <Image src="/perseverance.png" alt="Perseverance Rover" width={16} height={16} className="inline-block w-4 h-4 mr-1 align-middle" />}
                                        {timezone.city || timezone.name}
                                      </span>
                                      {timezone.abbreviation && (
                  <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded flex-shrink-0">
                    {timezone.abbreviation}
                  </span>
                )}
                {context.isRoverLocation && (
                  <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded flex-shrink-0 animate-pulse">
                    Rover
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-500 flex-shrink-0 ml-2">{context.offset}</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-wrap items-center justify-between mt-1 gap-2">
              <span className="truncate max-w-[160px]">{timezone.id}</span>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">{context.currentTime}</span>
                </div>
                {/* Hide Business Hours for Mars timezones */}
                {context.isBusinessHours && !timezone.id.startsWith('Mars/') && (
                  <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                    <Briefcase className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs whitespace-nowrap">Business hours</span>
                  </div>
                )}
                {timezone.id.startsWith('Mars/') && (
                  <div className="flex items-center space-x-1">
                    {context.isMarsDaytime ? (
                                      <div className="flex items-center space-x-1 text-amber-500 dark:text-amber-400">
                                        <span className="flex items-center">
                                          <Image src="/mars.png" alt="Mars" width={16} height={16} className="inline-block w-4 h-4 mr-1 align-middle" />
                                          <span className="text-xs">☀️</span>
                                        </span>
                                        <span className="text-xs whitespace-nowrap">Mars Daytime</span>
                      </div>
                    ) : (
                                      <div className="flex items-center space-x-1 text-indigo-500 dark:text-indigo-400">
                                        <span className="flex items-center">
                                          <Image src="/mars.png" alt="Mars" width={16} height={16} className="inline-block w-4 h-4 mr-1 align-middle" />
                                          <span className="text-xs">🌙</span>
                                        </span>
                                        <span className="text-xs whitespace-nowrap">Mars Night</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Add Perseverance rover information */}
            {context.isRoverLocation && context.roverInfo && (
              <div className="mt-2 text-xs bg-red-50 dark:bg-red-900/10 p-2 rounded border border-red-100 dark:border-red-900/20">
                <p className="font-medium text-red-700 dark:text-red-300">{context.roverInfo.name} Rover</p>
                <p className="text-red-600/80 dark:text-red-400/80 mt-1">{context.roverInfo.mission}</p>
                <p className="text-red-600/70 dark:text-red-400/70">Landed: {context.roverInfo.landingDate}</p>
              </div>
            )}
          </button>
        </div>
      );
    } catch (err) {
      console.error('Error rendering timezone item:', err);
      return <div style={style}>Error rendering timezone</div>;
    }
  }, [filteredTimezones, handleSelect, userTimezone]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={open => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay 
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          aria-hidden="true"
        />
        
        {/* Flex container for perfect centering */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Content container with animation & glassmorphism */}
          <Dialog.Content 
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg p-6 rounded-lg shadow-xl 
                      border border-white/20 dark:border-gray-700/50 flex flex-col overflow-hidden
                      w-full max-w-md"
            style={{ 
              maxHeight: 'min(600px, calc(100vh - 2rem))'
            }}
            {...props}
          >
            {/* Header section */}
            <div className="flex-none mb-4">
              <div className="flex justify-between items-center">
                <Dialog.Title 
                  className="text-xl font-semibold text-gray-900 dark:text-white"
                >
                  Select Timezone or Region
                </Dialog.Title>

                {DateTime.now().month === 4 && DateTime.now().day === 1 && (
                  <div className="mt-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 rounded-md border border-red-200 dark:border-red-800/50 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      
                      <span className="text-red-600/90 dark:text-red-400/90">Mars timezones now available!</span>
                    </div>
                    <div className="text-xs text-red-600/80 dark:text-red-400/80 font-medium">
                      Check out the <span className="font-bold">Perseverance Rover</span> timezone at Jezero Crater
                    </div>
                  </div>
                )}

                <Dialog.Close 
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 
                            text-gray-400 hover:text-gray-500"
                  aria-label="Close timezone selector"
                >
                  <X className="w-5 h-5" />
                </Dialog.Close>
              </div>
              
              <Dialog.Description className="sr-only">
                Search and select from available timezones. Use up and down arrow keys to navigate results.
              </Dialog.Description>
              
              <div className="mt-4 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by city, country or timezone..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  aria-label="Search timezones"
                  aria-controls="timezone-list"
                  aria-expanded={isOpen}
                  role="combobox"
                  aria-autocomplete="list"
                />
              </div>
            </div>

            <div
              aria-live="polite"
              className="sr-only"
              role="status"
            >
              {searchResultsCount} {searchResultsCount === 1 ? 'timezone' : 'timezones'} found
            </div>

            {/* Content section with proper height and overflow handling */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {/* Show loading state */}
              {isLoading && (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400 h-full flex items-center justify-center">
                  Loading timezones...
                </div>
              )}
              
              {/* Show error state */}
              {error && (
                <div className="p-4 text-center text-red-500 h-full flex items-center justify-center">
                  {error}
                </div>
              )}
              
              {/* Show empty state */}
              {!isLoading && !error && filteredTimezones.length === 0 && (
                <div 
                  className="p-4 text-center text-gray-500 dark:text-gray-400 h-full flex items-center justify-center"
                  role="alert"
                >
                  No timezones or regions found
                </div>
              )}
              
              {/* Show search results */}
              {!isLoading && !error && filteredTimezones.length > 0 && debouncedSearch.trim() && (
                // When searching, display a flat list of results with fixed height
                <div 
                  className="h-[320px] overflow-hidden"
                  role="listbox"
                  aria-label="Available timezones and regions"
                  id="timezone-list"
                >
                  <List
                    height={320}
                    width="100%"
                    itemCount={filteredTimezones.length}
                    itemSize={100} // Increased item size to accommodate Mars info
                    className="timezone-list focus:outline-none"
                    overscanCount={5}
                    itemKey={index => filteredTimezones[index]?.id || index} // Add itemKey
                  >
                    {renderListItem}
                  </List>
                </div>
              )}
              
              {/* Show grouped regions when not searching (Progressive Loading) */}
              {!isLoading && !error && !debouncedSearch.trim() && (
                <div 
                  className="h-[320px] overflow-y-auto pr-1 overscroll-contain" 
                  role="listbox" 
                  aria-label="Available timezone regions"
                >
                  {/* Group the *currently displayed* timezones */}
                  {Array.from(new Set(filteredTimezones.map(tz => { 
                    const parts = tz.id.split('/');
                    return parts[0] || 'Other';
                  }))).map(continent => (
                    <div key={continent} className="mb-4">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 px-4 py-1 sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10">
                        {continent}
                      </h3>
                      <div>
                        {filteredTimezones
                          .filter(tz => {
                            const parts = tz.id.split('/');
                            return (parts[0] || 'Other') === continent;
                          })
                          .map(timezone => {
                            try {
                              const context = getTimezoneContext(timezone, userTimezone);
                              return (
                                <button
                                  key={timezone.id}
                                  onClick={() => handleSelect(timezone)}
                                  className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 
                                            transition-colors duration-150 focus:outline-none focus:ring-2 
                                            focus:ring-primary-500 border-b border-gray-200 dark:border-gray-700`}
                                  role="option"
                                  aria-selected="false"
                                  id={`timezone-option-${timezone.id}`}
                                  tabIndex={0}
                                  data-timezone-id={timezone.id}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      handleSelect(timezone);
                                      e.preventDefault();
                                    }
                                  }}
                                >
            <div className="font-medium text-gray-900 dark:text-white flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <span className="truncate">
                  {/* Replace emoji with image */}
                  {timezone.id === 'Mars/Jezero' && <Image src="/perseverance.png" alt="Perseverance Rover" width={16} height={16} className="inline-block w-4 h-4 mr-1 align-middle" />}
                  {timezone.city || timezone.name}
                </span>
                {timezone.abbreviation && (
                                        <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded flex-shrink-0">
                                          {timezone.abbreviation}
                                        </span>
                                      )}
                                      {context.isRoverLocation && (
                                        <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded flex-shrink-0 animate-pulse">
                                          Rover
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-sm text-gray-500 flex-shrink-0 ml-2">{context.offset}</span>
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-wrap items-center justify-between mt-1 gap-2">
                                    <span className="truncate max-w-[160px]">{timezone.id}</span>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                      <div className="flex items-center space-x-1">
                                        <Clock className="w-4 h-4 flex-shrink-0" />
                                        <span className="whitespace-nowrap">{context.currentTime}</span>
                                      </div>
                                      {/* Hide Business Hours for Mars timezones */}
                                      {context.isBusinessHours && !timezone.id.startsWith('Mars/') && (
                                        <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                                          <Briefcase className="w-4 h-4 flex-shrink-0" />
                                          <span className="text-xs whitespace-nowrap">Business hours</span>
                                        </div>
                                      )}
                                      {timezone.id.startsWith('Mars/') && (
                                        <div className="flex items-center space-x-1">
                                          {context.isMarsDaytime ? (
                                            <div className="flex items-center space-x-1 text-amber-500 dark:text-amber-400">
                                              <span className="flex items-center">
                                                <Image src="/mars.png" alt="Mars" width={16} height={16} className="inline-block w-4 h-4 mr-1 align-middle" />
                                                <span className="text-xs">☀️</span>
                                              </span>
                                              <span className="text-xs whitespace-nowrap">Mars Daytime</span>
                                            </div>
                                          ) : (
                                            <div className="flex items-center space-x-1 text-indigo-500 dark:text-indigo-400">
                                              <span className="flex items-center">
                                                <Image src="/mars.png" alt="Mars" width={16} height={16} className="inline-block w-4 h-4 mr-1 align-middle" />
                                                <span className="text-xs">🌙</span>
                                              </span>
                                              <span className="text-xs whitespace-nowrap">Mars Night</span>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Add Perseverance rover information */}
                                  {context.isRoverLocation && context.roverInfo && (
                                    <div className="mt-2 text-xs bg-red-50 dark:bg-red-900/10 p-2 rounded border border-red-100 dark:border-red-900/20">
                                      <p className="font-medium text-red-700 dark:text-red-300">{context.roverInfo.name} Rover</p>
                                      <p className="text-red-600/80 dark:text-red-400/80 mt-1">{context.roverInfo.mission}</p>
                                      <p className="text-red-600/70 dark:text-red-400/70">Landed: {context.roverInfo.landingDate}</p>
                                    </div>
                                  )}
                                </button>
                              );
                            } catch (err) {
                              console.error('Error rendering grouped timezone:', err, timezone);
                              return null;
                            }
                          }).filter(Boolean)}
                      </div>
                    </div>
                  ))}
                  {/* Sentinel element for Intersection Observer */}
                  { !isLoadingMore && displayCount < allTimezones.length && (
                     <div ref={loadMoreRef} className="h-1"></div>
                  )}
                  {/* Loading Indicator */}
                  { isLoadingMore && (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      Loading more...
                    </div>
                  )}
                   {/* Message when all loaded */}
                   { !isLoadingMore && displayCount >= allTimezones.length && filteredTimezones.length > BATCH_SIZE && (
                     <div className="p-4 text-center text-sm text-gray-400 dark:text-gray-500">
                       All timezones loaded.
                     </div>
                   )}
                </div>
              )}
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
