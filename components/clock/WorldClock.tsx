'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { useTimezoneStore, useSelectedDate, Timezone } from '@/store/timezoneStore'; // Removed ViewMode, Added Timezone type
import { DateTime } from 'luxon';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
// Removed useView import
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import dynamic from 'next/dynamic';
// Removed MobileTimezoneCard import
// Removed DraggableTimezoneCard import
import { getLocalTimezone } from '@/lib/utils/timezone';
import { useWebVitals, optimizeLayoutStability } from '@/lib/utils/performance';
import { trackPerformance } from '@/app/sentry';
import { MobileMenu } from '@/components/MobileMenu'; // Import MobileMenu for the header
import { ArrowLeftCircle, Plus, Calendar, X } from 'lucide-react'; // Removed CalendarDays, Menu icon
// Removed unused imports
// import AnalogClock from './AnalogClock'; // Removed missing AnalogClock import
import { createPortal } from 'react-dom';
import { Calendar as CalendarUI } from '../ui/calendar';


/**
 * Using original view components directly
 * Components are optimized using React's built-in memoization techniques
 */
// Removed OptimizedListView dynamic import
// Import the new MobileV2ListView
const MobileV2ListView = dynamic(() => import('../views/MobileV2ListView'), {
  loading: () => <ViewPlaceholder />
});

// Dynamically import less critical components to reduce initial load
// Removed ViewSwitcher dynamic import
const TimezoneSelector = dynamic(() => import('./TimezoneSelector'), { ssr: false }); // Keep TimezoneSelector import

// Import the DatePicker (Dynamic import remains) - Keep for mobile modal
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
// Define the props interface for TimeZonePulse
interface TimeZonePulseProps {
  skipHeading?: boolean;
  disableMobileDetection?: boolean;
  forceMobileV2View?: boolean; // Add new prop
}

export default function TimeZonePulse({ skipHeading = false, disableMobileDetection = false, forceMobileV2View = false }: TimeZonePulseProps) {
  // Hydration safe rendering
  const [isClient, setIsClient] = useState(false);
  
  // Use web vitals reporting hook
  useWebVitals();

  // Get state from the timezone store
  const {
    timezones,
    addTimezone, // Keep this for the onSelect handler
    removeTimezone,
    highlightedTime,
    setHighlightedTime,
    localTimezone,
    selectedDate,
    setSelectedDate,
    resetToToday,
    isTimezoneSelectorOpen, // Get global state
    openTimezoneSelector,   // Get global action
    closeTimezoneSelector  // Get global action
    // Removed showMarsExplanation - no longer needed for tooltip logic
  } = useTimezoneStore();

  // Removed view state from context

  // State for the current time - initialize with null to avoid hydration mismatch
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  
  // State for showing the add timezone form
  const [showAddForm, setShowAddForm] = useState(false); // Keep for now, might be removable later
  // Remove local state: const [isSelectorOpen, setIsSelectorOpen] = useState(false); // State for the modal

  // State for tracking if the component has mounted
  const [mounted, setMounted] = useState(false);

  // Removed expandedTimezoneId state

  // Track when the LCP (Largest Contentful Paint) container is ready
  const [lcpReady, setLcpReady] = useState(false); // Keep LCP tracking
  
  // Use reduced motion setting for accessibility
  const prefersReducedMotion = useReducedMotion();

  // Detect mobile dimensions based on user feedback (iPhone-like or smaller)
  const isMobilePortraitOrSmaller = useMediaQuery('(max-width: 430px) and (max-height: 932px)');
  const isMobileLandscapeOrSmaller = useMediaQuery('(max-width: 932px) and (max-height: 430px)');
  // Allow bypassing mobile detection if disableMobileDetection is true
  const isConsideredMobile = disableMobileDetection ? false : (isMobilePortraitOrSmaller || isMobileLandscapeOrSmaller);
  
  // Refs for animation and layout stability
  const clockContainerRef = useRef<HTMLDivElement>(null);
  const timeColumnsContainerRef = useRef<HTMLDivElement>(null);
  const lcpContentRef = useRef<HTMLDivElement>(null);

  // Near the top of the component, after the local time state
  // Make sure we track the real-time current date
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  // New state for mobile DatePicker modal
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);

  // New state for calendar modal
  const [showCalendarModal, setShowCalendarModal] = useState(false);

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

    for (let i = 0; i < 48; i++) { // Keep time slot generation
      slots.push(startOfDay.plus({ minutes: i * 30 }).toJSDate());
    }

    return slots;
  }, [currentTime, selectedDate]);

  // Handle time selection for highlighting with optimized callback
  const handleTimeSelection = useCallback((time: Date | null) => {
    // Set the highlighted time
    setHighlightedTime(time);
    // Removed view switching logic
  }, [setHighlightedTime]); // Removed currentView, setCurrentView dependencies

  // Removed handleMobileTimeSelection
  // Removed handleToggleExpand

  // Round a date to the nearest increment (in minutes) - Keep this utility
  const roundToNearestIncrement = useCallback((date: Date, increment: number) => {
    const dt = DateTime.fromJSDate(date);
    const minutes = dt.minute;
    // Use Math.floor to always round down to the start of the interval
    const roundedMinutes = Math.floor(minutes / increment) * increment; 
    return dt.set({ minute: roundedMinutes, second: 0, millisecond: 0 }).toJSDate();
  }, []);

  // Callback to handle adding a timezone from the selector (using global state)
  const handleAddTimezone = useCallback((timezone: Timezone) => {
    addTimezone(timezone);
    closeTimezoneSelector(); // Use global action to close
  }, [addTimezone, closeTimezoneSelector]);

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
      {/* --- Mobile/Simplified Header Controls --- */}
      <div className="flex justify-between items-center mb-4 px-2 py-1 bg-card rounded-lg shadow-sm border border-border">
        <div className="flex items-center gap-2">
          <button 
            onClick={openTimezoneSelector} 
            className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground"
            aria-label="Add timezone"
            title="Add Timezone"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isViewingFutureDate && (
            <button
              type="button"
              onClick={resetToToday} 
              className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground"
              aria-label="Return to today"
              title="Return to Today"
            >
              <ArrowLeftCircle size={20} />
            </button>
          )}
          <button 
            onClick={() => setShowCalendarModal(true)}
            className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground"
            aria-label="Select date"
            title="Select Date"
          >
            <Calendar size={20} />
          </button>
        </div>
      </div>
      {/* --- End Header Controls --- */}
      
      {/* Calendar Modal (portal, matches sidebar) */}
      {showCalendarModal && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCalendarModal(false)} />
          <div className="relative z-10">
            <CalendarUI
              selectedDate={selectedDate}
              onDateSelect={(date) => {
                setSelectedDate(date);
                setShowCalendarModal(false);
              }}
              onClose={() => setShowCalendarModal(false)}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Simplified View Rendering - Always render MobileV2ListView */}
      <div className="flex justify-center w-full">
        <Suspense fallback={<ViewPlaceholder />}>
          {/* --- Always Render MobileV2 Forced View --- */}
          <AnimatePresence mode="wait">
            <motion.div
              key="mobilev2-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="time-columns-container w-full"
            >
              <MobileV2ListView
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
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </div>

      {/* Timezone Selection Modal (using global state) */}
      <AnimatePresence>
        {isTimezoneSelectorOpen && (
          <TimezoneSelector
            key="timezone-selector"
            isOpen={isTimezoneSelectorOpen}
            onClose={closeTimezoneSelector}
            onSelect={handleAddTimezone}
            excludeTimezones={[localTimezone, ...timezones.map(tz => tz.id)]}
            data-timezone-selector
          />
        )}
      </AnimatePresence>
    </div>
  );
}
