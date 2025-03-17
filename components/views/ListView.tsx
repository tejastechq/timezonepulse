'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DateTime } from 'luxon';
import { motion } from 'framer-motion';
import { Timezone } from '@/store/timezoneStore';

interface ListViewProps {
  selectedTimezones: Timezone[];
  userLocalTimezone: string;
  timeSlots: Date[];
  localTime: Date | null;
  highlightedTime: Date | null;
  handleTimeSelection: (time: Date) => void;
  roundToNearestIncrement: (date: Date, increment: number) => Date;
}

/**
 * ListView component for displaying timezones in a list format
 */
export default function ListView({
  selectedTimezones,
  userLocalTimezone,
  timeSlots,
  localTime,
  highlightedTime,
  handleTimeSelection,
  roundToNearestIncrement
}: ListViewProps) {
  const timeColumnsContainerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Set mounted state on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Format time for display
  const formatTime = useCallback((date: Date, timezone: string) => {
    return DateTime.fromJSDate(date).setZone(timezone).toFormat('h:mm a');
  }, []);

  // Check if a time is the current local time
  const isLocalTime = useCallback((time: Date, timezone: string) => {
    if (!localTime) return false;
    
    const roundedLocalTime = roundToNearestIncrement(localTime, 30);
    const timeInTimezone = DateTime.fromJSDate(time).setZone(timezone);
    const localTimeInTimezone = DateTime.fromJSDate(roundedLocalTime).setZone(timezone);
    
    return timeInTimezone.hasSame(localTimeInTimezone, 'minute');
  }, [localTime, roundToNearestIncrement]);

  // Check if a time is highlighted
  const isHighlighted = useCallback((time: Date) => {
    if (!highlightedTime) return false;
    
    return time.getTime() === highlightedTime.getTime();
  }, [highlightedTime]);

  // Check if a time is within business hours (9 AM to 5 PM)
  const isBusinessHours = useCallback((time: Date, timezone: string) => {
    const timeInTimezone = DateTime.fromJSDate(time).setZone(timezone);
    const hour = timeInTimezone.hour;
    return hour >= 9 && hour < 17;
  }, []);

  // Check if a time is during night time (8 PM to 6 AM)
  const isNightTime = useCallback((time: Date, timezone: string) => {
    const timeInTimezone = DateTime.fromJSDate(time).setZone(timezone);
    const hour = timeInTimezone.hour;
    return hour >= 20 || hour < 6;
  }, []);

  // Render time columns
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
    
    // Add other timezones if not already in the set
    selectedTimezones.forEach(timezone => {
      if (!uniqueTimezoneIds.has(timezone.id)) {
        uniqueTimezoneIds.add(timezone.id);
        uniqueTimezones.push(timezone);
      }
    });
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {uniqueTimezones.map((timezone) => (
          <div key={timezone.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-2">{timezone.name}</h3>
            
            <div 
              className="h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100"
              role="listbox"
            >
              {timeSlots.map((time) => {
                const isLocal = isLocalTime(time, timezone.id);
                const isHighlight = isHighlighted(time);
                const isBusiness = isBusinessHours(time, timezone.id);
                const isNight = isNightTime(time, timezone.id);
                
                return (
                  <div
                    key={`${timezone.id}-${time.getTime()}`}
                    role="option"
                    aria-selected={isHighlight}
                    data-key={time.getTime()}
                    data-local-time={isLocal ? 'true' : 'false'}
                    onClick={() => handleTimeSelection(time)}
                    className={`
                      py-2 px-3 mb-1 rounded-md cursor-pointer transition-colors
                      ${isHighlight ? 'bg-primary-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                      ${isLocal ? 'border-l-4 border-primary-500 pl-2' : ''}
                      ${isBusiness ? 'font-medium' : ''}
                      ${isNight ? 'text-gray-500 dark:text-gray-400' : ''}
                    `}
                  >
                    {formatTime(time, timezone.id)}
                    
                    {isBusiness && !isHighlight && (
                      <span className="ml-2 text-xs text-green-500">●</span>
                    )}
                    
                    {isNight && !isHighlight && (
                      <span className="ml-2 text-xs text-gray-400">○</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }, [
    mounted,
    userLocalTimezone,
    selectedTimezones,
    timeSlots,
    isLocalTime,
    isHighlighted,
    isBusinessHours,
    isNightTime,
    formatTime,
    handleTimeSelection
  ]);

  return (
    <motion.div
      ref={timeColumnsContainerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full"
    >
      {renderTimeColumns()}
    </motion.div>
  );
} 