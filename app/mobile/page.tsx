'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DateTime } from 'luxon';
import { useTimezoneStore, Timezone } from '@/store/timezoneStore';
import { getLocalTimezone } from '@/lib/utils/timezone';
import MobileTimezoneCard from '@/components/mobile/MobileTimezoneCard'; // Integrated
import TimezoneSelector from '@/components/clock/TimezoneSelector'; // Integrated
import { AnimatePresence } from 'framer-motion'; // Integrated
import { Plus } from 'lucide-react'; // For Add button icon

export default function MobileViewPage() {
  const [localTime, setLocalTime] = useState<Date | null>(new Date());
  const [highlightedTime, setHighlightedTime] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false); // Integrated

  // Get timezones from the Zustand store
  const { timezones, addTimezone, removeTimezone } = useTimezoneStore();
  const userLocalTimezone = useMemo(() => getLocalTimezone(), []);

  useEffect(() => {
    setIsMounted(true);
    // Update local time every second for smoother updates on mobile
    const interval = setInterval(() => {
      setLocalTime(new Date());
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  // Generate time slots for the day (reused from ListViewPage)
  const timeSlots = useMemo(() => {
    const slots: Date[] = [];
    // Use current date from localTime state if available, otherwise fallback
    const now = localTime || new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    // Generate 48 slots (24 hours with 30-minute intervals)
    for (let i = 0; i < 48; i++) {
      const slotTime = new Date(startOfDay);
      slotTime.setMinutes(i * 30);
      slots.push(slotTime);
    }
    return slots;
  }, [localTime]); // Re-calculate if localTime changes day

  // Handle time selection (passed down to cards)
  const handleTimeSelection = useCallback((time: Date | null) => {
    setHighlightedTime(time);
    // Add logic here if needed to reset inactivity timer like in ListView
  }, []);

  // Round time to nearest increment (corrected to round to *nearest*)
  const roundToNearestIncrement = useCallback((date: Date, increment: number): Date => {
    const minutes = date.getMinutes();
    const remainder = minutes % increment; // increment is 30

    let roundedMinutes;
    if (remainder < increment / 2) { // less than 15
      roundedMinutes = minutes - remainder; // round down
    } else {
      roundedMinutes = minutes + (increment - remainder); // round up
    }

    const rounded = new Date(date);
    // Adjust hours if rounding up pushes minutes >= 60
    if (roundedMinutes >= 60) {
        rounded.setHours(rounded.getHours() + 1);
        rounded.setMinutes(roundedMinutes - 60);
    } else {
        rounded.setMinutes(roundedMinutes);
    }
    rounded.setSeconds(0);
    rounded.setMilliseconds(0);

    return rounded;
  }, []);

  // Handler for adding a timezone (passed to TimezoneSelector)
  const handleAddTimezone = useCallback((timezone: Timezone) => { // Integrated
    addTimezone(timezone);
    setIsSelectorOpen(false);
  }, [addTimezone]);

  if (!isMounted) {
    // Avoid rendering mismatch during hydration
    return null;
  }

  return (
    // Main container with gradient background
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-navy-start to-black-end text-white p-4 font-sans">
      {/* Mobile Header */}
      <header className="flex items-center justify-between mb-4">
        <button className="p-2 bg-blue-600 rounded-md" aria-label="Menu">
          {/* Hamburger Icon SVG or Component */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6H20M4 12H20M4 18H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="text-xl font-bold uppercase">World Clock</h1>
        {/* Add Timezone Button - Placeholder */}
        <button
          onClick={() => setIsSelectorOpen(true)} // Integrated
          className="p-2 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
          aria-label="Add Timezone"
        >
          <Plus size={20} />
        </button>
      </header>

      {/* Placeholder for Timezone Cards List */}
      <main className="flex-grow space-y-4">
        {timezones.map((tz: Timezone) => ( // Integrated
          <MobileTimezoneCard
            key={tz.id}
            timezone={tz}
            localTime={localTime}
            highlightedTime={highlightedTime}
            timeSlots={timeSlots}
            handleTimeSelection={handleTimeSelection}
            roundToNearestIncrement={roundToNearestIncrement}
          />
        ))}
         {/* Fallback if no timezones selected */}
         {timezones.length === 0 && ( // Integrated
            <div className="text-center text-gray-400 mt-10">
                <p>No timezones added yet.</p>
                <button
                    onClick={() => setIsSelectorOpen(true)} // Integrated
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Add Timezone
                </button>
            </div>
        )}
      </main>

      {/* Placeholder for Date Display (omitted for now per instructions) */}
      {/* <footer className="text-center text-sm mt-4">
        Date Placeholder
      </footer> */}

      {/* Timezone Selection Modal (Reused) */}
      <AnimatePresence> {/* Integrated */}
        {isSelectorOpen && (
          <TimezoneSelector
            key="mobile-timezone-selector"
            isOpen={true}
            onClose={() => setIsSelectorOpen(false)}
            onSelect={handleAddTimezone}
            excludeTimezones={[userLocalTimezone, ...timezones.map(tz => tz.id)]}
            data-timezone-selector
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Add basic gradient colors to globals.css or tailwind config if they don't exist
// Example for tailwind.config.js:
// theme: {
//   extend: {
//     colors: {
//       'navy-start': '#0a192f', // Example color
//       'black-end': '#000000',  // Example color
//     },
//   },
// },
