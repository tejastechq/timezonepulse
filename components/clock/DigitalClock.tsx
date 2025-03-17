'use client';

import { useMemo } from 'react';
import { DateTime } from 'luxon';

interface DigitalClockProps {
  time: Date;
  timezone: string;
  highlightedTime: Date | null;
}

/**
 * Component for displaying a digital clock
 */
export default function DigitalClock({ time, timezone, highlightedTime }: DigitalClockProps) {
  // Format the time for display
  const { timeDisplay, dateDisplay, isHighlighted } = useMemo(() => {
    const dt = DateTime.fromJSDate(time).setZone(timezone);
    const timeDisplay = dt.toFormat('HH:mm:ss');
    const dateDisplay = dt.toFormat('EEE, MMM d');
    
    // Check if the current time matches the highlighted time
    let isHighlighted = false;
    if (highlightedTime) {
      const highlightDt = DateTime.fromJSDate(highlightedTime).setZone(timezone);
      isHighlighted = dt.hasSame(highlightDt, 'hour') && dt.hasSame(highlightDt, 'minute');
    }
    
    return { timeDisplay, dateDisplay, isHighlighted };
  }, [time, timezone, highlightedTime]);
  
  return (
    <div className="text-center">
      <div 
        className={`
          text-4xl font-mono font-bold mb-2
          ${isHighlighted ? 'text-primary-500' : ''}
        `}
      >
        {timeDisplay}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {dateDisplay}
      </div>
    </div>
  );
} 