'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { useTimezoneStore, ViewMode, useSelectedDate, Timezone } from '@/store/timezoneStore'; // Added Timezone type
import { DateTime } from 'luxon';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useView } from '@/app/contexts/ViewContext';
import dynamic from 'next/dynamic';
import { ListView, ClocksView, DigitalView } from '../views';
import { getLocalTimezone } from '@/lib/utils/timezone';
import { useWebVitals, optimizeLayoutStability } from '@/lib/utils/performance';
import { trackPerformance } from '@/app/sentry';
// Removed duplicate Timezone import
import { CalendarDays, ArrowLeftCircle, Plus } from 'lucide-react'; // Added Plus icon

// Define interfaces for the view components based on their implementations
interface ListViewProps {
  selectedTimezones: Timezone[];
  userLocalTimezone: string;
  timeSlots: Date[];
  localTime: Date | null;
  highlightedTime: Date | null;
  handleTimeSelection: (time: Date | null) => void;
  timezoneFormat: string;
  currentDate: Date | null;
}

interface ClocksViewProps {
  selectedTimezones: Timezone[];
  userLocalTimezone: string;
  setSelectedTimezones: (timezones: Timezone[]) => void;
}

interface DigitalViewProps {
  selectedTimezones: Timezone[];
  userLocalTimezone: string;
  setSelectedTimezones: (timezones: Timezone[]) => void;
}

/**
 * Using original view components directly
 * Components are optimized using React's built-in memoization techniques
 */
const OptimizedListView = dynamic(() => import('../views/ListView'), { 
  loading: () => <ViewPlaceholder />
});
const OptimizedClocksView = ClocksView;
const OptimizedDigitalView = DigitalView;

// Dynamically import less critical components to reduce initial load
const ViewSwitcher = dynamic(() => import('./ViewSwitcher'), { ssr: true });
const TimezoneSelector = dynamic(() => import('./TimezoneSelector'), { ssr: false }); // Added TimezoneSelector import

// Import the DatePicker
const DatePicker = dynamic(() => import('../ui/date-picker').then(mod => mod.DatePicker), {
  ssr: false
});

/**
 * Placeholder component shown during loading to prevent layout shifts
 */
const ViewPlaceholder = () => (
  <div className="w-full min-h-[400px] flex items-center justify-center">
    <div className="animate-pulse flex flex-col items-center justify-center">
      <div className="h-24 w-24 rounded-full bg-gray-300 dark:bg-gray-700"></div>
      <div className="h-4 w-48 mt-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
    </div>
  </div>
);

// Define the props interface for TimeZonePulse
interface TimeZonePulseProps {
  skipHeading?: boolean;
}

export default function TimeZonePulse({ skipHeading = false }: TimeZonePulseProps) {
  // Hydration safe rendering
  const [isClient, setIsClient] = useState(false);
  
  // Use web vitals reporting hook
  useWebVitals();

  // Get state from the timezone store
  const {
    timezones,
    addTimezone,
    removeTimezone,
    highlightedTime,
    setHighlightedTime,
    localTimezone,
    selectedDate,
    setSelectedDate,
    resetToToday
  } = useTimezoneStore();

  // Get view state from the view context
  const { currentView, setCurrentView } = useView();
  
  // State for the current time - initialize with null to avoid hydration mismatch
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  
  // State for showing the add timezone form
  const [showAddForm, setShowAddForm] = useState(false); // Keep for now, might be removable later
  const [isSelectorOpen, setIsSelectorOpen] = useState(false); // State for the modal

  // State for tracking if the component has mounted
  const [mounted, setMounted] = useState(false);
  
  // State for tracking if the view is transitioning
  const [isViewTransitioning, setIsViewTransitioning] = useState(false);

  // Track when the LCP (Largest Contentful Paint) container is ready
  const [lcpReady, setLcpReady] = useState(false);
  
  // Use reduced motion setting for accessibility
  const prefersReducedMotion = useReducedMotion();
  
  // Refs for animation and layout stability
  const clockContainerRef = useRef<HTMLDivElement>(null);
  const timeColumnsContainerRef = useRef<HTMLDivElement>(null);
  const lcpContentRef = useRef<HTMLDivElement>(null);

  // Near the top of the component, after the local time state
  // Make sure we track the real-time current date
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  // Hydration safe initialization
  useEffect(() => {
    setIsClient(true);
    setCurrentTime(new Date());
    setCurrentDate(new Date());
  }, []);

  // Optimize layout stability when component mounts
  useEffect(() => {
    if (clockContainerRef.current) {
      optimizeLayoutStability(clockContainerRef.current, 600);
    }
    
    // Mark the component as an LCP candidate for priority
    if (lcpContentRef.current) {
      lcpContentRef.current.setAttribute('fetchpriority', 'high');
    }
  }, []);

  // Track when the component content is ready for LCP measurement
  useEffect(() => {
    if (mounted && lcpContentRef.current) {
      const lcpMeasureStart = performance.now();
      setLcpReady(true);
      
      // Add a marker to track LCP
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          // Track in Sentry or other monitoring
          trackPerformance('lcp', lastEntry.startTime);
        }
      });
      
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      
      return () => {
        observer.disconnect();
      };
    }
  }, [mounted]);

  // Update the current time every second, but only after initial render
  useEffect(() => {
    setMounted(true);
    
    // Delay timer initialization to improve TTI
    const timerDelay = setTimeout(() => {
      const timer = setInterval(() => {
        const now = new Date();
        setCurrentTime(now);
        
        // If the date changes, update the current date as well
        const currentStoredDate = currentDate ? new Date(currentDate) : null;
        if (currentStoredDate && currentStoredDate.getDate() !== now.getDate()) {
          setCurrentDate(now);
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }, 1000); // Delay by 1 second
    
    return () => clearTimeout(timerDelay);
  }, [currentDate]);

  // Check if we're viewing a date other than today
  const isViewingFutureDate = useMemo(() => {
    if (!selectedDate) return false;
    
    const today = DateTime.local().startOf('day');
    const selected = DateTime.fromJSDate(selectedDate).startOf('day');
    
    return !selected.equals(today);
  }, [selectedDate]);

  // Generate time slots for the selected date at 30-minute intervals
  const timeSlots = useMemo(() => {
    if (!currentTime) return [];
    
    const slots = [];
    const dateToUse = selectedDate || currentTime;
    const date = DateTime.fromJSDate(dateToUse);
    const startOfDay = date.startOf('day');

    for (let i = 0; i < 48; i++) {
      slots.push(startOfDay.plus({ minutes: i * 30 }).toJSDate());
    }

    return slots;
  }, [currentTime, selectedDate]);

  // Handle time selection for highlighting with optimized callback
  const handleTimeSelection = useCallback((time: Date | null) => {
    // Set the highlighted time
    setHighlightedTime(time);
    
    // If the view is set to something other than list, switch to list view
    // to show the highlighted time
    if (currentView !== 'list') {
      setCurrentView('list');
    }
  }, [currentView, setCurrentView, setHighlightedTime]); // Added setHighlightedTime dependency

  // Round a date to the nearest increment (in minutes)
  const roundToNearestIncrement = useCallback((date: Date, increment: number) => {
    const dt = DateTime.fromJSDate(date);
    const minutes = dt.minute;
    // Use Math.floor to always round down to the start of the interval
    const roundedMinutes = Math.floor(minutes / increment) * increment; 
    return dt.set({ minute: roundedMinutes, second: 0, millisecond: 0 }).toJSDate();
  }, []);

  // Callback to handle adding a timezone from the selector
  const handleAddTimezone = useCallback((timezone: Timezone) => {
    addTimezone(timezone);
    setIsSelectorOpen(false);
  }, [addTimezone]);

  // Handle view transition animation - respect user's reduced motion setting
  useEffect(() => {
    // Use our data attribute approach to check if reduced motion is preferred
    const prefersReducedMotionCSS = document.documentElement.dataset.prefersReducedMotion === 'true' || 
                                    (prefersReducedMotion === true);
    
    if (!prefersReducedMotionCSS) {
      setIsViewTransitioning(true);
      const timer = setTimeout(() => {
        setIsViewTransitioning(false);
      }, 300); // Match this with your CSS transition duration
      return () => clearTimeout(timer);
    } else {
      // Skip animation for users who prefer reduced motion
      setIsViewTransitioning(false);
    }
  }, [currentView, prefersReducedMotion]);

  // Handle hydration mismatch by rendering placeholder until client-side render
  if (!isClient || !currentTime) {
    return (
      <div 
        ref={clockContainerRef}
        className="w-full transition-all duration-300 ease-in-out mx-auto px-6"
      >
        <div className="min-h-96 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="clock-container w-full max-w-screen-xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-4 h-12">
        <ViewSwitcher />
        <div className="flex items-center space-x-2">
          {/* Add Timezone Button */}
          <button
            onClick={() => setIsSelectorOpen(true)}
            className="p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            aria-label="Add Timezone"
            title="Add Timezone" // Tooltip for clarity
          >
            <Plus size={20} />
          </button>

          {/* Date Picker */}
          <DatePicker
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            minDate={new Date()} // Prevent selecting dates in the past
          />
          
          {/* Show reset to today button if viewing a future date */}
          {isViewingFutureDate && (
            <button
              type="button"
              onClick={resetToToday}
              className="flex items-center gap-1 px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              aria-label="Return to today"
            >
              <ArrowLeftCircle className="h-4 w-4" />
              <span className="text-sm">Today</span>
            </button>
          )}
        </div>
      </div>

      {/* Dynamic View Rendering - Using Suspense for better loading experience */}
      <div className="flex justify-center w-full">
        <Suspense fallback={<ViewPlaceholder />}>
          {currentView === 'list' && (
            <div
              ref={timeColumnsContainerRef}
              className={`time-columns-container w-full transition-opacity ${isViewTransitioning ? 'opacity-0' : 'opacity-100'}`}
            >
              <OptimizedListView
                selectedTimezones={timezones}
                userLocalTimezone={localTimezone}
                timeSlots={timeSlots}
                localTime={currentTime}
                highlightedTime={highlightedTime}
                handleTimeSelection={handleTimeSelection}
                roundToNearestIncrement={roundToNearestIncrement}
                removeTimezone={removeTimezone}
                currentDate={currentDate}
              />
            </div>
          )}

          {currentView === 'analog' && (
            <div className={`w-full ${isViewTransitioning ? 'view-transition-exit-active' : 'view-transition-enter-active'}`}>
              <OptimizedClocksView
                selectedTimezones={timezones}
                userLocalTimezone={localTimezone}
                setSelectedTimezones={(newTimezones) => {
                  // Check if we're removing a timezone (new list is shorter than current list)
                  if (newTimezones.length < timezones.length) {
                    // Find the timezone(s) that were removed
                    const currentIds = new Set(timezones.map(tz => tz.id));
                    const newIds = new Set(newTimezones.map(tz => tz.id));
                    
                    // Get IDs that are in current but not in new (these were removed)
                    currentIds.forEach(id => {
                      if (!newIds.has(id) && id !== localTimezone) {
                        removeTimezone(id);
                      }
                    });
                  } else {
                    // Adding new timezones (original implementation)
                    // Filter out the local timezone
                    const nonLocalTimezones = newTimezones.filter(tz => tz.id !== localTimezone);
                    
                    // Get only new timezones that aren't already in the store
                    const existingIds = new Set(timezones.map(tz => tz.id));
                    const newTimezoneItems = nonLocalTimezones.filter(tz => !existingIds.has(tz.id));
                    
                    // Add each new timezone
                    newTimezoneItems.forEach(tz => {
                      addTimezone(tz);
                    });
                  }
                }}
              />
            </div>
          )}

          {currentView === 'digital' && (
            <div className={`w-full ${isViewTransitioning ? 'view-transition-exit-active' : 'view-transition-enter-active'}`}>
              <OptimizedDigitalView
                selectedTimezones={timezones}
                userLocalTimezone={localTimezone}
                setSelectedTimezones={(newTimezones) => {
                  // Check if we're removing a timezone (new list is shorter than current list)
                  if (newTimezones.length < timezones.length) {
                    // Find the timezone(s) that were removed
                    const currentIds = new Set(timezones.map(tz => tz.id));
                    const newIds = new Set(newTimezones.map(tz => tz.id));
                    
                    // Get IDs that are in current but not in new (these were removed)
                    currentIds.forEach(id => {
                      if (!newIds.has(id) && id !== localTimezone) {
                        removeTimezone(id);
                      }
                    });
                  } else {
                    // Adding new timezones (original implementation)
                    // Filter out the local timezone
                    const nonLocalTimezones = newTimezones.filter(tz => tz.id !== localTimezone);
                    
                    // Get only new timezones that aren't already in the store
                    const existingIds = new Set(timezones.map(tz => tz.id));
                    const newTimezoneItems = nonLocalTimezones.filter(tz => !existingIds.has(tz.id));
                    
                    // Add each new timezone
                    newTimezoneItems.forEach(tz => {
                      addTimezone(tz);
                    });
                  }
                }}
              />
            </div>
          )}
        </Suspense>
      </div>

      {/* Timezone Selection Modal */}
      <AnimatePresence>
        {isSelectorOpen && (
          <TimezoneSelector
            key="desktop-timezone-selector"
            isOpen={true}
            onClose={() => setIsSelectorOpen(false)}
            onSelect={handleAddTimezone}
            excludeTimezones={[localTimezone, ...timezones.map(tz => tz.id)]}
            data-timezone-selector
          />
        )}
      </AnimatePresence>
    </div>
  );
}
