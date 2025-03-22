/**
 * Test file for the AnalogClock component
 * Verifies that the analog clock correctly handles different timezones
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import AnalogClock from '../components/clock/AnalogClock';

describe('AnalogClock', () => {
  // Define a fixed test time for consistent testing
  const testTime = new Date('2023-06-15T12:00:00Z'); // noon UTC
  
  it('displays correct time for New York timezone', () => {
    // Create a mock SVG element to measure rotation
    const { container } = render(
      <AnalogClock
        time={testTime}
        timezone="America/New_York"
        size={200}
        highlightedTime={null}
        theme="light"
      />
    );
    
    // At noon UTC, New York is at 8:00 AM (EDT)
    // Hour hand should be at 8 hour position (8 * 30 - 90 = 150 degrees)
    // Minute hand should be at 0 minute position (0 * 6 - 90 = -90 degrees)
    
    // Get the hour and minute hands by their class/id
    const hourHand = container.querySelector('[data-testid="hour-hand"]');
    const minuteHand = container.querySelector('[data-testid="minute-hand"]');
    
    // Check that the hour hand is correctly positioned
    expect(hourHand).toHaveAttribute('transform', expect.stringContaining('rotate(150'));
    
    // Check that the minute hand is correctly positioned
    expect(minuteHand).toHaveAttribute('transform', expect.stringContaining('rotate(-90'));
  });
  
  it('displays correct time for Tokyo timezone', () => {
    // Create a mock SVG element to measure rotation
    const { container } = render(
      <AnalogClock
        time={testTime}
        timezone="Asia/Tokyo"
        size={200}
        highlightedTime={null}
        theme="light"
      />
    );
    
    // At noon UTC, Tokyo is at 9:00 PM (JST)
    // Hour hand should be at 9 hour position (9 * 30 - 90 = 180 degrees)
    // Minute hand should be at 0 minute position (0 * 6 - 90 = -90 degrees)
    
    // Get the hour and minute hands by their class/id
    const hourHand = container.querySelector('[data-testid="hour-hand"]');
    const minuteHand = container.querySelector('[data-testid="minute-hand"]');
    
    // Check that the hour hand is correctly positioned
    expect(hourHand).toHaveAttribute('transform', expect.stringContaining('rotate(180'));
    
    // Check that the minute hand is correctly positioned
    expect(minuteHand).toHaveAttribute('transform', expect.stringContaining('rotate(-90'));
  });
  
  it('updates time display when timezone changes', () => {
    // First render with New York timezone
    const { container, rerender } = render(
      <AnalogClock
        time={testTime}
        timezone="America/New_York"
        size={200}
        highlightedTime={null}
        theme="light"
      />
    );
    
    // Get the hour hand
    const hourHandNY = container.querySelector('[data-testid="hour-hand"]');
    
    // Check initial position for New York time
    expect(hourHandNY).toHaveAttribute('transform', expect.stringContaining('rotate(150'));
    
    // Re-render with Tokyo timezone
    rerender(
      <AnalogClock
        time={testTime}
        timezone="Asia/Tokyo"
        size={200}
        highlightedTime={null}
        theme="light"
      />
    );
    
    // Get the hour hand again
    const hourHandTokyo = container.querySelector('[data-testid="hour-hand"]');
    
    // Check that hour hand position changed to Tokyo time
    expect(hourHandTokyo).toHaveAttribute('transform', expect.stringContaining('rotate(180'));
  });
}); 