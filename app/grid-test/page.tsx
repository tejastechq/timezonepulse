'use client';

import React, { useState, useEffect, useRef, Suspense, useCallback, useMemo } from 'react';
import { useTimezoneStore, Timezone } from '@/store/timezoneStore';
import { ViewProvider } from '@/app/contexts/ViewContext';
import { IntegrationsProvider } from '@/app/contexts/IntegrationsContext';
import dynamic from 'next/dynamic';
import { DateTime } from 'luxon';
import { FixedSizeList } from 'react-window';
import { useTheme } from 'next-themes';
import clsx from 'clsx';
import { useSettingsStore, getWeekendHighlightClass } from '@/store/settingsStore';
import { formatTimeForTimezone } from '@/lib/timezone-utils';
import { isInDST } from '@/lib/utils/timezone';
import { isNightHours, isWeekend as isWeekendUtil } from '@/lib/utils/dateTimeFormatter';
import { TimezoneColumn } from '@/components/views/MobileV2ListView';

// Placeholder for loading state
const ViewPlaceholder = () => (
  <div className="w-full min-h-[300px] flex items-center justify-center">
    <div className="animate-pulse flex flex-col items-center justify-center">
      <div className="h-16 w-16 rounded-full bg-gray-300 dark:bg-gray-700"></div>
      <div className="h-4 w-32 mt-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
    </div>
  </div>
);

// Helper function (can be moved to utils)
const roundToNearestIncrement = (date: Date, incrementMinutes: number): Date => {
  const incrementMillis = incrementMinutes * 60 * 1000;
  const ms = date.getTime();
  return new Date(Math.floor(ms / incrementMillis) * incrementMillis);
};

// Define getInitialColumns function *before* it's used in useState
const getInitialColumns = () => {
  if (typeof window !== 'undefined') {
    const width = window.innerWidth;
    if (width <= 540) return 1;
    if (width <= 912) return 2;
    if (width <= 1024) return 3;
    return 4;
  }
  return 4; // Default for server-side rendering
};

export default function GridTestPage() {
  // --- Hooks Section (All hooks defined first) ---
  const {
    timezones,
    hydrate,
    localTimezone,
    highlightedTime,
    setHighlightedTime,
  } = useTimezoneStore();
  const { resolvedTheme } = useTheme();
  const { weekendHighlightColor, highlightAutoClear, highlightDuration } = useSettingsStore(); // Added highlight settings

  const [isMounted, setIsMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [editingTimezoneIdState, setEditingTimezoneIdState] = useState<string | null>(null);
  const [selectorOpenState, setSelectorOpenState] = useState<boolean>(false);
  const [activeItem, setActiveItem] = useState<number | null>(null); // Grid item selection state
  const [columns, setColumns] = useState(getInitialColumns);
  const [rows, setRows] = useState(3); // Default, will be recalculated
  const containerRef = useRef<HTMLDivElement>(null);
  const listRefs = useRef<Record<string, FixedSizeList | null>>({}); // Ref for the list inside TimezoneColumn

  // Refs and State for highlight timer and scrolling logic (from MobileV2ListView)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timeRemainingRef = useRef<number>(highlightDuration);
  const [timeRemaining, setTimeRemaining] = useState<number>(highlightDuration); // For potential display
  const userIsScrollingRef = useRef(false); // Track if user is actively scrolling the list
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Timer to detect scroll end
  const lastScrollTimeRef = useRef<number>(0); // Timestamp of last scroll event
  const highlightedTimeRef = useRef<Date | null>(null); // Ref to track highlighted time for effects

  // --- Callbacks & Memos ---
  const handleUserScroll = useCallback((event: { scrollOffset: number; scrollUpdateWasRequested: boolean }) => {
    // Mark user as scrolling if it wasn't a programmatic scroll
    if (!event.scrollUpdateWasRequested) {
      userIsScrollingRef.current = true;
      lastScrollTimeRef.current = Date.now();
      // Clear previous scroll end timer
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      // Set a timer to reset scrolling state after a short delay
      scrollTimeoutRef.current = setTimeout(() => {
        userIsScrollingRef.current = false;
      }, 500); // Adjust delay as needed
    }
  }, []);

  const handleTouchStart = useCallback(() => {
    userIsScrollingRef.current = true;
    lastScrollTimeRef.current = Date.now();
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
  }, []);

  const handleTouchEnd = useCallback(() => {
    // Use a short delay to allow momentum scrolling to finish before resetting
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      userIsScrollingRef.current = false;
    }, 150); // Adjust delay as needed
  }, []);

  const handleTouchCancel = useCallback(() => {
    userIsScrollingRef.current = false;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
  }, []);

  const handleRemoveTimezone = useCallback((id: string) => console.log('Remove timezone:', id), []);
  const isHighlighted = useCallback((time: Date) => highlightedTime ? time.getTime() === highlightedTime.getTime() : false, [highlightedTime]);
  const checkNightHours = useCallback((time: Date, timezone: string) => isNightHours(time, timezone), []);
  const isDateBoundary = useCallback((time: Date, timezone: string) => {
    const timeInTimezone = DateTime.fromJSDate(time).setZone(timezone);
    return timeInTimezone.hour === 0 && timeInTimezone.minute === 0;
  }, []);
  const isDSTTransition = useCallback((time: Date, timezone: string) => {
    const timeInTimezone = DateTime.fromJSDate(time).setZone(timezone);
    const oneDayLater = timeInTimezone.plus({ days: 1 });
    return timeInTimezone.offset !== oneDayLater.offset;
  }, []);
  const isCurrentTime = useCallback((time: Date): boolean => {
    if (!currentTime) return false;
    const timeDateTime = DateTime.fromJSDate(time);
    const localDateTime = DateTime.fromJSDate(currentTime);
    const roundedLocalMinute = Math.floor(localDateTime.minute / 30) * 30;
    const roundedLocalDateTime = localDateTime.set({ minute: roundedLocalMinute, second: 0, millisecond: 0 });
    return timeDateTime.hasSame(roundedLocalDateTime, 'hour') && timeDateTime.minute === roundedLocalDateTime.minute;
  }, [currentTime]);
  const isWeekend = useCallback((time: Date, timezone: string) => isWeekendUtil(time, timezone), []);
  const formatTime = useCallback((date: Date, timezone: string) => formatTimeForTimezone(date, timezone, 'h:mm a'), []);
  const getHighlightAnimationClass = useCallback((isHighlight: boolean) => isHighlight ? 'highlight-item-optimized highlight-pulse-effect' : '', []);
  const getHighlightClass = useCallback((isWeekend: boolean) => isWeekend ? getWeekendHighlightClass(weekendHighlightColor) : '', [weekendHighlightColor]);
  const getTimezoneOffset = useCallback((timezone: string) => DateTime.now().setZone(timezone).toFormat('ZZ'), []);

  const timeSlots = useMemo(() => {
    if (!currentTime) return [];
    const slots = [];
    const dateToUse = currentDate || currentTime;
    const date = DateTime.fromJSDate(dateToUse);
    const startOfDay = date.startOf('day');
    for (let i = 0; i < 48; i++) {
      slots.push(startOfDay.plus({ minutes: i * 30 }).toJSDate());
    }
    return slots;
  }, [currentTime, currentDate]);

  // Callback to reset the highlight timer
  const resetInactivityTimer = useCallback(() => {
    if (!highlightedTimeRef.current || !highlightAutoClear) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setTimeRemaining(highlightDuration);
    timeRemainingRef.current = highlightDuration;
    timeoutRef.current = setTimeout(() => {
      // Check ref before clearing state
      if (highlightedTimeRef.current) {
        setHighlightedTime(null);
      }
    }, highlightDuration * 1000);
  }, [highlightAutoClear, highlightDuration, setHighlightedTime]);

  // Updated handleTimeSelection to include timer logic
  const handleTimeSelection = useCallback((time: Date | null) => {
    setHighlightedTime(time);
    // Update ref and reset timer if a time is selected and auto-clear is on
    if (time && highlightAutoClear) {
      highlightedTimeRef.current = time;
      resetInactivityTimer();
    } else if (!time) {
      // Clear ref and timer if selection is cleared
      highlightedTimeRef.current = null;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, [setHighlightedTime, highlightAutoClear, resetInactivityTimer]);

  const handleItemClick = (id: number) => {
    setActiveItem(activeItem === id ? null : id);
  };

  // Helper to get current time index
   const getCurrentTimeIndex = useCallback(() => {
    if (!currentTime || !timeSlots.length) return 0;
    const roundedLocalTime = roundToNearestIncrement(currentTime, 30);
    const index = timeSlots.findIndex(t => DateTime.fromJSDate(t).hasSame(DateTime.fromJSDate(roundedLocalTime), 'minute'));
    return index > -1 ? index : 0;
  }, [currentTime, timeSlots]);

  // Helper to scroll the list for the specific timezone column
  const scrollToIndex = useCallback((index: number, alignment: 'start' | 'center' | 'end' | 'smart' | 'auto' = 'center', timezoneId: string) => {
    const listRef = listRefs.current[timezoneId];
    // Only scroll if the user isn't actively scrolling
    if (listRef && !userIsScrollingRef.current) {
        requestAnimationFrame(() => {
            if (listRefs.current[timezoneId]) { // Double-check ref inside frame
                const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                listRefs.current[timezoneId]?.scrollToItem(index, prefersReducedMotion ? 'start' : alignment);
            }
        });
    }
  }, []); // Dependencies removed as it relies on refs and closure


  // --- Effects ---
  useEffect(() => {
    hydrate();
    setIsMounted(true);
    const now = new Date();
    setCurrentTime(now);
    setCurrentDate(now);
  }, [hydrate]);

  useEffect(() => {
    if (!isMounted) return;
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      const currentStoredDate = currentDate ? new Date(currentDate) : null;
      if (currentStoredDate && currentStoredDate.getDate() !== now.getDate()) {
        setCurrentDate(now);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isMounted, currentDate]);

  // Effect for highlight auto-clear timer
  useEffect(() => {
    highlightedTimeRef.current = highlightedTime; // Keep ref in sync
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (highlightedTime && highlightAutoClear) {
      setTimeRemaining(highlightDuration);
      timeRemainingRef.current = highlightDuration;
      timeoutRef.current = setTimeout(() => {
        if (highlightedTimeRef.current) {
          handleTimeSelection(null); // Use callback to clear state
        }
      }, highlightDuration * 1000);
    } else if (!highlightedTime) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setTimeRemaining(highlightDuration);
      timeRemainingRef.current = highlightDuration;
    }
    const timerId = timeoutRef.current;
    return () => { if (timerId) clearTimeout(timerId); };
  }, [highlightedTime, highlightAutoClear, highlightDuration, handleTimeSelection]);

  // Get first timezone for the single column display
  const firstTimezone = useMemo(() => timezones[0] || { id: 'America/New_York', name: 'New York', city: 'New York', offset: -5, country: 'US' }, [timezones]);

  // Effect to scroll to highlighted time or current time for the *single* column
  useEffect(() => {
    // Wait for mount, slots, and ensure user isn't scrolling
    if (!isMounted || !timeSlots.length || userIsScrollingRef.current || !firstTimezone) return;

    let targetIndex = -1;
    const alignment: 'start' | 'center' = 'start'; // Scroll to top

    if (highlightedTime) {
      const targetTimeUTC = DateTime.fromJSDate(highlightedTime).toUTC();
      targetIndex = timeSlots.findIndex(t => {
        const slotTimeUTC = DateTime.fromJSDate(t).toUTC();
        // Compare minutes for 30-min slots
        return slotTimeUTC.hasSame(targetTimeUTC, 'minute');
      });
    } else if (currentTime) {
      // If nothing highlighted, scroll to current time
      targetIndex = getCurrentTimeIndex();
    }

    if (targetIndex !== -1) {
      // Scroll the specific list for the first timezone
      // Add a slight delay to ensure the listRef is available after render
      const scrollTimer = setTimeout(() => {
          scrollToIndex(targetIndex, alignment, firstTimezone.id);
      }, 50); // 50ms delay, adjust if needed
      return () => clearTimeout(scrollTimer); // Cleanup timer
    }
  // Ensure dependencies cover all scenarios for scrolling
  }, [highlightedTime, currentTime, timeSlots, isMounted, firstTimezone?.id, scrollToIndex, getCurrentTimeIndex]); // Added firstTimezone.id


  // --- Non-Hook Logic ---
  const gridItems = useMemo(() => Array.from({ length: 10 }, (_, index) => ({
    id: index + 1,
    title: `Item ${index + 1}`,
    content: `This is a sample grid item with some content for demonstration purposes.`,
    color: index % 4 === 0 ? 'primary' :
           index % 4 === 1 ? 'blue' :
           index % 4 === 2 ? 'green' : 'amber'
  })), []);

  // Effect for layout calculation
  useEffect(() => {
    const calculateLayout = () => {
      if (!containerRef.current) return;
      const viewportWidth = window.innerWidth;
      let maxColumns;
      if (viewportWidth <= 540) maxColumns = 1;
      else if (viewportWidth <= 912) maxColumns = 2;
      else if (viewportWidth <= 1024) maxColumns = 3;
      else maxColumns = 4;
      const rowsNeeded = Math.ceil(gridItems.length / maxColumns);
      setColumns(maxColumns);
      setRows(rowsNeeded);
    };
    calculateLayout();
    window.addEventListener('resize', calculateLayout);
    return () => window.removeEventListener('resize', calculateLayout);
  }, [gridItems.length]);

  const getProgressWidth = (id: number) => {
    const percentage = (id % 5 + 1) * 20;
    return `${percentage}%`;
  };

  const reorganizeItems = () => {
    const visibleItems = gridItems;
    const reorganized = [];
    for (let row = 0; row < Math.ceil(gridItems.length / columns); row++) {
      for (let col = 0; col < columns; col++) {
        const index = row * columns + col;
        if (index < visibleItems.length) {
          reorganized.push(visibleItems[index]);
        }
      }
    }
    return reorganized;
  };

  const displayItems = reorganizeItems();

  const ITEM_WIDTH = 285;
  const GAP_WIDTH = 24;

  // --- Render Logic ---
  return (
    <ViewProvider>
      <IntegrationsProvider>
        <div className="w-full min-h-screen flex flex-col items-center justify-start p-8 overflow-x-hidden" ref={containerRef}>
          <h1 className="text-2xl font-bold mb-6 text-center">Grid Test with Timezone Card</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8 text-center max-w-2xl">
            A grid layout where the first item is replaced by a TimezoneCard component.
          </p>
          <div className={`w-full flex justify-center ${columns === 1 ? 'overflow-x-auto pb-4' : ''}`}>
            {!isMounted ? (
               <div className="flex-grow flex items-center justify-center min-h-[400px]">
                 <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
               </div>
            ) : (
              <div
                className="grid gap-6"
                style={{
                  width: `${columns * ITEM_WIDTH + (columns - 1) * GAP_WIDTH}px`,
                  gridTemplateColumns: `repeat(${columns}, ${ITEM_WIDTH}px)`,
                  gridAutoRows: 'minmax(min-content, max-content)',
                  maxWidth: columns === 1 ? 'none' : '100%'
                }}
              >
                {displayItems.map((item) => {
                  if (item.id === 1) {
                    // Ensure firstTimezone is defined before rendering
                    if (!firstTimezone) return <ViewPlaceholder key="tz-placeholder"/>;
                    return (
                      <TimezoneColumn
                        key={firstTimezone.id}
                        timezone={firstTimezone}
                        isLocal={firstTimezone.id === localTimezone}
                        isSearching={false}
                        filteredTimeSlots={[]}
                        timeSlots={timeSlots}
                        isHighlighted={isHighlighted}
                        checkNightHours={checkNightHours}
                        isDateBoundary={isDateBoundary}
                        isDSTTransition={isDSTTransition}
                        isCurrentTime={isCurrentTime}
                        isWeekend={isWeekend}
                        formatTime={formatTime}
                        getHighlightAnimationClass={getHighlightAnimationClass}
                        handleTimeSelection={handleTimeSelection} // Pass the updated handler
                        listRefs={listRefs} // Pass the ref collection
                        handleUserScroll={handleUserScroll}
                        resolvedTheme={resolvedTheme}
                        getTimezoneOffset={getTimezoneOffset}
                        handleRemoveTimezone={handleRemoveTimezone}
                        setEditingTimezoneId={setEditingTimezoneIdState}
                        setSelectorOpen={setSelectorOpenState}
                        userLocalTimezone={localTimezone || 'America/New_York'}
                        localTime={currentTime}
                        getHighlightClass={getHighlightClass}
                        handleTouchStart={handleTouchStart}
                        handleTouchEnd={handleTouchEnd}
                        handleTouchCancel={handleTouchCancel}
                      />
                    );
                  }

                  // Render original grid items for others
                  const ringClass = activeItem === item.id ? `ring-2 ring-offset-2 ${item.color === 'primary' ? 'ring-primary-500' : item.color === 'blue' ? 'ring-blue-500' : item.color === 'green' ? 'ring-green-500' : 'ring-amber-500'}` : '';
                  const bgColorClass = item.color === 'primary' ? 'bg-primary-500' : item.color === 'blue' ? 'bg-blue-500' : item.color === 'green' ? 'bg-green-500' : 'bg-amber-500';
                  const hoverBgClass = item.color === 'primary' ? 'hover:bg-primary-600' : item.color === 'blue' ? 'hover:bg-blue-600' : item.color === 'green' ? 'hover:bg-green-600' : 'hover:bg-amber-600';

                  return (
                    <div key={item.id} className="relative">
                      <div
                        onClick={() => handleItemClick(item.id)}
                        className={`w-[285px] h-[370px] bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg cursor-pointer flex flex-col ${ringClass}`}
                      >
                        <div className={`h-2 w-full ${bgColorClass} rounded-t-lg -mt-4 -mx-4 mb-4`}></div>
                        <h2 className="text-lg font-semibold mb-2 truncate">{item.title}</h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm line-clamp-2">{item.content}</p>
                        <div className="flex-grow flex flex-col justify-center items-center my-4">
                          <div className={`w-16 h-16 ${bgColorClass} rounded-full flex items-center justify-center text-white text-xl font-bold mb-4`}>{item.id}</div>
                          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-2">
                            <div className={`h-full ${bgColorClass} rounded-full`} style={{ width: getProgressWidth(item.id) }}></div>
                          </div>
                          <p className="text-center text-sm text-gray-500 dark:text-gray-400">Progress: {parseInt(getProgressWidth(item.id))}%</p>
                        </div>
                        <div className="mt-auto flex justify-between items-center">
                          <div className="h-3 rounded-full w-24 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            <div className={`h-full ${bgColorClass}`} style={{ width: getProgressWidth(item.id) }}></div>
                          </div>
                          <div className={`h-8 w-8 ${bgColorClass} rounded-full flex items-center justify-center text-white font-bold`}>{item.id}</div>
                        </div>
                      </div>
                      {activeItem === item.id && (
                        <div
                          className={`absolute top-[370px] left-0 w-[285px] bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg z-10 animate-fade-in`}
                          style={{ animation: 'fadeInUp 0.3s ease-out forwards' }}
                        >
                          <p className="text-sm text-gray-500 dark:text-gray-400">Additional information that appears when the item is selected.</p>
                          <button className={`mt-3 px-4 py-2 ${bgColorClass} ${hoverBgClass} text-white rounded-md text-sm`}>Action Button</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {isMounted && (
            <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg max-w-lg">
              <p className="text-sm">
                <strong>Current display:</strong> {columns} column{columns !== 1 ? 's' : ''} ({displayItems.length} items visible)
                {columns === 1 && <span className="ml-1 text-blue-600 dark:text-blue-400">(scroll horizontally to view)</span>}
              </p>
              <p className="text-sm mt-2">The layout dynamically adjusts column count. Item 1 is replaced by TimezoneCard.</p>
            </div>
          )}
          {/* Added global styles for animations and variables */}
          <style jsx global>{`
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            /* Ensure highlight animations are available globally if not already */
            .highlight-item-optimized { animation: none !important; position: relative; transform: translateZ(0); opacity: 1 !important; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); }
            .dark .highlight-item-optimized { box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3); }
            .highlight-pulse-effect { position: relative; overflow: hidden; }
            .highlight-pulse-effect::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(45deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0.1)); z-index: 3; transform: translateX(-100%); animation: shimmerHighlight 2s infinite; }
            @keyframes shimmerHighlight { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
            .highlight-item-optimized::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 2; pointer-events: none; border-radius: inherit; box-shadow: 0 0 0 0 rgba(var(--primary-500-rgb), 0.4); animation: optimizedHighlightPulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            @keyframes optimizedHighlightPulse { 0% { box-shadow: 0 0 0 0 rgba(var(--primary-500-rgb), 0.4); background-color: rgba(var(--primary-500-rgb), 0.05); } 50% { box-shadow: 0 0 0 8px rgba(var(--primary-500-rgb), 0.2); background-color: rgba(var(--primary-500-rgb), 0); } 100% { box-shadow: 0 0 0 0 rgba(var(--primary-500-rgb), 0); background-color: rgba(var(--primary-500-rgb), 0.05); } }
            :root { --primary-500-rgb: 99, 102, 241; } /* Define CSS variable */
            .dark { --primary-500-rgb: 129, 140, 248; } /* Define CSS variable for dark mode */
          `}</style>
        </div>
      </IntegrationsProvider>
    </ViewProvider>
  );
}
