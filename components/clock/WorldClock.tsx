'use client';

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { useTimezoneStore } from '@/store/timezoneStore';
import { DateTime } from 'luxon';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useView } from '@/app/contexts/ViewContext';
import { useDashboard } from '@/app/contexts/DashboardContext';
import dynamic from 'next/dynamic';
import { ListView, ClocksView, DigitalView } from '../views';
import { getLocalTimezone } from '@/lib/utils/timezone';
import { useWebVitalsReport, optimizeLayoutStability } from '@/lib/utils/performance';
import { trackPerformance } from '@/app/sentry';
import type { Timezone } from '@/store/timezoneStore';
// Import the static server component heading
import WorldClockHeading from './WorldClockHeading';

// Define interfaces for the view components based on their implementations
interface ListViewProps {
  selectedTimezones: Timezone[];
  userLocalTimezone: string;
  timeSlots: Date[];
  localTime: Date | null;
  highlightedTime: Date | null;
  handleTimeSelection: (time: Date | null) => void;
  roundToNearestIncrement: (date: Date, increment: number) => Date;
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
 * NOTE: Using original components directly
 * Million.js optimization is applied via next.config.js with skip filters
 * to exclude components with hook compatibility issues
 */
const OptimizedListView = ListView;
const OptimizedClocksView = ClocksView;
const OptimizedDigitalView = DigitalView;

// Dynamically import less critical components to reduce initial load
const ViewSwitcher = dynamic(() => import('./ViewSwitcher'), { ssr: true });
const DashboardToggle = dynamic(() => import('./DashboardToggle'), { ssr: true });
const ContextualInfo = dynamic(() => import('./ContextualInfo'), { ssr: false });
const PersonalNotes = dynamic(() => import('./PersonalNotes'), { ssr: false });
const NotificationButton = dynamic(() => import('./NotificationButton'), { ssr: false });

/**
 * Placeholder component shown during loading to prevent layout shifts
 */
const ViewPlaceholder = () => (
  <div 
    className="w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
    aria-hidden="true"
    role="presentation"
    style={{ 
      height: "600px",  // Reserve exact space to prevent CLS
      contain: "layout" // Optimize paint performance
    }}
  />
);

// Define the props interface for WorldClock
interface WorldClockProps {
  skipHeading?: boolean;
}

/**
 * Main WorldClock component that manages the clock display
 * Optimized for core web vitals (LCP, FID, CLS)
 */
export default function WorldClock({ skipHeading = false }: WorldClockProps) {
  // Hydration safe rendering
  const [isClient, setIsClient] = useState(false);
  
  // Use web vitals reporting hook
  useWebVitalsReport();

  // Get state from the timezone store
  const {
    timezones,
    addTimezone,
    removeTimezone,
    highlightedTime,
    setHighlightedTime,
    localTimezone
  } = useTimezoneStore();

  // Get view state from the view context
  const { currentView, setCurrentView } = useView();

  // Get dashboard state from the dashboard context
  const { isDashboardVisible } = useDashboard();

  // State for the current time - initialize with null to avoid hydration mismatch
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  
  // State for showing the add timezone form
  const [showAddForm, setShowAddForm] = useState(false);
  
  // State for tracking if the component has mounted
  const [mounted, setMounted] = useState(false);
  
  // State for tracking if the dashboard is animating
  const [isDashboardAnimating, setIsDashboardAnimating] = useState(false);
  
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

  // Hydration safe initialization
  useEffect(() => {
    setIsClient(true);
    setCurrentTime(new Date());
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
        setCurrentTime(new Date());
      }, 1000);
      
      return () => clearInterval(timer);
    }, 1000); // Delay by 1 second
    
    return () => clearTimeout(timerDelay);
  }, []);

  // Generate time slots for the current day at 30-minute intervals
  const timeSlots = useMemo(() => {
    if (!currentTime) return [];
    
    const slots = [];
    const now = DateTime.fromJSDate(currentTime);
    const startOfDay = now.startOf('day');

    for (let i = 0; i < 48; i++) {
      slots.push(startOfDay.plus({ minutes: i * 30 }).toJSDate());
    }

    return slots;
  }, [currentTime]);

  // Handle time selection for highlighting with optimized callback
  const handleTimeSelection = useCallback((time: Date | null) => {
    // Set the highlighted time
    setHighlightedTime(time);
    
    // If the view is set to something other than list, switch to list view
    // to show the highlighted time
    if (currentView !== 'list') {
      setCurrentView('list');
    }
  }, [currentView, setCurrentView]);

  // Round a date to the nearest increment (in minutes)
  const roundToNearestIncrement = useCallback((date: Date, increment: number) => {
    const dt = DateTime.fromJSDate(date);
    const minutes = dt.minute;
    const roundedMinutes = Math.round(minutes / increment) * increment;
    return dt.set({ minute: roundedMinutes, second: 0, millisecond: 0 }).toJSDate();
  }, []);

  // Handle dashboard animation
  useEffect(() => {
    if (isDashboardVisible(currentView)) {
      setIsDashboardAnimating(true);
    } else {
      const timer = setTimeout(() => {
        setIsDashboardAnimating(false);
      }, 300); // Match this with your CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [isDashboardVisible, currentView]);

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
      <div className="p-8 w-full">
        {!skipHeading && <WorldClockHeading />}
        <ViewPlaceholder />
      </div>
    );
  }

  return (
    <div
      className="p-8 w-full"
      ref={clockContainerRef}
      role="application"
      aria-label="World Clock Application"
    >
      {!skipHeading && <WorldClockHeading />}

      {/* View Switcher and Notification Button */}
      <div className="flex justify-between items-center mb-4 h-12">
        <ViewSwitcher />
        <NotificationButton />
      </div>

      {/* Dashboard Toggle Button */}
      <DashboardToggle />

      {/* Dynamic View Rendering - Using Suspense for better loading experience */}
      <div className="flex justify-center w-full">
        <Suspense fallback={<ViewPlaceholder />}>
          {currentView === 'list' && (
            <div
              ref={timeColumnsContainerRef}
              className={`isolate overflow-hidden ${isViewTransitioning ? 'view-transition-exit-active' : 'view-transition-enter-active'}`}
              style={{
                contain: 'paint layout',
                isolation: 'isolate',
                position: 'relative'
              }}
            >
              <OptimizedListView
                selectedTimezones={timezones}
                userLocalTimezone={localTimezone}
                timeSlots={timeSlots}
                localTime={currentTime}
                highlightedTime={highlightedTime}
                handleTimeSelection={handleTimeSelection}
                roundToNearestIncrement={roundToNearestIncrement}
              />
            </div>
          )}

          {currentView === 'clocks' && (
            <div className={`w-full ${isViewTransitioning ? 'view-transition-exit-active' : 'view-transition-enter-active'}`}>
              <OptimizedClocksView
                selectedTimezones={timezones}
                userLocalTimezone={localTimezone}
                setSelectedTimezones={(newTimezones) => {
                  // Filter out the local timezone
                  const nonLocalTimezones = newTimezones.filter(tz => tz.id !== localTimezone);
                  
                  // Get only new timezones that aren't already in the store
                  const existingIds = new Set(timezones.map(tz => tz.id));
                  const newTimezoneItems = nonLocalTimezones.filter(tz => !existingIds.has(tz.id));
                  
                  // Add each new timezone
                  newTimezoneItems.forEach(tz => {
                    addTimezone(tz);
                  });
                }}
              />
            </div>
          )}

          {currentView === 'digital' && (
            <div className={`w-full ${isViewTransitioning ? 'view-transition-exit-active' : 'view-transition-enter-active'}`}>
              <OptimizedDigitalView
                selectedTimezones={timezones}
                userLocalTimezone={localTimezone}
                setSelectedTimezones={(updatedTimezones) => {
                  // This is a workaround since we don't have a direct setTimezones function
                  // We'll use removeTimezone to achieve the same effect
                  const timezonesToRemove = timezones.filter(
                    tz => !updatedTimezones.some(updatedTz => updatedTz.id === tz.id)
                  );
                  
                  timezonesToRemove.forEach(tz => removeTimezone(tz.id));
                }}
              />
            </div>
          )}
        </Suspense>
      </div>

      {/* Dashboard with Animation - Using AnimatePresence for smooth transitions */}
      <AnimatePresence>
        {(isDashboardVisible(currentView) || isDashboardAnimating) && (
          <motion.div
            className={`
              flex justify-center w-full mt-8 pb-12
              ${isDashboardVisible(currentView) ? 'dashboard-enter-active' : 'dashboard-exit-active'}
            `}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ 
              duration: document.documentElement.dataset.prefersReducedMotion === 'true' || prefersReducedMotion ? 0 : 0.3 
            }}
            aria-hidden={!isDashboardVisible(currentView)}
          >
            <div
              className={`
                grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full max-w-7xl dashboard-container
                ${isDashboardVisible(currentView) ? 'visible' : ''}
              `}
              role="region"
              aria-label="Information for Timezones"
            >
              {/* Info for Local Time */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col">
                <h3 className="font-bold text-center mb-2">Your Time</h3>
                <div className="mt-2">
                  <ContextualInfo timezone={localTimezone} />
                  <PersonalNotes timezone={localTimezone} />
                </div>
              </div>

              {/* Info for Selected Timezones */}
              {timezones
                .filter(tz => tz.id !== localTimezone)
                // Ensure each timezone ID is unique by filtering duplicates
                .filter((tz, index, self) => index === self.findIndex(t => t.id === tz.id))
                .map((tz) => (
                  <div
                    key={tz.id}
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col"
                  >
                    <h3 className="font-bold text-center mb-2">{tz.name.split('/').pop()?.replace('_', ' ') || tz.name}</h3>
                    <div className="mt-2">
                      <ContextualInfo timezone={tz.id} />
                      <PersonalNotes timezone={tz.id} />
                    </div>
                  </div>
                ))
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Navigation Help - Only show in list view */}
      {currentView === 'list' && (
        <div className="fixed bottom-4 left-4 text-sm text-gray-400 bg-gray-800 p-2 rounded-lg shadow-lg opacity-0 hover:opacity-100 transition-opacity duration-200">
          <p>Keyboard Navigation:</p>
          <ul className="list-disc list-inside">
            <li>↑↓: Navigate 30 minutes</li>
            <li>Page Up/Down: Navigate hours</li>
            <li>Home: Current time</li>
          </ul>
        </div>
      )}
    </div>
  );
} 