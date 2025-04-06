'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTimezoneStore } from '@/store/timezoneStore';
import { DateTime } from 'luxon';
import { IntegrationsProvider } from '@/app/contexts/IntegrationsContext';
import dynamic from 'next/dynamic';

// Dynamically import MobileV2ListView
const MobileV2ListView = dynamic(() => import('@/components/views/MobileV2ListView'), {
  ssr: false,
  loading: () => (
    <div className="w-full min-h-[400px] flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  ),
});

export default function GridTestPage() {
  const {
    timezones,
    addTimezone,
    removeTimezone,
    highlightedTime,
    setHighlightedTime,
    localTimezone,
    selectedDate,
    setSelectedDate,
    resetToToday,
    hydrate,
  } = useTimezoneStore();

  const [isMounted, setIsMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    hydrate();
    setIsMounted(true);
    setCurrentTime(new Date());
    setCurrentDate(new Date());
  }, [hydrate]);

  useEffect(() => {
    if (!isMounted) return;
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      const storedDate = currentDate ? new Date(currentDate) : null;
      if (storedDate && storedDate.getDate() !== now.getDate()) {
        setCurrentDate(now);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isMounted, currentDate]);

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

  const handleTimeSelection = useCallback(
    (time: Date | null) => {
      setHighlightedTime(time);
    },
    [setHighlightedTime]
  );

  const roundToNearestIncrement = useCallback((date: Date, increment: number) => {
    const dt = DateTime.fromJSDate(date);
    const minutes = dt.minute;
    const roundedMinutes = Math.floor(minutes / increment) * increment;
    return dt.set({ minute: roundedMinutes, second: 0, millisecond: 0 }).toJSDate();
  }, []);

  return (
    <IntegrationsProvider>
      <main className="min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Grid Test - Full Timezone System</h1>
        {isMounted && currentTime ? (
          <MobileV2ListView
            selectedTimezones={timezones}
            userLocalTimezone={localTimezone}
            timeSlots={timeSlots}
            localTime={currentTime}
            highlightedTime={highlightedTime}
            handleTimeSelection={handleTimeSelection}
            roundToNearestIncrement={roundToNearestIncrement}
            removeTimezone={removeTimezone}
            currentDate={currentDate}
          />
        ) : (
          <div className="w-full min-h-[400px] flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </main>
    </IntegrationsProvider>
  );
}
