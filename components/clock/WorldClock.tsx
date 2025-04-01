'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { useTimezoneStore, ViewMode, useSelectedDate, Timezone } from '@/store/timezoneStore'; // Added Timezone type
import { DateTime } from 'luxon';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useView } from '@/app/contexts/ViewContext';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import dynamic from 'next/dynamic';
import { ListView, ClocksView, DigitalView } from '../views';
import MobileTimezoneCard from '../mobile/MobileTimezoneCard'; // Import MobileTimezoneCard
import DraggableTimezoneCard from '../mobile/DraggableTimezoneCard'; // Import DraggableTimezoneCard
import { getLocalTimezone } from '@/lib/utils/timezone';
import { useWebVitals, optimizeLayoutStability } from '@/lib/utils/performance';
import { trackPerformance } from '@/app/sentry';
import { MobileMenu } from '@/components/MobileMenu'; // Import MobileMenu for the header
import { CalendarDays, ArrowLeftCircle, Plus, Calendar, X } from 'lucide-react'; // Removed Menu icon, added MobileMenu component instead

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
  // Removed setSelectedTimezones from interface
}

interface DigitalViewProps {
  selectedTimezones: Timezone[];
  userLocalTimezone: string;
  // Removed setSelectedTimezones from interface
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
  
  // State for managing expanded mobile card
  const [expandedTimezoneId, setExpandedTimezoneId] = useState<string | null>(null);

  // Track when the LCP (Largest Contentful Paint) container is ready
  const [lcpReady, setLcpReady] = useState(false);
  
  // Use reduced motion setting for accessibility
  const prefersReducedMotion = useReducedMotion();

  // Detect mobile dimensions based on user feedback (iPhone-like or smaller)
  const isMobilePortraitOrSmaller = useMediaQuery('(max-width: 430px) and (max-height: 932px)');
  const isMobileLandscapeOrSmaller = useMediaQuery('(max-width: 932px) and (max-height: 430px)');
  const isConsideredMobile = isMobilePortraitOrSmaller || isMobileLandscapeOrSmaller;
  
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

    for (let i = 0; i < 48; i++) {
      slots.push(startOfDay.plus({ minutes: i * 30 }).toJSDate());
    }

    return slots;
  }, [currentTime, selectedDate]);

  // Handle time selection for highlighting with optimized callback
  const handleTimeSelection = useCallback((time: Date | null) => {
    // Set the highlighted time
    setHighlightedTime(time);

    // Restore view switching logic
    if (currentView !== 'list') {
      setCurrentView('list');
    }
  }, [currentView, setCurrentView, setHighlightedTime]);

  // Mobile-specific time selection handler that also collapses the card
  const handleMobileTimeSelection = useCallback((time: Date | null) => {
    setHighlightedTime(time);
    setExpandedTimezoneId(null); // Collapse card on selection
  }, [setHighlightedTime]);

  // Handler to toggle expanded state for mobile cards
  const handleToggleExpand = useCallback((timezoneId: string) => {
    setExpandedTimezoneId(prevId => (prevId === timezoneId ? null : timezoneId));
  }, []);

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
      {/* Conditional Header Rendering */}
      {isConsideredMobile ? (
        // Mobile Header (Moved from app/page.tsx and adapted)
        <header className="flex items-center justify-between mb-4 h-12">
          <MobileMenu />
          <h1 className="font-bold uppercase text-xl">TimeZonePulse</h1>
          <div className="flex items-center space-x-2">
            {/* Add Timezone Button (Mobile FAB exists, but keep this for consistency?) */}
             <button
               onClick={() => setIsSelectorOpen(true)}
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
      ) : (
        // Desktop Header Controls
        <div className="flex justify-between items-center mb-4 h-12">
          <ViewSwitcher />
          <div className="flex items-center space-x-2">
            <button // Desktop Add Button
              onClick={() => setIsSelectorOpen(true)}
              className="p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              aria-label="Add Timezone"
              title="Add Timezone" // Tooltip for clarity
            >
              <Plus size={20} />
            </button>
            <DatePicker // Desktop Date Picker
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
      )}
      {/* End of Conditional Header Rendering */}


      {/* Dynamic View Rendering - Using Suspense for better loading experience */}
      <div className="flex justify-center w-full"> {/* Removed redundant mobile controls from here */}
        <Suspense fallback={<ViewPlaceholder />}>
          {/* Render mobile view or desktop view based on detection */}
          {isConsideredMobile ? (
            // Mobile View: List of DraggableTimezoneCards (assuming this is the intended mobile card)
            // Need to import DraggableTimezoneCard if not already done
            <div className="w-full space-y-4 pb-20">
              <AnimatePresence initial={false}> {/* Keep animation wrapper */}
                {timezones.map((tz: Timezone) => ( // Ensure type is specified
                  <DraggableTimezoneCard // Use DraggableTimezoneCard if that's the correct one for mobile list
                    key={tz.id}
                    timezone={tz}
                    isLocal={tz.id === localTimezone} // Pass isLocal prop
                    onRemove={removeTimezone} // Pass remove function
                    // Pass down other necessary props
                    localTime={currentTime}
                    highlightedTime={highlightedTime}
                    timeSlots={timeSlots}
                    handleTimeSelection={handleMobileTimeSelection}
                    roundToNearestIncrement={roundToNearestIncrement}
                    isExpanded={expandedTimezoneId === tz.id}
                    onToggleExpand={handleToggleExpand}
                  />
                ))}
              </AnimatePresence>
              {timezones.length === 0 && ( // Add empty state message for mobile
                <div className="text-center text-gray-400 mt-10">
                  <p>No timezones added yet.</p>
                  <button
                    onClick={() => setIsSelectorOpen(true)}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Add Timezone
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Desktop View: Switch between List, Analog, Digital with Framer Motion
            <AnimatePresence mode="wait">
              {currentView === 'list' && (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  ref={timeColumnsContainerRef} // Keep ref if needed, though maybe better on the view itself?
                  className="time-columns-container w-full" // Removed transition classes
                >
                  <OptimizedListView
                    selectedTimezones={timezones}
                    userLocalTimezone={localTimezone}
                    timeSlots={timeSlots}
                    localTime={currentTime}
                    highlightedTime={highlightedTime}
                    handleTimeSelection={handleTimeSelection} // Use original handler
                    roundToNearestIncrement={roundToNearestIncrement}
                    removeTimezone={removeTimezone}
                    currentDate={currentDate}
                  />
                </motion.div>
              )}
              {currentView === 'analog' && (
                  <motion.div
                    key="analog"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full" // Removed transition classes
                  >
                    <OptimizedClocksView
                      selectedTimezones={timezones}
                      userLocalTimezone={localTimezone}
                    />
                  </motion.div>
              )}
              {currentView === 'digital' && (
                  <motion.div
                    key="digital"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full" // Removed transition classes
                  >
                    <OptimizedDigitalView
                      selectedTimezones={timezones}
                      userLocalTimezone={localTimezone}
                    />
                  </motion.div>
              )}
            </AnimatePresence>
          )}
        </Suspense>
      </div>

      {/* Mobile Floating Action Button (FAB) for adding timezone - only in portrait mode */}
      {isConsideredMobile && isMobilePortraitOrSmaller && (
        <button
          onClick={() => setIsSelectorOpen(true)}
          className="fixed right-4 bottom-4 p-4 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
          aria-label="Add Timezone"
          title="Add Timezone"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Mobile DatePicker Modal */}
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

      {/* Timezone Selection Modal */}
      <AnimatePresence>
        {isSelectorOpen && (
          <TimezoneSelector
            key="timezone-selector"
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
