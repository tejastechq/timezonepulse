'use client';

import React from 'react';
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
 */
export default function ClocksView(props: ClocksViewProps) {
  // Define the analog clock renderer function
  const renderAnalogClock = (time: Date, timezone: string) => (
    <AnalogClock
      time={time}
      size={180}
      highlightedTime={null}
    />
  );

  return (
    <BaseClockView
      {...props}
      renderClock={renderAnalogClock}
      minHeight="310px"
    />
  );
} 