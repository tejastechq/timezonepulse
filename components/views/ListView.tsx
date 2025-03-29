'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo, memo, forwardRef, useImperativeHandle } from 'react';
import { DateTime } from 'luxon';
import { motion, AnimatePresence } from 'framer-motion';
import { Timezone, useTimezoneStore } from '@/store/timezoneStore';
import { isNightHours, isWeekend } from '@/lib/utils/dateTimeFormatter';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { ChevronUp, ChevronDown, Sun, Moon, Clock, Plus, X, Edit2, Settings, CalendarDays } from 'lucide-react';
import { getAllTimezones, isInDST } from '@/lib/utils/timezone';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import TimezoneSelector from '../clock/TimezoneSelector'; // Import the shared TimezoneSelector
import TimeSearch from '../ui/TimeSearch'; // Import the TimeSearch component
import { useTheme } from 'next-themes';
import clsx from 'clsx';
import { useSettingsStore, getWeekendHighlightClass } from '@/store/settingsStore';

interface ListViewProps {
  selectedTimezones: Timezone[];
  userLocalTimezone: string;
  timeSlots: Date[];
  localTime: Date | null;
  highlightedTime: Date | null;
  handleTimeSelection: (time: Date | null) => void;
  roundToNearestIncrement?: (date: Date, increment: number) => Date;
  removeTimezone?: (id: string) => void;
  currentDate?: Date | null;
}

// Define handle type for useImperativeHandle
export interface ListViewHandle {
  scrollToTime: (time: Date, alignment?: 'start' | 'center' | 'end' | 'smart' | 'auto') => void;
}

/**
 * ListView Component
 * 
 * Displays multiple timezones in a list view with time columns.
 * Shows current time, business hours, and other time-related information.
 * 
 */
const ListView = forwardRef<ListViewHandle, ListViewProps>(({
  selectedTimezones,
  userLocalTimezone,
  timeSlots,
  localTime,
  highlightedTime,
  handleTimeSelection,
  roundToNearestIncrement = (date, increment) => {
    // Default implementation if not provided
    const dt = DateTime.fromJSDate(date);
    const minutes = dt.minute;
    const roundedMinutes = Math.round(minutes / increment) * increment;
    return dt.set({ minute: roundedMinutes, second: 0, millisecond: 0 }).toJSDate();
  },
  removeTimezone: externalRemoveTimezone,
  currentDate
}, ref) => {
  const timeColumnsContainerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const listRefs = useRef<Record<string, FixedSizeList | null>>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null); // Keep for timer
  const lastRenderTimeRef = useRef<number>(Date.now());
  const timerCleanupRef = useRef<(() => void) | null>(null);
  const scrollSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Keep for current time scroll
  
  const { resolvedTheme } = useTheme();
  const { weekendHighlightColor } = useSettingsStore();
  
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [editingTimezoneId, setEditingTimezoneId] = useState<string | null>(null);
  
  const { addTimezone, removeTimezone: storeRemoveTimezone } = useTimezoneStore();
  const removeTimezone = externalRemoveTimezone || storeRemoveTimezone;

  const [timeRemaining, setTimeRemaining] = useState<number>(120);
  const timeRemainingRef = useRef<number>(120);

  const [userIsScrolling, setUserIsScrolling] = useState(false);
  const userIsScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTimeRef = useRef<number>(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTimeSlots, setFilteredTimeSlots] = useState<Date[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDateInfo, setSelectedDateInfo] = useState<string | null>(null);
  
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
    return () => {
      markRender('unmount');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (timerCleanupRef.current) timerCleanupRef.current();
      if (scrollSyncTimeoutRef.current) clearTimeout(scrollSyncTimeoutRef.current);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [markRender, timeSlots, currentDate]);

  const highlightedTimeRef = useRef<Date | null>(null);
  useEffect(() => {
    highlightedTimeRef.current = highlightedTime;
  }, [highlightedTime]);

  const useConsolidatedTimer = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (!highlightedTimeRef.current || !mounted) return () => {};
    let lastTickTime = Date.now();
    let remainingTime = timeRemainingRef.current;
    const timerLoop = () => {
      if (!mounted || !highlightedTimeRef.current) {
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
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [mounted, handleTimeSelection]);

  useEffect(() => {
    if (!highlightedTime) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (timerCleanupRef.current) timerCleanupRef.current();
      return;
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (timerCleanupRef.current) timerCleanupRef.current();
    setTimeRemaining(120);
    timeRemainingRef.current = 120;
    const cleanup = useConsolidatedTimer();
    timerCleanupRef.current = cleanup;
    timeoutRef.current = setTimeout(() => {
      if (highlightedTimeRef.current) handleTimeSelection(null);
    }, 120000);
    return () => {
      if (timerCleanupRef.current) timerCleanupRef.current();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [highlightedTime, handleTimeSelection, useConsolidatedTimer]);

  const resetInactivityTimer = useCallback(() => {
    if (!highlightedTimeRef.current) return;
    const previousCleanup = timerCleanupRef.current;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (previousCleanup) previousCleanup();
    setTimeRemaining(120);
    timeRemainingRef.current = 120;
    timeoutRef.current = setTimeout(() => {
      if (highlightedTimeRef.current) handleTimeSelection(null);
    }, 120000);
    const cleanup = useConsolidatedTimer();
    timerCleanupRef.current = cleanup;
  }, [handleTimeSelection, useConsolidatedTimer]);

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

  const handleUserScroll = useCallback(() => {
    setUserIsScrolling(true);
    userIsScrollingRef.current = true;
    lastScrollTimeRef.current = Date.now();
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setUserIsScrolling(false);
      userIsScrollingRef.current = false;
    }, 500);
    if (highlightedTimeRef.current) resetInactivityTimer();
  }, [resetInactivityTimer]);

  const getCurrentTimeIndex = useCallback(() => {
    if (!localTime || !timeSlots.length) return 0;
    const roundedLocalTime = roundToNearestIncrement(localTime, 30);
    const index = timeSlots.findIndex(t => DateTime.fromJSDate(t).hasSame(DateTime.fromJSDate(roundedLocalTime), 'minute'));
    return index > -1 ? index : 0;
  }, [localTime, timeSlots, roundToNearestIncrement]);

  // Expose the scrollToTime function via ref
  useImperativeHandle(ref, () => ({
    scrollToTime: (time: Date, alignment: 'start' | 'center' | 'end' | 'smart' | 'auto' = 'center') => {
      const targetIndex = timeSlots.findIndex(t => t.getTime() === time.getTime());
      if (targetIndex !== -1) {
         // Directly call scrollToItem on all list refs
         const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
         Object.values(listRefs.current).forEach(listRef => {
            if (listRef) {
                listRef.scrollToItem(targetIndex, prefersReducedMotion ? 'start' : alignment);
            }
         });
      }
    }
  }), [timeSlots]); // Dependency: timeSlots (if they change, index calculation needs update)

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
    if (event.type === 'scroll') {
      handleUserScroll();
      lastRenderTimeRef.current = now;
      return;
    }
    const target = event.target as Element;
    const isRelevantInteraction = timeColumnsContainerRef.current?.contains(target) || target.closest('[data-time-item="true"]') !== null || target.closest('[data-reset-timer]') !== null;
    if (isRelevantInteraction) {
      lastRenderTimeRef.current = now;
      resetInactivityTimer();
    }
  }, [resetInactivityTimer, handleUserScroll]);

  useEffect(() => {
    if (!mounted || !highlightedTime) return;
    window.addEventListener('keydown', throttledUserInteraction, { passive: true });
    window.addEventListener('click', throttledUserInteraction, { passive: true });
    window.addEventListener('scroll', throttledUserInteraction, { passive: true });
    return () => {
      window.removeEventListener('keydown', throttledUserInteraction);
      window.removeEventListener('click', throttledUserInteraction);
      window.removeEventListener('scroll', throttledUserInteraction);
    };
  }, [mounted, highlightedTime, throttledUserInteraction]);

  const formatTimeFunction = useMemo(() => (date: Date, timezone: string) => DateTime.fromJSDate(date).setZone(timezone).toFormat('h:mm a'), []);
  const formatTime = useCallback((date: Date, timezone: string) => formatTimeFunction(date, timezone), [formatTimeFunction]);
  const isLocalTime = useCallback((time: Date, timezone: string) => {
    if (!localTime) return false;
    const roundedLocalTime = roundToNearestIncrement(localTime, 30);
    const timeInTimezone = DateTime.fromJSDate(time).setZone(timezone);
    const localTimeInTimezone = DateTime.fromJSDate(roundedLocalTime).setZone(timezone);
    return timeInTimezone.hasSame(localTimeInTimezone, 'minute');
  }, [localTime, roundToNearestIncrement]);
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
  const isCurrentTime = useCallback((time: Date, timezone: string) => {
    if (!localTime) return false;
    const cacheKey = `current-${time.getTime()}-${timezone}`;
    if (timeCalculationCache.current.has(cacheKey)) return timeCalculationCache.current.get(cacheKey) as boolean;
    const now = DateTime.fromJSDate(localTime);
    const timeToCheck = DateTime.fromJSDate(time).setZone(timezone);
    const result = now.hasSame(timeToCheck, 'minute');
    timeCalculationCache.current.set(cacheKey, result);
    return result;
  }, [localTime]);
  const getWeekdayName = useCallback((time: Date, timezone: string) => DateTime.fromJSDate(time).setZone(timezone).toFormat('cccc'), []);
  const isWeekend = useCallback((time: Date, timezone: string) => {
    const weekday = DateTime.fromJSDate(time).setZone(timezone).weekday;
    return weekday === 6 || weekday === 7;
  }, []);
  const getTimezoneOffset = useCallback((timezone: string) => DateTime.now().setZone(timezone).toFormat('ZZ'), []);
  const hasMeetingAt = useCallback((time: Date, timezone: string): boolean => false, []);
  const getMeetingTitle = useCallback((time: Date, timezone: string): string => "", []);

  const jumpToTime = useCallback((timePeriod: 'morning' | 'afternoon' | 'evening' | 'night' | 'now', timezone: string) => {
    if (!listRefs.current[timezone]) return;
    let targetIndex = 0;
    switch (timePeriod) {
      case 'morning': targetIndex = timeSlots.findIndex(t => DateTime.fromJSDate(t).setZone(timezone).hour === 8 && DateTime.fromJSDate(t).setZone(timezone).minute === 0); break;
      case 'afternoon': targetIndex = timeSlots.findIndex(t => DateTime.fromJSDate(t).setZone(timezone).hour === 12 && DateTime.fromJSDate(t).setZone(timezone).minute === 0); break;
      case 'evening': targetIndex = timeSlots.findIndex(t => DateTime.fromJSDate(t).setZone(timezone).hour === 18 && DateTime.fromJSDate(t).setZone(timezone).minute === 0); break;
      case 'night': targetIndex = timeSlots.findIndex(t => DateTime.fromJSDate(t).setZone(timezone).hour === 21 && DateTime.fromJSDate(t).setZone(timezone).minute === 0); break;
      case 'now': targetIndex = getCurrentTimeIndex(); break;
    }
    if (targetIndex === -1) targetIndex = 0;
    listRefs.current[timezone]?.scrollToItem(targetIndex, 'center');
  }, [timeSlots, getCurrentTimeIndex]);

  const handleAddTimezone = useCallback((timezone: Timezone) => { addTimezone(timezone); setSelectorOpen(false); }, [addTimezone]);
  const handleReplaceTimezone = useCallback((timezone: Timezone) => {
    if (editingTimezoneId) {
      removeTimezone(editingTimezoneId);
      addTimezone(timezone);
      setEditingTimezoneId(null);
      setSelectorOpen(false);
    }
  }, [addTimezone, removeTimezone, editingTimezoneId]);
  const handleRemoveTimezone = useCallback((id: string) => { if (id !== userLocalTimezone) removeTimezone(id); }, [removeTimezone, userLocalTimezone]);

  const getHighlightClass = useCallback((isWeekend: boolean) => isWeekend ? getWeekendHighlightClass(weekendHighlightColor) : '', [weekendHighlightColor]);

  const TimeItem = memo(function TimeItem({ style, time, timezone, isLocalTimeFn, isHighlightedFn, isNightTimeFn, isDateBoundaryFn, isDSTTransitionFn, isCurrentTimeFn, isWeekendFn, formatTimeFn, getHighlightAnimationClassFn, handleTimeSelectionFn }: TimeItemProps) {
    const isHighlight = isHighlightedFn(time);
    const isLocal = isLocalTimeFn(time, timezone);
    const isNight = isNightTimeFn(time, timezone);
    const isDay = !isNight;
    const isBoundary = isDateBoundaryFn(time, timezone);
    const isDST = isDSTTransitionFn(time, timezone);
    const isCurrent = isCurrentTimeFn(time, timezone);
    const isWknd = isWeekendFn(time, timezone);
    const formatted = formatTimeFn(time, timezone);
    const animClass = getHighlightAnimationClassFn(isHighlight);
    const cellClasses = clsx(
      'relative z-10 px-3 py-3 transition-all duration-300 border-b border-gray-100 dark:border-gray-800',
      isDST ? 'border-l-4 border-l-amber-400 dark:border-l-amber-500' : '',
      isBoundary ? 'border-t-2 border-t-gray-300 dark:border-t-gray-600' : '',
      isHighlight ? 'bg-blue-500 dark:bg-blue-600 text-white shadow-md' : '', 
      isCurrent && !isHighlight ? 'current-time-highlight' : '',
      isLocal && !isCurrent && !isHighlight ? 'font-medium' : '',
      isNight && !isHighlight && !isCurrent ? 'bg-gray-100/80 dark:bg-gray-800/80' : '',
      isDay && !isHighlight && !isCurrent ? 'bg-amber-50/30 dark:bg-amber-900/5 border-l-2 border-l-amber-300/50 dark:border-l-amber-700/30' : '',
      isWknd && !isHighlight && !isCurrent ? getHighlightClass(isWknd) : '',
      !isNight && !isHighlight && !isWknd && !isCurrent ? 'bg-white dark:bg-gray-900' : '',
      animClass
    );
    return (
      <div style={style} role="option" aria-selected={isHighlight} data-key={time.getTime()} data-local-time={isLocal ? 'true' : 'false'} data-current-time={isCurrent ? 'true' : 'false'} data-time-item="true" onClick={() => handleTimeSelectionFn(time)} className={cellClasses} tabIndex={0}>
        {isBoundary && <div className="absolute top-0 left-0 w-full text-xs text-gray-500 dark:text-gray-400 pt-0.5 px-3 font-medium">{DateTime.fromJSDate(time).setZone(timezone).toFormat('EEE, MMM d')}</div>}
        <div className="flex justify-between items-center">
          <span className={`${isHighlight ? 'text-white font-semibold' : ''} ${isCurrent && !isHighlight ? 'text-primary-700 dark:text-primary-300 font-medium' : ''}`}>{formatted}</span>
          <div className="flex items-center space-x-1">
            {isLocal && !isHighlight && !isCurrent && <span className="absolute left-0 top-0 h-full w-1 bg-primary-500 rounded-l-md" />}
            {isNight && !isHighlight && <span className="text-xs text-indigo-400 dark:text-indigo-300" title="Night time"><Moon className="h-3 w-3" /></span>}
            {isDay && !isHighlight && <span className="text-xs text-amber-500 dark:text-amber-400" title="Day time"><Sun className="h-3 w-3" /></span>}
            {isDST && !isHighlight && <span className="text-xs text-amber-500 ml-1" title="DST transition soon">⚠️</span>}
            {isCurrent && !isHighlight && <span className="text-xs text-blue-500 ml-1 animate-pulse" title="Current time">⏰</span>}
            {isWknd && !isHighlight && <span className="text-xs text-purple-500 ml-1" title="Weekend">🏖️</span>}
          </div>
        </div>
      </div>
    );
  }, (prevProps, nextProps) => prevProps.time.getTime() === nextProps.time.getTime() && prevProps.timezone === nextProps.timezone && prevProps.isHighlightedFn(prevProps.time) === nextProps.isHighlightedFn(nextProps.time) && prevProps.isLocalTimeFn(prevProps.time, prevProps.timezone) === nextProps.isLocalTimeFn(nextProps.time, nextProps.timezone) && prevProps.isCurrentTimeFn(prevProps.time, prevProps.timezone) === nextProps.isCurrentTimeFn(nextProps.time, nextProps.timezone));

  useEffect(() => { if (searchTerm) handleSearch(searchTerm); else setFilteredTimeSlots([]); }, [timeSlots]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredTimeSlots([]);
      setIsSearching(false);
      if (isSearching) scrollToIndex(getCurrentTimeIndex(), 'center'); 
      return;
    }
    setIsSearching(true);
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
    setFilteredTimeSlots(filtered);
    if (filtered.length > 0) {
      const wasScrolling = userIsScrollingRef.current;
      userIsScrollingRef.current = false;
      const targetIndex = timeSlots.findIndex(t => t.getTime() === filtered[0].getTime());
      if (targetIndex !== -1) scrollToIndex(targetIndex, 'center'); 
      userIsScrollingRef.current = wasScrolling;
    }
  }, [timeSlots, userLocalTimezone, isSearching, scrollToIndex, getCurrentTimeIndex]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setFilteredTimeSlots([]);
    setIsSearching(false);
    scrollToIndex(getCurrentTimeIndex(), 'center'); 
  }, [scrollToIndex, getCurrentTimeIndex]);

  const renderTimeColumns = useCallback(() => {
    if (!mounted) return null;
    const uniqueTimezoneIds = new Set();
    const uniqueTimezones = [];
    if (!uniqueTimezoneIds.has(userLocalTimezone)) { uniqueTimezoneIds.add(userLocalTimezone); uniqueTimezones.push({ id: userLocalTimezone, name: `Local (${userLocalTimezone})` }); }
    let nonLocalCount = 0;
    for (const timezone of selectedTimezones) { if (!uniqueTimezoneIds.has(timezone.id) && nonLocalCount < 7) { uniqueTimezoneIds.add(timezone.id); uniqueTimezones.push(timezone); nonLocalCount++; } }
    const canAddMore = uniqueTimezones.length < 8;
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
        {highlightedTime && (
          <>
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`${getTimeDiffColorClass()} p-1.5 px-3 rounded-md text-sm font-medium mb-2 flex items-center mx-auto shadow-sm`}>
              <Clock className="w-4 h-4 mr-2" />{timeDifference}
            </motion.div>
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`mb-4 p-3 rounded-lg shadow-sm glass-card backdrop-blur-fix ${resolvedTheme === 'dark' ? 'glass-card-dark' : 'glass-card-light'}`} style={{ isolation: 'isolate', backgroundColor: resolvedTheme === 'dark' ? 'rgba(15, 15, 25, 0.2)' : 'rgba(255, 255, 255, 0.15)' }}>
              <div className="flex items-center justify-between mb-2 relative z-[2]">
                <div className="flex items-center"><span className="inline-block w-3 h-3 bg-primary-500 rounded-full mr-2"></span><span className="text-sm font-medium text-gray-900 dark:text-white">{DateTime.fromJSDate(highlightedTime).toFormat('h:mm a')}</span></div>
                <button onClick={() => handleTimeSelection(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary-500" aria-label="Clear time selection"><X className="h-4 w-4" /></button>
              </div>
              <div className="mt-2 relative z-[2]">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1"><span>Auto-clear in {timeRemaining}s</span><button onClick={resetInactivityTimer} className="text-primary-500 hover:text-primary-600 focus:outline-none" data-reset-timer="true">Reset</button></div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5"><div className="bg-primary-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${(timeRemaining / 120) * 100}%` }}></div></div>
              </div>
            </motion.div>
          </>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 md:gap-8">
          {uniqueTimezones.map((timezone) => {
            const isDST = isInDST(timezone.id);
            return (
              <motion.div key={timezone.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`glass-card backdrop-blur-fix ${resolvedTheme === 'dark' ? 'glass-card-dark' : 'glass-card-light'} rounded-lg p-5 md:p-6 lg:p-7 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-lg w-full`} style={{ isolation: 'isolate', backgroundColor: resolvedTheme === 'dark' ? 'rgba(15, 15, 25, 0.2)' : 'rgba(255, 255, 255, 0.15)', minWidth: '280px' }} data-timezone-id={timezone.id}>
                <div className="flex justify-between items-center mb-3 md:mb-4 relative z-[2]">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{timezone.name.split('/').pop()?.replace('_', ' ') || timezone.name}</h3>
                    <div className="text-xs text-gray-600 dark:text-gray-300 flex items-center space-x-2"><span>{DateTime.now().setZone(timezone.id).toFormat('ZZZZ')}</span><span>({getTimezoneOffset(timezone.id)})</span>{isDST && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100">DST</span>}</div>
                    <div className="text-sm font-medium text-primary-600 dark:text-primary-400 mt-1">{localTime && DateTime.fromJSDate(localTime).setZone(timezone.id).toFormat('h:mm a')}</div>
                  </div>
                  <div className="flex items-center space-x-2 relative z-[2]">
                    <DropdownMenu.Root><DropdownMenu.Trigger asChild><button className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500" aria-label="Timezone options"><Settings className="h-4 w-4 text-gray-500 dark:text-gray-400" /></button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content className="min-w-[200px] bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1.5 border border-gray-200 dark:border-gray-700" sideOffset={5} align="end">
                      {timezone.id !== userLocalTimezone && <DropdownMenu.Item onSelect={() => { setEditingTimezoneId(timezone.id); setTimeout(() => setSelectorOpen(true), 100); }} className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"><Edit2 className="h-4 w-4 mr-2" />Change Timezone</DropdownMenu.Item>}
                      {timezone.id !== userLocalTimezone && <DropdownMenu.Item onSelect={() => handleRemoveTimezone(timezone.id)} className="flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"><X className="h-4 w-4 mr-2" />Remove</DropdownMenu.Item>}
                    </DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>
                    <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-full p-1">
                      <button onClick={() => jumpToTime('morning', timezone.id)} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500" title="Jump to morning (8 AM)" aria-label="Jump to morning"><Sun className="h-3.5 w-3.5 text-amber-500" /></button>
                      <button onClick={() => jumpToTime('afternoon', timezone.id)} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500" title="Jump to afternoon (12 PM)" aria-label="Jump to afternoon"><ChevronUp className="h-3.5 w-3.5 text-blue-500" /></button>
                      <button onClick={() => jumpToTime('evening', timezone.id)} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500" title="Jump to evening (6 PM)" aria-label="Jump to evening"><ChevronDown className="h-3.5 w-3.5 text-orange-500" /></button>
                      <button onClick={() => jumpToTime('night', timezone.id)} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500" title="Jump to night (9 PM)" aria-label="Jump to night"><Moon className="h-3.5 w-3.5 text-indigo-500" /></button>
                      <button onClick={() => jumpToTime('now', timezone.id)} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500" title="Jump to current time" aria-label="Jump to current time"><Clock className="h-3.5 w-3.5 text-green-500" /></button>
                    </div>
                  </div>
                </div>
                <div className="h-72 md:h-80 lg:h-96 rounded-md border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-[2px] overflow-hidden mt-4 md:mt-5 min-w-[300px] w-full" style={{ backgroundColor: resolvedTheme === 'dark' ? 'rgba(15, 15, 25, 0.1)' : 'rgba(255, 255, 255, 0.1)' }} role="listbox" aria-label={`Time selection list for ${timezone.name}`}>
                  <AutoSizer>
                    {({ height, width }) => (
                      <FixedSizeList height={height} width={width} itemCount={isSearching && filteredTimeSlots.length > 0 ? filteredTimeSlots.length : timeSlots.length} itemSize={48} overscanCount={10} ref={(ref) => { listRefs.current[timezone.id] = ref; }} className="focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md" style={{ backdropFilter: 'blur(2px)', backgroundColor: resolvedTheme === 'dark' ? 'rgba(15, 15, 25, 0.05)' : 'rgba(255, 255, 255, 0.05)' }} itemKey={(index) => { const slots = isSearching && filteredTimeSlots.length > 0 ? filteredTimeSlots : timeSlots; return `${timezone.id}-${slots[index].getTime()}`; }} onScroll={handleUserScroll}>
                        {({ index, style }) => { const slots = isSearching && filteredTimeSlots.length > 0 ? filteredTimeSlots : timeSlots; return (<TimeItem style={style} time={slots[index]} timezone={timezone.id} isLocalTimeFn={isLocalTime} isHighlightedFn={isHighlighted} isNightTimeFn={checkNightHours} isDateBoundaryFn={isDateBoundary} isDSTTransitionFn={isDSTTransition} isCurrentTimeFn={isCurrentTime} isWeekendFn={isWeekend} formatTimeFn={formatTime} getHighlightAnimationClassFn={getHighlightAnimationClass} getTimezoneOffsetFn={getTimezoneOffset} handleTimeSelectionFn={handleTimeSelection} />); }}
                      </FixedSizeList>
                    )}
                  </AutoSizer>
                </div>
              </motion.div>
            );
          })}
          {canAddMore && (
            <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} onClick={() => setSelectorOpen(true)} className={`glass-card backdrop-blur-fix ${resolvedTheme === 'dark' ? 'glass-card-dark' : 'glass-card-light'} rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-5 md:p-6 lg:p-7 h-full min-h-[300px] md:min-h-[320px] flex flex-col items-center justify-center hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-200 cursor-pointer w-full`} style={{ isolation: 'isolate', backgroundColor: resolvedTheme === 'dark' ? 'rgba(15, 15, 25, 0.2)' : 'rgba(255, 255, 255, 0.15)', minWidth: '280px' }} aria-label="Add Timezone or Region - Track time for another region">
              <div className="rounded-full bg-primary-100/80 dark:bg-primary-900/30 backdrop-blur-sm p-3 mb-3 shadow-md relative z-[2]"><Plus className="h-6 w-6 text-primary-600 dark:text-primary-400" /></div>
              <p className="text-gray-600 dark:text-gray-300 font-medium relative z-[2]">Add Timezone or Region</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1 relative z-[2]">Track time for another region</p>
            </motion.button>
          )}
        </div>
      </>
    );
  }, [mounted, userLocalTimezone, selectedTimezones, timeSlots, isLocalTime, isHighlighted, checkNightHours, isDateBoundary, isDSTTransition, isCurrentTime, isWeekend, getTimezoneOffset, formatTime, handleTimeSelection, getCurrentTimeIndex, jumpToTime, handleRemoveTimezone, timeRemaining, resetInactivityTimer, resolvedTheme, weekendHighlightColor, highlightedTime, localTime, currentDate]);

  // REMOVED useEffect for scrolling to HIGHLIGHTED time (parent will trigger via ref)

  // NEW useEffect for scrolling to CURRENT time (or initial load / when highlight is cleared)
  useEffect(() => {
    // Only run if mounted, we have localTime, and NO time is highlighted
    if (!mounted || !localTime || highlightedTime || !timeSlots.length) return;

    // Don't scroll to current time if user has scrolled recently
    const recentlyScrolled = Date.now() - lastScrollTimeRef.current < 1000; // Use 1s threshold
    if (userIsScrollingRef.current || recentlyScrolled) {
      return;
    }

    const targetIndex = getCurrentTimeIndex(); 

    // Call the scrollToIndex function (which now uses manual calc)
    const cleanup = scrollToIndex(targetIndex, 'center');
    return cleanup; // Return the cleanup function from scrollToIndex

  }, [mounted, localTime, highlightedTime, timeSlots, getCurrentTimeIndex, scrollToIndex]); // Dependencies: localTime, highlightedTime, scrollToIndex

  // Add cleanup for general timeouts (scrollTimeoutRef)
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

  // Add this before the return statement in the component
  const isViewingFutureDate = useMemo(() => {
    if (!timeSlots.length) return false;
    
    const firstSlot = timeSlots[0];
    const firstSlotDate = DateTime.fromJSDate(firstSlot);
    const currentDateTime = currentDate ? DateTime.fromJSDate(currentDate).startOf('day') : DateTime.local().startOf('day');
    
    return !firstSlotDate.hasSame(currentDateTime, 'day');
  }, [timeSlots, currentDate]);

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
      {/* Search Box with minimal styling - positioned above first column */}
      <div className="mb-4 w-full sm:w-80 ml-0 pt-3">
        <TimeSearch 
          onSearch={handleSearch}
          onClear={handleClearSearch}
          className="w-full"
          autoFormatTime={true}
          earlyFormattingDelay={100}
        />
        
        <AnimatePresence>
          {(filteredTimeSlots.length > 0 || (searchTerm && filteredTimeSlots.length === 0)) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={clsx(
                'mt-2 py-1 px-3 text-xs',
                filteredTimeSlots.length > 0 
                  ? 'text-gray-300'
                  : 'text-amber-300'
              )}
            >
              {filteredTimeSlots.length > 0 ? (
                <div className="flex items-center">
                  <span>
                    Found {filteredTimeSlots.length} time{filteredTimeSlots.length === 1 ? '' : 's'} matching {searchTerm.includes(':') 
                      ? `"${searchTerm}"` 
                      : `${searchTerm} o'clock`}
                  </span>
                </div>
              ) : (
                <div className="flex items-center">
                  <span>
                    No results found
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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

      {/* Add this right before or after the timezone header section */}
      {selectedDateInfo && (
        <div className="sticky top-0 z-20 bg-background mb-4 p-2 w-full rounded-md border border-primary">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CalendarDays className="text-primary h-5 w-5 mr-2" />
              <span className="font-medium text-primary">{selectedDateInfo}</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
});
ListView.displayName = 'ListView'; // Add display name for React DevTools
export default ListView;

// Update the TimeHeaderRow component to show the selected date
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
  // Convert to Luxon DateTime for easier formatting
  const dt = DateTime.fromJSDate(timeSlot);
  
  // Format the date for display in the header
  const dateDisplay = dt.toFormat('EEE, MMM d');
  
  // Check if time is during night hours using the same function as in ListView
  const store = useSettingsStore.getState();
  const hour = dt.hour;
  const isNightTime = store.nightHoursStart > store.nightHoursEnd
    ? hour >= store.nightHoursStart || hour < store.nightHoursEnd
    : hour >= store.nightHoursStart && hour < store.nightHoursEnd;
  
  // Set day/night theme colors
  const dayTimeColor = 'text-amber-500 dark:text-amber-400';
  const nightTimeColor = 'text-indigo-400 dark:text-indigo-300';
  
  return (
    <div 
      className={`
        px-2 py-1 text-sm 
        ${isHalfHour ? 'opacity-60 text-xs' : 'font-semibold'}
        ${isCurrentTime ? 'text-primary-500 font-bold' : ''}
        ${isDateBoundary ? 'border-t border-gray-300 dark:border-gray-700 pt-4 mt-4' : ''}
        ${isNightTime ? 'bg-gray-100/50 dark:bg-gray-800/30' : 'bg-transparent'}
      `}
    >
      {/* Show date at midnight or first time slot */}
      {(dt.hour === 0 && dt.minute === 0) || ((dt.hour === 0 || dt.hour === 12) && dt.minute === 0) ? (
        <div className="flex flex-col">
          <span className="text-primary-500 font-bold">{dateDisplay}</span>
          <div className="mt-1 flex items-center">
            <span>{formattedTime}</span>
            {isNightTime ? (
              <Moon className={`ml-2 h-3.5 w-3.5 ${nightTimeColor}`} />
            ) : (
              <Sun className={`ml-2 h-3.5 w-3.5 ${dayTimeColor}`} />
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center">
          <span>{formattedTime}</span>
          {isNightTime ? (
            <Moon className={`ml-2 h-3 w-3 ${nightTimeColor}`} />
          ) : (
            <Sun className={`ml-2 h-3 w-3 ${dayTimeColor}`} />
          )}
        </div>
      )}
      
      {/* Show DST transition indicator */}
      {isDSTTransition && (
        <span className="block text-xs text-amber-500 dark:text-amber-400 mt-1">
          DST {dt.isInDST ? 'begins' : 'ends'}
        </span>
      )}
    </div>
  );
});
