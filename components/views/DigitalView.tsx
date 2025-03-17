'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Timezone } from '@/store/timezoneStore';
import DigitalClock from '../clock/DigitalClock';
import { DateTime } from 'luxon';
import { isInDST } from '@/lib/utils/timezone';

interface DigitalViewProps {
  selectedTimezones: Timezone[];
  userLocalTimezone: string;
  setSelectedTimezones: (timezones: Timezone[]) => void;
}

/**
 * DigitalView component for displaying digital clocks
 */
export default function DigitalView({
  selectedTimezones,
  userLocalTimezone,
  setSelectedTimezones
}: DigitalViewProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  // Set mounted state and start timer on client
  useEffect(() => {
    setMounted(true);
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Handle removing a timezone
  const handleRemoveTimezone = (id: string) => {
    setSelectedTimezones(selectedTimezones.filter(tz => tz.id !== id));
  };

  // Render the digital clocks grid
  const renderDigitalClocks = () => {
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {uniqueTimezones.map((timezone) => {
          // Convert current time to the timezone
          const zonedTime = DateTime.fromJSDate(currentTime).setZone(timezone.id);
          
          // Check if the timezone is in DST
          const isDST = isInDST(timezone.id);
          
          // Format the date for display
          const dateDisplay = zonedTime.toFormat('EEE, MMM d');
          
          // Determine if it's business hours (9 AM to 5 PM)
          const hour = zonedTime.hour;
          const isBusinessHours = hour >= 9 && hour < 17;
          
          // Determine if it's night time (8 PM to 6 AM)
          const isNightTime = hour >= 20 || hour < 6;
          
          return (
            <motion.div
              key={timezone.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`
                relative p-4 rounded-lg shadow-md
                ${isNightTime ? 'bg-gray-800 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}
                ${isBusinessHours ? 'border-l-4 border-green-500' : ''}
              `}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold">{timezone.name.split('/').pop()?.replace('_', ' ') || timezone.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{timezone.id}</p>
                </div>
                <div className="flex items-center">
                  {isDST && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100 mr-2">
                      DST
                    </span>
                  )}
                  
                  {timezone.id !== userLocalTimezone && (
                    <button
                      onClick={() => handleRemoveTimezone(timezone.id)}
                      className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      aria-label="Remove timezone"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              <p className="text-sm mb-4">{dateDisplay}</p>
              
              <div className="flex justify-center mb-4">
                <DigitalClock
                  time={zonedTime.toJSDate()}
                  timezone={timezone.id}
                  highlightedTime={null}
                />
              </div>
              
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
        })}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full"
    >
      {renderDigitalClocks()}
    </motion.div>
  );
} 