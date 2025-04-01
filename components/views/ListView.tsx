'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo, memo, forwardRef, useImperativeHandle, startTransition } from 'react'; // Import startTransition
import { DateTime } from 'luxon';
import { motion, AnimatePresence } from 'framer-motion';
import { Timezone, useTimezoneStore } from '@/store/timezoneStore';
import { isNightHours, isWeekend } from '@/lib/utils/dateTimeFormatter';
import { FixedSizeList, ListChildComponentProps } from 'react-window'; // Import ListChildComponentProps
import AutoSizer from 'react-virtualized-auto-sizer';
import { ChevronUp, ChevronDown, Sun, Moon, Clock, Plus, X, Edit2, Settings, CalendarDays } from 'lucide-react';
import { getAllTimezones, isInDST } from '@/lib/utils/timezone';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import TimezoneSelector from '../clock/TimezoneSelector'; // Import the shared TimezoneSelector
import TimeSearch from '../ui/TimeSearch'; // Import the TimeSearch component
import { useTheme } from 'next-themes';
import clsx from 'clsx';
// Import highlight settings from the store
import { useSettingsStore, getWeekendHighlightClass } from '@/store/settingsStore';
// Dnd Imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy, // Using vertical strategy for list items, might need horizontal for columns
  rectSortingStrategy, // More appropriate for grid layout
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatTimeForTimezone } from '@/lib/timezone-utils';


interface ListViewProps {
  selectedTimezones: Timezone[];
  userLocalTimezone: string;
  timeSlots: Date[];
  localTime: Date | null;
  highlightedTime: Date | null;
  handleTimeSelection: (time: Date | null) => void;
  roundToNearestIncrement: (date: Date, increment: number) => Date; // Make this required, not optional
  removeTimezone?: (id: string) => void;
  currentDate?: Date | null;
}

// Define handle type for useImperativeHandle
export interface ListViewHandle {
  scrollToTime: (time: Date, alignment?: 'start' | 'center' | 'end' | 'smart' | 'auto') => void;
}

// Define TimeItemProps interface outside ListView
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
  formatTimeFn: (time: Date, timezone: string) => string;
  getHighlightAnimationClassFn: (isHighlight: boolean) => string;
  handleTimeSelectionFn: (time: Date) => void;
  getHighlightClass: (isWeekend: boolean) => string; // Added this prop
}

// Define TimeItem component outside ListView
const TimeItem = memo(function TimeItem({ style, time, timezone, isHighlightedFn, isNightTimeFn, isDateBoundaryFn, isDSTTransitionFn, isCurrentTimeFn, isWeekendFn, formatTimeFn, getHighlightAnimationClassFn, handleTimeSelectionFn, getHighlightClass }: TimeItemProps) {
  const isHighlight = isHighlightedFn(time);
  const isNight = isNightTimeFn(time, timezone);
  const isDay = !isNight;
  const isBoundary = isDateBoundaryFn(time, timezone);
  const isDST = isDSTTransitionFn(time, timezone);
  const isCurrent = isCurrentTimeFn(time);
  const isWknd = isWeekendFn(time, timezone);
  const formatted = formatTimeFn(time, timezone);
  const animClass = getHighlightAnimationClassFn(isHighlight);
  const cellClasses = clsx(
    'relative z-10 px-3 py-3 transition-all duration-300 border-b border-gray-100 dark:border-gray-800',
    isDST ? 'border-l-4 border-l-amber-400 dark:border-l-amber-500' : '',
    isBoundary ? 'border-t-2 border-t-gray-300 dark:border-t-gray-600' : '',
    isHighlight ? 'bg-blue-500 dark:bg-blue-600 text-white shadow-md' : '',
    isCurrent && !isHighlight ? 'current-time-highlight' : '',
    isNight && !isHighlight && !isCurrent ? 'bg-gray-100/80 dark:bg-gray-800/80' : '',
    isDay && !isHighlight && !isCurrent ? 'bg-amber-50/30 dark:bg-amber-900/5 border-l-2 border-l-amber-300/50 dark:border-l-amber-700/30' : '',
    isWknd && !isHighlight && !isCurrent ? getHighlightClass(isWknd) : '', // Use passed getHighlightClass
    !isNight && !isHighlight && !isWknd && !isCurrent ? 'bg-white dark:bg-gray-900' : '',
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
      onClick={(e) => { e.stopPropagation(); }}
      className={cellClasses}
      tabIndex={0}
    >
      {isBoundary && <div className="absolute top-0 left-0 w-full text-xs text-gray-500 dark:text-gray-400 pt-0.5 px-3 font-medium">{DateTime.fromJSDate(time).setZone(timezone).toFormat('EEE, MMM d')}</div>}
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          handleTimeSelectionFn(time);
        }}
      >
        <span 
          className={`
            ${isHighlight ? 'text-white font-semibold' : ''}
            ${isCurrent && !isHighlight ? 'text-primary-700 dark:text-primary-300 font-medium' : ''}
            ${timezone.startsWith('Mars/') && !isHighlight ? 'text-red-600 dark:text-red-400 font-medium' : ''}
          `}
        >
          {timezone.startsWith('Mars/') && !isHighlight && (
            <span className="mr-1 text-red-600 dark:text-red-400" title="Mars Time">🔴</span>
          )}
          {formatted}
        </span>
        <div className="flex items-center space-x-1 pointer-events-none">
          {isCurrent && !isHighlight && <span className="absolute left-0 top-0 h-full w-2 bg-blue-500 rounded-l-md animate-pulse" />}
          {isNight && !isHighlight && <span className="text-xs text-indigo-400 dark:text-indigo-300" title="Night time"><Moon className="h-3 w-3" /></span>}
          {isDay && !isHighlight && <span className="text-xs text-amber-500 dark:text-amber-400" title="Day time"><Sun className="h-3 w-3" /></span>}
          {isDST && !isHighlight && <span className="text-xs text-amber-500 ml-1" title="DST transition soon">⚠️</span>}
          {isCurrent && !isHighlight && <span className="text-xs text-blue-500 ml-1 animate-pulse" title="Current time">⏰</span>}
          {isWknd && !isHighlight && <span className="text-xs text-purple-500 ml-1" title="Weekend">🏖️</span>}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => prevProps.time.getTime() === nextProps.time.getTime() && prevProps.timezone === nextProps.timezone && prevProps.isHighlightedFn(prevProps.time) === nextProps.isHighlightedFn(nextProps.time) && prevProps.isCurrentTimeFn(prevProps.time) === nextProps.isCurrentTimeFn(nextProps.time));
TimeItem.displayName = 'TimeItem'; // Add display name

// Define the Row component for FixedSizeList (Moved outside ListView)
const Row = ({ index, style, data }: ListChildComponentProps) => {
  // Access itemData passed from FixedSizeList
  const currentItemData = data; 
  const slots = currentItemData.slots; // Use slots from itemData
  const time = slots[index];
  
  // Ensure all required functions are present in itemData
  if (!currentItemData || typeof currentItemData.isHighlightedFn !== 'function') {
    // Handle error or return placeholder
    return <div style={style}>Error: Missing item data</div>;
  }

  return (
    <TimeItem
      style={style}
      time={time}
      timezone={currentItemData.timezoneId} // Use timezoneId from itemData
      isHighlightedFn={currentItemData.isHighlightedFn}
      isNightTimeFn={currentItemData.isNightTimeFn}
      isDateBoundaryFn={currentItemData.isDateBoundaryFn}
      isDSTTransitionFn={currentItemData.isDSTTransitionFn}
      isCurrentTimeFn={currentItemData.isCurrentTimeFn}
      isWeekendFn={currentItemData.isWeekendFn}
      formatTimeFn={currentItemData.formatTimeFn}
      getHighlightAnimationClassFn={currentItemData.getHighlightAnimationClassFn}
      handleTimeSelectionFn={currentItemData.handleTimeSelectionFn}
      getHighlightClass={currentItemData.getHighlightClass} // Use getHighlightClass from itemData
    />
  );
};

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
  roundToNearestIncrement,
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
  // Get highlight settings from the store
  const { weekendHighlightColor, highlightAutoClear, highlightDuration } = useSettingsStore();
  
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [editingTimezoneId, setEditingTimezoneId] = useState<string | null>(null);
  
  const { addTimezone, removeTimezone: storeRemoveTimezone } = useTimezoneStore();
  const removeTimezone = externalRemoveTimezone || storeRemoveTimezone;

  // Initialize timeRemaining based on highlightDuration setting
  const [timeRemaining, setTimeRemaining] = useState<number>(highlightDuration);
  const timeRemainingRef = useRef<number>(highlightDuration);

  const [userIsScrolling, setUserIsScrolling] = useState(false);
  const userIsScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTimeRef = useRef<number>(0);
  const [currentScrollOffset, setCurrentScrollOffset] = useState(0); // State for scroll offset

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTimeSlots, setFilteredTimeSlots] = useState<Date[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDateInfo, setSelectedDateInfo] = useState<string | null>(null);

  // Dnd State & Sensors
  const { timezones: storeTimezones, reorderTimezones } = useTimezoneStore(); // Get timezones and reorder action
  const [items, setItems] = useState<Timezone[]>([]); // Local state for dnd order

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
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

  // Sync local dnd items state with store state
  useEffect(() => {
    // Filter out the local timezone if it exists, as it shouldn't be draggable/reorderable relative to others
    // Or maybe keep it but disable dragging? For now, let's filter it for simplicity in reordering logic.
    // We need a stable list of IDs for dnd-kit.
    const draggableTimezones = storeTimezones.filter(tz => tz.id !== userLocalTimezone);
    setItems(draggableTimezones);
  }, [storeTimezones, userLocalTimezone]);


  const highlightedTimeRef = useRef<Date | null>(null);
  useEffect(() => {
    highlightedTimeRef.current = highlightedTime;
  }, [highlightedTime]);

  // Updated timer logic to respect highlightAutoClear and highlightDuration
  const useConsolidatedTimer = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    // Only run timer if auto-clear is enabled
    if (!highlightedTimeRef.current || !mounted || !highlightAutoClear) return () => {};

    let lastTickTime = Date.now();
    let remainingTime = timeRemainingRef.current; // Use the ref which is updated with highlightDuration

    const timerLoop = () => {
      // Check again inside the loop in case settings change or component unmounts
      if (!mounted || !highlightedTimeRef.current || !highlightAutoClear) {
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
  }, [mounted, handleTimeSelection, highlightAutoClear]); // Added highlightAutoClear dependency

  // Updated effect to respect highlightAutoClear and highlightDuration
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

    // Only set up timers if auto-clear is enabled
    if (highlightAutoClear) {
      setTimeRemaining(highlightDuration); // Use setting
      timeRemainingRef.current = highlightDuration; // Use setting
      const cleanup = useConsolidatedTimer();
      timerCleanupRef.current = cleanup;
      timeoutRef.current = setTimeout(() => {
        if (highlightedTimeRef.current) handleTimeSelection(null);
      }, highlightDuration * 1000); // Use setting (convert s to ms)
    } else {
      // If auto-clear is off, ensure no timers are running
      setTimeRemaining(highlightDuration); // Still set initial display value if needed
      timeRemainingRef.current = highlightDuration;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (timerCleanupRef.current) timerCleanupRef.current();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [highlightedTime, handleTimeSelection, useConsolidatedTimer, highlightAutoClear, highlightDuration]); // Added dependencies

  // Updated reset logic to respect settings
  const resetInactivityTimer = useCallback(() => {
    if (!highlightedTimeRef.current || !highlightAutoClear) return; // Only reset if auto-clear is on

    const previousCleanup = timerCleanupRef.current;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (previousCleanup) previousCleanup();

    setTimeRemaining(highlightDuration); // Use setting
    timeRemainingRef.current = highlightDuration; // Use setting

    timeoutRef.current = setTimeout(() => {
      if (highlightedTimeRef.current) handleTimeSelection(null);
    }, highlightDuration * 1000); // Use setting (convert s to ms)

    const cleanup = useConsolidatedTimer();
    timerCleanupRef.current = cleanup;
  }, [handleTimeSelection, useConsolidatedTimer, highlightAutoClear, highlightDuration]); // Added dependencies

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
    // Using non-null assertion since we know roundToNearestIncrement is required in props
    const roundedLocalTime = roundToNearestIncrement!(localTime, 30);
    const index = timeSlots.findIndex(t => DateTime.fromJSDate(t).hasSame(DateTime.fromJSDate(roundedLocalTime), 'minute'));
    return index > -1 ? index : 0;
  }, [localTime, timeSlots, roundToNearestIncrement]);

  const scrollToIndex = useCallback((index: number, alignment: 'start' | 'center' | 'end' | 'smart' | 'auto' = 'center') => {
    // Don't scroll if user is actively scrolling, unless forced
    if (userIsScrollingRef.current) return;

    const prefersReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Batch scrolling operations in requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      // Scroll all lists to the same index
      Object.values(listRefs.current).forEach(listRef => {
        if (listRef) {
          listRef.scrollToItem(index, prefersReducedMotion ? 'start' : alignment);
        }
      });
    });
  }, []);

  // Expose the scrollToTime function via ref
  useImperativeHandle(ref, () => ({
    scrollToTime: (time: Date, alignment: 'start' | 'center' | 'end' | 'smart' | 'auto' = 'center') => {
      if (!time || !timeSlots.length) return;
      
      // Convert to UTC for consistent timezone handling
      const targetTimeUTC = DateTime.fromJSDate(time).toUTC();
      
      // Find the matching time slot using a more precise comparison
      const targetIndex = timeSlots.findIndex(t => {
        const slotTimeUTC = DateTime.fromJSDate(t).toUTC();
        return slotTimeUTC.hasSame(targetTimeUTC, 'minute');
      });
      
      if (targetIndex !== -1) {
        // Use requestAnimationFrame for immediate visual response
        requestAnimationFrame(() => {
          const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          
          // Scroll all timezone columns to show the selected time
          Object.values(listRefs.current).forEach(listRef => {
            if (listRef) {
              listRef.scrollToItem(targetIndex, prefersReducedMotion ? 'start' : alignment);
            }
          });
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

  const formatTimeFunction = useMemo(() => (date: Date, timezone: string) => {
    // Use our timezone utility that already handles Mars timezones
    return formatTimeForTimezone(date, timezone, 'h:mm a');
  }, []);
  const formatTime = useCallback((date: Date, timezone: string) => formatTimeFunction(date, timezone), [formatTimeFunction]);
  
  // Removed isLocalTime function as it's no longer needed

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
  const isCurrentTime = useCallback((time: Date): boolean => {
    if (!localTime) return false;
    
    const timeDateTime = DateTime.fromJSDate(time);
    const localDateTime = DateTime.fromJSDate(localTime);
    
    // Use a wider window for "current time" to ensure the highlight appears
    // and round down the local time to nearest 30 minutes increment
    const roundedLocalTime = Math.floor(localDateTime.minute / 30) * 30;
    const roundedLocalDateTime = localDateTime.set({ minute: roundedLocalTime, second: 0, millisecond: 0 });
    
    // Check if time slot matches the rounded local time
    return timeDateTime.hasSame(roundedLocalDateTime, 'hour') && 
           timeDateTime.minute === roundedLocalDateTime.minute;
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

  // Updated handleRemoveTimezone to include confirmation
  const handleRemoveTimezone = useCallback((id: string) => {
    if (id !== userLocalTimezone) {
      const timezoneToRemove = selectedTimezones.find(tz => tz.id === id);
      const name = timezoneToRemove?.name.split('/').pop()?.replace('_', ' ') || id;
      if (window.confirm(`Are you sure you want to remove the timezone "${name}"?`)) {
        removeTimezone(id);
      }
    }
  }, [removeTimezone, userLocalTimezone, selectedTimezones]); // Added selectedTimezones dependency

  const getHighlightClass = useCallback((isWeekend: boolean) => isWeekend ? getWeekendHighlightClass(weekendHighlightColor) : '', [weekendHighlightColor]);

  useEffect(() => { if (searchTerm) handleSearch(searchTerm); else setFilteredTimeSlots([]); }, [timeSlots]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredTimeSlots([]);
      setIsSearching(false);
      if (isSearching) {
        // When exiting search mode, sync back to current time position
        requestAnimationFrame(() => {
          scrollToIndex(getCurrentTimeIndex(), 'center');
        });
      }
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
      // Store current user scrolling state
      const wasScrolling = userIsScrollingRef.current;
      
      // Temporarily disable user scrolling flag to ensure scroll action happens
      userIsScrollingRef.current = false;
      
      const targetIndex = timeSlots.findIndex(t => t.getTime() === filtered[0].getTime());
      if (targetIndex !== -1) {
        // Use requestAnimationFrame for smoother scrolling
        requestAnimationFrame(() => {
          scrollToIndex(targetIndex, 'center');
          
          // Restore previous user scrolling state
          userIsScrollingRef.current = wasScrolling;
        });
      } else {
        // Restore previous user scrolling state if no scrolling occurred
        userIsScrollingRef.current = wasScrolling;
      }
    }
  }, [timeSlots, userLocalTimezone, isSearching, scrollToIndex, getCurrentTimeIndex]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setFilteredTimeSlots([]);
    setIsSearching(false);
    scrollToIndex(getCurrentTimeIndex(), 'center'); 
  }, [scrollToIndex, getCurrentTimeIndex]);

  // Dnd Drag End Handler (Moved Here)
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      
      // Calculate indices based on the original store array (including local timezone if present)
      // This is crucial because the store action needs indices relative to the full list.
      // Find the index of the *first* non-local timezone in the store array.
      const firstDraggableIndexInStore = storeTimezones.findIndex(tz => tz.id !== userLocalTimezone);
      
      // Adjust the dnd indices (which are relative to the `items` array) 
      // to be relative to the `storeTimezones` array.
      // Ensure we handle the case where there might be no draggable items (firstDraggableIndexInStore === -1)
      const storeOldIndex = firstDraggableIndexInStore !== -1 ? firstDraggableIndexInStore + oldIndex : -1;
      const storeNewIndex = firstDraggableIndexInStore !== -1 ? firstDraggableIndexInStore + newIndex : -1;

      // Update local state for immediate UI feedback
      setItems(currentItems => arrayMove(currentItems, oldIndex, newIndex));

      // Then update the store state in a separate operation wrapped in startTransition
      if (storeOldIndex !== -1 && storeNewIndex !== -1) {
        startTransition(() => {
          reorderTimezones(storeOldIndex, storeNewIndex);
        });
      } else {
        console.error("Could not calculate valid store indices for reordering.", { storeOldIndex, storeNewIndex, firstDraggableIndexInStore });
      }
    }
  }, [items, reorderTimezones, storeTimezones, userLocalTimezone]);


  const renderTimeColumns = useCallback(() => {
    if (!mounted) return null;
    
    // Find the local timezone object from the store to render it first
    const localTimezoneObj = storeTimezones.find(tz => tz.id === userLocalTimezone);
    
    // The `items` state already contains the draggable (non-local) timezones in their current order
    const draggableTimezones = items; 

    // Combine local (if found) and draggable timezones for rendering
    const displayTimezones = localTimezoneObj ? [localTimezoneObj, ...draggableTimezones] : [...draggableTimezones];
    
    const canAddMore = displayTimezones.length < 8; // Max 8 columns including local

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
              {/* Only show timer UI if auto-clear is enabled */}
              {highlightAutoClear && (
                <div className="mt-2 relative z-[2]">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                    <span>Auto-clear in {timeRemaining}s</span>
                    <button onClick={resetInactivityTimer} className="text-primary-500 hover:text-primary-600 focus:outline-none" data-reset-timer="true">Reset</button>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    {/* Use highlightDuration for progress bar calculation */}
                    <div className="bg-primary-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${(timeRemaining / highlightDuration) * 100}%` }}></div>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
        {/* Wrap grid with DndContext and SortableContext */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          {/* Use items (draggable timezones) for SortableContext */}
          <SortableContext items={items.map(item => item.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-1 md:gap-1">
              {/* Render the local timezone first (not sortable relative to others) */}
              {localTimezoneObj && (
                 <TimezoneColumn 
                   key={localTimezoneObj.id} 
                   timezone={localTimezoneObj} 
                   isLocal={true} 
                   // Pass other necessary props
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
                   getHighlightClass={getHighlightClass} // Pass down getHighlightClass
                 />
              )}
              
              {/* Render the sortable (draggable) timezones */}
              {items.map((timezone) => (
                <SortableTimezoneColumn 
                  key={timezone.id} 
                  timezone={timezone} 
                  isLocal={false}
                  // Pass other necessary props
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
                  getHighlightClass={getHighlightClass} // Pass down getHighlightClass
                />
              ))}

              {/* Add Timezone Button */}
              {canAddMore && (
                <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} onClick={() => setSelectorOpen(true)} className={`glass-card backdrop-blur-fix ${resolvedTheme === 'dark' ? 'glass-card-dark' : 'glass-card-light'} rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-5 md:p-6 lg:p-7 h-full min-h-[300px] md:min-h-[320px] flex flex-col items-center justify-center hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-200 cursor-pointer`} style={{ isolation: 'isolate', backgroundColor: resolvedTheme === 'dark' ? 'rgba(15, 15, 25, 0.2)' : 'rgba(255, 255, 255, 0.15)', minWidth: '280px' }} aria-label="Add Timezone or Region - Track time for another region">
                  <div className="rounded-full bg-primary-100/80 dark:bg-primary-900/30 backdrop-blur-sm p-3 mb-3 shadow-md relative z-[2]"><Plus className="h-6 w-6 text-primary-600 dark:text-primary-400" /></div>
                  <p className="text-gray-600 dark:text-gray-300 font-medium relative z-[2]">Add Timezone or Region</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1 relative z-[2]">Track time for another region</p>
                </motion.button>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </>
    );
  }, [mounted, userLocalTimezone, storeTimezones, items, timeSlots, isHighlighted, checkNightHours, isDateBoundary, isDSTTransition, isCurrentTime, isWeekend, getTimezoneOffset, formatTime, handleTimeSelection, getCurrentTimeIndex, handleRemoveTimezone, handleReplaceTimezone, editingTimezoneId, timeRemaining, resetInactivityTimer, resolvedTheme, weekendHighlightColor, highlightedTime, localTime, currentDate, isSearching, filteredTimeSlots, highlightAutoClear, highlightDuration, sensors, handleDragEnd, getHighlightClass]); // Added Dnd related dependencies and getHighlightClass

  // Optimize synchronization of scrolling across timezone columns when highlightedTime changes
  useEffect(() => {
    if (!mounted || !highlightedTime) return;
    
    // Skip if user is actively scrolling to avoid interrupting user interaction
    if (userIsScrollingRef.current) {
      // Set a flag to sync after user stops scrolling
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
              listRef.scrollToItem(targetIndex, 'center');
            }
          });
        }
      };

      // Wait until user stops scrolling
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(syncAfterScrolling, 500);
      return;
    }
    
    // Find the target index for the highlighted time in UTC to ensure consistent behavior across timezones
    const highlightedDateTime = DateTime.fromJSDate(highlightedTime).toUTC();
    
    const targetIndex = timeSlots.findIndex(slot => {
      const slotDateTime = DateTime.fromJSDate(slot).toUTC();
      return slotDateTime.hasSame(highlightedDateTime, 'minute');
    });
    
    if (targetIndex !== -1) {
      // Use requestAnimationFrame instead of setTimeout for better performance
      // This will run the scrolling on the next frame, which is visually immediate
      // but still gives React enough time to finish rendering
      requestAnimationFrame(() => {
        // Scroll all timezone columns to the highlighted time
        Object.values(listRefs.current).forEach(listRef => {
          if (listRef) {
            const prefersReducedMotion = typeof window !== 'undefined' && 
              window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            
            listRef.scrollToItem(targetIndex, prefersReducedMotion ? 'start' : 'center');
          }
        });
      });
    }
  }, [highlightedTime, timeSlots, mounted]);

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

  // Add this additional useEffect near other effects to force a refresh of time calculations
  useEffect(() => {
    if (!mounted || !localTime) return;
    
    // Clear the time calculation cache when local time changes
    timeCalculationCache.current.clear();
    
    // Force list refresh on time changes at the 30-minute boundaries
    const localDateTime = DateTime.fromJSDate(localTime);
    const minute = localDateTime.minute;
    
    // If we're close to a 30-minute boundary (within 10 seconds), force refresh all lists
    if ((minute === 0 || minute === 30) && localDateTime.second < 10) {
      Object.values(listRefs.current).forEach(listRef => {
        if (listRef) {
          listRef.forceUpdate();
        }
      });
      
      // Also scroll to current time if not highlighted
      if (!highlightedTime) {
        scrollToIndex(getCurrentTimeIndex(), 'center');
      }
    }
  }, [localTime, mounted, highlightedTime, scrollToIndex, getCurrentTimeIndex]);

  // Calculate the vertical position for the current time line
  const currentTimeLineTop = useMemo(() => {
    if (!localTime || !timeSlots.length || !mounted) return null;

    const itemSize = 48; // Height of each time slot item
    const listStartTime = DateTime.fromJSDate(timeSlots[0]);
    const currentLocalTime = DateTime.fromJSDate(localTime);

    // Calculate the difference in minutes from the start of the list
    const diffInMinutes = currentLocalTime.diff(listStartTime, 'minutes').minutes;

    // Calculate the pixel offset based on minutes (each 30 min slot is itemSize)
    const pixelOffset = (diffInMinutes / 30) * itemSize;

    // The final top position is the calculated offset minus the current scroll offset
    // We subtract scrollOffset because the line is positioned relative to the container,
    // but its logical position is within the scrolled content.
    return pixelOffset - currentScrollOffset;

  }, [localTime, timeSlots, mounted, currentScrollOffset]);


  return (
    <motion.div
      ref={timeColumnsContainerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-screen-xl mx-auto px-2 sm:px-4 lg:px-6 relative" // Added relative positioning
      style={{ isolation: 'isolate' }}
      // Removed onScroll from the outer div, handled by FixedSizeList
    >
      {/* Current Time Line */}
      {mounted && currentTimeLineTop !== null && (
         // Ensure the line is only rendered within the visible bounds of the list area potentially
         // We might need to refine this based on the exact container structure later
         // Adding a check to prevent rendering way above/below the typical view
         currentTimeLineTop > -100 && currentTimeLineTop < 20000 && // Basic bounds check
          <div
            className="absolute left-0 right-0 h-px bg-red-500 dark:bg-red-400 z-30 pointer-events-none shadow-md"
            style={{
              top: `${currentTimeLineTop}px`,
              // Consider adding a transition for smoother updates if needed, but might impact performance
              // transition: 'top 0.1s linear' 
            }}
            aria-hidden="true" // Hide from screen readers
          />
      )}

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

      {/* Add date notification banner - moved to a more prominent position */}
      {selectedDateInfo && (
        <div className="sticky top-0 z-20 bg-background mb-4 p-3 w-full rounded-md border border-primary-500 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CalendarDays className="text-primary-500 h-5 w-5 mr-2" />
              <span className="font-medium text-primary-500">{selectedDateInfo}</span>
            </div>
          </div>
        </div>
      )}

      {renderTimeColumns()}
      
      {/* Timezone Selection Modal */}
      <AnimatePresence>
        {selectorOpen && (
          <TimezoneSelector
            key="timezone-selector"
            isOpen={true}
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
});
ListView.displayName = 'ListView'; // Add display name for React DevTools

// Define TimezoneColumn component (extracted from renderTimeColumns map)
const TimezoneColumn = memo(({ 
  timezone, 
  isLocal,
  // Pass down all necessary props from ListView
  isSearching, filteredTimeSlots, timeSlots, isHighlighted, checkNightHours, isDateBoundary, isDSTTransition, isCurrentTime, isWeekend, formatTime, getHighlightAnimationClass, handleTimeSelection, listRefs, handleUserScroll, resolvedTheme, getTimezoneOffset, handleRemoveTimezone, setEditingTimezoneId, setSelectorOpen, userLocalTimezone, localTime, getHighlightClass
}: { 
  timezone: Timezone; 
  isLocal: boolean;
  // Define types for passed props
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
  getHighlightClass: (isWeekend: boolean) => string; // Added prop
}) => {
  const isDST = isInDST(timezone.id);
  // Prepare itemData for this specific timezone column
  const itemData = {
    slots: isSearching && filteredTimeSlots.length > 0 ? filteredTimeSlots : timeSlots,
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
    getHighlightClass: getHighlightClass, // Pass down getHighlightClass
  };

  return (
    <motion.div 
      layout // Keep layout animation
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }} 
      className={`glass-card backdrop-blur-fix ${resolvedTheme === 'dark' ? 'glass-card-dark' : 'glass-card-light'} rounded-lg p-5 md:p-6 lg:p-7 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-lg relative`} 
      style={{ isolation: 'isolate', backgroundColor: resolvedTheme === 'dark' ? 'rgba(15, 15, 25, 0.2)' : 'rgba(255, 255, 255, 0.15)', minWidth: '280px' }} 
      data-timezone-id={timezone.id}
    >
      {/* Added relative positioning to card */}
      <div className="flex justify-between items-center mb-3 md:mb-4 relative z-[2]">
        <div>
          <h3 className={`text-lg font-semibold ${timezone.id === 'Mars/Jezero' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
            {timezone.id.startsWith('Mars/') && (
              <span className="inline-block mr-1" title="Mars Time">🔴</span>
            )}
            {timezone.id === 'Mars/Jezero' && (
              <span className="inline-block mr-1" title="Perseverance Rover Location">🤖</span>
            )}
            {timezone.name.split('/').pop()?.replace('_', ' ') || timezone.name}
            {timezone.id === 'Mars/Jezero' && (
              <span className="ml-2 text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded animate-pulse">
                Perseverance
              </span>
            )}
          </h3>
          <div className="text-xs text-gray-600 dark:text-gray-300 flex items-center space-x-2">
            <span>{timezone.id.startsWith('Mars/') ? 'MTC' : DateTime.now().setZone(timezone.id).toFormat('ZZZZ')}</span>
            <span>({getTimezoneOffset(timezone.id)})</span>
            {isDST && !timezone.id.startsWith('Mars/') && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100">DST</span>}
            {timezone.id.startsWith('Mars/') && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300">MARS</span>}
          </div>
          <div className={`text-sm font-medium mt-1 ${timezone.id.startsWith('Mars/') ? 'text-red-600 dark:text-red-400' : 'text-primary-600 dark:text-primary-400'}`}>
            {localTime && formatTime(localTime, timezone.id)}
          </div>
          {timezone.id === 'Mars/Jezero' && (
            <div className="mt-2 text-xs bg-red-50 dark:bg-red-900/10 p-2 rounded border border-red-100 dark:border-red-900/20">
              <p className="font-medium text-red-700 dark:text-red-300">Perseverance Rover</p>
              <p className="text-red-600/80 dark:text-red-400/80 mt-1">NASA Mars 2020 Mission</p>
              <p className="text-red-600/70 dark:text-red-400/70">
                <span className="inline-block">Location: Jezero Crater</span>
                <span className="inline-block ml-2">18.38°N, 77.58°E</span>
              </p>
            </div>
          )}
        </div>
        {/* Only show controls for non-local timezones */}
        {!isLocal && (
          <div className="flex items-center space-x-1 relative z-[2]">
            {/* Settings Dropdown - Remove button moved inside */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500" aria-label="Timezone options">
                  <Settings className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="min-w-[200px] bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1.5 border border-gray-200 dark:border-gray-700" sideOffset={5} align="end">
                  {/* Simplified: Only show Change Timezone if not local */}
                  {timezone.id !== userLocalTimezone && (
                    <DropdownMenu.Item
                      onSelect={() => { setEditingTimezoneId(timezone.id); setTimeout(() => setSelectorOpen(true), 100); }}
                      className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />Change Timezone
                    </DropdownMenu.Item>
                  )}
                  {/* Add Remove option inside the dropdown */}
                  {timezone.id !== userLocalTimezone && (
                    <>
                      <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                      <DropdownMenu.Item
                        onSelect={() => handleRemoveTimezone(timezone.id)}
                        className="flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer focus:bg-red-50 dark:focus:bg-red-900/20 focus:text-red-700 dark:focus:text-red-300 focus:outline-none"
                      >
                        <X className="h-4 w-4 mr-2" />Remove
                      </DropdownMenu.Item>
                    </>
                  )}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        )}
      </div>
      <div className="h-72 md:h-80 lg:h-96 rounded-md border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-[2px] overflow-hidden mt-4 md:mt-5 min-w-[300px]" style={{ backgroundColor: resolvedTheme === 'dark' ? 'rgba(15, 15, 25, 0.1)' : 'rgba(255, 255, 255, 0.1)' }} role="listbox" aria-label={`Time selection list for ${timezone.name}`}>
        <AutoSizer>
          {({ height, width }) => (
            <FixedSizeList
              height={height}
              width={width}
              itemCount={itemData.slots.length}
              itemSize={48}
              overscanCount={10}
              ref={(ref) => { listRefs.current[timezone.id] = ref; }}
              className="focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md"
              style={{ backdropFilter: 'blur(2px)', backgroundColor: resolvedTheme === 'dark' ? 'rgba(15, 15, 25, 0.05)' : 'rgba(255, 255, 255, 0.05)' }}
              itemKey={(index) => `${timezone.id}-${itemData.slots[index].getTime()}`}
              // Pass the scroll event object to handleUserScroll
              onScroll={handleUserScroll}
              itemData={itemData} // Pass itemData here
            >
              {/* Pass Row component defined outside ListView */}
              {Row} 
            </FixedSizeList>
          )}
        </AutoSizer>
      </div>
    </motion.div>
  );
});
TimezoneColumn.displayName = 'TimezoneColumn';

// Define SortableTimezoneColumn component
const SortableTimezoneColumn = (props: React.ComponentProps<typeof TimezoneColumn>) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging, // Add isDragging state
  } = useSortable({ id: props.timezone.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined, // Increase z-index while dragging
    opacity: isDragging ? 0.8 : 1, // Slightly transparent when dragging
    cursor: isDragging ? 'grabbing' : 'grab', // Change cursor style
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TimezoneColumn {...props} />
    </div>
  );
};


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
