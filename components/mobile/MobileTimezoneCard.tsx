'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { DateTime } from 'luxon';
import { Timezone } from '@/store/timezoneStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react'; // Icons for expand/collapse
import MobileTimeList from './MobileTimeList'; // Integrated

interface MobileTimezoneCardProps {
  timezone: Timezone;
  localTime: Date | null;
  highlightedTime: Date | null;
  timeSlots: Date[];
  handleTimeSelection: (time: Date) => void; // Changed from onTimeSelect to handleTimeSelection for consistency
  roundToNearestIncrement: (date: Date, increment: number) => Date;
}

const MobileTimezoneCard: React.FC<MobileTimezoneCardProps> = ({
  timezone,
  localTime,
  highlightedTime,
  timeSlots,
  handleTimeSelection, // Changed from onTimeSelect
  roundToNearestIncrement,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Renamed from selectTime to match prop name passed down
  const handleSelectTime = useCallback((time: Date) => {
    handleTimeSelection(time);
    setIsExpanded(false); // Collapse after selection
  }, [handleTimeSelection]);

  // --- Time Formatting Logic (adapted from ListView/page) ---

  const formatTime = useCallback((date: Date | null, format: string = 'h:mm a'): string => {
    if (!date) return '--:--';
    return DateTime.fromJSDate(date).setZone(timezone.id).toFormat(format);
  }, [timezone.id]);

  const currentTimeFormatted = useMemo(() => formatTime(localTime), [localTime, formatTime]);

  const selectedTimeFormatted = useMemo(() => {
    if (!highlightedTime) return '--:--';
    // Calculate the equivalent selected time in this card's timezone
    const highlightedDateTime = DateTime.fromJSDate(highlightedTime); // Already in system time (effectively UTC internally for Luxon)
    return highlightedDateTime.setZone(timezone.id).toFormat('h:mm a');
  }, [highlightedTime, timezone.id]);


  const timezoneOffset = useMemo(() => {
    return DateTime.now().setZone(timezone.id).toFormat('ZZZZ'); // e.g., GMT+1
  }, [timezone.id]);

  const timezoneAbbreviation = useMemo(() => {
     return DateTime.now().setZone(timezone.id).toFormat('ZZ'); // e.g., CDT
  }, [timezone.id]);


  // --- Render Logic ---

  return (
    <motion.div
      layout // Animate layout changes (like expansion)
      className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50 shadow-md cursor-pointer overflow-hidden"
      onClick={!isExpanded ? toggleExpand : undefined} // Only allow opening via card click
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Collapsed View */}
      <div className="flex flex-col">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold">{timezone.city || timezone.name.split('/').pop()?.replace('_', ' ')}</h2>
            <p className="text-xs text-gray-400">
              {timezoneAbbreviation} {timezoneOffset}
            </p>
          </div>
          {/* Expand/Collapse Chevron */}
          <motion.div
             onClick={toggleExpand} // Allow chevron click to toggle anytime
             whileTap={{ scale: 0.9 }}
             className="p-1"
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </motion.div>
        </div>

        <div className="flex justify-between mt-3">
          {/* Current Time */}
          <p className="text-3xl font-bold tabular-nums tracking-tight">
            {currentTimeFormatted}
          </p>
          {/* Selected Time */}
          <p className="text-3xl font-bold text-blue-400 tabular-nums tracking-tight">
            {selectedTimeFormatted}
          </p>
        </div>
      </div>

      {/* Expanded View - Time List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="time-list"
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: '16px' }} // Adjust height and add margin
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden" // Important for smooth animation
          >
            {/* Integrated MobileTimeList */}
            <MobileTimeList
              timeSlots={timeSlots}
              timezoneId={timezone.id}
              localTime={localTime}
              highlightedTime={highlightedTime}
              onTimeSelect={handleSelectTime} // Pass the handleSelectTime callback
              roundToNearestIncrement={roundToNearestIncrement}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MobileTimezoneCard; // Added the missing export statement
