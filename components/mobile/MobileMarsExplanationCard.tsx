'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ChevronDown, ChevronUp, X, Info } from 'lucide-react'; // Added Info icon
import { useTimezoneStore } from '@/store/timezoneStore';

// Re-use the content structure from MarsTimeExplanation
// Removed onClose prop as the X button is removed
const ExplanationContent = () => (
  <div className="p-4 pt-0 text-sm"> {/* Reverted to text-sm for mobile content */}
    {/* Title - Adjusted styling */}
    {/* Removed pr-8 as the X button is gone */}
    {/* Removed title from expanded view to save space */}
    {/* <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">About Mars Time</h3> */}

    {/* Content */}
    <div className="space-y-2 text-gray-700 dark:text-gray-300"> {/* Reduced spacing */}
      <p>
        <strong>Mars Sol:</strong> A Martian day (sol) is ~2.75% longer than an Earth day (24h 39m 35s).
      </p>
      <p>
        <strong>Mars Time Zones:</strong> Like Earth, Mars uses time zones based on longitude (15° ≈ 1 Mars hour).
      </p>
      {/* Removed Sol Count and NASA fact for brevity */}
      
      {/* Time increments explanation */}
      <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-700/40 flex items-start gap-2"> {/* Reduced margin/padding */}
        <Info size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" /> {/* Reduced size */}
        <div className="text-xs text-blue-800 dark:text-blue-200"> {/* Kept text-xs for this box */}
          <p className="font-medium">Why Time Slots Match</p>
          <p className="mt-1">Mars days are longer. This clock simulates Mars time using Earth's 30-min increments, so slots may look the same.</p> {/* Further simplified copy */}
        </div>
      </div>
      {/* Removed Call to action */}
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
      className="bg-white/90 dark:bg-gray-800/80 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-md cursor-pointer overflow-hidden backdrop-blur-sm relative" // Changed colors
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
          <Info size={20} className="text-gray-600 dark:text-gray-400" /> {/* Changed color */}
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100"> {/* Changed colors, font-semibold */}
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
           className="p-2 text-gray-500 dark:text-gray-400" // Changed colors
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
