'use client';

import React, { useMemo, memo } from 'react';
import { DateTime } from 'luxon';
import { useSettingsStore } from '@/store/settingsStore';
import { formatTime } from '@/lib/utils/dateTimeFormatter';
import { convertEarthToMarsTime, formatMarsTime } from '@/lib/utils/mars-timezone';

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
    // Special handling for Mars timezones
    if (timezone.startsWith('Mars/')) {
      try {
        // Validate time is valid
        if (!(time instanceof Date) || isNaN(time.getTime())) {
          console.error('Invalid time provided to DigitalClock for Mars timezone:', time);
          return { 
            timeDisplay: '--:--', 
            dateDisplay: 'Invalid Date', 
            isHighlighted: false 
          };
        }
        
        // Convert Earth time to Mars time
        const marsTimeData = convertEarthToMarsTime(DateTime.fromJSDate(time), timezone);
        const timeDisplay = formatMarsTime(marsTimeData);
        const dateDisplay = `Sol ${marsTimeData.sol}`;
        
        // Check if highlighted time matches
        let isHighlighted = false;
        if (highlightedTime && !isNaN(highlightedTime.getTime())) {
          const highlightMarsData = convertEarthToMarsTime(
            DateTime.fromJSDate(highlightedTime), 
            timezone
          );
          
          isHighlighted = 
            marsTimeData.hours === highlightMarsData.hours && 
            marsTimeData.minutes === highlightMarsData.minutes;
        }
        
        return { timeDisplay, dateDisplay, isHighlighted };
      } catch (error) {
        console.error('Error calculating Mars time for digital display:', error);
        return { 
          timeDisplay: 'Mars Time Error', 
          dateDisplay: 'Check Console', 
          isHighlighted: false 
        };
      }
    }
    
    // Regular Earth timezone handling
    try {
      const dt = DateTime.fromJSDate(time).setZone(timezone);
      
      if (!dt.isValid) {
        console.error('Invalid timezone conversion in DigitalClock:', timezone, dt.invalidExplanation);
        return { 
          timeDisplay: '--:--', 
          dateDisplay: 'Invalid Timezone', 
          isHighlighted: false 
        };
      }
      
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
    } catch (error) {
      console.error('Error in DigitalClock time formatting:', error);
      return { 
        timeDisplay: '--:--', 
        dateDisplay: 'Error', 
        isHighlighted: false 
      };
    }
  }, [time, timezone, highlightedTime]);

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