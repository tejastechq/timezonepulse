'use client';

import React, { useMemo } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { Timezone } from '@/store/timezoneStore';
import { DateTime } from 'luxon';
import { isInDST } from '@/lib/utils/timezone';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Edit2, Settings } from 'lucide-react';
import { useTheme } from 'next-themes';
import type { MotionStyle } from 'framer-motion';

// Define props interface
interface ClockCardProps {
  timezone: Timezone;
  currentTime: Date;
  userLocalTimezone: string;
  renderClock: (time: Date, timezone: string, size?: number) => React.ReactNode;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
}

/**
 * ClockCard component with glassmorphism effect
 * Displays a single timezone with clock and status indicators
 */
function ClockCard({
  timezone,
  currentTime,
  userLocalTimezone,
  renderClock,
  onEdit,
  onRemove
}: ClockCardProps) {
  // Get theme for styling
  const { resolvedTheme } = useTheme();
  
  // Memoize expensive calculations
  const zonedTime = useMemo(() => 
    DateTime.fromJSDate(currentTime).setZone(timezone.id),
    [currentTime, timezone.id]
  );
  
  const isDST = useMemo(() => isInDST(timezone.id), [timezone.id]);
  const dateDisplay = useMemo(() => zonedTime.toFormat('EEE, MMM d'), [zonedTime]);
  const hour = zonedTime.hour;
  const isBusinessHours = useMemo(() => hour >= 9 && hour < 17, [hour]);
  const isNightTime = useMemo(() => hour >= 20 || hour < 6, [hour]);
  
  // Glass card classes based on theme and time
  const glassClasses = `glass-card backdrop-blur-fix ${isNightTime || resolvedTheme === 'dark' ? 'glass-card-dark' : 'glass-card-light'}`;
  
  // In-line style for enhanced transparency control
  const cardStyle: MotionStyle = {
    isolation: 'isolate',
    backgroundColor: isNightTime || resolvedTheme === 'dark' 
      ? 'rgba(15, 15, 25, 0.2)' 
      : 'rgba(255, 255, 255, 0.15)'
  };
  
  return (
    <motion.div
      key={timezone.id}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      className={`
        relative p-4 rounded-lg ${glassClasses}
        ${isBusinessHours ? 'border-l-4 border-green-500' : 'border-l-4 border-transparent'}
        ${isNightTime ? 'text-white' : 'text-gray-900 dark:text-white'}
        transition-all duration-200
      `}
      style={cardStyle}
    >
      <div className="flex justify-between items-start mb-2 relative z-[2]">
        <div>
          <h3 className="text-lg font-semibold">{timezone.name.split('/').pop()?.replace('_', ' ') || timezone.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{timezone.id}</p>
        </div>
        <div className="flex items-center space-x-2">
          {isDST && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100">
              DST
            </span>
          )}
          
          {/* Timezone options dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button 
                className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700
                          focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Timezone options"
              >
                <Settings className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
            </DropdownMenu.Trigger>
            
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[200px] glass-card backdrop-blur-fix glass-card-light dark:glass-card-dark rounded-lg shadow-lg py-1.5 border border-gray-200 dark:border-gray-700"
                sideOffset={5}
                align="end"
              >
                {timezone.id !== userLocalTimezone && (
                  <DropdownMenu.Item 
                    onSelect={() => onEdit(timezone.id)}
                    className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Change Timezone
                  </DropdownMenu.Item>
                )}
                
                {timezone.id !== userLocalTimezone && (
                  <DropdownMenu.Item 
                    onSelect={() => onRemove(timezone.id)}
                    className="flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove
                  </DropdownMenu.Item>
                )}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
      
      <p className="text-sm mb-4 relative z-[2]">{dateDisplay}</p>
      
      {/* Clock display */}
      <div className="flex justify-center items-center mb-4 relative z-[2]">
        {renderClock(zonedTime.toJSDate(), timezone.id)}
      </div>
      
      {/* Status indicators */}
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 relative z-[2]">
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

export default React.memo(ClockCard); 