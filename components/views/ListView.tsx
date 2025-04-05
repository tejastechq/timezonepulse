'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo, memo, forwardRef, useImperativeHandle, startTransition } from 'react';
import Image from 'next/image';
import { DateTime } from 'luxon';
import { motion, AnimatePresence } from 'framer-motion';
import { Timezone, useTimezoneStore } from '@/store/timezoneStore';
import { isNightHours, isWeekend } from '@/lib/utils/dateTimeFormatter';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
// Removed AutoSizer import
// import AutoSizer from 'react-virtualized-auto-sizer'; 
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

interface ListViewProps {
  selectedTimezones: Timezone[];
  userLocalTimezone: string;
  timeSlots: Date[];
  localTime: Date | null;
  highlightedTime: Date | null;
  handleTimeSelection: (time: Date | null) => void;
  roundToNearestIncrement: (date: Date, increment: number) => Date;
  removeTimezone?: (id: string) => void;
  currentDate?: Date | null;
}

export interface ListViewHandle {
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
    isHighlight ? 'bg-primary-500/90 text-white font-medium' : 'text-foreground font-normal',
    isCurrent && !isHighlight ? 'border-l-2 border-primary-400 bg-primary-100/10 dark:bg-primary-900/10' : '',
    isDay && !isHighlight && !isCurrent ? 'border-l border-amber-300/50 dark:border-amber-500/30 bg-amber-50/10 dark:bg-amber-900/5' : '',
    isNight && !isHighlight && !isCurrent ? 'border-l border-indigo-300/50 dark:border-indigo-500/30 bg-indigo-50/5 dark:bg-indigo-900/5' : '',
    isBoundary && !isHighlight ? 'border-t border-t-border/30' : '',
    animClass
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
        isHighlight ? 'text-white' : isCurrent ? 'text-primary-700 dark:text-primary-300 font-medium' : 'text-foreground',
        timezone.startsWith('Mars/') && !isHighlight ? 'text-red-600/90 dark:text-red-400/90' : ''
      )}>
        {timezone.startsWith('Mars/') && !isHighlight && (
          <span className="mr-1 text-red-600/80 dark:text-red-400/80 inline-flex items-center opacity-80" title="Mars Time">
            <span className="text-xs">♂︎</span>
          </span>
        )}
        {formatted}
      </span>
      
      {/* Simplified indicators */}
      <div className="flex items-center space-x-1.5 opacity-70">
        {isNight && !isHighlight && <span title="Night hours">●</span>}
        {isDay && !isHighlight && <span title="Day hours">○</span>}
        {isCurrent && !isHighlight && <span className="text-xs font-medium text-primary-500">now</span>}
        {isDST && !isHighlight && <span className="text-xs text-amber-500/80" title="DST transition">⊙</span>}
        {isWknd && !isHighlight && <span className="text-xs text-purple-500/80" title="Weekend">⌇</span>}
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

const ListView = forwardRef<ListViewHandle, ListViewProps>(({
  selectedTimezones,
  userLocalTimezone,
  timeSlots,
  localTime,
  highlightedTime,
  handleTimeSelection,
  roundToNearestIncrement,
  removeTimezone: externalRemoveTimezone,
  currentDate
}, ref) => {
  const timeColumnsContainerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const listRefs = useRef<Record<string, FixedSizeList | null>>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastRenderTimeRef = useRef<number>(Date.now());
  const scrollSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTimeSlots, setFilteredTimeSlots] = useState<Date[]>([]);

  const markRender = useCallback((name: string) => {
    if (typeof performance !== 'undefined' && process.env.NODE_ENV === 'development') {
      performance.mark(`ListView-${name}-${Date.now()}`);
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

    return () => {
      markRender('unmount');
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
      if (frameId) cancelAnimationFrame(frameId);
      if (scrollSyncId) clearTimeout(scrollSyncId);
      if (scrollTimeoutId) clearTimeout(scrollTimeoutId);
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

  const handleUserScroll = useCallback((event: { scrollOffset: number; scrollUpdateWasRequested: boolean }) => {
    if (!event.scrollUpdateWasRequested) {
        setUserIsScrolling(true);
        userIsScrollingRef.current = true;
        lastScrollTimeRef.current = Date.now();
        setCurrentScrollOffset(event.scrollOffset);

        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
            setUserIsScrolling(false);
            userIsScrollingRef.current = false;
        }, 500);

        if (highlightedTimeRef.current) resetInactivityTimer();
        
        // We no longer synchronize scrolling between timezone lists
        // Each list scrolls independently
    }
  }, [resetInactivityTimer]);

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
  }, []);

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
      const timezoneToRemove = selectedTimezones.find(tz => tz.id === id);
      const name = timezoneToRemove?.name.split('/').pop()?.replace('_', ' ') || id;
      if (window.confirm(`Are you sure you want to remove the timezone "${name}"?`)) {
        removeTimezone(id);
      }
    }
  }, [removeTimezone, userLocalTimezone, selectedTimezones]);

  const getHighlightClass = useCallback((isWeekend: boolean) => isWeekend ? getWeekendHighlightClass(weekendHighlightColor) : '', [weekendHighlightColor]); // Uses hardcoded function now

  const handleSearch = useCallback((term: string) => {
    if (!term.trim()) {
      scrollToIndex(getCurrentTimeIndex(), 'center');
      return;
    }
    const searchLower = term.toLowerCase().trim();
    const filtered = timeSlots.filter(timeSlot => {
      const timeInLocalZone = DateTime.fromJSDate(timeSlot).setZone(userLocalTimezone);
      const hour12 = timeInLocalZone.toFormat('h');
      const hour24 = timeInLocalZone.toFormat('HH');
      const fullTime12 = timeInLocalZone.toFormat('h:mm a').toLowerCase();
      const fullTime24 = timeInLocalZone.toFormat('HH:mm').toLowerCase();
      if (searchLower.includes(':')) return fullTime12.startsWith(searchLower) || fullTime24.startsWith(searchLower);
      else return hour12 === searchLower || hour24 === searchLower;
    });
    scrollToIndex(filtered.length > 0 ? timeSlots.findIndex(t => t.getTime() === filtered[0].getTime()) : getCurrentTimeIndex(), 'center');
  }, [timeSlots, userLocalTimezone, scrollToIndex, getCurrentTimeIndex]);

  useEffect(() => { if (searchTerm) handleSearch(searchTerm); }, [timeSlots, searchTerm, handleSearch]);

  const handleClearSearch = useCallback(() => {
    scrollToIndex(getCurrentTimeIndex(), 'center');
  }, [scrollToIndex, getCurrentTimeIndex]);

  const renderTimeColumns = useCallback(() => {
    if (!mounted) return null;

    const localTimezoneObj = storeTimezones.find(tz => tz.id === userLocalTimezone);
    const nonLocalTimezones = storeTimezones.filter(tz => tz.id !== userLocalTimezone);
    const displayTimezones = localTimezoneObj ? [localTimezoneObj, ...nonLocalTimezones] : [...nonLocalTimezones];
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 justify-items-center"> {/* Added justify-items-center */}
          {displayTimezones.map((timezone) => (
            <TimezoneColumn
              key={timezone.id}
              timezone={timezone}
              isLocal={timezone.id === userLocalTimezone}
              isSearching={isSearching}
              filteredTimeSlots={filteredTimeSlots}
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
            />
          ))}
          {canAddMore && (
            <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} onClick={() => setSelectorOpen(true)} className={`glass-card backdrop-blur-fix ${resolvedTheme === 'dark' ? 'glass-card-dark' : 'glass-card-light'} rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-5 md:p-6 lg:p-7 h-full min-h-[300px] md:min-h-[320px] flex flex-col items-center justify-center hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-200 cursor-pointer`} style={{ isolation: 'isolate', backgroundColor: resolvedTheme === 'dark' ? 'rgba(15, 15, 25, 0.2)' : 'rgba(255, 255, 255, 0.15)', minWidth: '280px' }} aria-label="Add Timezone or Region - Track time for another region">
              <div className="rounded-full bg-primary-100/80 dark:bg-primary-900/30 backdrop-blur-sm p-3 mb-3 shadow-md relative z-[2]"><Plus className="h-6 w-6 text-primary-600 dark:text-primary-400" /></div>
              <p className="text-gray-600 dark:text-gray-300 font-medium relative z-[2]">Add Timezone or Region</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1 relative z-[2]">Track time for another region</p>
            </motion.button>
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
    getHighlightAnimationClass,
    handleUserScroll,
    filteredTimeSlots,
    isSearching
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
              // Revert syncAfterScrolling to 'center' for desktop
              listRef.scrollToItem(targetIndex, 'center');
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
          // Revert highlight scroll to 'center' (or 'start' for reduced motion) for desktop
          const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          listRef.scrollToItem(targetIndex, prefersReducedMotion ? 'start' : 'center');
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
    scrollToIndex(targetIndex, 'center');
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
      if (!highlightedTime) {
        scrollToIndex(getCurrentTimeIndex(), 'center');
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
      {/* Beautiful time-themed background */}
      <div 
        className="absolute inset-0 -z-10 bg-gradient-to-br from-transparent via-primary-50/5 to-accent/5 dark:from-transparent dark:via-primary-900/5 dark:to-accent/10 overflow-hidden rounded-xl"
        style={{
          backgroundImage: resolvedTheme === 'dark' ? 
            'radial-gradient(circle at 10% 10%, rgba(59, 130, 246, 0.03) 0%, transparent 50%), radial-gradient(circle at 90% 90%, rgba(252, 165, 165, 0.03) 0%, transparent 50%)' : 
            'radial-gradient(circle at 10% 10%, rgba(59, 130, 246, 0.05) 0%, transparent 50%), radial-gradient(circle at 90% 90%, rgba(252, 165, 165, 0.05) 0%, transparent 50%)'
        }}
      >
        {/* Add clock hand animation */}
        <div className="absolute top-[5%] right-[5%] w-40 h-40 opacity-5">
          <div className="relative w-full h-full rounded-full border border-gray-400/20">
            <div className="absolute top-1/2 left-1/2 w-[1px] h-[40%] bg-primary-500/40 origin-bottom animate-clock-second"></div>
            <div className="absolute top-1/2 left-1/2 w-[2px] h-[30%] bg-accent/40 origin-bottom animate-clock-minute"></div>
          </div>
        </div>
        
        {/* Subtle circles representing clock faces/world map dots */}
        <div className="absolute w-full h-full opacity-5">
          <div className="absolute top-[10%] left-[15%] w-20 h-20 rounded-full border border-primary-400/20 animate-pulse-slow"></div>
          <div className="absolute top-[35%] right-[25%] w-32 h-32 rounded-full border border-accent/20"></div>
          <div className="absolute bottom-[20%] left-[35%] w-40 h-40 rounded-full border border-primary-400/20"></div>
          <div className="absolute top-[60%] right-[10%] w-16 h-16 rounded-full border border-accent/20 animate-pulse-slow"></div>
        </div>
        
        {/* Subtle grid pattern to represent timelines */}
        <div className="absolute w-full h-full opacity-5">
          <div className="grid grid-cols-12 h-full">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="border-l border-gray-400/20 dark:border-gray-400/10 h-full"></div>
            ))}
          </div>
          <div className="grid grid-rows-12 w-full">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="border-t border-gray-400/20 dark:border-gray-400/10 w-full"></div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4 w-full sm:w-80 ml-0 pt-3">
        <AnimatePresence>
          {(filteredTimeSlots.length > 0 || (searchTerm && filteredTimeSlots.length === 0)) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={clsx('mt-2 py-1 px-3 text-xs', filteredTimeSlots.length > 0 ? 'text-gray-300' : 'text-amber-300')}
            >
              {filteredTimeSlots.length > 0 ? (
                <div className="flex items-center"><span>Found {filteredTimeSlots.length} time{filteredTimeSlots.length === 1 ? '' : 's'} matching {searchTerm.includes(':') ? `"${searchTerm}"` : `${searchTerm} o'clock`}</span></div>
              ) : (
                <div className="flex items-center"><span>No results found</span></div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
ListView.displayName = 'ListView';

const TimezoneColumn = memo(({
  timezone,
  isLocal,
  isSearching, filteredTimeSlots, timeSlots, isHighlighted, checkNightHours, isDateBoundary, isDSTTransition, isCurrentTime, isWeekend, formatTime, getHighlightAnimationClass, handleTimeSelection, listRefs, handleUserScroll, resolvedTheme, getTimezoneOffset, handleRemoveTimezone, setEditingTimezoneId, setSelectorOpen, userLocalTimezone, localTime, getHighlightClass
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
}) => {
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white/10 dark:bg-black/10 backdrop-blur-md rounded-lg overflow-hidden shadow-lg border border-white/10 dark:border-white/5 w-80 mx-auto" // Re-added mx-auto
      style={{ 
        isolation: 'isolate', 
        // Removed minWidth: '280px', 
        transition: 'all 0.3s ease',
        backgroundImage: timezone.id.startsWith('Mars/') ? 
          'linear-gradient(to bottom right, rgba(239, 68, 68, 0.03), transparent)' : 
          'linear-gradient(to bottom right, rgba(var(--color-primary-500), 0.03), transparent)'
      }}
      data-timezone-id={timezone.id}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.08)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.borderColor = '';
      }}
    >
      <div className="p-3 border-b border-border/10 flex justify-between items-center relative overflow-hidden">
        {/* Day/night indicator for visual context */}
        {localTime && (
          <div className="absolute inset-0 -z-10 opacity-10">
            {(() => {
              const dt = DateTime.fromJSDate(localTime).setZone(timezone.id);
              const hour = dt.hour;
              
              if (hour >= 5 && hour < 8) {
                return <div className="absolute inset-0 bg-gradient-to-r from-amber-300/20 to-blue-300/20" />; // Dawn
              } else if (hour >= 8 && hour < 16) {
                return <div className="absolute inset-0 bg-gradient-to-r from-yellow-300/20 to-sky-300/20" />; // Day
              } else if (hour >= 16 && hour < 19) {
                return <div className="absolute inset-0 bg-gradient-to-r from-orange-300/20 to-purple-300/20" />; // Dusk
              } else {
                return <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-indigo-900/20" />; // Night
              }
            })()}
          </div>
        )}

        <div>
          <div className="flex items-baseline">
            <h3 className={`text-base font-medium ${timezone.id === 'Mars/Jezero' ? 'text-red-600 dark:text-red-400' : 'text-foreground'} flex items-center`}>
              {timezone.id.startsWith('Mars/') && (<span className="inline-block mr-1.5" title="Mars Time"><Image src="/mars.png" alt="Mars" width={16} height={16} className="inline-block w-4 h-4 align-text-bottom" /></span>)}
              <span className="truncate">{timezone.name.split('/').pop()?.replace('_', ' ') || timezone.name}</span>
            </h3>
            <span className="ml-2 text-xs text-muted-foreground">
              {timezone.id.startsWith('Mars/') ? timezone.id === 'Mars/Jezero' ? '(MTC+05:10)' : '(MTC)' : `(${getTimezoneOffset(timezone.id)})`}
            </span>
          </div>
          <div className={`text-xl font-mono tracking-tight ${timezone.id.startsWith('Mars/') ? 'text-red-600 dark:text-red-400' : 'text-primary-600 dark:text-primary-400'}`}>
            {localTime && formatTime(localTime, timezone.id)}
          </div>
          
          {/* Time of day visual indicator */}
          {localTime && (
            <div className="mt-1 flex items-center">
              {(() => {
                const dt = DateTime.fromJSDate(localTime).setZone(timezone.id);
                const hour = dt.hour;
                const minutePercentage = dt.minute / 60;
                const dayProgress = ((hour + minutePercentage) / 24) * 100;
                
                return (
                  <>
                    <div className="h-1 flex-grow rounded bg-gray-200/30 dark:bg-gray-700/30 overflow-hidden">
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
                    <span className="ml-2 text-xs text-muted-foreground/80">
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
        
        {!isLocal && (
          <button 
            onClick={() => handleRemoveTimezone(timezone.id)} 
            className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none opacity-50 hover:opacity-100" 
            aria-label="Remove timezone"
          >
            <X className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
          </button>
        )}
      </div>
      
      <div 
        className="h-60 overflow-hidden scrollbar-hide"
        style={{ 
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none', /* IE/Edge */
        }}
        role="listbox" 
        aria-label={`Time selection list for ${timezone.name}`}
        onWheel={(e) => {
          // Handle wheel events for the timezone's time list when cursor is over it
          e.stopPropagation(); // Stop wheel event from propagating to parent elements
          
          // Get the list reference for this timezone
          const listRef = listRefs.current[timezone.id];
          if (!listRef) return;
          
          // Calculate scroll direction and amount
          const delta = e.deltaY;
          
          // Safely access scrollOffset or use direct scrollTo with a delta
          let currentOffset = 0;
          
          // Check if state and scrollOffset exist on listRef
          if (listRef.state && 'scrollOffset' in listRef.state) {
            currentOffset = (listRef.state as any).scrollOffset;
          }
          
          const itemSize = 40; // Reduced from 48 for a more compact look
          
          // Smooth scroll calculation
          const scrollAmount = delta > 0 ? itemSize : -itemSize;
          const newOffset = Math.max(0, currentOffset + scrollAmount);
          
          // Scroll to the new position
          listRef.scrollTo(newOffset);
         }}
       >
         {/* Removed AutoSizer, set width directly */}
         {/* <AutoSizer> */}
           {/* {({ height, width }) => ( */}
             <FixedSizeList
               height={240} // Explicit height needed without AutoSizer
               width="100%" // Reverted back to 100% to fill parent w-80
              itemCount={displaySlots.length}
              itemSize={40} // Reduced from 48
              overscanCount={10}
              ref={(ref) => { listRefs.current[timezone.id] = ref; }}
              className="focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md scrollbar-hide"
              style={{ 
                backgroundColor: 'transparent',
                scrollbarWidth: 'none', /* Firefox */
                msOverflowStyle: 'none', /* IE/Edge */
              }}
              itemKey={(index) => `${timezone.id}-${itemData.slots[index].getTime()}`}
              onScroll={handleUserScroll}
              itemData={itemData}
             >
               {Row}
             </FixedSizeList>
           {/* )} */}
         {/* </AutoSizer> */}
      </div>
    </motion.div>
  );
});
TimezoneColumn.displayName = 'TimezoneColumn';

export default ListView;

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
