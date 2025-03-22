'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { useTimezoneStore, ViewMode } from '@/store/timezoneStore';
import { DateTime } from 'luxon';
// Import only what we need from framer-motion initially
import { useReducedMotion } from 'framer-motion';
import { useView } from '@/app/contexts/ViewContext';
import { useIntegrations } from '@/app/contexts/IntegrationsContext';
import dynamic from 'next/dynamic';
import HydrationSafeguard from '@/app/components/HydrationSafeguard';
// Import views dynamically instead of directly
const ListView = dynamic(() => import('../views/ListView'), { ssr: true });
const ClocksView = dynamic(() => import('../views/ClocksView'), { ssr: true });
const DigitalView = dynamic(() => import('../views/DigitalView'), { ssr: true });
import { getLocalTimezone } from '@/lib/utils/timezone';
import { useWebVitals, optimizeLayoutStability } from '@/lib/utils/performance';
import { trackPerformance } from '@/app/sentry';
import type { Timezone } from '@/store/timezoneStore';
// Import the static server component heading
import WorldClockHeading from './WorldClockHeading';

// Dynamically import additional framer-motion components as needed
const AnimatePresence = dynamic(() => import('framer-motion').then(mod => ({ default: mod.AnimatePresence })), { ssr: true });
const Motion = dynamic(() => import('framer-motion').then(mod => ({ default: mod.motion })), { ssr: true });

// Dynamically import the WorldMapSelector with no SSR
const WorldMapSelector = dynamic(() => import('../map/WorldMapSelector'), { ssr: false });

// Define interfaces for the view components based on their implementations
interface ListViewProps {
  selectedTimezones: Timezone[];
  userLocalTimezone: string;
  timeSlots: Date[];
  localTime: Date | null;
  highlightedTime: Date | null;
  handleTimeSelection: (time: Date | null) => void;
  roundToNearestIncrement: (date: Date, increment: number) => Date;
  removeTimezone?: (id: string) => void;
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
const OptimizedListView = ListView;
const OptimizedClocksView = ClocksView;
const OptimizedDigitalView = DigitalView;

// Dynamically import all non-critical components
const ViewSwitcher = dynamic(() => import('./ViewSwitcher'), { ssr: false });
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

export default function WorldClock({ skipHeading = false }: WorldClockProps) {
  // No need for isClient state with HydrationSafeguard
  
  // Use web vitals reporting hook
  useWebVitals();

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
  
  // State for the current time - initialize with null to avoid hydration mismatch
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  
  // State for showing the add timezone form
  const [showAddForm, setShowAddForm] = useState(false);
  
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

  // Add state for map visibility
  const [showMap, setShowMap] = useState(false);
  
  // Track if map data is preloaded
  const [isMapDataPreloaded, setIsMapDataPreloaded] = useState(false);
  
  // Preload the map data
  useEffect(() => {
    // Only preload once
    if (isMapDataPreloaded) return;
    
    // Start preloading map data after initial render
    const preloadTimer = setTimeout(() => {
      const preloadMapData = async () => {
        try {
          // Preload the map component
          import('../map/WorldMapSelector')
            .then(() => {
              // After component is loaded, preload the map data
              fetch('/data/world-110m.json', { priority: 'low' })
                .catch(() => {
                  // Silently handle failure - we'll retry when actually needed
                  console.log('Map data preloading failed, will retry when needed');
                });
            });
          
          setIsMapDataPreloaded(true);
        } catch (error) {
          // Silently fail - we'll retry when the map is actually shown
          console.log('Map preloading failed, will retry when needed');
        }
      };
      
      preloadMapData();
    }, 3000); // Delay by 3 seconds after initial page load
    
    return () => clearTimeout(preloadTimer);
  }, [isMapDataPreloaded]);
  
  // Toggle map visibility
  const toggleMap = useCallback(() => {
    setShowMap(prev => !prev);
  }, []);
  
  // Hydration safe initialization moved into HydrationSafeguard
  useEffect(() => {
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

  // Render placeholder during loading
  const renderLoading = () => (
    <div 
      ref={clockContainerRef}
      className="w-full transition-all duration-300 ease-in-out mx-auto px-6"
    >
      {/* Clock heading */}
      {!skipHeading && <WorldClockHeading />}
      
      <div className="min-h-96 flex items-center justify-center">
        <div className="w-24 h-24 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
      </div>
    </div>
  );

  // Main component content
  const renderContent = () => {
    // If no current time yet, show loading
    if (!currentTime) {
      return renderLoading();
    }

    return (
      <div 
        ref={clockContainerRef}
        className="w-full transition-all duration-300 ease-in-out mx-auto px-6"
      >
        {/* Clock heading */}
        {!skipHeading && <WorldClockHeading />}
        
        <div className="flex justify-between items-center mb-4 h-12">
          <ViewSwitcher />
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMap}
              className="flex items-center justify-center px-4 py-2 rounded-md bg-gray-800 hover:bg-gray-700 text-white text-sm"
              aria-label={showMap ? "Hide world map" : "Show world map"}
            >
              {showMap ? 'Hide Map' : 'World Map'}
            </button>
            <NotificationButton />
          </div>
        </div>

        {/* World Map Section */}
        <AnimatePresence>
          {showMap && (
            <Motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 overflow-hidden"
            >
              <WorldMapSelector />
            </Motion.div>
          )}
        </AnimatePresence>

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
                  removeTimezone={removeTimezone}
                />
              </div>
            )}

            {currentView === 'clocks' && (
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
      </div>
    );
  };

  // Wrap component in HydrationSafeguard to prevent hydration mismatches
  return (
    <HydrationSafeguard fallback={renderLoading()}>
      {renderContent()}
    </HydrationSafeguard>
  );
} 