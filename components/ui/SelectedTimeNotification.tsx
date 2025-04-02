'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DateTime } from 'luxon';
import { X, Clock } from 'lucide-react';
import { createPortal } from 'react-dom';

interface SelectedTimeNotificationProps {
  highlightedTime: Date | null;
  resolvedTheme: string | undefined;
  handleTimeSelection: (time: Date | null) => void;
  highlightAutoClear: boolean;
  timeRemaining: number;
  highlightDuration: number;
  resetInactivityTimer: () => void;
}

const SelectedTimeNotification: React.FC<SelectedTimeNotificationProps> = ({
  highlightedTime,
  resolvedTheme,
  handleTimeSelection,
  highlightAutoClear,
  timeRemaining,
  highlightDuration,
  resetInactivityTimer,
}) => {
  if (!highlightedTime) {
    return null;
  }

  // For client-side only code
  const [isMounted, setIsMounted] = React.useState(false);
  const [timeAgo, setTimeAgo] = React.useState('');
  
  React.useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Calculate time ago
  React.useEffect(() => {
    if (!highlightedTime) return;
    
    const updateTimeAgo = () => {
      const now = DateTime.now();
      const selected = DateTime.fromJSDate(highlightedTime);
      const diff = now.diff(selected, ['hours', 'minutes']);
      
      const hours = Math.floor(diff.hours);
      const minutes = Math.floor(diff.minutes % 60);
      
      let timeAgoText = '';
      if (hours > 0) {
        timeAgoText += `${hours} hour${hours !== 1 ? 's' : ''} `;
      }
      if (minutes > 0 || hours === 0) {
        timeAgoText += `${minutes} minute${minutes !== 1 ? 's' : ''}`;
      }
      
      setTimeAgo(timeAgoText + ' ago');
    };
    
    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [highlightedTime]);

  // Apply notification styling here (Step 3 & 4)
  // Using md: prefix for desktop-only behavior
  const notificationClasses = `fixed bottom-4 right-4 z-[100] w-auto max-w-xs hidden md:block`;

  const notificationContent = (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`${notificationClasses} p-3 rounded-lg shadow-lg glass-card backdrop-blur-fix ${resolvedTheme === 'dark' ? 'glass-card-dark' : 'glass-card-light'}`}
      style={{ 
        isolation: 'isolate', 
        backgroundColor: resolvedTheme === 'dark' ? 'rgba(15, 15, 25, 0.2)' : 'rgba(255, 255, 255, 0.15)',
        position: 'fixed',
        bottom: '1rem',
        right: '1rem'
      }}
    >
      <div className="flex items-center justify-between mb-2 relative z-[2]">
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 bg-primary-500 rounded-full mr-2"></span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {DateTime.fromJSDate(highlightedTime).toFormat('h:mm a')}
          </span>
        </div>
        <button
          onClick={() => handleTimeSelection(null)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Clear time selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Time ago indicator */}
      <motion.div 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 p-1.5 px-3 rounded-md text-sm font-medium mb-2 flex items-center mx-auto shadow-sm"
      >
        <Clock className="w-4 h-4 mr-2" />
        {timeAgo}
      </motion.div>

      {highlightAutoClear && (
        <div className="mt-2 relative z-[2]">
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
            <span>Auto-clear in {timeRemaining}s</span>
            <button
              onClick={resetInactivityTimer}
              className="text-primary-500 hover:text-primary-600 focus:outline-none"
              data-reset-timer="true"
            >
              Reset
            </button>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-primary-500 h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${(timeRemaining / highlightDuration) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
    </motion.div>
  );

  // Return the portal only on the client
  return isMounted ? createPortal(notificationContent, document.body) : null;
};

export default SelectedTimeNotification;
