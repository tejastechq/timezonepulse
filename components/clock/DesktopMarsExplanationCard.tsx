'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

// Re-use the content structure from MobileMarsExplanationCard
// No need for onClose here as it's persistent and just expands/collapses
// Re-use the content structure from MobileMarsExplanationCard
// No need for onClose here as it's persistent and just expands/collapses
const ExplanationContent = () => (
  // Apply red text theme from mobile
  <div className="p-4 pt-2 text-sm text-red-600/90 dark:text-red-400/90"> {/* Adjusted padding */}
    {/* Content */}
    <div className="space-y-3"> {/* Increased spacing */}
      <p>
        {/* Use strong tag for consistency */}
        <strong>Mars Sol:</strong> A Martian day (sol) is 24 hours, 39 minutes, and 35 seconds long — about 2.75% longer than an Earth day.
      </p>
      <p>
        <strong>Mars Time Zones:</strong> Like Earth, different locations on Mars have different local times based on longitude. 15° of longitude equals 1 Mars hour difference.
      </p>
      <p>
        <strong>Sol Count:</strong> Mission teams count days on Mars as "sols" since landing. Perseverance landed on February 18, 2021 (Sol 0).
      </p>

      {/* Time increments explanation - Apply red theme */}
      <div className="mt-4 p-3 bg-red-100/70 dark:bg-red-800/20 rounded border border-red-200/80 dark:border-red-700/30 flex items-start gap-2"> 
        <Info size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        {/* Apply red text theme */}
        <div className="text-xs text-red-700/90 dark:text-red-300/90"> 
          <p className="font-medium">About Time Increments</p>
          <p className="mt-1">The time slots show the same time because Mars days are longer than Earth days. In this April Fools feature, we've simulated Mars time but kept Earth's 30-minute increments.</p>
        </div>
      </div>

      {/* Apply red text theme */}
      <p className="text-xs mt-4 text-red-500/80 dark:text-red-400/80 italic"> 
        NASA mission teams actually work on "Mars time" during critical mission phases, shifting their Earth schedules by ~40 minutes each day!
      </p>
      
      {/* Call to action */}
      <p className="mt-4 font-medium">
        Want to see it in action? Add a Mars timezone like "Mars/Jezero" (Perseverance Rover) to compare its time with Earth!
      </p>
    </div>
  </div>
);


const DesktopMarsExplanationCard: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false); // Start collapsed by default

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // Animation variants
  const contentContainerVariants: Variants = {
    open: {
      opacity: 1,
      height: 'auto',
      marginTop: '8px', // Add margin when open
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    closed: {
      opacity: 0,
      height: 0,
      marginTop: '0px', // No margin when closed
      transition: { duration: 0.3, ease: "easeInOut" }
    }
  };

  return (
    <motion.div
      layout // Animate layout changes
      // Apply red theme styling from mobile card
      className="bg-red-50/90 dark:bg-red-900/70 mb-4 p-4 rounded-lg border border-red-200/50 dark:border-red-800/40 shadow-md cursor-pointer overflow-hidden backdrop-blur-sm"
      onClick={toggleExpand}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Collapsed View Header - Apply red theme */}
      <div className="flex justify-between items-center font-sans">
        <div className="flex items-center space-x-2">
          <Info size={18} className="text-red-600 dark:text-red-400" />
          <h2 className="text-base font-medium text-red-700 dark:text-red-300"> {/* Adjusted size & color */}
            About Mars Time
          </h2>
        </div>
        {/* Expand/Collapse Chevron - Apply red theme */}
        <motion.div
           className="p-1 text-red-500 dark:text-red-300" // Adjusted padding & color
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </motion.div>
      </div>

      {/* Expanded View - Explanation Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="explanation-content-desktop"
            variants={contentContainerVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="overflow-hidden" // Removed mt-3, handled by variant
          >
            <ExplanationContent />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DesktopMarsExplanationCard;
