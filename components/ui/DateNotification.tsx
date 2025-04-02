'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, CalendarDays } from 'lucide-react';
import { createPortal } from 'react-dom';

interface DateNotificationProps {
  selectedDateInfo: string | null;
  resolvedTheme: string | undefined;
}

const DateNotification: React.FC<DateNotificationProps> = ({
  selectedDateInfo,
  resolvedTheme,
}) => {
  // Hooks must be called at the top level
  const [isMounted, setIsMounted] = React.useState(false);
  
  React.useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Early return if no date info
  if (!selectedDateInfo) {
    return null;
  }

  const notificationClasses = `fixed bottom-4 right-4 z-[90] w-72 hidden md:block`;

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
        right: '1rem',
        width: '18rem'
      }}
    >
      <div className="flex items-center justify-between relative z-[2]">
        <div className="flex items-center">
          <CalendarDays className="text-primary-500 h-5 w-5 mr-2" />
          <span className="font-medium text-primary-500">{selectedDateInfo}</span>
        </div>
      </div>
    </motion.div>
  );

  // Return the portal only on the client
  return isMounted ? createPortal(notificationContent, document.body) : null;
};

export default DateNotification;
