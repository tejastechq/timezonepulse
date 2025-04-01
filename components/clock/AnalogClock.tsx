'use client';

import React, { useEffect, useState, useMemo, memo } from 'react';
import { DateTime } from 'luxon';
import { motion } from 'framer-motion';
import { convertEarthToMarsTime } from '@/lib/utils/mars-timezone'; // Import Mars time conversion utility

interface AnalogClockProps {
  time: Date;
  timezone: string;
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
  timezone,
  size = 200, 
  highlightedTime,
  theme = 'auto'
}: AnalogClockProps) {
  // Generate unique IDs for SVG elements to prevent conflicts when multiple clocks are rendered
  const uniqueId = useMemo(() => `clock-${Math.random().toString(36).substring(2, 9)}`, []);
  
  // State to track if the clock is mounted
  const [mounted, setMounted] = useState(false);
  
  // Calculate dimensions
  const center = size / 2;
  const strokeWidth = size / 40;
  const clockRadius = center - strokeWidth;
  
  // Effect to handle mounting state
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  // Calculate the rotation angles for the clock hands
  const { hourRotation, minuteRotation, secondRotation, highlightRotation } = useMemo(() => {
    // Default values to prevent NaN
    let hourRotation = 0;
    let minuteRotation = 0;
    let secondRotation = 0;
    let highlightRotation = null;
    
    try {
      // Validate time is a valid Date object
      if (!(time instanceof Date) || isNaN(time.getTime())) {
        console.error('Invalid time provided to AnalogClock:', time);
        return { hourRotation, minuteRotation, secondRotation, highlightRotation };
      }
      
      // Special handling for Mars timezones
      if (timezone.startsWith('Mars/')) {
        try {
          // Use Mars time conversion for the timezone
          const marsTimeData = convertEarthToMarsTime(DateTime.fromJSDate(time), timezone);
          
          // Calculate rotation angles from Mars time components
          hourRotation = (marsTimeData.hours % 12) * 30 + (marsTimeData.minutes * 0.5);
          minuteRotation = marsTimeData.minutes * 6 + (marsTimeData.seconds * 0.1);
          secondRotation = marsTimeData.seconds * 6;
          
          // Handle highlight time for Mars if needed
          if (highlightedTime && highlightedTime instanceof Date && !isNaN(highlightedTime.getTime())) {
            const marsHighlightData = convertEarthToMarsTime(
              DateTime.fromJSDate(highlightedTime), 
              timezone
            );
            highlightRotation = (marsHighlightData.hours % 12) * 30 + (marsHighlightData.minutes * 0.5);
          }
          
          return { hourRotation, minuteRotation, secondRotation, highlightRotation };
        } catch (error) {
          console.error('Error calculating Mars time:', error);
          // Fall back to Earth time calculation if Mars conversion fails
        }
      }
      
      // Regular Earth timezone handling
      const dt = DateTime.fromJSDate(time).setZone(timezone);
      
      // Verify the timezone conversion was successful
      if (!dt.isValid) {
        console.error('Invalid timezone conversion in AnalogClock:', timezone, dt.invalidExplanation);
        return { hourRotation, minuteRotation, secondRotation, highlightRotation };
      }
      
      const hours = dt.hour % 12;
      const minutes = dt.minute;
      const seconds = dt.second;
      const milliseconds = dt.millisecond;
      
      // Calculate rotations with additional precision for smoother movement
      // For SVG rotate transforms, 0 degrees is at 12 o'clock position, and rotation is clockwise
      hourRotation = (hours * 30) + (minutes * 0.5); // 30 degrees per hour, plus 0.5 degrees per minute
      minuteRotation = (minutes * 6) + (seconds * 0.1); // 6 degrees per minute, plus 0.1 degrees per second
      secondRotation = (seconds * 6) + (milliseconds * 0.006); // 6 degrees per second, plus adjustment for milliseconds
      
      // Calculate highlight rotation if a highlighted time is provided
      if (highlightedTime && highlightedTime instanceof Date && !isNaN(highlightedTime.getTime())) {
        // Convert highlighted time to the same timezone
        const highlightDt = DateTime.fromJSDate(highlightedTime).setZone(timezone);
        
        if (highlightDt.isValid) {
          const highlightHours = highlightDt.hour % 12;
          const highlightMinutes = highlightDt.minute;
          highlightRotation = (highlightHours * 30) + (highlightMinutes * 0.5);
        }
      }
    } catch (error) {
      console.error('Error in AnalogClock rotation calculations:', error);
    }
    
    return { hourRotation, minuteRotation, secondRotation, highlightRotation };
  }, [time, timezone, highlightedTime]);
  
  // Calculate hand endpoints - simplified now that we're using SVG transforms
  const hourHandLength = clockRadius * 0.5;
  const minuteHandLength = clockRadius * 0.7;
  const secondHandLength = clockRadius * 0.85;
  
  // Determine clock face colors based on theme
  const clockFaceColor = theme === 'dark' ? '#1F2937' : '#F9FAFB';
  const clockBorderColor = theme === 'dark' ? '#4B5563' : '#E5E7EB';
  const clockNumeralColor = theme === 'dark' ? '#D1D5DB' : '#374151';
  const hourHandColor = theme === 'dark' ? '#E5E7EB' : '#111827'; // Slightly less stark contrast
  const minuteHandColor = theme === 'dark' ? '#D1D5DB' : '#374151'; // More subtle minute hand
  const secondHandColor = theme === 'dark' ? '#EF4444' : '#DC2626';
  const markerOpacity = theme === 'dark' ? 0.75 : 0.6;
  const clockOuterGlowColor = theme === 'dark' ? '#3B82F6' : '#60A5FA';

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
          stroke={theme === 'dark' ? hourHandColor : clockNumeralColor}
          strokeWidth={isMainMarker ? strokeWidth * 0.8 : strokeWidth * 0.5}
          strokeOpacity={isMainMarker ? markerOpacity : markerOpacity * 0.7}
          strokeLinecap="round"
        />
      );
    });
  }, [center, size, strokeWidth, theme, hourHandColor, clockNumeralColor, markerOpacity]);

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
      
      // Adjust text positioning and sizing for different clock sizes
      const fontSize = Math.max(size * 0.11, 10); // Ensure minimum readable size
      const fontWeight = size < 150 ? '600' : '500'; // Bolder for smaller clocks
      
      return (
        <text
          key={i}
          x={x}
          y={y + fontSize * 0.3} // Adjust for vertical centering
          fill={clockNumeralColor}
          fontSize={fontSize}
          fontWeight={fontWeight}
          textAnchor="middle"
          dominantBaseline="middle"
          opacity={0.9} // Slightly higher opacity for better readability
          style={{
            userSelect: 'none', // Prevent text selection
          }}
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
          strokeOpacity={theme === 'dark' ? 0.4 : 0.3}
        />
      );
    }).filter(Boolean);
  }, [center, clockRadius, size, strokeWidth, theme]);

  // Hour hand as a simple line for a more elegant look
  const renderElegantHourHand = () => (
    <g transform={`rotate(${hourRotation}, ${center}, ${center})`} data-testid="hour-hand">
      <line
        x1={center}
        y1={center + size * 0.05}
        x2={center}
        y2={center - hourHandLength}
        stroke={hourHandColor}
        strokeWidth={strokeWidth * 0.75}
        strokeLinecap="round"
      />
    </g>
  );

  // Minute hand as a simple line for a more elegant look
  const renderElegantMinuteHand = () => (
    <g transform={`rotate(${minuteRotation}, ${center}, ${center})`} data-testid="minute-hand">
      <line
        x1={center}
        y1={center + size * 0.05}
        x2={center}
        y2={center - minuteHandLength}
        stroke={minuteHandColor}
        strokeWidth={strokeWidth * 0.5}
        strokeLinecap="round"
      />
    </g>
  );
  
  // Second hand remains as is but slightly thinner
  const renderElegantSecondHand = () => (
    <g transform={`rotate(${secondRotation}, ${center}, ${center})`} data-testid="second-hand">
      <line
        x1={center}
        y1={center + size * 0.07}
        x2={center}
        y2={center - secondHandLength}
        stroke={secondHandColor}
        strokeWidth={strokeWidth * 0.25}
        strokeLinecap="round"
      />
      {/* Keep the small circle at the end */}
      <circle
        cx={center}
        cy={center - secondHandLength + strokeWidth}
        r={strokeWidth * 0.5}
        fill={secondHandColor}
      />
    </g>
  );

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 drop-shadow-md"
      >
        {/* Filters and gradients */}
        <defs>
          <filter id={`inner-shadow-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feOffset dx="0" dy="0" />
            <feGaussianBlur stdDeviation="2" result="offset-blur" />
            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
            <feFlood floodColor="black" floodOpacity="0.2" result="color" />
            <feComposite operator="in" in="color" in2="inverse" result="shadow" />
            <feComposite operator="over" in="shadow" in2="SourceGraphic" />
          </filter>
          
          <filter id={`hand-shadow-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0.8" dy="0.8" stdDeviation="0.8" floodOpacity="0.3" />
          </filter>
          
          <linearGradient id={`glass-reflection-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.1" />
            <stop offset="20%" stopColor="#FFFFFF" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          
          <linearGradient id={`clock-face-gradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme === 'dark' ? '#2D3748' : '#FFFFFF'} />
            <stop offset="100%" stopColor={clockFaceColor} />
          </linearGradient>
          
          <radialGradient id={`inner-circle-gradient-${uniqueId}`} cx="50%" cy="50%" r="50%" fx="35%" fy="35%">
            <stop offset="0%" stopColor={theme === 'dark' ? '#4A5568' : '#F7FAFC'} />
            <stop offset="100%" stopColor={theme === 'dark' ? '#2D3748' : '#E2E8F0'} />
          </radialGradient>
          
          <pattern id={`subtle-texture-${uniqueId}`} patternUnits="userSpaceOnUse" width="100" height="100" patternTransform="scale(0.5)">
            <rect width="100%" height="100%" fill="none" />
            <path d="M0,0 L10,10 M10,0 L0,10" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.03" />
          </pattern>
        </defs>
        
        {/* Clock face */}
        <circle
          cx={center}
          cy={center}
          r={clockRadius}
          fill={`url(#clock-face-gradient-${uniqueId})`}
          stroke={clockBorderColor}
          strokeWidth={strokeWidth}
          filter={`url(#inner-shadow-${uniqueId})`}
        />
        
        {/* Clock face details */}
        <circle
          cx={center}
          cy={center}
          r={clockRadius - 1}
          fill={`url(#subtle-texture-${uniqueId})`}
          fillOpacity="0.4"
        />
        
        {/* Minute ticks */}
        {minuteTicks}
        
        {/* Hour markers */}
        {hourMarkers}
        
        {/* Clock numerals */}
        {clockNumerals}
        
        {/* Hour hand - as a path for better visibility */}
        {renderElegantHourHand()}
        
        {/* Minute hand - as a path for better visibility */}
        {renderElegantMinuteHand()}
        
        {/* Second hand */}
        {renderElegantSecondHand()}
        
        {/* Highlighted time indicator */}
        {highlightRotation !== null && (
          <line
            x1={center}
            y1={center}
            x2={center}
            y2={center - (clockRadius - strokeWidth * 6)}
            stroke="#F59E0B"
            strokeWidth={strokeWidth * 0.3}
            strokeLinecap="round"
            strokeDasharray="1,2"
            transform={`rotate(${highlightRotation}, ${center}, ${center})`}
          />
        )}
        
        {/* Clock center */}
        <circle
          cx={center}
          cy={center}
          r={strokeWidth * 1.2}
          fill={`url(#inner-circle-gradient-${uniqueId})`}
          stroke={theme === 'dark' ? '#4B5563' : '#9CA3AF'}
          strokeWidth={strokeWidth * 0.15}
          filter={`url(#hand-shadow-${uniqueId})`}
        />
        
        {/* Center dot cap */}
        <circle
          cx={center}
          cy={center}
          r={strokeWidth * 0.5}
          fill={secondHandColor}
        />
      </svg>
    </div>
  );
} 

// Export a memoized version of the component
export default memo(AnalogClock);