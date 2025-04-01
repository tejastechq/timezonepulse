'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ChevronDown, ChevronUp, X, Info } from 'lucide-react'; // Added Info icon
import { useTimezoneStore } from '@/store/timezoneStore';

// Re-use the content structure from MarsTimeExplanation
// Removed onClose prop as the X button is removed
const ExplanationContent = () => (
  <div className="p-4 pt-0 text-sm"> {/* Added padding */}
    {/* Title - Adjusted styling */}
    {/* Removed pr-8 as the X button is gone */}
    <h3 className="text-lg font-medium text-red-700 dark:text-red-300 mb-3"> 
      About Mars Time
    </h3>

    {/* Content */}
    <div className="space-y-3 text-red-600/90 dark:text-red-400/90"> {/* Increased spacing */}
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
      <div className="mt-4 p-3 bg-red-100/70 dark:bg-red-800/20 rounded border border-red-200/80 dark:border-red-700/30 flex items-start gap-2"> {/* Increased margin-top and padding */}
        <Info size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-red-700/90 dark:text-red-300/90">
          <p className="font-medium">About Time Increments</p>
          <p className="mt-1">The time slots show the same time because Mars days are longer than Earth days. In this April Fools feature, we've simulated Mars time but kept Earth's 30-minute increments.</p>
        </div>
      </div>

      <p className="text-xs mt-4 text-red-500/80 dark:text-red-400/80 italic"> {/* Increased margin-top */}
        NASA mission teams actually work on "Mars time" during critical mission phases, shifting their Earth schedules by ~40 minutes each day!
      </p>

      {/* Call to action */}
      <p className="mt-4 font-medium">
        Want to see it in action? Add a Mars timezone like "Mars/Jezero" (Perseverance Rover) to compare its time with Earth!
      </p>
    </div>
  </div>
);


const MobileMarsExplanationCard: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false); // Start collapsed by default
  // Removed hideMarsExplanation and handleClose as the X button is gone
  // const { hideMarsExplanation } = useTimezoneStore(); 

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // Removed handleClose callback


  // Animation variants (similar to MobileTimezoneCard)
  const cardTapVariants: Variants = {
    tap: { scale: 0.98, transition: { duration: 0.1 } },
    initial: { scale: 1 }
  };

  const contentContainerVariants: Variants = {
    open: {
      opacity: 1,
      height: 'auto', // Animate height
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    closed: {
      opacity: 0,
      height: 0, // Animate height
      transition: { duration: 0.3, ease: "easeInOut" }
    }
  };

  return (
    <motion.div
      layout // Animate layout changes
      // Use specific styling for the explanation card
      className="bg-red-50/90 dark:bg-red-900/70 p-5 rounded-lg border border-red-200/50 dark:border-red-800/40 shadow-md cursor-pointer overflow-hidden backdrop-blur-sm relative" // Added relative positioning
      onClick={toggleExpand}
      whileTap={!isExpanded ? "tap" : ""}
      variants={cardTapVariants}
      initial="initial"
      animate="initial"
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Collapsed View Header */}
      <div className="flex justify-between items-center font-sans">
        <div className="flex items-center space-x-2">
          <Info size={20} className="text-red-600 dark:text-red-400" />
          <h2 className="text-lg font-medium text-red-700 dark:text-red-300">
            About Mars Time
          </h2>
        </div>
        {/* Expand/Collapse Chevron */}
        <motion.div
           onClick={(e) => {
             e.stopPropagation(); // Prevent card's main onClick
             toggleExpand();
           }}
           whileTap={{ scale: 0.9 }}
           className="p-2 text-red-500 dark:text-red-300"
        >
          {isExpanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
        </motion.div>
      </div>

      {/* Expanded View - Explanation Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="explanation-content"
            variants={contentContainerVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="overflow-hidden mt-3" // Add margin top for spacing
          >
            {/* Render the explanation content (no onClose needed) */}
            <ExplanationContent />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MobileMarsExplanationCard;
