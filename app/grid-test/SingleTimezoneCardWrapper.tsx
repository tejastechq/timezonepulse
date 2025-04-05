'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTimezoneStore, Timezone } from '@/store/timezoneStore';
import { FixedSizeList } from 'react-window';
import { useTheme } from 'next-themes';
import { useSettingsStore, getWeekendHighlightClass } from '@/store/settingsStore';
import { DateTime } from 'luxon';
import { formatTimeForTimezone } from '@/lib/timezone-utils';
import { isInDST } from '@/lib/utils/timezone';
import { isNightHours, isWeekend as isWeekendUtil } from '@/lib/utils/dateTimeFormatter';
import { TimezoneColumn } from '@/components/views/MobileV2ListView';

// Re-define Placeholder within this file or import if needed
const ViewPlaceholder = () => (
    <div className="w-full min-h-[300px] flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center justify-center">
        <div className="h-16 w-16 rounded-full bg-gray-300 dark:bg-gray-700"></div>
        <div className="h-4 w-32 mt-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  );


interface SingleTimezoneCardWrapperProps {
  timezone: Timezone;
  initialCurrentTime: Date | null; // Pass initial time
}

// Helper function
const roundToNearestIncrement = (date: Date, incrementMinutes: number): Date => {
    const incrementMillis = incrementMinutes * 60 * 1000;
    const ms = date.getTime();
    return new Date(Math.floor(ms / incrementMillis) * incrementMillis);
};

export default function SingleTimezoneCardWrapper({ timezone, initialCurrentTime }: SingleTimezoneCardWrapperProps) {
  // --- Hooks Section ---
  const { localTimezone } = useTimezoneStore(); // Get localTimezone from store
  const { resolvedTheme } = useTheme();
  const { weekendHighlightColor, highlightAutoClear, highlightDuration } = useSettingsStore();
  const [highlightedTime, setHighlightedTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(initialCurrentTime); // Use passed initial time
  const [currentDate, setCurrentDate] = useState<Date | null>(initialCurrentTime); // Use passed initial time

  const listRefs = useRef<Record<string, FixedSizeList | null>>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timeRemainingRef = useRef<number>(highlightDuration);
  const [timeRemaining, setTimeRemaining] = useState<number>(highlightDuration);
  const userIsScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTimeRef = useRef<number>(0);
  const highlightedTimeRef = useRef<Date | null>(null);
  // Dummy state setters needed for TimezoneColumn props
  const [editingTimezoneIdState, setEditingTimezoneIdState] = useState<string | null>(null);
  const [selectorOpenState, setSelectorOpenState] = useState<boolean>(false);

  // --- Callbacks & Memos ---
  const handleUserScroll = useCallback((event: { scrollOffset: number; scrollUpdateWasRequested: boolean }) => {
    if (!event.scrollUpdateWasRequested) {
      userIsScrollingRef.current = true;
      lastScrollTimeRef.current = Date.now();
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => { userIsScrollingRef.current = false; }, 500);
    }
  }, []);
  const handleTouchStart = useCallback(() => {
    userIsScrollingRef.current = true;
    lastScrollTimeRef.current = Date.now();
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
  }, []);
  const handleTouchEnd = useCallback(() => {
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => { userIsScrollingRef.current = false; }, 150);
  }, []);
  const handleTouchCancel = useCallback(() => {
    userIsScrollingRef.current = false;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
  }, []);
  const handleRemoveTimezone = useCallback((id: string) => console.log('Remove timezone (dummy):', id), []);
  const isHighlighted = useCallback((time: Date) => highlightedTime ? time.getTime() === highlightedTime.getTime() : false, [highlightedTime]);
  const checkNightHours = useCallback((time: Date, tzId: string) => isNightHours(time, tzId), []);
  const isDateBoundary = useCallback((time: Date, tzId: string) => {
    const timeInTimezone = DateTime.fromJSDate(time).setZone(tzId);
    return timeInTimezone.hour === 0 && timeInTimezone.minute === 0;
  }, []);
  const isDSTTransition = useCallback((time: Date, tzId: string) => {
    const timeInTimezone = DateTime.fromJSDate(time).setZone(tzId);
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
  const isWeekend = useCallback((time: Date, tzId: string) => isWeekendUtil(time, tzId), []);
  const formatTime = useCallback((date: Date, tzId: string) => formatTimeForTimezone(date, tzId, 'h:mm a'), []);
  const getHighlightAnimationClass = useCallback((isHighlight: boolean) => isHighlight ? 'highlight-item-optimized highlight-pulse-effect' : '', []);
  const getHighlightClass = useCallback((isWeekend: boolean) => isWeekend ? getWeekendHighlightClass(weekendHighlightColor) : '', [weekendHighlightColor]);
  const getTimezoneOffset = useCallback((tzId: string) => DateTime.now().setZone(tzId).toFormat('ZZ'), []);

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

  const resetInactivityTimer = useCallback(() => {
    if (!highlightedTimeRef.current || !highlightAutoClear) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setTimeRemaining(highlightDuration);
    timeRemainingRef.current = highlightDuration;
    timeoutRef.current = setTimeout(() => {
      if (highlightedTimeRef.current) setHighlightedTime(null);
    }, highlightDuration * 1000);
  }, [highlightAutoClear, highlightDuration, setHighlightedTime]);

  const handleTimeSelection = useCallback((time: Date | null) => {
    setHighlightedTime(time);
    if (time && highlightAutoClear) {
      highlightedTimeRef.current = time;
      resetInactivityTimer();
    } else if (!time) {
      highlightedTimeRef.current = null;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, [setHighlightedTime, highlightAutoClear, resetInactivityTimer]);

   const getCurrentTimeIndex = useCallback(() => {
    if (!currentTime || !timeSlots.length) return 0;
    const roundedLocalTime = roundToNearestIncrement(currentTime, 30);
    const index = timeSlots.findIndex(t => DateTime.fromJSDate(t).hasSame(DateTime.fromJSDate(roundedLocalTime), 'minute'));
    return index > -1 ? index : 0;
  }, [currentTime, timeSlots]);

  const scrollToIndex = useCallback((index: number, alignment: 'start' | 'center' | 'end' | 'smart' | 'auto' = 'center', timezoneId: string) => {
    const listRef = listRefs.current[timezoneId];
    if (listRef && !userIsScrollingRef.current) {
      requestAnimationFrame(() => {
        if (listRefs.current[timezoneId]) {
          const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          listRefs.current[timezoneId]?.scrollToItem(index, prefersReducedMotion ? 'start' : alignment);
        }
      });
    }
  }, []);

  // --- Effects ---
   useEffect(() => {
    // Update internal current time every second
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      const currentStoredDate = currentDate ? new Date(currentDate) : null;
      if (currentStoredDate && currentStoredDate.getDate() !== now.getDate()) {
        setCurrentDate(now);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [currentDate]); // Rerun only if currentDate changes (which it does daily)

  // Effect for highlight auto-clear timer
  useEffect(() => {
    highlightedTimeRef.current = highlightedTime;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (highlightedTime && highlightAutoClear) {
      setTimeRemaining(highlightDuration);
      timeRemainingRef.current = highlightDuration;
      timeoutRef.current = setTimeout(() => {
        if (highlightedTimeRef.current) handleTimeSelection(null);
      }, highlightDuration * 1000);
    } else if (!highlightedTime) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setTimeRemaining(highlightDuration);
      timeRemainingRef.current = highlightDuration;
    }
    const timerId = timeoutRef.current;
    return () => { if (timerId) clearTimeout(timerId); };
  }, [highlightedTime, highlightAutoClear, highlightDuration, handleTimeSelection]);

  // Effect to scroll to highlighted time or current time
  useEffect(() => {
    if (!timeSlots.length || userIsScrollingRef.current || !timezone) return;

    let targetIndex = -1;
    const alignment: 'start' | 'center' = 'start';

    if (highlightedTime) {
      const targetTimeUTC = DateTime.fromJSDate(highlightedTime).toUTC();
      targetIndex = timeSlots.findIndex(t => {
        const slotTimeUTC = DateTime.fromJSDate(t).toUTC();
        return slotTimeUTC.hasSame(targetTimeUTC, 'minute');
      });
    } else if (currentTime) {
      targetIndex = getCurrentTimeIndex();
    }

    if (targetIndex !== -1) {
      const scrollTimer = setTimeout(() => {
        scrollToIndex(targetIndex, alignment, timezone.id);
      }, 150); // Increased delay
      return () => clearTimeout(scrollTimer);
    }
  }, [highlightedTime, currentTime, timeSlots, timezone?.id, scrollToIndex, getCurrentTimeIndex]); // Added timezone.id

  // --- Render Logic ---
  if (!timezone) return <ViewPlaceholder />; // Handle case where timezone is not yet available

  return (
    <TimezoneColumn
      key={timezone.id}
      timezone={timezone}
      isLocal={timezone.id === localTimezone} // Check against global localTimezone
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
      setEditingTimezoneId={setEditingTimezoneIdState} // Pass dummy setter
      setSelectorOpen={setSelectorOpenState} // Pass dummy setter
      userLocalTimezone={localTimezone || 'America/New_York'} // Use global or fallback
      localTime={currentTime} // Use internal currentTime state
      getHighlightClass={getHighlightClass}
      handleTouchStart={handleTouchStart}
      handleTouchEnd={handleTouchEnd}
      handleTouchCancel={handleTouchCancel}
    />
  );
}
