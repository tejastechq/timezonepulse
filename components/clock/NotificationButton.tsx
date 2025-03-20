'use client';

import React, { useState, useEffect } from 'react';
import { useIntegrations } from '@/app/contexts/IntegrationsContext';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * NotificationButton component for displaying and managing notifications
 */
// million-ignore
export default function NotificationButton() {
  const { activeNotifications, dismissNotification } = useIntegrations();
  const [isOpen, setIsOpen] = useState(false);
  
  // Close notifications panel when there are no notifications
  useEffect(() => {
    if (activeNotifications.length === 0) {
      setIsOpen(false);
    }
  }, [activeNotifications]);
  
  // Toggle notifications panel
  const toggleNotifications = () => {
    setIsOpen(!isOpen);
  };
  
  // Handle dismissing a notification
  const handleDismiss = (id: string) => {
    dismissNotification(id);
  };
  
  return (
    <div className="relative">
      <button
        onClick={toggleNotifications}
        className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
        
        {/* Notification badge */}
        {activeNotifications.length > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {activeNotifications.length}
          </span>
        )}
      </button>
      
      {/* Notifications panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10"
          >
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium">Notifications</h3>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {activeNotifications.length > 0 ? (
                <ul>
                  {activeNotifications.map((notification) => (
                    <motion.li
                      key={notification.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3 border-b border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex justify-between items-start">
                        <p className="text-sm">{notification.message}</p>
                        <button
                          onClick={() => handleDismiss(notification.id)}
                          className="ml-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                          aria-label="Dismiss notification"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                  No notifications
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 