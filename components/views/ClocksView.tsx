'use client';

import React, { useCallback, memo, useMemo } from 'react';
import { Timezone } from '@/store/timezoneStore';
import BaseClockView from '../clock/BaseClockView';
import AnalogClock from '../clock/AnalogClock';
import { useTheme } from 'next-themes';

interface ClocksViewProps {
  selectedTimezones: Timezone[];
  userLocalTimezone: string;
  // Removed setSelectedTimezones from interface
}

/**
 * ClocksView component for displaying analog clocks
 * Uses BaseClockView for shared functionality
 * Optimized with memoization to prevent unnecessary re-renders
 */
function ClocksView(props: ClocksViewProps) {
  // Get theme from next-themes
  const { resolvedTheme } = useTheme();
  
  // Determine clock theme based on system theme
  const clockTheme = useMemo(() => {
    return resolvedTheme === 'dark' ? 'dark' : 'light';
  }, [resolvedTheme]);

  // Define the analog clock renderer function - memoized to prevent recreation on each render
  const renderAnalogClock = useCallback((time: Date, timezone: string) => {
    // Ensure time is a valid Date object
    const validTime = time instanceof Date && !isNaN(time.getTime()) ? time : new Date();
    
    return (
      <AnalogClock
        time={validTime}
        timezone={timezone}
        size={220}
        highlightedTime={null}
        theme={clockTheme as 'light' | 'dark'}
      />
    );
  }, [clockTheme]);

  return (
    <BaseClockView
      {...props}
      renderClock={renderAnalogClock}
      minHeight="310px"
    />
  );
}

// Export a memoized version of the component
export default memo(ClocksView);
