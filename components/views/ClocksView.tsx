'use client';

import React, { useCallback, memo } from 'react';
import { Timezone } from '@/store/timezoneStore';
import BaseClockView from '../clock/BaseClockView';
import AnalogClock from '../clock/AnalogClock';

interface ClocksViewProps {
  selectedTimezones: Timezone[];
  userLocalTimezone: string;
  setSelectedTimezones: (timezones: Timezone[]) => void;
}

/**
 * ClocksView component for displaying analog clocks
 * Uses BaseClockView for shared functionality
 * Optimized with memoization to prevent unnecessary re-renders
 */
function ClocksView(props: ClocksViewProps) {
  // Define the analog clock renderer function - memoized to prevent recreation on each render
  const renderAnalogClock = useCallback((time: Date, timezone: string) => (
    <AnalogClock
      time={time}
      size={180}
      highlightedTime={null}
    />
  ), []);

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