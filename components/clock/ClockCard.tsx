'use client';

import React, { useMemo, useCallback } from 'react'; // Added useCallback
import { motion, MotionProps } from 'framer-motion';
import { Timezone } from '@/store/timezoneStore';
import { DateTime } from 'luxon';
import { isInDST } from '@/lib/utils/timezone';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Edit2, Settings, X } from 'lucide-react'; // Added X icon
import { useTheme } from 'next-themes';
import type { MotionStyle } from 'framer-motion';

// Define props interface
interface ClockCardProps {
  timezone: Timezone;
  currentTime: Date;
  userLocalTimezone: string;
  renderClock: (time: Date, timezone: string, size?: number) => React.ReactNode;
  onEdit: (id: string) => void;
  removeTimezone: (id: string) => void; // Changed prop name to match BaseClockView
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
  removeTimezone // Changed prop name
}: ClockCardProps) {
  // Get theme for styling
  const { resolvedTheme } = useTheme();

  // Ensure currentTime is a valid Date
  const validTime = useMemo(() => {
    return currentTime instanceof Date && !isNaN(currentTime.getTime()) 
      ? currentTime 
      : new Date();
  }, [currentTime]);

  // Callback for remove button click with confirmation
  const handleRemoveClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card interactions if needed
    if (timezone.id !== userLocalTimezone) {
      const name = timezone.name.split('/').pop()?.replace('_', ' ') || timezone.id;
      if (window.confirm(`Are you sure you want to remove the timezone "${name}"?`)) {
        removeTimezone(timezone.id); // Use the passed prop
      }
    }
  }, [timezone, userLocalTimezone, removeTimezone]);

  // Memoize expensive calculations
  const zonedTime = useMemo(() =>
    DateTime.fromJSDate(validTime).setZone(timezone.id),
    [validTime, timezone.id]
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
        group relative p-4 md:p-5 lg:p-6 rounded-lg ${glassClasses} 
        w-full max-w-[320px] min-w-[280px] mx-auto
        ${isBusinessHours ? 'border-l-4 border-green-500' : 'border-l-4 border-transparent'}
        ${isNightTime ? 'text-white' : 'text-gray-900 dark:text-white'}
        transition-all duration-200
      `}
      style={cardStyle}
    >
      {/* Overlay Remove Button */}
      {timezone.id !== userLocalTimezone && (
        <button
          onClick={handleRemoveClick}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-gray-500/30 text-white/70
                     opacity-0 group-hover:opacity-100 group-focus-within:opacity-100
                     hover:bg-red-500/70 hover:text-white focus:opacity-100 focus:bg-red-500/70 focus:text-white
                     focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800/50
                     transition-opacity duration-200"
          aria-label={`Remove timezone ${timezone.name}`}
          title="Remove Timezone"
        >
          <X className="h-4 w-4" />
        </button>
      )}

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
                {/* The old Remove DropdownMenu.Item is completely removed as it's handled by the X button */}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
      
      <p className="text-sm mb-4 relative z-[2]">{dateDisplay}</p>
      
      {/* Clock display */}
      <div className="flex justify-center items-center mb-4 relative z-[2]">
        {renderClock(validTime, timezone.id)}
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
