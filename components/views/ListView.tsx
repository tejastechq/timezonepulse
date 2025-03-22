'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo, memo } from 'react';
import { DateTime } from 'luxon';
import { motion, AnimatePresence } from 'framer-motion';
import { Timezone, useTimezoneStore } from '@/store/timezoneStore';
import { isBusinessHours, isNightHours, isWeekend } from '@/lib/utils/dateTimeFormatter';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { ChevronUp, ChevronDown, Sun, Moon, Clock, Plus, X, Edit2, Settings } from 'lucide-react';
import { getAllTimezones, isInDST } from '@/lib/utils/timezone';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import TimezoneSelector from '../clock/TimezoneSelector'; // Import the shared TimezoneSelector
import { useTheme } from 'next-themes';
import clsx from 'clsx';
import { useSettingsStore, getWeekendHighlightClass } from '@/store/settingsStore';
import { ExpandableTabs } from '@/components/ui/expandable-tabs';

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

/**
 * ListView Component
 * 
 * Displays multiple timezones in a list view with time columns.
 * Shows current time, business hours, and other time-related information.
 * 
 * TODO: Implement a proper event/meeting system to replace the mock implementation.
 * The system should:
 * - Connect to a calendar API or a custom events database
 * - Display real events with proper titles, durations, and participants
 * - Allow adding/editing events directly from the interface
 * - Support recurring events and notifications
 */
export default function ListView({
  selectedTimezones,
  userLocalTimezone,
  timeSlots,
  localTime,
  highlightedTime,
  handleTimeSelection,
  roundToNearestIncrement,
  removeTimezone: externalRemoveTimezone
}: ListViewProps) {
  const timeColumnsContainerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const listRefs = useRef<Record<string, FixedSizeList | null>>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastRenderTimeRef = useRef<number>(Date.now());
  // Add a ref to store the timer cleanup function
  const timerCleanupRef = useRef<(() => void) | null>(null);
  
  // Add a ref for scrollSyncTimeout to fix the undefined error
  const scrollSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get theme from next-themes
  const { resolvedTheme } = useTheme();
  
  // Get weekend highlight color from settings store
  const { weekendHighlightColor } = useSettingsStore();
  
  // State for timezone selector
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [editingTimezoneId, setEditingTimezoneId] = useState<string | null>(null);
  
  // Get timezone actions from store
  const { addTimezone, removeTimezone: storeRemoveTimezone } = useTimezoneStore();

  // Use the external removeTimezone function if provided, otherwise use the one from the store
  const removeTimezone = externalRemoveTimezone || storeRemoveTimezone;

  // Increase default timer from 60 to 120 seconds to give user more time
  const [timeRemaining, setTimeRemaining] = useState<number>(120);
  // Add a ref to keep track of the current time remaining
  const timeRemainingRef = useRef<number>(120);

  // Add state and refs to track user scrolling activity
  const [userIsScrolling, setUserIsScrolling] = useState(false);
  const userIsScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track the last time the user manually scrolled
  const lastScrollTimeRef = useRef<number>(0);

  // Create a performance marker for debugging
  const markRender = useCallback((name: string) => {
    if (typeof performance !== 'undefined' && process.env.NODE_ENV === 'development') {
      performance.mark(`ListView-${name}-${Date.now()}`);
    }
  }, []);

  // Set mounted state on client and handle comprehensive cleanup
  useEffect(() => {
    setMounted(true);
    markRender('mount');
    
    // Comprehensive cleanup function
    return () => {
      markRender('unmount');
      
      // Clean up all timers and animation frames on unmount
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Call the timer cleanup function if it exists
      if (timerCleanupRef.current) {
        timerCleanupRef.current();
        timerCleanupRef.current = null;
      }
      
      // Reset state
      setTimeRemaining(120);
      timeRemainingRef.current = 120;
      highlightedTimeRef.current = null;
    };
  }, [markRender]);

  // Add a ref to keep track of the currently highlighted time
  const highlightedTimeRef = useRef<Date | null>(null);
  
  // Update the ref whenever highlightedTime changes
  useEffect(() => {
    highlightedTimeRef.current = highlightedTime;
  }, [highlightedTime]);

  // Consolidated timer manager - uses RAF for smoother timing
  const useConsolidatedTimer = useCallback(() => {
    // Always make sure to clear any existing animation frame first
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Only start timer if we have a highlighted time
    if (!highlightedTimeRef.current || !mounted) return () => {}; // Return empty cleanup function

    // Initialize last tick time
    let lastTickTime = Date.now();
    // Use the ref instead of the state directly
    let remainingTime = timeRemainingRef.current;
    
    // Use requestAnimationFrame for smoother animations that sync with browser's render cycle
    const timerLoop = () => {
      // Check if component is still mounted and still has a highlighted time
      if (!mounted || !highlightedTimeRef.current) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }
      
      const now = Date.now();
      const deltaTime = now - lastTickTime;
      
      // Only update state at most once per second to avoid unnecessary renders
      if (deltaTime >= 1000) {
        lastTickTime = now;
        remainingTime -= 1;
        
        if (remainingTime <= 0) {
          // When we reach 0, clear the timer and selection
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
          // Use the handler function directly rather than relying on the captured value
          handleTimeSelection(null);
          return;
        }
        
        // Update both the ref and the state
        timeRemainingRef.current = remainingTime;
        setTimeRemaining(remainingTime);
      }
      
      // Continue the loop
      animationFrameRef.current = requestAnimationFrame(timerLoop);
    };
    
    // Start the timer loop
    animationFrameRef.current = requestAnimationFrame(timerLoop);
    
    // Clear the timer on cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [mounted, handleTimeSelection]); // Remove highlightedTime from dependencies, use ref instead

  // Auto-cancel selection after 1 minute of inactivity with visual countdown
  useEffect(() => {
    // Don't do anything if there's no highlighted time
    if (!highlightedTime) {
      // Clear any existing timers
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Call any existing cleanup function
      if (timerCleanupRef.current) {
        timerCleanupRef.current();
        timerCleanupRef.current = null;
      }
      
      return;
    }
    
    // Clear any previous timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Call any existing cleanup function
    if (timerCleanupRef.current) {
      timerCleanupRef.current();
      timerCleanupRef.current = null;
    }
    
    // Reset time remaining when selection changes
    setTimeRemaining(120);
    timeRemainingRef.current = 120;
    
    // Use the consolidated timer approach and store the cleanup function
    const cleanup = useConsolidatedTimer();
    timerCleanupRef.current = cleanup;
    
    // Also set a backup timeout just in case (belt and suspenders)
    timeoutRef.current = setTimeout(() => {
      // Use the ref to check if still valid
      if (highlightedTimeRef.current) {
        handleTimeSelection(null);
      }
    }, 120000); // 120,000 ms = 2 minutes (increased from 1 minute)
    
    // Return a cleanup function that handles all timers
    return () => {
      if (timerCleanupRef.current) {
        timerCleanupRef.current();
        timerCleanupRef.current = null;
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [highlightedTime, handleTimeSelection, useConsolidatedTimer]);
  
  // Function to reset the inactivity timer and visual countdown
  const resetInactivityTimer = useCallback(() => {
    // Use the ref to check if we have a highlighted time
    if (!highlightedTimeRef.current) return;
    
    // Store previous cleanup function if it exists
    const previousCleanup = timerCleanupRef.current;
    
    // Cancel all existing timers first to avoid potential issues with multiple timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    
    // If we had a previous cleanup function, call it
    if (previousCleanup) {
      previousCleanup();
    }
    
    // Reset time remaining to 120 seconds (increased from 60)
    setTimeRemaining(120);
    timeRemainingRef.current = 120;
    
    // Set a new timeout for automatic clearing
    timeoutRef.current = setTimeout(() => {
      // Ensure we're still in a valid state before clearing the selection
      if (highlightedTimeRef.current) {
        handleTimeSelection(null);
      }
    }, 120000); // 120,000 ms = 2 minutes (increased from 1 minute)
    
    // Restart the animation frame timer and store its cleanup function
    const cleanup = useConsolidatedTimer();
    timerCleanupRef.current = cleanup;
  }, [handleTimeSelection, useConsolidatedTimer]);
  
  // Add click outside handler to cancel time selection - uses a more performant approach
  useEffect(() => {
    // Only add the listener if there's a highlighted time
    if (!mounted || !highlightedTime) return;
    
    // Use a throttled handler to avoid excessive calculations
    let lastClickTime = 0;
    const CLICK_THROTTLE = 150; // ms
    
    // Handler to detect clicks outside the time columns
    const handleClickOutside = (event: MouseEvent) => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_THROTTLE) return;
      lastClickTime = now;
      
      if (
        timeColumnsContainerRef.current && 
        !timeColumnsContainerRef.current.contains(event.target as Node) &&
        // Prevent cancellation when clicking on timezone selection modal
        !(event.target as Element)?.closest('[data-timezone-selector]')
      ) {
        // Cancel the selection
        handleTimeSelection(null);
      }
    };
    
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mounted, highlightedTime, handleTimeSelection]);
  
  // Add handler for when user starts scrolling
  const handleUserScroll = useCallback(() => {
    // Mark that user is currently scrolling
    setUserIsScrolling(true);
    userIsScrollingRef.current = true;
    lastScrollTimeRef.current = Date.now();
    
    // Clear any existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
    
    // Set a timeout to mark scrolling as finished after a delay
    scrollTimeoutRef.current = setTimeout(() => {
      setUserIsScrolling(false);
      userIsScrollingRef.current = false;
    }, 3000); // Consider user finished scrolling after 3 seconds of inactivity
    
    // If there's a highlighted time, reset the inactivity timer
    if (highlightedTimeRef.current) {
      resetInactivityTimer();
    }
  }, [resetInactivityTimer]);
  
  // Find index of current time in timeslots array
  const getCurrentTimeIndex = useCallback(() => {
    if (!localTime || !timeSlots.length) return 0;
    
    const roundedLocalTime = roundToNearestIncrement(localTime, 30);
    const index = timeSlots.findIndex(t => 
      DateTime.fromJSDate(t).hasSame(DateTime.fromJSDate(roundedLocalTime), 'minute')
    );
    
    return index > -1 ? index : 0;
  }, [localTime, timeSlots, roundToNearestIncrement]);
  
  // Updated synchronizeScrolls function that respects user scrolling
  const synchronizeScrolls = useCallback(() => {
    if (scrollSyncTimeoutRef.current) {
      clearTimeout(scrollSyncTimeoutRef.current);
      scrollSyncTimeoutRef.current = null;
    }

    // If user is actively scrolling or has scrolled recently (within last 3 seconds), don't auto-scroll
    const recentlyScrolled = Date.now() - lastScrollTimeRef.current < 3000;
    if (userIsScrollingRef.current || recentlyScrolled) {
      return;
    }
    
    scrollSyncTimeoutRef.current = setTimeout(() => {
      // Get index to scroll to (either highlighted time or current time)
      let targetIndex: number;
      
      if (highlightedTime) {
        // Find index of highlighted time using timestamp comparison
        targetIndex = timeSlots.findIndex(t => 
          t.getTime() === highlightedTime.getTime()
        );
      } else if (localTime) {
        // If no highlighted time, use current time
        targetIndex = getCurrentTimeIndex();
      } else {
        // Fallback
        targetIndex = 0;
      }
      
      // Default to current time if target index wasn't found
      if (targetIndex === -1) targetIndex = getCurrentTimeIndex();
      
      // Check if user prefers reduced motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      // Apply optimized scroll behavior
      Object.entries(listRefs.current).forEach(([timezoneId, listRef]) => {
        if (listRef) {
          if (prefersReducedMotion) {
            // Instant scroll for users who prefer reduced motion
            listRef.scrollToItem(targetIndex, 'center');
          } else {
            // Simplified smooth scroll to reduce complexity
            listRef.scrollToItem(targetIndex, 'center');
          }
        }
      });
    }, 50); // Small delay to batch scroll operations
  }, [highlightedTime, localTime, timeSlots, getCurrentTimeIndex]); // Add proper dependencies

  // Update throttledUserInteraction to include scrolling events
  const throttledUserInteraction = useCallback((event: Event) => {
    const now = Date.now();
    // Throttle to once per 100ms
    if (now - lastRenderTimeRef.current < 100) return;
    
    // Check if we even have a highlighted time
    if (!highlightedTimeRef.current) return;
    
    // Handle keyboard events specially for accessibility
    if (event.type === 'keydown') {
      const keyEvent = event as KeyboardEvent;
      // Reset the timer for navigation keys (arrows, tab, space, enter)
      const accessibilityKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', ' ', 'Enter'];
      if (accessibilityKeys.includes(keyEvent.key)) {
        lastRenderTimeRef.current = now;
        resetInactivityTimer();
        return;
      }
    }
    
    // Handle scroll events
    if (event.type === 'scroll') {
      handleUserScroll();
      lastRenderTimeRef.current = now;
      return;
    }
    
    // For mouse and other events, check if the interaction is relevant
    const target = event.target as Element;
    
    // Check if the interaction is within the time columns container, a time item, or the reset button
    const isRelevantInteraction = 
      timeColumnsContainerRef.current?.contains(target) || 
      target.closest('[data-time-item="true"]') !== null ||
      target.closest('[data-reset-timer]') !== null;
    
    // Only reset the timer for relevant interactions
    if (isRelevantInteraction) {
      lastRenderTimeRef.current = now;
      resetInactivityTimer();
    }
  }, [resetInactivityTimer, handleUserScroll]);
  
  // Listen for user interactions to reset the timer - with throttling
  useEffect(() => {
    if (!mounted || !highlightedTime) return;
    
    // Add event listeners with passive option for better performance
    // Add scroll event listener to detect user scrolling
    window.addEventListener('keydown', throttledUserInteraction, { passive: true });
    window.addEventListener('click', throttledUserInteraction, { passive: true });
    window.addEventListener('scroll', throttledUserInteraction, { passive: true });
    
    return () => {
      // Remove event listeners
      window.removeEventListener('keydown', throttledUserInteraction);
      window.removeEventListener('click', throttledUserInteraction);
      window.removeEventListener('scroll', throttledUserInteraction);
    };
  }, [mounted, highlightedTime, throttledUserInteraction]);
  
  // Memoize expensive functions
  // Format time for display - memoized with useMemo
  const formatTimeFunction = useMemo(() => {
    return (date: Date, timezone: string) => {
      return DateTime.fromJSDate(date).setZone(timezone).toFormat('h:mm a');
    };
  }, []);

  // Use memoized format time function
  const formatTime = useCallback((date: Date, timezone: string) => {
    return formatTimeFunction(date, timezone);
  }, [formatTimeFunction]);

  // Check if a time is the current local time - with timestamp comparison instead of object comparison
  const isLocalTime = useCallback((time: Date, timezone: string) => {
    if (!localTime) return false;
    
    const roundedLocalTime = roundToNearestIncrement(localTime, 30);
    const timeInTimezone = DateTime.fromJSDate(time).setZone(timezone);
    const localTimeInTimezone = DateTime.fromJSDate(roundedLocalTime).setZone(timezone);
    
    return timeInTimezone.hasSame(localTimeInTimezone, 'minute');
  }, [localTime, roundToNearestIncrement]);

  // Check if a time is highlighted - using timestamp comparison for better performance
  const isHighlighted = useCallback((time: Date) => {
    if (!highlightedTime) return false;
    
    return time.getTime() === highlightedTime.getTime();
  }, [highlightedTime]);

  // Helper to generate animation class for highlighted items - optimize to use CSS variables
  const getHighlightAnimationClass = useCallback((isHighlight: boolean) => {
    if (!isHighlight) return '';
    
    // Use a class that applies hardware-accelerated animations
    return 'highlight-item-optimized';
  }, []);

  // Add optimized CSS keyframes for animations
  useEffect(() => {
    if (!mounted) return;
    
    // Add optimized keyframes that use hardware acceleration if they don't exist
    if (!document.querySelector('#optimized-animations')) {
      const style = document.createElement('style');
      style.id = 'optimized-animations';
      style.innerHTML = `
        /* Fix for white flashing in highlight transitions */
        .time-item {
          transition: none !important; /* Disable transitions that might cause flashing */
          will-change: transform;
          position: relative;
          transform: translateZ(0);
          /* Apply a background color that matches the parent to avoid white flash */
          background-color: var(--time-item-bg, rgba(0, 0, 0, 0));
        }
        
        /* Add highlight styles without transitions */
        .time-item.bg-primary-500 {
          background-color: rgb(var(--primary-500-rgb)) !important;
          color: white !important;
          /* Force immediate painting without animation */
          transform: translateZ(0);
          backface-visibility: hidden;
          -webkit-font-smoothing: subpixel-antialiased;
        }
        
        /* Optimize current time indicator to prevent flashing */
        .current-time-indicator {
          position: relative;
          overflow: hidden;
          /* Force the correct layering */
          z-index: 0;
        }
        
        .current-time-indicator::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 3px;
          background-color: rgb(var(--primary-500-rgb));
          /* Ensure this is in front of any other elements */
          z-index: 1;
          transform: translateZ(0);
        }
        
        /* When using hardware-accelerated animations */
        .highlight-item-optimized {
          /* Use transform for hardware acceleration but no actual animation */
          animation: none !important;
          position: relative;
          /* Force GPU rendering */
          transform: translateZ(0);
          /* No opacity changes that could cause flashing */
          opacity: 1 !important;
        }
        
        /* Instead of animating properties that can cause flashing, 
           use a pseudo element for the visual effect */
        .highlight-item-optimized::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 2;
          pointer-events: none;
          border-radius: inherit;
          box-shadow: 0 0 0 0 rgba(var(--primary-500-rgb), 0.4);
          /* Use this instead of scaling the parent element */
          animation: optimizedHighlightPulse 1s cubic-bezier(0.4, 0, 0.6, 1) forwards;
        }
        
        @keyframes optimizedHighlightPulse {
          0% { 
            box-shadow: 0 0 0 0 rgba(var(--primary-500-rgb), 0.4);
          }
          50% { 
            box-shadow: 0 0 0 8px rgba(var(--primary-500-rgb), 0.2);
          }
          100% { 
            box-shadow: 0 0 0 0 rgba(var(--primary-500-rgb), 0);
          }
        }
        
        /* Additional fix to prevent highlight flashing when adding/removing classes */
        .bg-primary-100, .bg-primary-500, .bg-primary-900\\/30 {
          transition: none !important;
        }
        
        /* Root variables */
        :root {
          --primary-500-rgb: 99, 102, 241;
          --time-item-bg: transparent;
          --time-item-text: inherit;
        }
        
        .dark {
          --primary-500-rgb: 129, 140, 248;
          /* Set dark mode background to avoid white flash */
          --time-item-bg: rgba(17, 24, 39, 0.4);
        }
      `;
      document.head.appendChild(style);
    }
  }, [mounted]);

  // Use the business hours function from utils that uses settings store
  const checkBusinessHours = useCallback((time: Date, timezone: string) => {
    return isBusinessHours(time, timezone);
  }, []);

  // Use the night hours function from utils that uses settings store
  const checkNightHours = useCallback((time: Date, timezone: string) => {
    return isNightHours(time, timezone);
  }, []);

  // Check if a time slot is at midnight (0:00)
  const isDateBoundary = useCallback((time: Date, timezone: string) => {
    const timeInTimezone = DateTime.fromJSDate(time).setZone(timezone);
    return timeInTimezone.hour === 0 && timeInTimezone.minute === 0;
  }, []);

  // Check if a time slot is near a DST transition
  const isDSTTransition = useCallback((time: Date, timezone: string) => {
    // Check if this time slot is within 24 hours of a DST transition
    const timeInTimezone = DateTime.fromJSDate(time).setZone(timezone);
    const oneDayLater = timeInTimezone.plus({ days: 1 });
    return timeInTimezone.offset !== oneDayLater.offset;
  }, []);
  
  // Cache for time-related calculations to reduce recomputation
  const timeCalculationCache = useRef(new Map<string, boolean>());
  
  // Clear cache when necessary data changes
  useEffect(() => {
    timeCalculationCache.current.clear();
  }, [localTime, highlightedTime]);
  
  // Optimized version of isCurrentTime with caching
  const isCurrentTime = useCallback((time: Date, timezone: string) => {
    if (!localTime) return false;
    
    const cacheKey = `current-${time.getTime()}-${timezone}`;
    if (timeCalculationCache.current.has(cacheKey)) {
      return timeCalculationCache.current.get(cacheKey) as boolean;
    }
    
    const now = DateTime.fromJSDate(localTime);
    const timeToCheck = DateTime.fromJSDate(time).setZone(timezone);
    
    const result = now.hasSame(timeToCheck, 'minute');
    timeCalculationCache.current.set(cacheKey, result);
    
    return result;
  }, [localTime]);
  
  // Get weekday name for a time
  const getWeekdayName = useCallback((time: Date, timezone: string) => {
    return DateTime.fromJSDate(time).setZone(timezone).toFormat('cccc');
  }, []);
  
  // Check if a day is a weekend
  const isWeekend = useCallback((time: Date, timezone: string) => {
    const weekday = DateTime.fromJSDate(time).setZone(timezone).weekday;
    return weekday === 6 || weekday === 7; // Saturday or Sunday
  }, []);

  // Get time zone offset for display
  const getTimezoneOffset = useCallback((timezone: string) => {
    return DateTime.now().setZone(timezone).toFormat('ZZ');
  }, []);

  // Mock function to check if there's a meeting at a specific time
  // In a real application, this would connect to a meeting/event API
  const hasMeetingAt = useCallback((time: Date, timezone: string): boolean => {
    // Disabled the mock meeting at 2pm for now
    // Will be replaced with a proper implementation in the future
    return false;
    
    // Previous implementation:
    // const timeToCheck = DateTime.fromJSDate(time).setZone(timezone);
    // return timeToCheck.hour === 14 && timeToCheck.minute === 0;
  }, []);

  // Mock function to get meeting title
  // Kept for future implementation
  const getMeetingTitle = useCallback((time: Date, timezone: string): string => {
    // This will be replaced with actual event data in the future
    return "";
  }, []);

  // Jump to a specific time period
  const jumpToTime = useCallback((timePeriod: 'morning' | 'afternoon' | 'evening' | 'night' | 'now', timezone: string) => {
    if (!listRefs.current[timezone]) return;
    
    let targetIndex = 0;
    
    switch (timePeriod) {
      case 'morning':
        // Jump to 8am
        targetIndex = timeSlots.findIndex(t => {
          const dt = DateTime.fromJSDate(t).setZone(timezone);
          return dt.hour === 8 && dt.minute === 0;
        });
        break;
      case 'afternoon':
        // Jump to 12pm
        targetIndex = timeSlots.findIndex(t => {
          const dt = DateTime.fromJSDate(t).setZone(timezone);
          return dt.hour === 12 && dt.minute === 0;
        });
        break;
      case 'evening':
        // Jump to 6pm
        targetIndex = timeSlots.findIndex(t => {
          const dt = DateTime.fromJSDate(t).setZone(timezone);
          return dt.hour === 18 && dt.minute === 0;
        });
        break;
      case 'night':
        // Jump to 9pm
        targetIndex = timeSlots.findIndex(t => {
          const dt = DateTime.fromJSDate(t).setZone(timezone);
          return dt.hour === 21 && dt.minute === 0;
        });
        break;
      case 'now':
        // Jump to current time
        targetIndex = getCurrentTimeIndex();
        break;
    }
    
    // Default to 0 if not found
    if (targetIndex === -1) targetIndex = 0;
    
    // Scroll to the target index
    listRefs.current[timezone]?.scrollToItem(targetIndex, 'center');
  }, [timeSlots, getCurrentTimeIndex]);
  
  // Handle adding a new timezone
  const handleAddTimezone = useCallback((timezone: Timezone) => {
    addTimezone(timezone);
    setSelectorOpen(false);
  }, [addTimezone]);
  
  // Handle replacing a timezone
  const handleReplaceTimezone = useCallback((timezone: Timezone) => {
    if (editingTimezoneId) {
      removeTimezone(editingTimezoneId);
      addTimezone(timezone);
      setEditingTimezoneId(null);
      setSelectorOpen(false);
    }
  }, [addTimezone, removeTimezone, editingTimezoneId]);
  
  // Handle removing a timezone
  const handleRemoveTimezone = useCallback((id: string) => {
    // Don't allow removing the local timezone
    if (id !== userLocalTimezone) {
      removeTimezone(id);
    }
  }, [removeTimezone, userLocalTimezone]);

  // Create a memoized time item component to prevent unnecessary re-renders
  interface TimeItemProps {
    style: React.CSSProperties;
    time: Date;
    timezone: string;
    isLocalTimeFn: (time: Date, timezone: string) => boolean;
    isHighlightedFn: (time: Date) => boolean;
    isBusinessHoursFn: (time: Date, timezone: string) => boolean;
    isNightTimeFn: (time: Date, timezone: string) => boolean;
    isDateBoundaryFn: (time: Date, timezone: string) => boolean;
    isDSTTransitionFn: (time: Date, timezone: string) => boolean;
    isCurrentTimeFn: (time: Date, timezone: string) => boolean;
    isWeekendFn: (time: Date, timezone: string) => boolean;
    formatTimeFn: (time: Date, timezone: string) => string;
    getHighlightAnimationClassFn: (isHighlight: boolean) => string;
    getTimezoneOffsetFn: (timezone: string) => string;
    handleTimeSelectionFn: (time: Date | null) => void;
  }

  // Memoize weekend highlight class getter to prevent unnecessary re-renders
  const getHighlightClass = useCallback((isWeekend: boolean) => {
    if (!isWeekend) return '';
    return getWeekendHighlightClass(weekendHighlightColor);
  }, [weekendHighlightColor]);

  const TimeItem = memo(function TimeItem({
    style,
    time,
    timezone,
    isLocalTimeFn,
    isHighlightedFn,
    isBusinessHoursFn,
    isNightTimeFn,
    isDateBoundaryFn,
    isDSTTransitionFn,
    isCurrentTimeFn,
    isWeekendFn,
    formatTimeFn,
    getHighlightAnimationClassFn,
    getTimezoneOffsetFn,
    handleTimeSelectionFn
  }: TimeItemProps) {
    // Check if this time should be highlighted
    const isHighlight = isHighlightedFn(time);
    const isLocalTime = isLocalTimeFn(time, timezone);
    const isBusinessHours = isBusinessHoursFn(time, timezone);
    const isNightTime = isNightTimeFn(time, timezone);
    const isDateBoundary = isDateBoundaryFn(time, timezone);
    const isDSTTransition = isDSTTransitionFn(time, timezone);
    const isCurrentTime = isCurrentTimeFn(time, timezone);
    const isWeekend = isWeekendFn(time, timezone);
    
    // Get formatted time for display
    const formattedTime = formatTimeFn(time, timezone);
    
    // Get animation class for highlighted times
    const highlightAnimationClass = getHighlightAnimationClassFn(isHighlight);
    
    // Calculate time cell classes based on properties
    const timeCellClasses = clsx(
      'relative z-10 px-3 py-3 transition-all duration-300 border-b border-gray-100 dark:border-gray-800',
      isDSTTransition ? 'border-l-4 border-l-amber-400 dark:border-l-amber-500' : '',
      isDateBoundary ? 'border-t-2 border-t-gray-300 dark:border-t-gray-600' : '',
      isHighlight ? 'bg-blue-50 dark:bg-blue-900/20 font-semibold' : '', 
      isLocalTime ? 'font-medium' : '',
      isBusinessHours && !isHighlight ? 'bg-green-50/50 dark:bg-green-900/10' : '',
      isNightTime && !isHighlight ? 'bg-gray-100/50 dark:bg-gray-800/50' : '',
      isWeekend && !isHighlight ? getWeekendHighlightClass(weekendHighlightColor) : '',
      !isBusinessHours && !isNightTime && !isHighlight && !isWeekend ? 'bg-white dark:bg-gray-900' : '',
      highlightAnimationClass
    );
    
    return (
      <div
        style={style}
        role="option"
        aria-selected={isHighlight}
        data-key={time.getTime()}
        data-local-time={isLocalTime ? 'true' : 'false'}
        data-time-item="true"
        onClick={() => handleTimeSelectionFn(time)}
        className={timeCellClasses}
        tabIndex={0}
      >
        {/* If it's midnight, show the date */}
        {isDateBoundary && (
          <div className="absolute top-0 left-0 w-full text-xs text-gray-500 dark:text-gray-400 pt-0.5 px-3 font-medium">
            {DateTime.fromJSDate(time).setZone(timezone).toFormat('EEE, MMM d')}
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <span className={`${isHighlight ? 'text-white' : ''} ${isCurrentTime ? 'text-primary-700 dark:text-primary-300 font-medium' : ''}`}>
            {formattedTime}
          </span>
          <div className="flex space-x-1">
            {isLocalTime && !isHighlight && (
              <span className="absolute left-0 top-0 h-full w-1 bg-primary-500 rounded-l-md" />
            )}
            
            {isBusinessHours && !isHighlight && (
              <span className="text-xs text-green-500" title="Business hours">●</span>
            )}
            
            {isNightTime && !isHighlight && (
              <span className="text-xs text-gray-400" title="Night time">○</span>
            )}
            
            {isDSTTransition && !isHighlight && (
              <span className="text-xs text-amber-500 ml-1" title="DST transition soon">⚠️</span>
            )}

            {isCurrentTime && !isHighlight && (
              <span className="text-xs text-blue-500 ml-1" title="Current time">⏰</span>
            )}

            {isWeekend && !isHighlight && (
              <span className="text-xs text-purple-500 ml-1" title="Weekend">🏖️</span>
            )}
          </div>
        </div>
      </div>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison function for memoization
    // Only re-render if any of these change
    return (
      prevProps.time.getTime() === nextProps.time.getTime() &&
      prevProps.timezone === nextProps.timezone &&
      prevProps.isHighlightedFn(prevProps.time) === nextProps.isHighlightedFn(nextProps.time) &&
      prevProps.isLocalTimeFn(prevProps.time, prevProps.timezone) === 
        nextProps.isLocalTimeFn(nextProps.time, nextProps.timezone) &&
      prevProps.isCurrentTimeFn(prevProps.time, prevProps.timezone) === 
        nextProps.isCurrentTimeFn(nextProps.time, nextProps.timezone)
    );
  });

  // Updated renderTimeColumns function to include the countdown indicator
  const renderTimeColumns = useCallback(() => {
    if (!mounted) return null;
    
    // Create a Set to track unique timezone IDs
    const uniqueTimezoneIds = new Set();
    const uniqueTimezones = [];
    
    // Add local timezone first if not already present
    if (!uniqueTimezoneIds.has(userLocalTimezone)) {
      uniqueTimezoneIds.add(userLocalTimezone);
      uniqueTimezones.push({ id: userLocalTimezone, name: `Local (${userLocalTimezone})` });
    }
    
    // Add up to 7 other timezones (not counting local timezone)
    // This allows for a total of 8 timezones including the local one
    let nonLocalCount = 0;
    for (const timezone of selectedTimezones) {
      if (!uniqueTimezoneIds.has(timezone.id) && nonLocalCount < 7) {
        uniqueTimezoneIds.add(timezone.id);
        uniqueTimezones.push(timezone);
        nonLocalCount++;
      }
    }
    
    // Determine if we can add more timezones (max is 8 total)
    const canAddMore = uniqueTimezones.length < 8;
    
    // Calculate time difference if a time is selected
    const getTimeDifference = () => {
      if (!highlightedTime || !localTime) return null;
      
      const now = DateTime.fromJSDate(localTime);
      const selected = DateTime.fromJSDate(highlightedTime);
      const diff = selected.diff(now, ['hours', 'minutes']);
      
      const hours = Math.floor(diff.hours);
      const minutes = Math.floor(diff.minutes);
      
      let diffText = '';
      if (hours !== 0) {
        diffText += `${Math.abs(hours)} hour${Math.abs(hours) !== 1 ? 's' : ''}`;
      }
      if (minutes !== 0) {
        if (diffText) diffText += ' ';
        diffText += `${Math.abs(minutes)} minute${Math.abs(minutes) !== 1 ? 's' : ''}`;
      }
      
      if (!diffText) return 'Current time';
      
      return `${diff.hours >= 0 && diff.minutes >= 0 ? '+' : '-'} ${diffText} from now`;
    };
    
    const timeDifference = getTimeDifference();
    
    return (
      <>
        {/* Time Relationship Indicator - show when a time is selected */}
        {highlightedTime && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-4 p-3 rounded-lg shadow-sm glass-card backdrop-blur-fix ${
              resolvedTheme === 'dark' ? 'glass-card-dark' : 'glass-card-light'
            }`}
            style={{
              isolation: 'isolate',
              backgroundColor: resolvedTheme === 'dark'
                ? 'rgba(15, 15, 25, 0.2)'
                : 'rgba(255, 255, 255, 0.15)'
            }}
          >
            <div className="flex items-center justify-between mb-2 relative z-[2]">
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 bg-primary-500 rounded-full mr-2"></span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {DateTime.fromJSDate(highlightedTime).toFormat('h:mm a')} {' '}
                  <span className="text-gray-600 dark:text-gray-300">
                    ({timeDifference})
                  </span>
                </span>
              </div>
              <button 
                onClick={() => handleTimeSelection(null)} 
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Clear time selection"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* Countdown indicator */}
            <div className="mt-2 relative z-[2]">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                <span>Auto-clear in {timeRemaining}s</span>
                <button 
                  onClick={resetInactivityTimer}
                  className="text-primary-500 hover:text-primary-600 focus:outline-none"
                  data-reset-timer="true"
                >
                  Reset
                </button>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div 
                  className="bg-primary-500 h-1.5 rounded-full transition-all duration-1000"
                  style={{ width: `${(timeRemaining / 60) * 100}%` }}
                ></div>
              </div>
            </div>
          </motion.div>
        )}
      
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 md:gap-8">
          {uniqueTimezones.map((timezone) => {
            // Check if the timezone is in DST
            const isDST = isInDST(timezone.id);
            
            return (
              <motion.div 
                key={timezone.id} 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`glass-card backdrop-blur-fix ${
                  resolvedTheme === 'dark' ? 'glass-card-dark' : 'glass-card-light'
                } rounded-lg p-5 md:p-6 lg:p-7 border border-gray-200 dark:border-gray-700
                          transition-all duration-200 hover:shadow-lg w-full`}
                style={{
                  isolation: 'isolate',
                  backgroundColor: resolvedTheme === 'dark'
                    ? 'rgba(15, 15, 25, 0.2)'
                    : 'rgba(255, 255, 255, 0.15)',
                  minWidth: '280px'
                }}
                data-timezone-id={timezone.id}
              >
                <div className="flex justify-between items-center mb-3 md:mb-4 relative z-[2]">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {timezone.name.split('/').pop()?.replace('_', ' ') || timezone.name}
                    </h3>
                    <div className="text-xs text-gray-600 dark:text-gray-300 flex items-center space-x-2">
                      <span>{DateTime.now().setZone(timezone.id).toFormat('ZZZZ')}</span>
                      <span>({getTimezoneOffset(timezone.id)})</span>
                      {isDST && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100">
                          DST
                        </span>
                      )}
                    </div>
                    {/* Show current time in the timezone */}
                    <div className="text-sm font-medium text-primary-600 dark:text-primary-400 mt-1">
                      {localTime && DateTime.fromJSDate(localTime).setZone(timezone.id).toFormat('h:mm a')}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 relative z-[2]">
                    {/* Timezone options dropdown */}
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <button 
                          className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700
                                    focus:outline-none focus:ring-2 focus:ring-primary-500"
                          aria-label="Timezone options"
                        >
                          <Settings className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </button>
                      </DropdownMenu.Trigger>
                      
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          className="min-w-[200px] bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1.5 border border-gray-200 dark:border-gray-700"
                          sideOffset={5}
                          align="end"
                        >
                          {timezone.id !== userLocalTimezone && (
                            <DropdownMenu.Item 
                              onSelect={() => {
                                setEditingTimezoneId(timezone.id);
                                setTimeout(() => setSelectorOpen(true), 100);
                              }}
                              className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Change Timezone
                            </DropdownMenu.Item>
                          )}
                          
                          {timezone.id !== userLocalTimezone && (
                            <DropdownMenu.Item 
                              onSelect={() => handleRemoveTimezone(timezone.id)}
                              className="flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenu.Item>
                          )}
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                    
                    {/* Replace quick navigation buttons with ExpandableTabs */}
                    <ExpandableTabs
                      tabs={[
                        { title: "Morning", icon: Sun, color: "text-amber-500" },
                        { title: "Afternoon", icon: ChevronUp, color: "text-blue-500" },
                        { title: "Evening", icon: ChevronDown, color: "text-orange-500" },
                        { title: "Night", icon: Moon, color: "text-indigo-500" },
                        { title: "Now", icon: Clock, color: "text-green-500" }
                      ]}
                      className="bg-gray-100 dark:bg-gray-700 rounded-full"
                      activeColor="text-primary-500"
                      size="sm"
                      onChange={(index) => {
                        if (index === null) return;
                        const timeValues = ['morning', 'afternoon', 'evening', 'night', 'now'] as const;
                        jumpToTime(timeValues[index], timezone.id);
                      }}
                    />
                  </div>
                </div>
                
                <div 
                  className="h-72 md:h-80 lg:h-96 rounded-md border border-gray-200/50 dark:border-gray-700/50 
                    backdrop-blur-[2px] overflow-hidden mt-4 md:mt-5 min-w-[300px] w-full"
                  style={{
                    backgroundColor: resolvedTheme === 'dark'
                      ? 'rgba(15, 15, 25, 0.1)'
                      : 'rgba(255, 255, 255, 0.1)'
                  }}
                  role="listbox"
                  aria-label={`Time selection list for ${timezone.name}`}
                >
                  <AutoSizer>
                    {({ height, width }) => (
                      <FixedSizeList
                        height={height}
                        width={width}
                        itemCount={timeSlots.length}
                        itemSize={48}
                        overscanCount={10}
                        ref={(ref) => { listRefs.current[timezone.id] = ref; }}
                        className="focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md"
                        style={{
                          backdropFilter: 'blur(2px)',
                          backgroundColor: resolvedTheme === 'dark' 
                            ? 'rgba(15, 15, 25, 0.05)'
                            : 'rgba(255, 255, 255, 0.05)'
                        }}
                        itemKey={(index) => `${timezone.id}-${timeSlots[index].getTime()}`}
                        onScroll={handleUserScroll}
                      >
                        {({ index, style }) => (
                          <TimeItem
                            style={style}
                            time={timeSlots[index]}
                            timezone={timezone.id}
                            isLocalTimeFn={isLocalTime}
                            isHighlightedFn={isHighlighted}
                            isBusinessHoursFn={checkBusinessHours}
                            isNightTimeFn={checkNightHours}
                            isDateBoundaryFn={isDateBoundary}
                            isDSTTransitionFn={isDSTTransition}
                            isCurrentTimeFn={isCurrentTime}
                            isWeekendFn={isWeekend}
                            formatTimeFn={formatTime}
                            getHighlightAnimationClassFn={getHighlightAnimationClass}
                            getTimezoneOffsetFn={getTimezoneOffset}
                            handleTimeSelectionFn={handleTimeSelection}
                          />
                        )}
                      </FixedSizeList>
                    )}
                  </AutoSizer>
                </div>
              </motion.div>
            );
          })}
          
          {/* Add Timezone Button */}
          {canAddMore && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectorOpen(true)}
              className={`glass-card backdrop-blur-fix ${
                resolvedTheme === 'dark' ? 'glass-card-dark' : 'glass-card-light'
              } rounded-lg border-2 border-dashed border-gray-300 
                        dark:border-gray-700 p-5 md:p-6 lg:p-7 h-full min-h-[300px] md:min-h-[320px] flex flex-col items-center justify-center
                        hover:border-primary-500 dark:hover:border-primary-500
                        transition-all duration-200 cursor-pointer w-full`}
              style={{
                isolation: 'isolate',
                backgroundColor: resolvedTheme === 'dark'
                  ? 'rgba(15, 15, 25, 0.2)'
                  : 'rgba(255, 255, 255, 0.15)',
                minWidth: '280px'
              }}
              aria-label="Add Timezone or Region - Track time for another region"
            >
              <div className="rounded-full bg-primary-100/80 dark:bg-primary-900/30 backdrop-blur-sm p-3 mb-3 shadow-md relative z-[2]">
                <Plus className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-300 font-medium relative z-[2]">Add Timezone or Region</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1 relative z-[2]">
                Track time for another region
              </p>
            </motion.button>
          )}
        </div>
      </>
    );
  }, [
    mounted,
    userLocalTimezone,
    selectedTimezones,
    timeSlots,
    isLocalTime,
    isHighlighted,
    checkBusinessHours,
    checkNightHours,
    isDateBoundary,
    isDSTTransition,
    isCurrentTime,
    isWeekend,
    getTimezoneOffset,
    formatTime,
    handleTimeSelection,
    getCurrentTimeIndex,
    jumpToTime,
    handleRemoveTimezone,
    timeRemaining,
    resetInactivityTimer,
    handleUserScroll,
    resolvedTheme,
    weekendHighlightColor
  ]);

  // Update the useEffect hook to call our updated synchronizeScrolls function
  useEffect(() => {
    if (!mounted || !timeSlots.length) return;
    
    // Use the synchronizeScrolls function we defined earlier
    // Only scroll to current time if user hasn't been scrolling recently
    if (!userIsScrolling) {
      synchronizeScrolls();
    }
    
    return () => {
      // Clear the timeout on cleanup
      if (scrollSyncTimeoutRef.current) {
        clearTimeout(scrollSyncTimeoutRef.current);
        scrollSyncTimeoutRef.current = null;
      }
    };
  }, [mounted, highlightedTime, localTime, timeSlots, synchronizeScrolls, userIsScrolling]);

  // Add cleanup for all timeouts
  useEffect(() => {
    return () => {
      // Clean up all timeouts on unmount
      if (scrollSyncTimeoutRef.current) {
        clearTimeout(scrollSyncTimeoutRef.current);
        scrollSyncTimeoutRef.current = null;
      }
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
    };
  }, []);

  return (
    <motion.div
      ref={timeColumnsContainerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8"
      style={{ isolation: 'isolate' }}
      onScroll={handleUserScroll} // Add onScroll handler
    >
      {renderTimeColumns()}
      
      {/* Timezone Selection Modal */}
      <AnimatePresence>
        {selectorOpen && (
          <TimezoneSelector
            isOpen={selectorOpen}
            onClose={() => {
              setSelectorOpen(false);
              setEditingTimezoneId(null);
            }}
            onSelect={editingTimezoneId ? handleReplaceTimezone : handleAddTimezone}
            excludeTimezones={[userLocalTimezone, ...selectedTimezones.map(tz => tz.id)]}
            data-timezone-selector
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
