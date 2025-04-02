'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Timezone } from '@/store/timezoneStore';
import { isInDST } from '@/lib/utils/timezone';
import { DateTime } from 'luxon';

interface TimezoneTileProps {
  timezone: Timezone;
  currentTime: Date;
  onRemove?: (id: string) => void;
  isCompact?: boolean;
}

/**
 * Component for displaying a timezone in a compact tile format
 */
export default function TimezoneTile({
  timezone,
  currentTime,
  onRemove,
  isCompact = false
}: TimezoneTileProps) {
  // Convert current time to the timezone
  const zonedTime = DateTime.fromJSDate(currentTime).setZone(timezone.id);
  
  // Check if the timezone is in DST
  const isDST = isInDST(timezone.id);
  
  // Determine if it's business hours (9 AM to 5 PM)
  const hour = zonedTime.hour;
  const isBusinessHours = hour >= 9 && hour < 17;
  
  // Determine if it's night time (8 PM to 6 AM)
  const isNightTime = hour >= 20 || hour < 6;
  
  // Format the time for display
  const timeDisplay = zonedTime.toFormat('HH:mm');
  const dateDisplay = zonedTime.toFormat('EEE, MMM d');
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`
        ${isCompact ? 'p-2' : 'p-3'} 
        rounded-lg bg-white/20 dark:bg-black/20 backdrop-blur-md border border-gray-200 dark:border-gray-800
        ${isBusinessHours ? 'border-l-4 border-green-500' : ''}
        ${isNightTime ? 'text-white' : 'text-gray-900 dark:text-white'}
      `}
    >
      <div className="flex justify-between items-center">
        <div>
          <h3 className={`${isCompact ? 'text-sm' : 'text-md'} font-semibold truncate`}>
            {timezone.city || timezone.name}
          </h3>
          {!isCompact && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{timezone.id}</p>
          )}
        </div>
        <div className="flex items-center">
          {isDST && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100 mr-2">
              DST
            </span>
          )}
          {onRemove && (
            <button
              onClick={() => onRemove(timezone.id)}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Remove timezone"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="mt-2 flex justify-between items-end">
        <div className="text-lg font-bold">{timeDisplay}</div>
        {!isCompact && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {zonedTime.toFormat('ZZZZ')}
          </div>
        )}
      </div>
      
      {!isCompact && (
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {isBusinessHours ? 'Business Hours' : isNightTime ? 'Night Time' : 'Off Hours'}
        </div>
      )}
    </motion.div>
  );
} 