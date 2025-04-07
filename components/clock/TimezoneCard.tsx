'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Timezone, ViewMode } from '@/store/timezoneStore';
import { isInDST } from '@/lib/utils/timezone';
import { DateTime } from 'luxon';

interface TimezoneCardProps {
  timezone: Timezone;
  currentTime: Date;
  // viewMode: ViewMode; // Removed
  onRemove: (id: string) => void;
  highlightedTime: Date | null;
  timeSlots: Date[];
  onTimeSelect: (time: Date) => void;
  roundToNearestIncrement: (date: Date, increment: number) => Date;
}

/**
 * Component for displaying a single timezone with a glassmorphism effect
 */
export default function TimezoneCard({
  timezone,
  currentTime,
  // viewMode, // Removed
  onRemove,
  highlightedTime,
  timeSlots,
  onTimeSelect,
  roundToNearestIncrement
}: TimezoneCardProps) {
  const [showOptions, setShowOptions] = useState(false);
  
  // Convert current time to the timezone
  const zonedTime = DateTime.fromJSDate(currentTime).setZone(timezone.id);
  
  // Check if the timezone is in DST
  const isDST = isInDST(timezone.id);
  
  // Determine if it's business hours (9 AM to 5 PM)
  const hour = zonedTime.hour;
  const isBusinessHours = hour >= 9 && hour < 17;
  
  // Determine if it's night time (8 PM to 6 AM)
  const isNightTime = hour >= 20 || hour < 6;
  
  // Format the date for display
  const dateDisplay = zonedTime.toFormat('EEE, MMM d');
  
  // Glass card classes
  const glassClasses = `glass-card ${isNightTime ? 'glass-card-dark' : 'glass-card-light'}`;
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      className={`
        relative p-4 rounded-lg ${glassClasses} 
        w-full max-w-[400px] min-w-[280px] mx-auto
        ${isBusinessHours ? 'border-l-4 border-green-500' : ''}
        ${isNightTime ? 'text-white' : 'text-gray-900 dark:text-white'}
        border-2 border-transparent transition-all duration-300 ease-in-out
        hover:border-yellow-400
      `}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-semibold">{(timezone.city || timezone.name).replace(/[()]/g, '')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{timezone.id}</p>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {DateTime.now().setZone(timezone.id).offsetNameShort || DateTime.now().setZone(timezone.id).toFormat('ZZZZ')}
          </span>
        </div>
        <div className="flex items-center">
          {isDST && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100 mr-2">
              DST
            </span>
          )}
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="p-3 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:ring-2 focus:ring-primary-500 transition-colors"
            aria-label="Options"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Options dropdown */}
      {showOptions && (
        <div className="absolute right-4 top-12 z-10 glass-card glass-card-light dark:glass-card-dark rounded-md shadow-lg py-1">
          <button
            onClick={() => {
              onRemove(timezone.id);
              setShowOptions(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Remove
          </button>
        </div>
      )}
      
      <p className="text-sm mb-4">{dateDisplay}</p>
      
      {/* Clock display */}
      <div className="flex justify-center mb-4">
        {/* Always render list content */}
        <div className="w-full max-h-40 overflow-y-auto">
          {timeSlots.map((slot) => {
              const slotInTimezone = DateTime.fromJSDate(slot).setZone(timezone.id);
              
              // Round the current time down to the nearest slot increment
              const roundedCurrentTime = highlightedTime 
                ? roundToNearestIncrement(highlightedTime, 30 * 60 * 1000) // Assuming 30 min increment
                : null;

              // Convert rounded time to the card's timezone for comparison
              const roundedCurrentInTimezone = roundedCurrentTime
                ? DateTime.fromJSDate(roundedCurrentTime).setZone(timezone.id)
                : null;

              // Check if the slot matches the rounded current time
              const isHighlighted = roundedCurrentInTimezone && 
                roundedCurrentInTimezone.hasSame(slotInTimezone, 'hour') && 
                roundedCurrentInTimezone.hasSame(slotInTimezone, 'minute');
              
return (
                <button
                  key={slot.getTime()}
                  onClick={() => onTimeSelect(slot)}
                  style={isHighlighted ? { fontFamily: "'Space Grotesk', 'JetBrains Mono', monospace" } : {}}
                  className={`
                    w-full text-left px-2 py-1 rounded-md mb-1 transition-colors duration-150 ease-in-out
${isHighlighted 
                      ? 'bg-primary-500 text-white text-2xl font-bold' // Larger, bolder font for highlighted current time
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700' // Normal style: standard padding, hover effect
                    }
                  `}
                >
                  {slotInTimezone.toFormat('HH:mm')}
                </button>
              );
            })}
          </div>
      </div>
      
      {/* Status indicators */}
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          {isBusinessHours ? 'Business Hours' : isNightTime ? 'Night Time' : 'Off Hours'}
        </span>
        <span>
          {zonedTime.toFormat('ZZZZ')}
        </span>
      </div>
    </motion.div>
  );
}
