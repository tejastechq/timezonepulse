import React, { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MarsTimeExplanationProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * A speech bubble tooltip that explains Mars time and sols
 * Appears when a user adds a Mars timezone to inform them about
 * how Mars time works and relates to Earth time
 */
const MarsTimeExplanation = ({ isOpen, onClose }: MarsTimeExplanationProps) => {
  // Set up auto-dismiss after 30 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 30000); // 30 seconds
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="fixed z-50 top-20 right-8 w-80 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg shadow-lg border border-red-200 dark:border-red-800/40 text-sm"
          style={{ 
            filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
          }}
        >
          {/* Speech bubble pointer */}
          <div 
            className="absolute w-4 h-4 bg-red-50 dark:bg-red-900/20 border-t border-l border-red-200 dark:border-red-800/40 transform rotate-45"
            style={{ top: '-8px', right: '30px' }}
          />
          
          {/* Close button */}
          <button 
            onClick={onClose} 
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-red-200/50 dark:hover:bg-red-800/30 text-red-500 dark:text-red-300"
            aria-label="Close explanation"
          >
            <X size={16} />
          </button>
          
          {/* Title */}
          <h3 className="text-red-700 dark:text-red-300 font-medium mb-2 pr-6">About Mars Time</h3>
          
          {/* Content */}
          <div className="space-y-2 text-red-600/90 dark:text-red-400/90">
            <p>
              <strong>Mars Sol:</strong> A Martian day (sol) is 24 hours, 39 minutes, and 35 seconds long — about 2.75% longer than an Earth day.
            </p>
            <p>
              <strong>Mars Time Zones:</strong> Like Earth, different locations on Mars have different local times based on longitude. 15° of longitude equals 1 Mars hour difference.
            </p>
            <p>
              <strong>Sol Count:</strong> Mission teams count days on Mars as "sols" since landing. Perseverance landed on February 18, 2021 (Sol 0).
            </p>
            
            {/* Time increments explanation */}
            <div className="mt-3 p-2 bg-red-100/70 dark:bg-red-800/20 rounded border border-red-200/80 dark:border-red-700/30 flex items-start gap-2">
              <Info size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-700/90 dark:text-red-300/90">
                <p className="font-medium">About Time Increments</p>
                <p className="mt-1">The time slots show the same time because Mars days are longer than Earth days. In this April Fools feature, we've simulated Mars time but kept Earth's 30-minute increments.</p>
              </div>
            </div>
            
            <p className="text-xs mt-3 text-red-500/80 dark:text-red-400/80 italic">
              NASA mission teams actually work on "Mars time" during critical mission phases, shifting their Earth schedules by ~40 minutes each day!
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MarsTimeExplanation; 