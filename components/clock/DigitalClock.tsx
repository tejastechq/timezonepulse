'use client';

import React, { useMemo, memo } from 'react';
import { DateTime } from 'luxon';
import { useSettingsStore } from '@/store/settingsStore';
import { formatTime } from '@/lib/utils/dateTimeFormatter';

interface DigitalClockProps {
  time: Date;
  timezone: string;
  highlightedTime: Date | null;
}

/**
 * Component for displaying a digital clock
 * Optimized with memoization to prevent unnecessary re-renders
 */
function DigitalClock({ time, timezone, highlightedTime }: DigitalClockProps) {
  // Format the time for display - memoized to prevent recalculation on every render
  const { timeDisplay, dateDisplay, isHighlighted } = useMemo(() => {
    const dt = DateTime.fromJSDate(time).setZone(timezone);
    
    // Use the formatTime utility to format the time according to user settings
    const timeDisplay = formatTime(dt);
    const dateDisplay = dt.toFormat('EEE, MMM d');
    
    // Check if the current time matches the highlighted time
    let isHighlighted = false;
    if (highlightedTime) {
      const highlightDt = DateTime.fromJSDate(highlightedTime).setZone(timezone);
      isHighlighted = dt.hasSame(highlightDt, 'hour') && dt.hasSame(highlightDt, 'minute');
    }
    
    return { timeDisplay, dateDisplay, isHighlighted };
  }, [time, timezone, highlightedTime]); // Removed showSeconds from dependencies since it's handled by formatTime

  return (
    <div className="text-center">
      <div 
        className={`
          text-3xl md:text-4xl lg:text-5xl font-mono font-bold mb-2 md:mb-3
          ${isHighlighted ? 'text-primary-500' : ''}
        `}
      >
        {timeDisplay}
      </div>
      <div className="text-sm md:text-base text-gray-500 dark:text-gray-400">
        {dateDisplay}
      </div>
    </div>
  );
}

// Export a memoized version of the component
export default memo(DigitalClock);