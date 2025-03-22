'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Timezone } from '@/store/timezoneStore';
import BaseClockView from '../clock/BaseClockView';
import DigitalClock from '../clock/DigitalClock';

interface DigitalViewProps {
  selectedTimezones: Timezone[];
  userLocalTimezone: string;
  setSelectedTimezones: (timezones: Timezone[]) => void;
}

/**
 * DigitalView component for displaying digital clocks
 * Uses BaseClockView for shared functionality
 * Optimized with memoization to prevent unnecessary re-renders
 */
function DigitalView(props: DigitalViewProps) {
  // Define the digital clock renderer function - memoized to prevent recreation on each render
  const renderDigitalClock = useCallback((time: Date, timezone: string) => (
    <DigitalClock
      time={time}
      timezone={timezone}
      highlightedTime={null}
    />
  ), []);

  return (
    <BaseClockView
      {...props}
      renderClock={renderDigitalClock}
      minHeight="280px"
    />
  );
}

// Export a memoized version of the component
export default memo(DigitalView); 