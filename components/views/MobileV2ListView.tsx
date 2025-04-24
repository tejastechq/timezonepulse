'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo, memo, forwardRef, useImperativeHandle } from 'react';
import Image from 'next/image';
import { DateTime } from 'luxon';
import { motion, AnimatePresence } from 'framer-motion';
import { Timezone, useTimezoneStore } from '@/store/timezoneStore';
import { isNightHours, isWeekend } from '@/lib/utils/dateTimeFormatter';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { ChevronUp, ChevronDown, Sun, Moon, Clock, Plus, X, Edit2, Settings, CalendarDays } from 'lucide-react';
import { getAllTimezones, isInDST } from '@/lib/utils/timezone';
import SelectedTimeNotification from '../ui/SelectedTimeNotification';
import DateNotification from '../ui/DateNotification';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import TimezoneSelector from '../clock/TimezoneSelector';
import { useTheme } from 'next-themes';
import clsx from 'clsx';
// Removed settings store import
import { formatTimeForTimezone } from '@/lib/timezone-utils';
import { convertEarthToMarsTime, formatMarsTime } from '@/lib/utils/mars-timezone';

const useConsolidatedTimerHook = (
  mounted: boolean,
  highlightedTime: Date | null,
  highlightAutoClear: boolean,
  highlightDuration: number,
  handleTimeSelection: (time: Date | null) => void,
  timeRemainingRef: React.MutableRefObject<number>,
  setTimeRemaining: React.Dispatch<React.SetStateAction<number>>
) => {
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mounted || !highlightedTime || !highlightAutoClear) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    let lastTickTime = Date.now();
    let remainingTime = timeRemainingRef.current;

    const timerLoop = () => {
      if (!mounted || !highlightedTime || !highlightAutoClear) {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        return;
      }
      const now = Date.now();
      const deltaTime = now - lastTickTime;
      if (deltaTime >= 1000) {
        lastTickTime = now;
        remainingTime -= 1;
        if (remainingTime <= 0) {
          if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
          handleTimeSelection(null);
          return;
        }
        timeRemainingRef.current = remainingTime;
        setTimeRemaining(remainingTime);
      }
      animationFrameRef.current = requestAnimationFrame(timerLoop);
    };

    animationFrameRef.current = requestAnimationFrame(timerLoop);

    const frameRef = animationFrameRef.current; // Copy ref value
    return () => {
      if (frameRef) cancelAnimationFrame(frameRef); // Use copied value
    };
  }, [mounted, highlightedTime, highlightAutoClear, highlightDuration, handleTimeSelection, timeRemainingRef, setTimeRemaining]);
};

// Rename interface for clarity
interface MobileV2ListViewProps {
  selectedTimezones: Timezone[];
  userLocalTimezone: string;
  timeSlots: Date[];
  localTime: Date | null;
  highlightedTime: Date | null;
  handleTimeSelection: (time: Date | null) => void;
  roundToNearestIncrement: (date: Date, increment: number) => Date;
  removeTimezone?: (id: string) => void;
  currentDate?: Date | null;
  showBackground?: boolean; // optional prop to toggle background overlay
}

// Rename interface for clarity
export interface MobileV2ListViewHandle {
  scrollToTime: (time: Date, alignment?: 'start' | 'center' | 'end' | 'smart' | 'auto') => void;
}

interface TimeItemProps {
  style: React.CSSProperties;
  time: Date;
  timezone: string;
  isHighlightedFn: (time: Date) => boolean;
  isNightTimeFn: (time: Date, timezone: string) => boolean;
  isDateBoundaryFn: (time: Date, timezone: string) => boolean;
  isDSTTransitionFn: (time: Date, timezone: string) => boolean;
  isCurrentTimeFn: (time: Date) => boolean;
  isWeekendFn: (time: Date, timezone: string) => boolean;
  getHighlightAnimationClassFn: (isHighlight: boolean) => string;
  handleTimeSelectionFn: (time: Date) => void;
  getHighlightClass: (isWeekend: boolean) => string;
  formattedTimeStr: string;
}

const TimeItem = memo(function TimeItem({ style, time, timezone, isHighlightedFn, isNightTimeFn, isDateBoundaryFn, isDSTTransitionFn, isCurrentTimeFn, isWeekendFn, getHighlightAnimationClassFn, handleTimeSelectionFn, getHighlightClass, formattedTimeStr }: TimeItemProps) {
  const isHighlight = isHighlightedFn(time);
  const isNight = isNightTimeFn(time, timezone);
  const isDay = !isNight;
  const isBoundary = isDateBoundaryFn(time, timezone);
  const isDST = isDSTTransitionFn(time, timezone);
  const isCurrent = isCurrentTimeFn(time);
  const isWknd = isWeekendFn(time, timezone);
  const formatted = formattedTimeStr;
  const animClass = getHighlightAnimationClassFn(isHighlight);
  
  // Minimalistic styling
  const cellClasses = clsx(
    'flex justify-between items-center px-3 py-2 cursor-pointer transition-all duration-150 relative',
    'hover:bg-accent/30',
    // Apply bright background and animation to current time if not selected
    isHighlight ? 'bg-primary-500/90 text-white font-medium ring-2 ring-primary-400 shadow-lg scale-105 transition-transform duration-200' : 
    // Use pink for current time highlight
    isCurrent ? 'bg-pink-500/90 dark:bg-pink-600/90 text-white font-medium highlight-item-optimized highlight-pulse-effect' : 
    'text-foreground font-normal',
    // Keep day/night/boundary borders only if not current or highlighted
    isDay && !isHighlight && !isCurrent ? 'border-l border-amber-300/50 dark:border-amber-500/30 bg-amber-50/10 dark:bg-amber-900/5' : '',
    isNight && !isHighlight && !isCurrent ? 'border-l border-indigo-300/50 dark:border-indigo-500/30 bg-indigo-50/5 dark:bg-indigo-900/5' : '',
    isBoundary && !isHighlight && !isCurrent ? 'border-t border-t-border/30' : '', // Also hide border if current
    animClass // This applies highlight animation if selected (isHighlight is true)
  );
  
  return (
    <div
      style={style}
      role="option"
      aria-selected={isHighlight}
      data-key={time.getTime()}
      data-current-time={isCurrent ? 'true' : 'false'}
      data-time-item="true"
      onClick={(e) => { 
        e.stopPropagation(); 
        handleTimeSelectionFn(time);
      }}
      className={cellClasses}
      tabIndex={0}
    >
      {isBoundary && (
        <div className="absolute top-0 left-0 w-full flex items-center justify-center">
          <div className="bg-primary-100 dark:bg-primary-900/80 text-primary-800 dark:text-primary-200 text-xs rounded-b-md px-3 py-1 font-medium shadow-sm border-t-0 border-x border-b border-primary-200 dark:border-primary-700/50">
            {DateTime.fromJSDate(time).setZone(timezone).toFormat('EEE, MMM d')}
          </div>
        </div>
      )}
      
      {/* Time display with minimal styling */}
      <span className={clsx(
        'font-mono text-sm tracking-tight',
        // Make text white if highlighted OR current time
        isHighlight || isCurrent ? 'text-white' : 'text-foreground', 
        timezone.startsWith('Mars/') && !isHighlight && !isCurrent ? 'text-red-600/90 dark:text-red-400/90' : '' // Keep Mars red only if not highlighted/current
      )}>
        {timezone.startsWith('Mars/') && !isHighlight && !isCurrent && ( // Keep Mars icon only if not highlighted/current
          <span className="mr-1 text-red-600/80 dark:text-red-400/80 inline-flex items-center opacity-80" title="Mars Time">
            <span className="text-xs">♂︎</span>
          </span>
        )}
        {formatted}
      </span>
      
      {/* Simplified indicators */}
      <div className="flex items-center space-x-1.5 opacity-90"> {/* Increased opacity slightly for visibility on highlight */}
        {/* Show "Selected" when highlighted */}
        {isHighlight && <span className="text-xs font-medium text-white">Selected</span>}
        
        {/* Keep other indicators, but ensure they don't show when highlighted OR current */}
        {isNight && !isHighlight && !isCurrent && <span title="Night hours">●</span>}
        {isDay && !isHighlight && !isCurrent && <span title="Day hours">○</span>}
        {/* Make "now" indicator white */}
        {isCurrent && !isHighlight && <span className="text-xs font-medium text-white">now</span>} 
        {isDST && !isHighlight && !isCurrent && <span className="text-xs text-amber-500/80" title="DST transition">⊙</span>}
        {isWknd && !isHighlight && !isCurrent && <span className="text-xs text-purple-500/80" title="Weekend">⌇</span>}
      </div>
    </div>
  );
}, (prevProps, nextProps) => prevProps.time.getTime() === nextProps.time.getTime() && prevProps.timezone === nextProps.timezone && prevProps.isHighlightedFn(prevProps.time) === nextProps.isHighlightedFn(nextProps.time) && prevProps.isCurrentTimeFn(prevProps.time) === nextProps.isCurrentTimeFn(nextProps.time));
TimeItem.displayName = 'TimeItem';

const Row = ({ index, style, data }: ListChildComponentProps) => {
  const currentItemData = data;
  const slots = currentItemData.slots;
  const time = slots[index];

  if (!currentItemData || typeof currentItemData.isHighlightedFn !== 'function' || !currentItemData.timezoneId) {
    return <div style={style}>Error: Missing item data</div>;
  }

  let formattedTimeStr: string;

  if (currentItemData.isMars && currentItemData.marsSlotsData && currentItemData.marsSlotsData[index]) {
    const marsData = currentItemData.marsSlotsData[index];
    const marsDateTime = { hours: marsData.hours, minutes: marsData.minutes, seconds: 0, sol: marsData.sol };
    formattedTimeStr = formatMarsTime(marsDateTime);
  } else {
    formattedTimeStr = currentItemData.formatTimeFn(time, currentItemData.timezoneId);
  }

  return (
    <TimeItem
      style={style}
      time={time}
      timezone={currentItemData.timezoneId}
      isHighlightedFn={currentItemData.isHighlightedFn}
      isNightTimeFn={currentItemData.isNightTimeFn}
      isDateBoundaryFn={currentItemData.isDateBoundaryFn}
      isDSTTransitionFn={currentItemData.isDSTTransitionFn}
      isCurrentTimeFn={currentItemData.isCurrentTimeFn}
      isWeekendFn={currentItemData.isWeekendFn}
      getHighlightAnimationClassFn={currentItemData.getHighlightAnimationClassFn}
      handleTimeSelectionFn={currentItemData.handleTimeSelectionFn}
      getHighlightClass={currentItemData.getHighlightClass}
      formattedTimeStr={formattedTimeStr}
    />
  );
};

// Rename component
const MobileV2ListView = forwardRef<MobileV2ListViewHandle, MobileV2ListViewProps>(({
  selectedTimezones,
  userLocalTimezone,
  timeSlots,
  localTime,
  highlightedTime,
  handleTimeSelection,
  roundToNearestIncrement,
  removeTimezone: externalRemoveTimezone,
  currentDate,
  showBackground = true
}, ref) => {
  const timeColumnsContainerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const listRefs = useRef<Record<string, FixedSizeList | null>>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastRenderTimeRef = useRef<number>(Date.now());
  const scrollSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoScrollTimerRef = useRef<NodeJS.Timeout | null>(null); // Ref for 5s auto-scroll timer
  const touchEndTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref for short delay after touch ends

  const { resolvedTheme } = useTheme();
  // Removed settings store usage
  const weekendHighlightColor = 'red'; // Hardcoded default
  const highlightAutoClear = true; // Hardcoded default
  const highlightDuration = 60; // Hardcoded default (seconds)
  // Hardcoded weekend highlight class function
  const getWeekendHighlightClass = (color: string) => `bg-${color}-100 dark:bg-${color}-900/20`;

  const [selectorOpen, setSelectorOpen] = useState(false);
  const [editingTimezoneId, setEditingTimezoneId] = useState<string | null>(null);

  const { addTimezone, removeTimezone: storeRemoveTimezone, timezones: storeTimezones } = useTimezoneStore();
  const removeTimezone = externalRemoveTimezone || storeRemoveTimezone;

  const timeRemainingRef = useRef<number>(highlightDuration);
  const [timeRemaining, setTimeRemaining] = useState<number>(highlightDuration);

  const [userIsScrolling, setUserIsScrolling] = useState(false);
  const userIsScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTimeRef = useRef<number>(0);
  const [currentScrollOffset, setCurrentScrollOffset] = useState(0);

  const [selectedDateInfo, setSelectedDateInfo] = useState<string | null>(null);

  const markRender = useCallback((name: string) => {
    if (typeof performance !== 'undefined' && process.env.NODE_ENV === 'development') {
      performance.mark(`MobileV2ListView-${name}-${Date.now()}`); // Update mark name
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    markRender('mount');
    if (timeSlots.length > 0) {
      const firstSlot = timeSlots[0];
      const firstSlotDate = DateTime.fromJSDate(firstSlot);
      const currentDateTime = currentDate ? DateTime.fromJSDate(currentDate).startOf('day') : DateTime.local().startOf('day');
      if (!firstSlotDate.hasSame(currentDateTime, 'day')) {
        setSelectedDateInfo(firstSlotDate.toFormat('EEEE, MMMM d, yyyy'));
      } else {
        setSelectedDateInfo(null);
      }
    }
    // Copy refs for cleanup
    const timeoutId = timeoutRef.current;
    const intervalId = countdownIntervalRef.current;
    const frameId = animationFrameRef.current;
    const scrollSyncId = scrollSyncTimeoutRef.current;
    const scrollTimeoutId = scrollTimeoutRef.current;
    const autoScrollId = autoScrollTimerRef.current;
    const touchEndId = touchEndTimeoutRef.current;

    return () => {
      markRender('unmount');
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
      if (frameId) cancelAnimationFrame(frameId);
      if (scrollSyncId) clearTimeout(scrollSyncId);
      if (scrollTimeoutId) clearTimeout(scrollTimeoutId);
      if (autoScrollId) clearTimeout(autoScrollId); // Clear auto-scroll timer on unmount
      if (touchEndId) clearTimeout(touchEndId); // Clear touch end timer on unmount
    };
  }, [markRender, timeSlots, currentDate]);

  useConsolidatedTimerHook(
    mounted,
    highlightedTime,
    highlightAutoClear,
    highlightDuration,
    handleTimeSelection,
    timeRemainingRef,
    setTimeRemaining
  );

  const highlightedTimeRef = useRef<Date | null>(null);
  useEffect(() => {
    highlightedTimeRef.current = highlightedTime;
  }, [highlightedTime]);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (highlightedTime && highlightAutoClear) {
      setTimeRemaining(highlightDuration);
      timeRemainingRef.current = highlightDuration;
      timeoutRef.current = setTimeout(() => {
        if (highlightedTimeRef.current) {
          handleTimeSelection(null);
        }
      }, highlightDuration * 1000);
    } else if (!highlightedTime) {
      setTimeRemaining(highlightDuration);
      timeRemainingRef.current = highlightDuration;
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [highlightedTime, highlightAutoClear, highlightDuration, handleTimeSelection]);

  const resetInactivityTimer = useCallback(() => {
    if (!highlightedTimeRef.current || !highlightAutoClear) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setTimeRemaining(highlightDuration);
    timeRemainingRef.current = highlightDuration;
    timeoutRef.current = setTimeout(() => {
      if (highlightedTimeRef.current) {
        handleTimeSelection(null);
      }
    }, highlightDuration * 1000);
  }, [handleTimeSelection, highlightAutoClear, highlightDuration]);

  useEffect(() => {
    if (!mounted || !highlightedTime) return;
    let lastClickTime = 0;
    const CLICK_THROTTLE = 150;
    const handleClickOutside = (event: MouseEvent) => {
      const now = Date.now();
      if (now - lastClickTime < CLICK_THROTTLE) return;
      lastClickTime = now;
      if (timeColumnsContainerRef.current && !timeColumnsContainerRef.current.contains(event.target as Node) && !(event.target as Element)?.closest('[data-timezone-selector]')) {
        handleTimeSelection(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mounted, highlightedTime, handleTimeSelection]);

  // Define these earlier to fix TS errors related to declaration order
  const getCurrentTimeIndex = useCallback(() => {
    if (!localTime || !timeSlots.length) return 0;
    const roundedLocalTime = roundToNearestIncrement(localTime, 30);
    const index = timeSlots.findIndex(t => DateTime.fromJSDate(t).hasSame(DateTime.fromJSDate(roundedLocalTime), 'minute'));
    return index > -1 ? index : 0;
  }, [localTime, timeSlots, roundToNearestIncrement]);

  const scrollToIndex = useCallback((index: number, alignment: 'start' | 'center' | 'end' | 'smart' | 'auto' = 'center') => {
    if (userIsScrollingRef.current) return;
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // When manually invoking scrollToIndex (like for initial position),
    // we still want to synchronize all timezones for the first view
    // But after that, each timezone scrolls independently
    requestAnimationFrame(() => {
      Object.values(listRefs.current).forEach(listRef => {
        if (listRef) {
          listRef.scrollToItem(index, prefersReducedMotion ? 'start' : alignment);
        }
      });
    });
  }, []); // Removed dependencies that caused issues, rely on closure

  const handleUserScroll = useCallback((event: { scrollOffset: number; scrollUpdateWasRequested: boolean }) => {
    // Ignore programmatic scrolls and scrolls triggered by touch
    if (event.scrollUpdateWasRequested || userIsScrollingRef.current) {
        return;
    }

    // Handle non-touch scroll (e.g., mouse wheel)
    setUserIsScrolling(true); // Temporarily set for this scroll event sequence
    lastScrollTimeRef.current = Date.now();
    setCurrentScrollOffset(event.scrollOffset);

    // Clear any existing timers
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    if (autoScrollTimerRef.current) clearTimeout(autoScrollTimerRef.current);
    if (touchEndTimeoutRef.current) clearTimeout(touchEndTimeoutRef.current);

    // Set the timeout to detect when non-touch scrolling has stopped (500ms)
    scrollTimeoutRef.current = setTimeout(() => {
        // Check if a touch didn't take over in the meantime
        if (!userIsScrollingRef.current) {
            setUserIsScrolling(false); // Reset state for UI if needed

            // Start the 5-second auto-scroll timer
            if (autoScrollTimerRef.current) clearTimeout(autoScrollTimerRef.current);
            autoScrollTimerRef.current = setTimeout(() => {
                const targetTime = highlightedTimeRef.current;
                let targetIndex = -1;

                if (targetTime && timeSlots.length > 0) {
                    const targetTimeUTC = DateTime.fromJSDate(targetTime).toUTC();
                    targetIndex = timeSlots.findIndex(t => {
                        const slotTimeUTC = DateTime.fromJSDate(t).toUTC();
                        return slotTimeUTC.hasSame(targetTimeUTC, 'minute');
                    });
                } else if (timeSlots.length > 0) {
                    targetIndex = getCurrentTimeIndex();
                }

                if (targetIndex !== -1) {
                    scrollToIndex(targetIndex, 'start'); // Scroll to highlighted or current time
                }
            }, 5000); // 5 seconds delay
        } else {
            // If touch took over, just reset the UI state if needed
            setUserIsScrolling(false);
        }
    }, 500); // 500ms delay to detect scroll stop

    if (highlightedTimeRef.current) resetInactivityTimer();

  }, [resetInactivityTimer, timeSlots, getCurrentTimeIndex, scrollToIndex]); // Added dependencies back

  // --- Touch Event Handlers ---
  const handleTouchStart = useCallback(() => {
    // User started touching - definitely scrolling
    setUserIsScrolling(true);
    userIsScrollingRef.current = true;
    lastScrollTimeRef.current = Date.now(); // Update last interaction time

    // Clear any pending timers immediately
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    if (autoScrollTimerRef.current) clearTimeout(autoScrollTimerRef.current);
    if (touchEndTimeoutRef.current) clearTimeout(touchEndTimeoutRef.current);

    if (highlightedTimeRef.current) resetInactivityTimer();
  }, [resetInactivityTimer]);

  const handleTouchEndOrCancel = useCallback(() => {
    // User stopped touching. Wait a brief moment for scroll momentum to potentially stop
    // before declaring scrolling finished and starting the inactivity timer.
    if (touchEndTimeoutRef.current) clearTimeout(touchEndTimeoutRef.current);

    touchEndTimeoutRef.current = setTimeout(() => {
        setUserIsScrolling(false); // Update state for UI if needed
        userIsScrollingRef.current = false; // Mark scrolling as stopped

        // Now start the 5-second auto-scroll timer
        if (autoScrollTimerRef.current) clearTimeout(autoScrollTimerRef.current); // Clear just in case
        autoScrollTimerRef.current = setTimeout(() => {
            const targetTime = highlightedTimeRef.current;
            let targetIndex = -1;

            if (targetTime && timeSlots.length > 0) {
                const targetTimeUTC = DateTime.fromJSDate(targetTime).toUTC();
                targetIndex = timeSlots.findIndex(t => {
                    const slotTimeUTC = DateTime.fromJSDate(t).toUTC();
                    return slotTimeUTC.hasSame(targetTimeUTC, 'minute');
                });
            } else if (timeSlots.length > 0) {
                targetIndex = getCurrentTimeIndex();
            }

            if (targetIndex !== -1) {
                scrollToIndex(targetIndex, 'start'); // Scroll to highlighted or current time
            }
        }, 5000); // 5 seconds delay
    }, 100); // 100ms delay after touch ends
  }, [timeSlots, getCurrentTimeIndex, scrollToIndex]); // Added dependencies

  useImperativeHandle(ref, () => ({
    scrollToTime: (time: Date, alignment: 'start' | 'center' | 'end' | 'smart' | 'auto' = 'center') => {
      if (!time || !timeSlots.length) return;
      const targetTimeUTC = DateTime.fromJSDate(time).toUTC();
      const targetIndex = timeSlots.findIndex(t => {
        const slotTimeUTC = DateTime.fromJSDate(t).toUTC();
        return slotTimeUTC.hasSame(targetTimeUTC, 'minute');
      });
      if (targetIndex !== -1) {
        // Restore original requestAnimationFrame here
        requestAnimationFrame(() => {
          const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          Object.values(listRefs.current).forEach(listRef => {
            if (listRef) {
              listRef.scrollToItem(targetIndex, prefersReducedMotion ? 'start' : alignment);
            }
          });
        });
      }
    }
  }), [timeSlots]);

  const throttledUserInteraction = useCallback((event: Event) => {
    const now = Date.now();
    if (now - lastRenderTimeRef.current < 100) return;
    if (!highlightedTimeRef.current) return;
    if (event.type === 'keydown') {
      const keyEvent = event as KeyboardEvent;
      const accessibilityKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', ' ', 'Enter'];
      if (accessibilityKeys.includes(keyEvent.key)) {
        lastRenderTimeRef.current = now;
        resetInactivityTimer();
        return;
      }
    }
    const target = event.target as Element;
    const isRelevantInteraction = timeColumnsContainerRef.current?.contains(target) || target.closest('[data-time-item="true"]') !== null || target.closest('[data-reset-timer]') !== null;
    if (isRelevantInteraction) {
      lastRenderTimeRef.current = now;
      resetInactivityTimer();
    }
  }, [resetInactivityTimer]);

  useEffect(() => {
    if (!mounted || !highlightedTime) return;
    window.addEventListener('keydown', throttledUserInteraction, { passive: true });
    window.addEventListener('click', throttledUserInteraction, { passive: true });
    return () => {
      window.removeEventListener('keydown', throttledUserInteraction);
      window.removeEventListener('click', throttledUserInteraction);
    };
  }, [mounted, highlightedTime, throttledUserInteraction]);

  const formatTimeFunction = useMemo(() => (date: Date, timezone: string) => {
    return formatTimeForTimezone(date, timezone, 'h:mm a');
  }, []);
  const formatTime = useCallback((date: Date, timezone: string) => formatTimeFunction(date, timezone), [formatTimeFunction]);

  const isHighlighted = useCallback((time: Date) => highlightedTime ? time.getTime() === highlightedTime.getTime() : false, [highlightedTime]);
  const getHighlightAnimationClass = useCallback((isHighlight: boolean) => isHighlight ? 'highlight-item-optimized highlight-pulse-effect' : '', []);

  useEffect(() => {
    if (!mounted) return;
    if (!document.querySelector('#optimized-animations')) {
      const style = document.createElement('style');
      style.id = 'optimized-animations';
      style.innerHTML = `
        .time-item { transition: none !important; will-change: transform; position: relative; transform: translateZ(0); background-color: var(--time-item-bg, rgba(0, 0, 0, 0)); }
        .time-item.bg-primary-500 { background-color: rgb(var(--primary-500-rgb)) !important; color: white !important; transform: translateZ(0); backface-visibility: hidden; -webkit-font-smoothing: subpixel-antialiased; }
        .current-time-indicator { position: relative; overflow: hidden; z-index: 0; }
        .current-time-indicator::before { content: ''; position: absolute; left: 0; top: 0; height: 100%; width: 3px; background-color: rgb(var(--primary-500-rgb)); z-index: 1; transform: translateZ(0); }
        .current-time-highlight { background-color: rgba(59, 130, 246, 0.08); border-left: 3px solid rgb(59, 130, 246); font-weight: 500; position: relative; }
        .dark .current-time-highlight { background-color: rgba(96, 165, 250, 0.1); border-left: 3px solid rgb(96, 165, 250); }
        .current-time-highlight::after { content: ''; position: absolute; left: 0; top: 0; right: 0; bottom: 0; border-radius: 0 3px 3px 0; background: radial-gradient(circle at left, rgba(59, 130, 246, 0.15), transparent 70%); pointer-events: none; z-index: 0; }
        .dark .current-time-highlight::after { background: radial-gradient(circle at left, rgba(96, 165, 250, 0.15), transparent 70%); }
        .highlight-item-optimized { animation: none !important; position: relative; transform: translateZ(0); opacity: 1 !important; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); }
        .dark .highlight-item-optimized { box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3); }
        .highlight-pulse-effect { position: relative; overflow: hidden; }
        .highlight-pulse-effect::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(45deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0.1)); z-index: 3; transform: translateX(-100%); animation: shimmerHighlight 2s infinite; }
        @keyframes shimmerHighlight { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .highlight-item-optimized::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 2; pointer-events: none; border-radius: inherit; box-shadow: 0 0 0 0 rgba(var(--primary-500-rgb), 0.4); animation: optimizedHighlightPulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes optimizedHighlightPulse { 0% { box-shadow: 0 0 0 0 rgba(var(--primary-500-rgb), 0.4); background-color: rgba(var(--primary-500-rgb), 0.05); } 50% { box-shadow: 0 0 0 8px rgba(var(--primary-500-rgb), 0.2); background-color: rgba(var(--primary-500-rgb), 0); } 100% { box-shadow: 0 0 0 0 rgba(var(--primary-500-rgb), 0); background-color: rgba(var(--primary-500-rgb), 0.05); } }
        .bg-primary-100, .bg-primary-500, .bg-blue-500, .bg-blue-600, .bg-primary-900\\/30 { transition: none !important; }
        :root { --primary-500-rgb: 99, 102, 241; --time-item-bg: transparent; --time-item-text: inherit; }
        .dark { --primary-500-rgb: 129, 140, 248; --time-item-bg: rgba(17, 24, 39, 0.4); }
        /* Hide scrollbars across browsers */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        /* For Chrome, Safari, and newer Edge */
        ::-webkit-scrollbar {
          width: 0px;
          background: transparent;
        }
      `;
      document.head.appendChild(style);
    }
  }, [mounted]);

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
  const timeCalculationCache = useRef(new Map<string, boolean>());
  useEffect(() => { timeCalculationCache.current.clear(); }, [localTime, highlightedTime]);
  const isCurrentTime = useCallback((time: Date): boolean => {
    if (!localTime) return false;
    const timeDateTime = DateTime.fromJSDate(time);
    const localDateTime = DateTime.fromJSDate(localTime);
    const roundedLocalTime = Math.floor(localDateTime.minute / 30) * 30;
    const roundedLocalDateTime = localDateTime.set({ minute: roundedLocalTime, second: 0, millisecond: 0 });
    return timeDateTime.hasSame(roundedLocalDateTime, 'hour') && timeDateTime.minute === roundedLocalDateTime.minute;
  }, [localTime]);
  const getWeekdayName = useCallback((time: Date, timezone: string) => DateTime.fromJSDate(time).setZone(timezone).toFormat('cccc'), []);
  const isWeekend = useCallback((time: Date, timezone: string) => {
    const weekday = DateTime.fromJSDate(time).setZone(timezone).weekday;
    return weekday === 6 || weekday === 7;
  }, []);
  const getTimezoneOffset = useCallback((timezone: string) => DateTime.now().setZone(timezone).toFormat('ZZ'), []);
  const hasMeetingAt = useCallback((time: Date, timezone: string): boolean => false, []);
  const getMeetingTitle = useCallback((time: Date, timezone: string): string => "", []);

  const handleAddTimezone = useCallback((timezone: Timezone) => { addTimezone(timezone); setSelectorOpen(false); }, [addTimezone]);
  const handleReplaceTimezone = useCallback((timezone: Timezone) => {
    if (editingTimezoneId) {
      removeTimezone(editingTimezoneId);
      addTimezone(timezone);
      setEditingTimezoneId(null);
      setSelectorOpen(false);
    }
  }, [addTimezone, removeTimezone, editingTimezoneId]);

  const handleRemoveTimezone = useCallback((id: string) => {
    if (id !== userLocalTimezone) {
      removeTimezone(id);
    }
  }, [removeTimezone, userLocalTimezone]);

  const getHighlightClass = useCallback((isWeekend: boolean) => isWeekend ? getWeekendHighlightClass(weekendHighlightColor) : '', [weekendHighlightColor]); // Uses hardcoded function now

  const renderTimeColumns = useCallback(() => {
    if (!mounted) return null;

    const localTimezoneObj = storeTimezones.find(tz => tz.id === userLocalTimezone);
    const nonLocalTimezones = storeTimezones.filter(tz => tz.id !== userLocalTimezone);

    // Filter to only local timezone on initial load (when only 1 timezone saved)
    let displayTimezones: Timezone[] = [];
    if (storeTimezones.length <= 1 && localTimezoneObj) {
      displayTimezones = [localTimezoneObj];
    } else if (localTimezoneObj) {
      displayTimezones = [localTimezoneObj, ...nonLocalTimezones];
    } else {
      displayTimezones = [...nonLocalTimezones];
    }

    const canAddMore = displayTimezones.length < 8;

    const getTimeDifference = () => {
      if (!highlightedTime || !localTime) return null;
      const now = DateTime.fromJSDate(localTime);
      const selected = DateTime.fromJSDate(highlightedTime);
      const diff = selected.diff(now, ['hours', 'minutes']);
      const absHours = Math.abs(Math.floor(diff.hours));
      const absMinutes = Math.abs(Math.floor(diff.minutes));
      const isFuture = diff.hours >= 0 && diff.minutes >= 0;
      const direction = isFuture ? 'from now' : 'ago';
      let diffText = '';
      if (absHours > 0) diffText += `${absHours} ${absHours === 1 ? 'hour' : 'hours'}`;
      if (absMinutes > 0 || (absHours === 0 && absMinutes === 0)) { if (diffText) diffText += ' '; diffText += `${absMinutes} ${absMinutes === 1 ? 'minute' : 'minutes'}`; }
      if (absHours === 0 && absMinutes === 0) return 'Current time';
      return `${diffText} ${direction}`;
    };
    const timeDifference = getTimeDifference();
    const getTimeDiffColorClass = () => {
      if (!timeDifference || timeDifference === 'Current time') return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      if (timeDifference.includes('from now')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
    };
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {displayTimezones.map((timezone) => (
            <TimezoneColumn
              key={timezone.id}
              timezone={timezone}
              isLocal={timezone.id === userLocalTimezone}
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
              handleTimeSelection={handleTimeSelection}
              listRefs={listRefs}
              handleUserScroll={handleUserScroll}
              resolvedTheme={resolvedTheme}
              getTimezoneOffset={getTimezoneOffset}
              handleRemoveTimezone={handleRemoveTimezone}
              setEditingTimezoneId={setEditingTimezoneId}
              setSelectorOpen={setSelectorOpen}
              userLocalTimezone={userLocalTimezone}
              localTime={localTime}
              getHighlightClass={getHighlightClass}
              handleTouchStart={() => {}}
              handleTouchEnd={() => {}}
              handleTouchCancel={() => {}}
            />
          ))}

          {/* Add Timezone ghost card */}
          {canAddMore && (
            <div className="relative group">
              <button
                onClick={() => setSelectorOpen(true)}
                className="flex flex-col justify-center items-center border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-lg hover:border-primary-500 hover:dark:border-primary-400 hover:bg-primary-50/20 dark:hover:bg-primary-900/20 transition-colors cursor-pointer"
                style={{ minHeight: '350px', minWidth: '280px', height: '100%', width: '100%' }}
                aria-label="Add a new timezone or region"
              >
                <Plus className="w-8 h-8 mb-3 opacity-70" />
                <span className="font-medium text-lg">Add Timezone</span>
              </button>
            </div>
          )}
        </div>
      </>
    );
  }, [
    mounted, 
    userLocalTimezone, 
    storeTimezones, 
    timeSlots,
    isHighlighted,
    checkNightHours,
    isDateBoundary,
    isDSTTransition,
    isCurrentTime,
    isWeekend,
    getTimezoneOffset,
    formatTime,
    handleTimeSelection,
    getCurrentTimeIndex,
    handleRemoveTimezone,
    setSelectorOpen,
    setEditingTimezoneId,
    resolvedTheme,
    getHighlightClass,
    handleTouchStart,
    handleTouchEndOrCancel,
    getHighlightAnimationClass,
    handleUserScroll
  ]);

  useEffect(() => {
    if (!mounted || !highlightedTime) return;
    if (userIsScrollingRef.current) {
      const syncAfterScrolling = () => {
        if (!highlightedTime) return;
        const targetIndex = timeSlots.findIndex(slot => {
          const slotDateTime = DateTime.fromJSDate(slot).toUTC();
          const highlightedDateTime = DateTime.fromJSDate(highlightedTime).toUTC();
          return slotDateTime.hasSame(highlightedDateTime, 'minute');
        });
        if (targetIndex !== -1) {
          Object.values(listRefs.current).forEach(listRef => {
            if (listRef) {
              // Apply the 'start' alignment change here in syncAfterScrolling
              listRef.scrollToItem(targetIndex, 'start');
            }
          });
        }
      };
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(syncAfterScrolling, 500);
      return;
    }
    const highlightedDateTime = DateTime.fromJSDate(highlightedTime).toUTC();
    const targetIndex = timeSlots.findIndex(slot => {
      const slotDateTime = DateTime.fromJSDate(slot).toUTC();
      return slotDateTime.hasSame(highlightedDateTime, 'minute');
    });
    if (targetIndex !== -1) {
      // Remove requestAnimationFrame to attempt more immediate scrolling
      Object.values(listRefs.current).forEach(listRef => {
        if (listRef) {
          // Always scroll to the start (top) when a time is highlighted
          listRef.scrollToItem(targetIndex, 'start');
        }
      });
    }
  }, [highlightedTime, timeSlots, mounted]); // Ensure dependencies are correct

  useEffect(() => {
    if (!mounted || !localTime || highlightedTime || !timeSlots.length) return;
    const recentlyScrolled = Date.now() - lastScrollTimeRef.current < 1000;
    if (userIsScrollingRef.current || recentlyScrolled) {
      return;
    }
    const targetIndex = getCurrentTimeIndex();
    // Scroll current time to the top on initial load
    scrollToIndex(targetIndex, 'start'); 
  }, [mounted, localTime, highlightedTime, timeSlots, getCurrentTimeIndex, scrollToIndex]);

  useEffect(() => {
    return () => {
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

  const isViewingFutureDate = useMemo(() => {
    if (!timeSlots.length) return false;
    const firstSlot = timeSlots[0];
    const firstSlotDate = DateTime.fromJSDate(firstSlot);
    const currentDateTime = currentDate ? DateTime.fromJSDate(currentDate).startOf('day') : DateTime.local().startOf('day');
    return !firstSlotDate.hasSame(currentDateTime, 'day');
  }, [timeSlots, currentDate]);

  useEffect(() => {
    if (!mounted || !localTime) return;
    timeCalculationCache.current.clear();
    const localDateTime = DateTime.fromJSDate(localTime);
    const minute = localDateTime.minute;
    if ((minute === 0 || minute === 30) && localDateTime.second < 10) {
      Object.values(listRefs.current).forEach(listRef => {
        if (listRef) {
          listRef.forceUpdate();
        }
      });
      // Also scroll to current time (start) on half-hour updates if no time is highlighted
      if (!highlightedTime) {
        scrollToIndex(getCurrentTimeIndex(), 'start');
      }
    }
  }, [localTime, mounted, highlightedTime, scrollToIndex, getCurrentTimeIndex]);

  const currentTimeLineTop = useMemo(() => {
    if (!localTime || !timeSlots.length || !mounted) return null;
    const itemSize = 48;
    const listStartTime = DateTime.fromJSDate(timeSlots[0]);
    const currentLocalTime = DateTime.fromJSDate(localTime);
    const diffInMinutes = currentLocalTime.diff(listStartTime, 'minutes').minutes;
    const pixelOffset = (diffInMinutes / 30) * itemSize;
    return pixelOffset - currentScrollOffset;
  }, [localTime, timeSlots, mounted, currentScrollOffset]);

  return (
    <motion.div
      ref={timeColumnsContainerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-screen-xl mx-auto px-2 sm:px-4 lg:px-6 relative"
      style={{ 
        isolation: 'isolate',
        position: 'relative',
        zIndex: 1
      }}
    >

      <DateNotification 
        selectedDateInfo={selectedDateInfo}
        resolvedTheme={resolvedTheme}
      />

      {renderTimeColumns()}

      <AnimatePresence>
        {selectorOpen && (
          <TimezoneSelector
            key="timezone-selector"
            isOpen={true}
            onClose={() => { setSelectorOpen(false); setEditingTimezoneId(null); }}
            onSelect={editingTimezoneId ? handleReplaceTimezone : handleAddTimezone}
            excludeTimezones={[userLocalTimezone, ...selectedTimezones.map(tz => tz.id)]}
            data-timezone-selector
          />
        )}
      </AnimatePresence>

      <SelectedTimeNotification
        highlightedTime={highlightedTime}
        resolvedTheme={resolvedTheme}
        handleTimeSelection={handleTimeSelection}
        highlightAutoClear={highlightAutoClear}
        timeRemaining={timeRemaining}
        highlightDuration={highlightDuration}
        resetInactivityTimer={resetInactivityTimer}
      />
    </motion.div>
  );
});
// Rename display name
MobileV2ListView.displayName = 'MobileV2ListView';

const NEWS_API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY || '';
const SPORTS_API_KEY = '3'; // Use '3' for free tier/dev
const EPL_LEAGUE_ID = '4328'; // English Premier League as default

const NEWS_CATEGORIES = [
  { value: 'top', label: 'Top' },
  { value: 'sports', label: 'Sports' },
  { value: 'technology', label: 'Technology' },
  { value: 'business', label: 'Business' },
  { value: 'health', label: 'Health' },
  { value: 'science', label: 'Science' },
  { value: 'entertainment', label: 'Entertainment' },
];
const SPORTS_LEAGUES = [
  { value: '4328', label: 'EPL' },
  { value: '4387', label: 'NBA' },
  { value: '4424', label: 'MLB' },
  { value: '4391', label: 'NFL' },
];

const TimezoneColumn = memo(({
  timezone,
  isLocal,
  isSearching, filteredTimeSlots, timeSlots, isHighlighted, checkNightHours, isDateBoundary, isDSTTransition, isCurrentTime, isWeekend, formatTime, getHighlightAnimationClass, handleTimeSelection, listRefs, handleUserScroll, resolvedTheme, getTimezoneOffset, handleRemoveTimezone, setEditingTimezoneId, setSelectorOpen, userLocalTimezone, localTime, getHighlightClass,
  handleTouchStart, handleTouchEnd, handleTouchCancel
}: {
  timezone: Timezone;
  isLocal: boolean;
  isSearching: boolean;
  filteredTimeSlots: Date[];
  timeSlots: Date[];
  isHighlighted: (time: Date) => boolean;
  checkNightHours: (time: Date, timezone: string) => boolean;
  isDateBoundary: (time: Date, timezone: string) => boolean;
  isDSTTransition: (time: Date, timezone: string) => boolean;
  isCurrentTime: (time: Date) => boolean;
  isWeekend: (time: Date, timezone: string) => boolean;
  formatTime: (date: Date, timezone: string) => string;
  getHighlightAnimationClass: (isHighlight: boolean) => string;
  handleTimeSelection: (time: Date | null) => void;
  listRefs: React.MutableRefObject<Record<string, FixedSizeList | null>>;
  handleUserScroll: (event: { scrollOffset: number; scrollUpdateWasRequested: boolean }) => void;
  resolvedTheme: string | undefined;
  getTimezoneOffset: (timezone: string) => string;
  handleRemoveTimezone: (id: string) => void;
  setEditingTimezoneId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectorOpen: React.Dispatch<React.SetStateAction<boolean>>;
  userLocalTimezone: string;
  localTime: Date | null;
  getHighlightClass: (isWeekend: boolean) => string;
  handleTouchStart: () => void;
  handleTouchEnd: () => void;
  handleTouchCancel: () => void;
}) => {
  const itemSize = 40; // Define item size for height calculation
  const isDST = isInDST(timezone.id);
  const isMars = timezone.id.startsWith('Mars/');

  const marsTimeSlotsData = useMemo(() => {
    if (!isMars || !timeSlots.length) return null;
    const MARS_SOL_TO_EARTH_DAY_RATIO = 1.0274912517;
    const EARTH_INCREMENT_SECONDS = 30 * 60;
    const MARS_INCREMENT_SECONDS = EARTH_INCREMENT_SECONDS / MARS_SOL_TO_EARTH_DAY_RATIO;
    const MARS_SECONDS_IN_SOL = 86400;
    const referenceEarthTime = DateTime.fromJSDate(timeSlots[0]);
    const referenceMarsData = convertEarthToMarsTime(referenceEarthTime, timezone.id);
    let currentTotalMarsSeconds = (referenceMarsData.hours * 3600) + (referenceMarsData.minutes * 60) + referenceMarsData.seconds;
    let currentSol = referenceMarsData.sol;
    const slotsData: { hours: number; minutes: number; sol: number }[] = [];
    for (let i = 0; i < timeSlots.length; i++) {
      if (i > 0) {
        currentTotalMarsSeconds += MARS_INCREMENT_SECONDS;
        if (currentTotalMarsSeconds >= MARS_SECONDS_IN_SOL) {
           currentSol += Math.floor(currentTotalMarsSeconds / MARS_SECONDS_IN_SOL);
           currentTotalMarsSeconds %= MARS_SECONDS_IN_SOL;
        }
      }
      const positiveTotalSeconds = (currentTotalMarsSeconds % MARS_SECONDS_IN_SOL + MARS_SECONDS_IN_SOL) % MARS_SECONDS_IN_SOL;
      const hours = Math.floor(positiveTotalSeconds / 3600);
      const minutes = Math.floor((positiveTotalSeconds % 3600) / 60);
      slotsData.push({ hours, minutes, sol: currentSol });
    }
    return slotsData;
  }, [isMars, timeSlots, timezone.id]);

  const itemData = {
    slots: isSearching && filteredTimeSlots.length > 0 ? filteredTimeSlots : timeSlots,
    marsSlotsData: marsTimeSlotsData,
    timezoneId: timezone.id,
    isHighlightedFn: isHighlighted,
    isNightTimeFn: checkNightHours,
    isDateBoundaryFn: isDateBoundary,
    isDSTTransitionFn: isDSTTransition,
    isCurrentTimeFn: isCurrentTime,
    isWeekendFn: isWeekend,
    formatTimeFn: formatTime,
    getHighlightAnimationClassFn: getHighlightAnimationClass,
    handleTimeSelectionFn: handleTimeSelection,
    getHighlightClass: getHighlightClass,
    isMars: isMars,
  };

  const displaySlots = isSearching && filteredTimeSlots.length > 0 ? filteredTimeSlots : timeSlots;
  const listHeight = displaySlots.length * itemSize; // Calculate height based on filtered items
  const listRef = useRef<FixedSizeList | null>(null); // Create a ref for this specific list

  // --- EVENTS UI STATE ---
  const [showEvents, setShowEvents] = useState(false);
  const [activeTab, setActiveTab] = useState<'weather' | 'news' | 'sports'>('weather');
  const [newsCategory, setNewsCategory] = useState('top');
  const [sportsLeague, setSportsLeague] = useState(EPL_LEAGUE_ID);
  // Weather state
  const [weather, setWeather] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  // News state
  const [news, setNews] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  // Sports state
  const [sports, setSports] = useState<any[]>([]);
  const [sportsLoading, setSportsLoading] = useState(false);
  const [sportsError, setSportsError] = useState<string | null>(null);

  // Reset loading/error/data state on tab/filter change
  useEffect(() => {
    if (activeTab === 'weather') {
      setWeatherError(null);
    } else if (activeTab === 'news') {
      setNewsError(null);
    } else if (activeTab === 'sports') {
      setSportsError(null);
    }
  }, [activeTab]);

  // Fetch weather data
  useEffect(() => {
    if (showEvents && activeTab === 'weather' && timezone.lat && timezone.lon) {
      setWeatherLoading(true);
      setWeatherError(null);
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${timezone.lat}&longitude=${timezone.lon}&current_weather=true`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data && data.current_weather) {
            setWeather({
              temperature: data.current_weather.temperature,
              wind: data.current_weather.windspeed,
              condition: data.current_weather.weathercode,
              icon: null,
              humidity: data.current_weather.humidity
            });
          } else {
            setWeatherError('No weather data available.');
          }
        })
        .catch(() => setWeatherError('Failed to fetch weather data.'))
        .finally(() => setWeatherLoading(false));
    }
  }, [showEvents, activeTab, timezone.lat, timezone.lon]);

  // Fetch news data
  useEffect(() => {
    if (showEvents && activeTab === 'news' && timezone.country) {
      setNewsLoading(true);
      setNewsError(null);
      fetch(
        `https://newsdata.io/api/1/news?apikey=${NEWS_API_KEY}&country=${timezone.country?.toLowerCase()}&language=en&category=${newsCategory}`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data && data.results && Array.isArray(data.results)) {
            setNews(data.results);
          } else {
            setNewsError('No news data available.');
          }
        })
        .catch(() => setNewsError('Failed to fetch news data.'))
        .finally(() => setNewsLoading(false));
    }
  }, [showEvents, activeTab, timezone.country, newsCategory]);

  // Fetch sports data
  useEffect(() => {
    if (showEvents && activeTab === 'sports') {
      setSportsLoading(true);
      setSportsError(null);
      fetch(
        `https://www.thesportsdb.com/api/v1/json/${SPORTS_API_KEY}/eventspastleague.php?id=${sportsLeague}`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data && data.events && Array.isArray(data.events)) {
            setSports(data.events.slice(0, 10));
          } else {
            setSportsError('No sports data available.');
          }
        })
        .catch(() => setSportsError('Failed to fetch sports data.'))
        .finally(() => setSportsLoading(false));
    }
  }, [showEvents, activeTab, sportsLeague]);

  // Handler for clicking the top-right empty space to toggle collapse/expand
  const handleHeaderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent toggling if clicking the remove (X) button or its children
    if ((e.target as HTMLElement).closest('[data-remove-timezone]')) return;
    setShowEvents((prev) => !prev);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white/25 dark:bg-gray-800/30 backdrop-blur-md rounded-lg overflow-hidden shadow-xl border-2 border-primary-100/30 dark:border-primary-900/30"
      style={{ 
        isolation: 'isolate', 
        minWidth: '280px',
        transition: 'all 0.3s ease',
        backgroundImage: timezone.id.startsWith('Mars/') ? 
          'linear-gradient(to bottom right, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.01))' : 
          'linear-gradient(to bottom right, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.01))'
      }}
      data-timezone-id={timezone.id}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.15)';
        e.currentTarget.style.borderColor = timezone.id.startsWith('Mars/') ? 
          'rgba(239, 68, 68, 0.5)' : // Red for Mars
          'rgba(59, 130, 246, 0.5)'; // Blue for Earth
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.borderColor = '';
      }}
    >
      <div
        className="p-4 border-b-2 border-primary-100/30 dark:border-primary-900/30 flex justify-between items-center relative overflow-hidden cursor-pointer group"
        onClick={handleHeaderClick}
        tabIndex={0}
        aria-label={showEvents ? 'Collapse timezone card' : 'Expand timezone card'}
        role="button"
      >
        {/* Day/night indicator for visual context */}
        {localTime && (
          <div className="absolute inset-0 -z-10 opacity-20 pointer-events-none">
            {(() => {
              const dt = DateTime.fromJSDate(localTime).setZone(timezone.id);
              const hour = dt.hour;
              if (hour >= 5 && hour < 8) {
                return <div className="absolute inset-0 bg-gradient-to-r from-amber-300/30 to-blue-300/30" />; // Dawn
              } else if (hour >= 8 && hour < 16) {
                return <div className="absolute inset-0 bg-gradient-to-r from-yellow-300/30 to-sky-300/30" />; // Day
              } else if (hour >= 16 && hour < 19) {
                return <div className="absolute inset-0 bg-gradient-to-r from-orange-300/30 to-purple-300/30" />; // Dusk
              } else {
                return <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 to-indigo-900/30" />; // Night
              }
            })()}
          </div>
        )}
        <div>
          <div className="flex items-baseline">
            <h3 className={`text-lg font-semibold ${timezone.id === 'Mars/Jezero' ? 'text-red-600 dark:text-red-400' : 'text-primary-700 dark:text-primary-300'} flex items-center`}>
              {timezone.id.startsWith('Mars/') && (<span className="inline-block mr-2" title="Mars Time"><Image src="/mars.png" alt="Mars" width={20} height={20} className="inline-block w-5 h-5 align-text-bottom" /></span>)}
              <span className="truncate">{(timezone.name.split('/').pop()?.replace('_', ' ') || timezone.name).replace(/[()]/g, '').replace(/[-+]\d{2}:\d{2}/, '')}</span>
            </h3>
            <span className="ml-2 text-xs font-medium text-muted-foreground bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
              {timezone.id.startsWith('Mars/') 
                ? timezone.id === 'Mars/Jezero' ? 'MTC+05:10' : 'MTC' 
                : (() => {
                    const localOffset = DateTime.now().setZone(userLocalTimezone).offset;
                    const tzOffset = DateTime.now().setZone(timezone.id).offset;
                    const diffMinutes = tzOffset - localOffset;
                    const sign = diffMinutes >= 0 ? '+' : '-';
                    const absMinutes = Math.abs(diffMinutes);
                    const hours = Math.floor(absMinutes / 60).toString().padStart(2, '0');
                    const minutes = (absMinutes % 60).toString().padStart(2, '0');
                    return `${sign}${hours}:${minutes}`;
                  })()}
            </span>
          </div>
          <div className={`text-2xl font-mono font-semibold mt-2 tracking-tight ${timezone.id.startsWith('Mars/') ? 'text-red-600 dark:text-red-400' : 'text-primary-600 dark:text-primary-400'}`}>
            {localTime && formatTime(localTime, timezone.id)}
          </div>
          {/* Time of day visual indicator */}
          {localTime && (
            <div className="mt-2 flex items-center">
              {(() => {
                const dt = DateTime.fromJSDate(localTime).setZone(timezone.id);
                const hour = dt.hour;
                const minutePercentage = dt.minute / 60;
                const dayProgress = ((hour + minutePercentage) / 24) * 100;
                return (
                  <>
                    <div className="h-2 flex-grow rounded-full bg-gray-200/50 dark:bg-gray-700/50 overflow-hidden">
                      <div 
                        className="h-full transition-all duration-1000 ease-in-out" 
                        style={{ 
                          width: `${dayProgress}%`,
                          background: hour >= 5 && hour < 8 ? 'linear-gradient(to right, #fbbf24, #60a5fa)' : // Dawn
                                    hour >= 8 && hour < 16 ? 'linear-gradient(to right, #fcd34d, #38bdf8)' : // Day
                                    hour >= 16 && hour < 19 ? 'linear-gradient(to right, #fb923c, #c084fc)' : // Dusk
                                    'linear-gradient(to right, #1e3a8a, #4f46e5)' // Night
                        }}
                      ></div>
                    </div>
                    <span className="ml-2 text-xs font-medium text-muted-foreground/90">
                      {hour >= 5 && hour < 8 ? 'Dawn' : 
                       hour >= 8 && hour < 16 ? 'Day' : 
                       hour >= 16 && hour < 19 ? 'Dusk' : 'Night'}
                    </span>
                  </>
                );
              })()}
            </div>
          )}
          {/* Mars mini info - simplified */}
          {timezone.id === 'Mars/Jezero' && (
            <div className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">
              Perseverance • Jezero Crater • {localTime && formatTime(localTime, timezone.id).includes('Sol') ? formatTime(localTime, timezone.id).split('MTC')[1].trim() : 'Sol'}
            </div>
          )}
        </div>
        {/* Remove button (excluded from header click) */}
        {!isLocal && timezone.id !== userLocalTimezone && (
          <button 
            onClick={() => handleRemoveTimezone(timezone.id)} 
            className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 transition-colors z-10"
            aria-label={`Remove timezone ${(timezone.name.split('/').pop()?.replace('_', ' ') || timezone.name).replace(/[()]/g, '')}`}
            data-remove-timezone
            tabIndex={0}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {/* Time increments list (only show when not showing events) */}
      {!showEvents && (
        <div
          className="overflow-hidden scrollbar-hide"
          style={{
            height: '15rem',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          role="listbox"
          aria-label={`Time selection list for ${timezone.name}`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
          onWheel={(e) => {
            e.stopPropagation();
            const listRef = listRefs.current[timezone.id];
            if (!listRef) return;
            let currentOffset = 0;
            if (listRef.state && 'scrollOffset' in listRef.state) {
              currentOffset = (listRef.state as any).scrollOffset;
            }
            const itemSize = 40;
            const scrollAmount = e.deltaY > 0 ? itemSize : -itemSize;
            const newOffset = Math.max(0, currentOffset + scrollAmount);
            listRef.scrollTo(newOffset);
          }}
        >
           <AutoSizer>
             {({ height, width }) => (
               <FixedSizeList
                 key={isSearching && displaySlots.length > 0 ? `filtered-${timezone.id}` : `full-${timezone.id}`}
                 height={height}
                 width={width}
                  itemCount={displaySlots.length}
                 itemSize={itemSize}
                 overscanCount={10}
                 ref={(r) => {
                   listRef.current = r;
                   listRefs.current[timezone.id] = r;
                 }}
                 className="focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md scrollbar-hide"
                 style={{
                  backgroundColor: 'transparent',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
                itemKey={(index) => `${timezone.id}-${itemData.slots[index].getTime()}`}
                onScroll={handleUserScroll}
                itemData={itemData}
              >
                {Row}
              </FixedSizeList>
            )}
          </AutoSizer>
        </div>
      )}
      {/* --- EVENTS UI --- */}
      <div className="w-full flex flex-col items-center justify-center mt-2">
        {/* Remove the Show Events button, header is now the toggle */}
        {showEvents && (
          <motion.div layout initial={false} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} style={{ overflow: 'hidden', width: '100%' }}>
            <button
              onClick={() => setShowEvents(false)}
              className="mb-4 w-full py-2 rounded-lg bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-semibold shadow hover:bg-gray-400 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
              aria-label="Hide events for this timezone"
            >
              Hide Events
            </button>
            {/* Tab Bar */}
            <div role="tablist" aria-label="Current Events Tabs" className="flex w-full justify-center gap-2 mb-2">
              <button
                role="tab"
                aria-selected={activeTab === 'weather'}
                tabIndex={activeTab === 'weather' ? 0 : -1}
                className={`px-4 py-2 rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${activeTab === 'weather' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                onClick={() => setActiveTab('weather')}
              >
                <span role="img" aria-label="Weather" className="mr-1">☀️</span> Weather
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'news'}
                tabIndex={activeTab === 'news' ? 0 : -1}
                className={`px-4 py-2 rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${activeTab === 'news' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                onClick={() => setActiveTab('news')}
              >
                <span role="img" aria-label="News" className="mr-1">📰</span> News
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'sports'}
                tabIndex={activeTab === 'sports' ? 0 : -1}
                className={`px-4 py-2 rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${activeTab === 'sports' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                onClick={() => setActiveTab('sports')}
              >
                <span role="img" aria-label="Sports" className="mr-1">🏟️</span> Sports
              </button>
            </div>
            {/* Filter Bar */}
            <div className="flex w-full justify-center gap-4 mb-4">
              {activeTab === 'news' && (
                <div>
                  <label htmlFor="filter-category" className="text-xs text-gray-500 dark:text-gray-400 mr-1">Category</label>
                  <select
                    id="filter-category"
                    className="rounded px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                    value={newsCategory}
                    onChange={e => setNewsCategory(e.target.value)}
                  >
                    {NEWS_CATEGORIES.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}
              {activeTab === 'sports' && (
                <div>
                  <label htmlFor="filter-league" className="text-xs text-gray-500 dark:text-gray-400 mr-1">League</label>
                  <select
                    id="filter-league"
                    className="rounded px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                    value={sportsLeague}
                    onChange={e => setSportsLeague(e.target.value)}
                  >
                    {SPORTS_LEAGUES.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {/* Tab Content Area */}
            <div className="w-full flex flex-col items-center justify-center min-h-[80px]">
              {activeTab === 'weather' && (
                <div className="w-full flex flex-col items-center">
                  {weatherLoading && <div className="text-gray-500">Loading weather...</div>}
                  {weatherError && <div className="text-red-600">{weatherError}</div>}
                  {!weatherLoading && !weatherError && weather && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-3xl font-bold text-primary-600 dark:text-primary-300">
                        {weather.temperature}&deg;C
                      </div>
                      <div className="text-lg text-gray-700 dark:text-gray-200">
                        Condition code: {weather.condition}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Wind: {weather.wind} km/h
                      </div>
                      {weather.humidity !== undefined && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Humidity: {weather.humidity}%
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'news' && (
                <div className="w-full flex flex-col items-center">
                  {newsLoading && <div className="text-gray-500">Loading news...</div>}
                  {newsError && <div className="text-red-600">{newsError}</div>}
                  {!newsLoading && !newsError && news && news.length > 0 && (
                    <ul className="w-full max-w-md divide-y divide-gray-200 dark:divide-gray-700">
                      {news.map((article, idx) => (
                        <li key={idx} className="py-2">
                          <a href={article.link} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary-600 dark:text-primary-300 hover:underline">
                            {article.title}
                          </a>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {article.source_id || article.creator?.[0] || 'Unknown Source'}
                            {article.pubDate && (
                              <span> &middot; {new Date(article.pubDate).toLocaleString()}</span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {!newsLoading && !newsError && (!news || news.length === 0) && (
                    <div className="text-gray-500">No news found for this region.</div>
                  )}
                </div>
              )}
              {activeTab === 'sports' && (
                <div className="w-full flex flex-col items-center">
                  {sportsLoading && <div className="text-gray-500">Loading sports events...</div>}
                  {sportsError && <div className="text-red-600">{sportsError}</div>}
                  {!sportsLoading && !sportsError && sports && sports.length > 0 && (
                    <ul className="w-full max-w-md divide-y divide-gray-200 dark:divide-gray-700">
                      {sports.map((event, idx) => (
                        <li key={event.idEvent || idx} className="py-2">
                          <div className="font-semibold text-primary-600 dark:text-primary-300">
                            {event.strEvent}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {event.strLeague} &middot; {event.dateEvent} {event.strTime}
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-200">
                            {event.strHomeTeam} {event.intHomeScore !== null ? event.intHomeScore : ''}
                            {event.intHomeScore !== null && event.intAwayScore !== null ? ' - ' : ''}
                            {event.strAwayTeam} {event.intAwayScore !== null ? event.intAwayScore : ''}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {!sportsLoading && !sportsError && (!sports || sports.length === 0) && (
                    <div className="text-gray-500">No sports events found.</div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
});
TimezoneColumn.displayName = 'TimezoneColumn';

// Rename export and export TimezoneColumn
export { TimezoneColumn }; // Export the column component
export default MobileV2ListView;


const TimeHeaderRow = memo(function TimeHeaderRow({
  timeSlot,
  isHalfHour,
  isDateBoundary,
  isDSTTransition,
  isCurrentTime,
  formattedTime
}: {
  timeSlot: Date;
  isHalfHour: boolean;
  isDateBoundary: boolean;
  isDSTTransition: boolean;
  isCurrentTime: boolean;
  formattedTime: string;
}) {
  const dt = DateTime.fromJSDate(timeSlot);
  const dateDisplay = dt.toFormat('EEE, MMM d');
  // Removed settings store usage
  const hour = dt.hour;
  // Hardcoded night hours check
  const nightHoursStart = 20; 
  const nightHoursEnd = 6;
  const isNightTime = nightHoursStart > nightHoursEnd ? hour >= nightHoursStart || hour < nightHoursEnd : hour >= nightHoursStart && hour < nightHoursEnd;
  const dayTimeColor = 'text-amber-500 dark:text-amber-400';
  const nightTimeColor = 'text-indigo-400 dark:text-indigo-300';
  return (
    <div className={`px-2 py-1 text-sm ${isHalfHour ? 'opacity-60 text-xs' : 'font-semibold'} ${isCurrentTime ? 'text-primary-500 font-bold' : ''} ${isDateBoundary ? 'border-t border-gray-300 dark:border-gray-700 pt-4 mt-4' : ''} ${isNightTime ? 'bg-gray-100/50 dark:bg-gray-800/30' : 'bg-transparent'}`}>
      {(dt.hour === 0 && dt.minute === 0) || ((dt.hour === 0 || dt.hour === 12) && dt.minute === 0) ? (
        <div className="flex flex-col"><span className="text-primary-500 font-bold">{dateDisplay}</span><div className="mt-1 flex items-center"><span>{formattedTime}</span>{isNightTime ? (<Moon className={`ml-2 h-3.5 w-3.5 ${nightTimeColor}`} />) : (<Sun className={`ml-2 h-3.5 w-3.5 ${dayTimeColor}`} />)}</div></div>
      ) : (
        <div className="flex items-center"><span>{formattedTime}</span>{isNightTime ? (<Moon className={`ml-2 h-3 w-3 ${nightTimeColor}`} />) : (<Sun className={`ml-2 h-3 w-3 ${dayTimeColor}`} />)}</div>
      )}
      {isDSTTransition && (<span className="block text-xs text-amber-500 dark:text-amber-400 mt-1">DST {dt.isInDST ? 'begins' : 'ends'}</span>)}
    </div>
  );
});
