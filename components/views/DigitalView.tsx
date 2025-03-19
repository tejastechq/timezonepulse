'use client';

import React from 'react';
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
 */
export default function DigitalView(props: DigitalViewProps) {
  // Define the digital clock renderer function
  const renderDigitalClock = (time: Date, timezone: string) => (
    <DigitalClock
      time={time}
      timezone={timezone}
      highlightedTime={null}
    />
  );

  return (
    <BaseClockView
      {...props}
      renderClock={renderDigitalClock}
      minHeight="250px"
    />
  );
} 