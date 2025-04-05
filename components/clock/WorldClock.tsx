'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { useTimezoneStore, useSelectedDate, Timezone } from '@/store/timezoneStore'; // Removed ViewMode, Added Timezone type
import { DateTime } from 'luxon';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
// Removed useView import
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import dynamic from 'next/dynamic';
// Removed ListView, ClocksView, DigitalView imports
// Removed MobileTimezoneCard import
// Removed DraggableTimezoneCard import
import { getLocalTimezone } from '@/lib/utils/timezone';
import { useWebVitals, optimizeLayoutStability } from '@/lib/utils/performance';
import { trackPerformance } from '@/app/sentry';
import { MobileMenu } from '@/components/MobileMenu'; // Import MobileMenu for the header
import { ArrowLeftCircle, Plus, Calendar, X } from 'lucide-react'; // Removed CalendarDays, Menu icon
// Removed unused imports
import AnalogClock from './AnalogClock'; // Keep AnalogClock if used elsewhere, otherwise remove later


// Removed ListViewProps, ClocksViewProps, DigitalViewProps interfaces

/**
 * Using original view components directly
 * Components are optimized using React's built-in memoization techniques
 */
// Removed OptimizedListView dynamic import
// Import the new MobileV2ListView
const MobileV2ListView = dynamic(() => import('../views/MobileV2ListView'), {
  loading: () => <ViewPlaceholder />
});
// Removed OptimizedClocksView assignment
// Removed OptimizedDigitalView assignment

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
      {/* Simplified Header Rendering - Always show mobile-style header controls */}
      {/* Since MobileV2ListView is forced, use the controls suitable for it */}
      <header className="flex items-center justify-between mb-4 h-12">
          <MobileMenu />
          <h1 className="font-bold uppercase text-xl">TimeZonePulse</h1>
          <div className="flex items-center space-x-2">
             {/* Add Timezone Button (Mobile FAB exists, but keep this for consistency?) */}
              <button
                onClick={openTimezoneSelector} // Use global action
                className="p-2 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors text-white" // Added text-white for visibility if needed
                aria-label="Add Timezone"
              >
               <Plus size={20} />
             </button>
            {/* Calendar Button (Mobile) */}
            <button
              onClick={() => setShowDatePickerModal(true)} // Connect to modal state
              className="p-2 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors text-white" // Added text-white
              aria-label="Open Calendar"
            >
              <Calendar size={20} />
            </button>
          </div>
        </header>
      {/* Removed Desktop Header Controls block */}
      {/* End of Simplified Header Rendering */}


      {/* Simplified View Rendering - Always render MobileV2ListView */}
      <div className="flex justify-center w-full">
        <Suspense fallback={<ViewPlaceholder />}>
          {/* --- Always Render MobileV2 Forced View --- */}
          <AnimatePresence mode="wait">
            <motion.div
              key="mobilev2-list" // Keep key for animation consistency
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
                  handleTimeSelection={handleTimeSelection} // Keep this prop
                  roundToNearestIncrement={roundToNearestIncrement} // Keep this prop
                  removeTimezone={removeTimezone} // Keep this prop
                  currentDate={currentDate} // Keep this prop
                />
              </motion.div>
            </AnimatePresence>
          {/* Removed isConsideredMobile block (DraggableTimezoneCard) */}
          {/* Removed standard desktop view block (ListView, ClocksView, DigitalView) */}
        </Suspense>
      </div>

      {/* Mobile DatePicker Modal - Keep this as it's triggered by the simplified header */}
      <AnimatePresence>
        {isConsideredMobile && showDatePickerModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-lg shadow-lg p-4 w-full max-w-sm border border-border m-auto"
              style={{ maxHeight: '90vh' }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Select Date</h3>
                <button 
                  onClick={() => setShowDatePickerModal(false)}
                  className="p-1 rounded-full hover:bg-muted transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="mb-4">
                <DatePicker
                  selectedDate={selectedDate}
                  onDateChange={(date) => {
                    setSelectedDate(date);
                    setShowDatePickerModal(false);
                  }}
                  minDate={new Date()} // Prevent selecting dates in the past
                />
              </div>
              
              {isViewingFutureDate && (
                <button
                  type="button"
                  onClick={() => {
                    resetToToday();
                    setShowDatePickerModal(false);
                  }}
                  className="w-full flex items-center justify-center gap-1 px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                  aria-label="Return to today"
                >
                  <ArrowLeftCircle className="h-4 w-4" />
                  <span>Today</span>
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

       {/* Timezone Selection Modal (using global state) */}
       <AnimatePresence>
         {isTimezoneSelectorOpen && ( // Use global state
           <TimezoneSelector
             key="timezone-selector"
             isOpen={isTimezoneSelectorOpen} // Pass global state
             onClose={closeTimezoneSelector} // Use global action
             onSelect={handleAddTimezone}
             excludeTimezones={[localTimezone, ...timezones.map(tz => tz.id)]}
            data-timezone-selector
          />
        )}
      </AnimatePresence>
    </div>
  );
}
