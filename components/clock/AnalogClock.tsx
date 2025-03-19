'use client';

import React, { useMemo, memo } from 'react';
import { DateTime } from 'luxon';
import { motion } from 'framer-motion';

interface AnalogClockProps {
  time: Date;
  size?: number;
  highlightedTime: Date | null;
}

/**
 * Component for displaying an analog clock
 * Optimized with memoization to prevent unnecessary re-renders
 */
function AnalogClock({ time, size = 200, highlightedTime }: AnalogClockProps) {
  // Calculate the rotation angles for the clock hands
  const { hourRotation, minuteRotation, secondRotation, highlightRotation } = useMemo(() => {
    const dt = DateTime.fromJSDate(time);
    const hours = dt.hour % 12;
    const minutes = dt.minute;
    const seconds = dt.second;
    
    // Calculate rotations
    // Adjust the rotation to account for SVG coordinate system
    // In standard clock, 0 degrees should point to 12 o'clock, which is -90 degrees in SVG coordinates
    const hourRotation = (hours * 30) + (minutes * 0.5) - 90; // 30 degrees per hour, plus 0.5 degrees per minute
    const minuteRotation = minutes * 6 - 90; // 6 degrees per minute
    const secondRotation = seconds * 6 - 90; // 6 degrees per second
    
    // Calculate highlight rotation if a highlighted time is provided
    let highlightRotation = null;
    if (highlightedTime) {
      const highlightDt = DateTime.fromJSDate(highlightedTime);
      const highlightHours = highlightDt.hour % 12;
      const highlightMinutes = highlightDt.minute;
      highlightRotation = (highlightHours * 30) + (highlightMinutes * 0.5) - 90;
    }
    
    return { hourRotation, minuteRotation, secondRotation, highlightRotation };
  }, [time, highlightedTime]);
  
  // Calculate dimensions
  const center = size / 2;
  const strokeWidth = size / 40;
  
  // Memoize the hour markers to prevent recalculation on every render
  const hourMarkers = useMemo(() => {
    return [...Array(12)].map((_, i) => {
      const angle = (i * 30) * (Math.PI / 180);
      const markerLength = size * 0.1;
      const x1 = center + (center - strokeWidth - markerLength) * Math.sin(angle);
      const y1 = center - (center - strokeWidth - markerLength) * Math.cos(angle);
      const x2 = center + (center - strokeWidth) * Math.sin(angle);
      const y2 = center - (center - strokeWidth) * Math.cos(angle);
      
      return (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="currentColor"
          strokeWidth={i % 3 === 0 ? strokeWidth : strokeWidth / 2}
          strokeOpacity="0.5"
        />
      );
    });
  }, [center, size, strokeWidth]);

  // Calculate endpoints for the clock hands
  const getHandCoordinates = (length: number, rotation: number) => {
    // Convert rotation from degrees to radians and adjust for SVG coordinate system
    const radians = (rotation + 90) * (Math.PI / 180);
    // Calculate the end point of the hand
    return {
      x2: center + length * Math.cos(radians),
      y2: center + length * Math.sin(radians)
    };
  };
  
  // Calculate hand endpoints
  const hourHandLength = size * 0.25;
  const minuteHandLength = size * 0.35;
  const secondHandLength = size * 0.4;
  
  const hourHand = getHandCoordinates(hourHandLength, hourRotation);
  const minuteHand = getHandCoordinates(minuteHandLength, minuteRotation);
  const secondHand = getHandCoordinates(secondHandLength, secondRotation);
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Clock face */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
      >
        {/* Clock circle */}
        <circle
          cx={center}
          cy={center}
          r={center - strokeWidth}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeOpacity="0.2"
        />
        
        {/* Hour markers */}
        {hourMarkers}
        
        {/* Highlighted time indicator */}
        {highlightRotation !== null && (
          <line
            x1={center}
            y1={center}
            x2={center + (center - strokeWidth * 4) * Math.cos((highlightRotation + 90) * (Math.PI / 180))}
            y2={center + (center - strokeWidth * 4) * Math.sin((highlightRotation + 90) * (Math.PI / 180))}
            stroke="#F59E0B"
            strokeWidth={strokeWidth / 2}
            strokeLinecap="round"
          />
        )}
        
        {/* Hour hand */}
        <line
          x1={center}
          y1={center}
          x2={hourHand.x2}
          y2={hourHand.y2}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Minute hand */}
        <line
          x1={center}
          y1={center}
          x2={minuteHand.x2}
          y2={minuteHand.y2}
          stroke="currentColor"
          strokeWidth={strokeWidth * 0.7}
          strokeLinecap="round"
        />
        
        {/* Second hand */}
        <line
          x1={center}
          y1={center}
          x2={secondHand.x2}
          y2={secondHand.y2}
          stroke="#EF4444"
          strokeWidth={strokeWidth * 0.3}
          strokeLinecap="round"
        />
        
        {/* Center dot */}
        <circle
          cx={center}
          cy={center}
          r={strokeWidth}
          fill="currentColor"
        />
      </svg>
    </div>
  );
} 

// Export a memoized version of the component
export default memo(AnalogClock); 