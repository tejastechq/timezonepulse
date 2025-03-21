'use client';

import React, { useEffect, useState, useRef, useMemo, memo } from 'react';
import { DateTime } from 'luxon';
import { motion } from 'framer-motion';

interface AnalogClockProps {
  time: Date;
  size?: number;
  highlightedTime: Date | null;
  theme?: 'light' | 'dark' | 'auto';
}

/**
 * Component for displaying an analog clock with enhanced aesthetics
 * Optimized with memoization to prevent unnecessary re-renders
 */
function AnalogClock({ 
  time, 
  size = 200, 
  highlightedTime,
  theme = 'auto'
}: AnalogClockProps) {
  // Calculate the rotation angles for the clock hands
  const { hourRotation, minuteRotation, secondRotation, highlightRotation } = useMemo(() => {
    const dt = DateTime.fromJSDate(time);
    const hours = dt.hour % 12;
    const minutes = dt.minute;
    const seconds = dt.second;
    const milliseconds = dt.millisecond;
    
    // Calculate rotations with additional precision for smoother movement
    // Adjust the rotation to account for SVG coordinate system
    // In standard clock, 0 degrees should point to 12 o'clock, which is -90 degrees in SVG coordinates
    const hourRotation = (hours * 30) + (minutes * 0.5) - 90; // 30 degrees per hour, plus 0.5 degrees per minute
    const minuteRotation = (minutes * 6) + (seconds * 0.1) - 90; // 6 degrees per minute, plus 0.1 degrees per second
    const secondRotation = (seconds * 6) + (milliseconds * 0.006) - 90; // 6 degrees per second, plus adjustment for milliseconds
    
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
  const clockRadius = center - strokeWidth;
  
  // Determine clock face colors based on theme
  const clockFaceColor = theme === 'dark' ? '#2D3748' : '#F7FAFC';
  const clockBorderColor = theme === 'dark' ? '#4A5568' : '#E2E8F0';
  const clockNumeralColor = theme === 'dark' ? '#CBD5E0' : '#4A5568';
  const hourHandColor = theme === 'dark' ? '#E2E8F0' : '#2D3748';
  const minuteHandColor = theme === 'dark' ? '#E2E8F0' : '#4A5568';
  
  // Memoize the hour markers to prevent recalculation on every render
  const hourMarkers = useMemo(() => {
    return [...Array(12)].map((_, i) => {
      const angle = (i * 30) * (Math.PI / 180);
      const isMainMarker = i % 3 === 0;
      const markerLength = isMainMarker ? size * 0.12 : size * 0.08;
      const markerDistance = isMainMarker ? strokeWidth + 2 : strokeWidth + 1;
      
      const x1 = center + (center - markerDistance - markerLength) * Math.sin(angle);
      const y1 = center - (center - markerDistance - markerLength) * Math.cos(angle);
      const x2 = center + (center - markerDistance) * Math.sin(angle);
      const y2 = center - (center - markerDistance) * Math.cos(angle);
      
      return (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="currentColor"
          strokeWidth={isMainMarker ? strokeWidth * 0.8 : strokeWidth * 0.5}
          strokeOpacity={isMainMarker ? 0.7 : 0.5}
          strokeLinecap="round"
        />
      );
    });
  }, [center, size, strokeWidth]);

  // Generate clock numerals
  const clockNumerals = useMemo(() => {
    return [...Array(12)].map((_, i) => {
      // Skip 0, start from 1-12
      const hour = i === 0 ? 12 : i;
      const angle = (i * 30) * (Math.PI / 180);
      // Position numerals slightly inside the clock face
      const distance = clockRadius * 0.75;
      const x = center + distance * Math.sin(angle);
      const y = center - distance * Math.cos(angle);
      
      // Adjust text positioning
      const fontSize = size * 0.12;
      
      return (
        <text
          key={i}
          x={x}
          y={y + fontSize * 0.3} // Adjust for vertical centering
          fill={clockNumeralColor}
          fontSize={fontSize}
          fontWeight="500"
          textAnchor="middle"
          dominantBaseline="middle"
          opacity={0.85}
        >
          {hour}
        </text>
      );
    });
  }, [center, clockRadius, clockNumeralColor, size]);

  // Generate minute ticks
  const minuteTicks = useMemo(() => {
    return [...Array(60)].map((_, i) => {
      // Skip positions where hour markers exist
      if (i % 5 === 0) return null;
      
      const angle = (i * 6) * (Math.PI / 180);
      const tickLength = size * 0.03;
      const x1 = center + (clockRadius - tickLength) * Math.sin(angle);
      const y1 = center - (clockRadius - tickLength) * Math.cos(angle);
      const x2 = center + clockRadius * Math.sin(angle);
      const y2 = center - clockRadius * Math.cos(angle);
      
      return (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="currentColor"
          strokeWidth={strokeWidth * 0.3}
          strokeOpacity={0.3}
        />
      );
    }).filter(Boolean);
  }, [center, clockRadius, size, strokeWidth]);

  // Calculate endpoints for the clock hands
  const getHandCoordinates = (length: number, rotation: number, offset: number = 0) => {
    // Convert rotation from degrees to radians and adjust for SVG coordinate system
    const radians = (rotation + 90) * (Math.PI / 180);
    
    // For the tail of the hand (extending slightly behind center)
    const tailRadians = ((rotation + 90) + 180) * (Math.PI / 180);
    
    // Calculate the end point of the hand
    return {
      x2: center + length * Math.cos(radians),
      y2: center + length * Math.sin(radians),
      // Add a small tail to the hand for balance
      x1: offset ? center + offset * Math.cos(tailRadians) : center,
      y1: offset ? center + offset * Math.sin(tailRadians) : center
    };
  };
  
  // Calculate hand endpoints
  const hourHandLength = clockRadius * 0.5;
  const minuteHandLength = clockRadius * 0.7;
  const secondHandLength = clockRadius * 0.85;
  
  // Add a small extension behind the center point for balance
  const hourHand = getHandCoordinates(hourHandLength, hourRotation, size * 0.07);
  const minuteHand = getHandCoordinates(minuteHandLength, minuteRotation, size * 0.1);
  const secondHand = getHandCoordinates(secondHandLength, secondRotation, size * 0.15);
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 drop-shadow-md"
      >
        {/* Clock face with inner shadow */}
        <defs>
          <filter id="inner-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feOffset dx="0" dy="0" />
            <feGaussianBlur stdDeviation="2" result="offset-blur" />
            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
            <feFlood floodColor="black" floodOpacity="0.2" result="color" />
            <feComposite operator="in" in="color" in2="inverse" result="shadow" />
            <feComposite operator="over" in="shadow" in2="SourceGraphic" />
          </filter>
          
          {/* Shadow for clock hands */}
          <filter id="hand-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0.5" dy="0.5" stdDeviation="0.5" floodOpacity="0.3" />
          </filter>
        </defs>
        
        {/* Clock background */}
        <circle
          cx={center}
          cy={center}
          r={clockRadius}
          fill={clockFaceColor}
          stroke={clockBorderColor}
          strokeWidth={strokeWidth}
          filter="url(#inner-shadow)"
        />
        
        {/* Minute ticks */}
        {minuteTicks}
        
        {/* Hour markers */}
        {hourMarkers}
        
        {/* Clock numerals */}
        {clockNumerals}
        
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
            strokeDasharray="2,2"
          />
        )}
        
        {/* Hour hand */}
        <line
          x1={hourHand.x1}
          y1={hourHand.y1}
          x2={hourHand.x2}
          y2={hourHand.y2}
          stroke={hourHandColor}
          strokeWidth={strokeWidth * 1.2}
          strokeLinecap="round"
          filter="url(#hand-shadow)"
        />
        
        {/* Minute hand */}
        <line
          x1={minuteHand.x1}
          y1={minuteHand.y1}
          x2={minuteHand.x2}
          y2={minuteHand.y2}
          stroke={minuteHandColor}
          strokeWidth={strokeWidth * 0.8}
          strokeLinecap="round"
          filter="url(#hand-shadow)"
        />
        
        {/* Second hand with smooth animation */}
        <motion.line
          x1={secondHand.x1}
          y1={secondHand.y1}
          x2={secondHand.x2}
          y2={secondHand.y2}
          stroke="#EF4444"
          strokeWidth={strokeWidth * 0.4}
          strokeLinecap="round"
          initial={false}
          transition={{ 
            type: "spring",
            stiffness: 100,
            damping: 10,
            duration: 0.1 
          }}
        />
        
        {/* Center dot with shadow */}
        <circle
          cx={center}
          cy={center}
          r={strokeWidth * 1.3}
          fill="#CBD5E0"
          stroke="currentColor"
          strokeWidth={strokeWidth * 0.2}
          filter="url(#hand-shadow)"
        />
        
        {/* Center dot cap */}
        <circle
          cx={center}
          cy={center}
          r={strokeWidth * 0.7}
          fill="#EF4444"
        />
      </svg>
    </div>
  );
} 

// Export a memoized version of the component
export default memo(AnalogClock); 