'use client';

import { useMemo } from 'react';
import { DateTime } from 'luxon';
import { motion } from 'framer-motion';

interface AnalogClockProps {
  time: Date;
  size?: number;
  highlightedTime: Date | null;
}

/**
 * Component for displaying an analog clock
 */
export default function AnalogClock({ time, size = 200, highlightedTime }: AnalogClockProps) {
  // Calculate the rotation angles for the clock hands
  const { hourRotation, minuteRotation, secondRotation, highlightRotation } = useMemo(() => {
    const dt = DateTime.fromJSDate(time);
    const hours = dt.hour % 12;
    const minutes = dt.minute;
    const seconds = dt.second;
    
    // Calculate rotations
    const hourRotation = (hours * 30) + (minutes * 0.5); // 30 degrees per hour, plus 0.5 degrees per minute
    const minuteRotation = minutes * 6; // 6 degrees per minute
    const secondRotation = seconds * 6; // 6 degrees per second
    
    // Calculate highlight rotation if a highlighted time is provided
    let highlightRotation = null;
    if (highlightedTime) {
      const highlightDt = DateTime.fromJSDate(highlightedTime);
      const highlightHours = highlightDt.hour % 12;
      const highlightMinutes = highlightDt.minute;
      highlightRotation = (highlightHours * 30) + (highlightMinutes * 0.5);
    }
    
    return { hourRotation, minuteRotation, secondRotation, highlightRotation };
  }, [time, highlightedTime]);
  
  // Calculate dimensions
  const center = size / 2;
  const strokeWidth = size / 40;
  
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
        {[...Array(12)].map((_, i) => {
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
        })}
        
        {/* Highlighted time indicator */}
        {highlightRotation !== null && (
          <motion.line
            x1={center}
            y1={center}
            x2={center}
            y2={strokeWidth * 2}
            stroke="#F59E0B"
            strokeWidth={strokeWidth / 2}
            strokeLinecap="round"
            style={{
              transformOrigin: `${center}px ${center}px`,
              rotate: `${highlightRotation}deg`,
            }}
          />
        )}
        
        {/* Hour hand */}
        <motion.line
          x1={center}
          y1={center}
          x2={center}
          y2={center - size * 0.25}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{
            transformOrigin: `${center}px ${center}px`,
            rotate: `${hourRotation}deg`,
          }}
        />
        
        {/* Minute hand */}
        <motion.line
          x1={center}
          y1={center}
          x2={center}
          y2={center - size * 0.35}
          stroke="currentColor"
          strokeWidth={strokeWidth * 0.7}
          strokeLinecap="round"
          style={{
            transformOrigin: `${center}px ${center}px`,
            rotate: `${minuteRotation}deg`,
          }}
        />
        
        {/* Second hand */}
        <motion.line
          x1={center}
          y1={center}
          x2={center}
          y2={center - size * 0.4}
          stroke="#EF4444"
          strokeWidth={strokeWidth * 0.3}
          strokeLinecap="round"
          style={{
            transformOrigin: `${center}px ${center}px`,
            rotate: `${secondRotation}deg`,
          }}
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