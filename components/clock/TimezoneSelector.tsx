'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getAllTimezones } from '@/lib/utils/timezone';
import { sortTimezonesByRelevance, getTimezoneContext } from '@/lib/utils/timezoneSearch';
import { Timezone } from '@/store/timezoneStore';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, Clock, Briefcase } from 'lucide-react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { useDebounce } from '@/lib/hooks';

// Fallback implementation of useDebounce in case the import fails
const useLocalDebounce = <T,>(value: T, delay: number): T => {
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
  // Use local debounce as fallback if the imported hook fails
  const debouncedSearch = useDebounce ? useDebounce(search, 300) : useLocalDebounce(search, 300);
  const [timezones, setTimezones] = useState<Timezone[]>([]);
  const [filteredTimezones, setFilteredTimezones] = useState<Timezone[]>([]);
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
  const [searchResultsCount, setSearchResultsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const allTimezones = getAllTimezones();
      const availableTimezones = allTimezones.filter(tz => 
        !excludeTimezones.includes(tz.id)
      );
      setTimezones(availableTimezones);
      setFilteredTimezones(availableTimezones);
      setSearchResultsCount(availableTimezones.length);
    } catch (err) {
      setError('Error loading timezones. Please try again.');
      console.error('Error loading timezones:', err);
      setTimezones([]);
      setFilteredTimezones([]);
    } finally {
      setIsLoading(false);
    }
  }, [excludeTimezones]);

  // Memoize filtered timezones to prevent unnecessary re-renders
  const memoizedFilteredTimezones = useMemo(() => {
    try {
      if (!debouncedSearch.trim()) {
        return timezones;
      }

      const searchLower = debouncedSearch.toLowerCase();
      const filtered = timezones.filter(tz => 
        tz.name.toLowerCase().includes(searchLower) || 
        tz.id.toLowerCase().includes(searchLower) ||
        (tz.city && tz.city.toLowerCase().includes(searchLower)) ||
        (tz.country && tz.country.toLowerCase().includes(searchLower)) ||
        (tz.abbreviation && tz.abbreviation.toLowerCase().includes(searchLower)) ||
        (tz.region && tz.region.toLowerCase().includes(searchLower))
      );

      return sortTimezonesByRelevance(filtered, debouncedSearch, recentTimezones);
    } catch (err) {
      console.error('Error filtering timezones:', err);
      return [];
    }
  }, [debouncedSearch, timezones, recentTimezones]);

  // Update filtered timezones and search results count when memoized value changes
  useEffect(() => {
    setFilteredTimezones(memoizedFilteredTimezones);
    setSearchResultsCount(memoizedFilteredTimezones.length);
  }, [memoizedFilteredTimezones]);

  // Handle timezone selection
  const handleSelect = useCallback((timezone: Timezone) => {
    try {
      // Update recent timezones
      const updatedRecent = new Set(recentTimezones);
      updatedRecent.add(timezone.id);
      if (updatedRecent.size > 10) {
        const firstItem = updatedRecent.values().next().value;
        updatedRecent.delete(firstItem);
      }
      localStorage.setItem('recentTimezones', JSON.stringify([...updatedRecent]));
      
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
            className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 
                      transition-colors duration-150 focus:outline-none focus:ring-2 
                      focus:ring-primary-500"
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
                <span className="truncate">{timezone.city || timezone.name}</span>
                {timezone.abbreviation && (
                  <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded flex-shrink-0">
                    {timezone.abbreviation}
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
                {context.isBusinessHours && (
                  <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                    <Briefcase className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs whitespace-nowrap">Business hours</span>
                  </div>
                )}
              </div>
            </div>
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
      <AnimatePresence mode="sync" onExitComplete={() => null}>
        {isOpen && (
          <Dialog.Portal forceMount>
            {/* Fixed backdrop blur layer with fade-out on exit */}
            <motion.div 
              className="fixed inset-0 backdrop-blur-sm z-40"
              aria-hidden="true"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
            />
            
            {/* Animated backdrop overlay (opacity only) */}
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={overlayVariants}
              transition={overlayTransition}
            >
              <Dialog.Overlay 
                className="fixed inset-0 bg-black/50 z-40"
                aria-hidden="true"
              />
            </motion.div>
            
            {/* Flex container for perfect centering */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Content container with animation */}
              <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={contentVariants}
                transition={transition}
                layout
                className="w-full max-w-md will-change-transform"
              >
                <Dialog.Content 
                  className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl 
                            border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
                  style={{ 
                    width: '100%',
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

                      <Dialog.Close 
                        className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 
                                  text-gray-400 hover:text-gray-500"
                        aria-label="Close dialog"
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
                      <div className="h-[320px] overflow-hidden">
                        <List
                          height={320}
                          width="100%"
                          itemCount={filteredTimezones.length}
                          itemSize={80}
                          className="timezone-list focus:outline-none"
                          tabIndex={0}
                          role="listbox"
                          aria-label="Available timezones and regions"
                          id="timezone-list"
                          overscanCount={5}
                        >
                          {renderListItem}
                        </List>
                      </div>
                    )}
                    
                    {/* Show grouped regions when not searching */}
                    {!isLoading && !error && filteredTimezones.length > 0 && !debouncedSearch.trim() && (
                      // When not searching, display grouped by region with proper scrolling
                      <div 
                        className="h-[320px] overflow-y-auto pr-1 overscroll-contain" 
                        role="listbox" 
                        aria-label="Available timezone regions"
                      >
                        {/* Group timezones by region */}
                        {Array.from(new Set(filteredTimezones.map(tz => tz.region || 'Other'))).map(region => (
                          <div key={region} className="mb-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 px-4 py-1 sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10">
                              {region}
                            </h3>
                            <div>
                              {filteredTimezones
                                .filter(tz => (tz.region || 'Other') === region)
                                .map(timezone => {
                                  try {
                                    const context = getTimezoneContext(timezone, userTimezone);
                                    return (
                                      <button
                                        key={timezone.id}
                                        onClick={() => handleSelect(timezone)}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 
                                                  transition-colors duration-150 focus:outline-none focus:ring-2 
                                                  focus:ring-primary-500 border-b border-gray-200 dark:border-gray-700"
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
                                            <span className="truncate">{timezone.city || timezone.name}</span>
                                            {timezone.abbreviation && (
                                              <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded flex-shrink-0">
                                                {timezone.abbreviation}
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
                                            {context.isBusinessHours && (
                                              <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                                                <Briefcase className="w-4 h-4 flex-shrink-0" />
                                                <span className="text-xs whitespace-nowrap">Business hours</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
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
                      </div>
                    )}
                  </div>
                </Dialog.Content>
              </motion.div>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
} 