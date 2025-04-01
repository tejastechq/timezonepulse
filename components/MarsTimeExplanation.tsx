import React, { useState, useEffect, useRef } from 'react';
import { X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface MarsTimeExplanationProps {
  isOpen: boolean;
  onClose: () => void;
  position?: 'left' | 'right';
  targetTimezoneId?: string | null; // ID of the Mars timezone to position next to
}

/**
 * A speech bubble tooltip that explains Mars time and sols
 * Appears when a user adds a Mars timezone to inform them about
 * how Mars time works and relates to Earth time
 */
const MarsTimeExplanation = ({ 
  isOpen, 
  onClose, 
  position = 'right',
  targetTimezoneId = null
}: MarsTimeExplanationProps) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const [tooltipPlacement, setTooltipPlacement] = useState<'side' | 'attached'>('side');
  
  // Helper function to ensure all Mars timezone cards have the data-timezone-id attribute
  // This is needed because some components might not add this attribute
  useEffect(() => {
    // Add data-timezone-id attributes to all timezone cards that might not have them
    const addTimezoneIdsToCards = () => {
      const timezoneHeaders = document.querySelectorAll('h3');
      
      timezoneHeaders.forEach(header => {
         // Look for Mars timezone headers - check for emoji, Mars text, or Mars image
         const headerText = header.textContent; // Check for null first
         if (
           headerText && (
             headerText.includes('🔴') || 
             headerText.includes('Mars') ||
             header.querySelector('img[src="/mars.png"]')
           )
         ) {
          // Find the closest parent card
          const card = header.closest('[class*="glass-card"]');
           
           if (card && headerText) { // Ensure headerText is not null here too
             // Extract the Mars timezone id from the text content
             const timezoneName = headerText
               .replace('🔴', '')
               .replace('🤖', '')
               .trim();
             const cardText = card.textContent || '';
            
            // Try to find which Mars timezone this is
            let timezoneId = '';
            if (cardText.includes('Jezero')) {
              timezoneId = 'Mars/Jezero';
            } else if (cardText.includes('Gale')) {
              timezoneId = 'Mars/Gale';
            } else if (cardText.includes('InSight')) {
              timezoneId = 'Mars/InSight';
            } else {
              timezoneId = 'Mars/Timezone';
            }
            
            // Add the data attribute if not already present
            if (!card.hasAttribute('data-timezone-id')) {
              card.setAttribute('data-timezone-id', timezoneId);
            }
          }
        }
      });
    };
    
    // Run the function when the component mounts and whenever isOpen changes
    if (isOpen) {
      addTimezoneIdsToCards();
    }
  }, [isOpen]);
  
  // Find the target timezone card
  useEffect(() => {
    if (!isOpen || !targetTimezoneId) return;
    
    // Try to find the target timezone card in the DOM
    const targetCard = document.querySelector(`[data-timezone-id="${targetTimezoneId}"]`);
    setTargetElement(targetCard);
    
    // Determine placement strategy based on card position
    if (targetCard) {
      const cardRect = targetCard.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const isCardInMiddle = cardRect.left > 300 && cardRect.right < (viewportWidth - 300);
      setTooltipPlacement(isCardInMiddle ? 'side' : 'attached');
    } else {
      setTooltipPlacement('side');
    }
  }, [isOpen, targetTimezoneId]);

  // If we're rendering to the side of the page (not attached to a card)
  if (tooltipPlacement === 'side') {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={`fixed z-50 top-20 w-80 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 text-base ${position === 'right' ? 'right-8' : 'left-8'}`} // Changed colors, text-base
            style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
          >
            {/* Speech bubble pointer - pointing up */}
            <div 
              className="absolute w-4 h-4 bg-white dark:bg-gray-800 border-t border-l border-gray-200 dark:border-gray-700 transform rotate-45" // Changed colors
              style={{ top: '-8px', [position === 'right' ? 'right' : 'left']: '30px' }}
            />
            
            {/* Content */}
            <TooltipContent onClose={onClose} />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // If we're attaching to a timezone card, use a portal to render inside it
  if (!targetElement || !isOpen) {
    return null;
  }

  // Create relative-positioned wrapper inside the target card
  return createPortal(
    <div className="relative">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="absolute z-50 w-80 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 text-base" // Changed colors, text-base
            style={{ 
              top: '0',
              [position === 'right' ? 'left' : 'right']: 'calc(100% + 20px)',
              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
            }}
          >
            {/* Speech bubble pointer - pointing sideways */}
            <div 
              className="absolute w-4 h-4 bg-white dark:bg-gray-800 border-t border-l border-gray-200 dark:border-gray-700" // Changed colors
              style={{ 
                top: '30px',
                [position === 'right' ? 'left' : 'right']: '-8px',
                transform: position === 'right' ? 'rotate(-45deg)' : 'rotate(135deg)'
              }}
            />
            
            {/* Content */}
            <TooltipContent onClose={onClose} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    targetElement
  );
};

// Separate component for the tooltip content to avoid duplication
const TooltipContent = ({ onClose }: { onClose: () => void }) => (
  <>
    {/* Close button (using div to avoid nesting issues) */}
    <div 
      onClick={onClose} 
      className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-pointer" // Changed colors
      aria-label="Close explanation"
      role="button" // Add role for accessibility
      tabIndex={0} // Make it focusable
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClose(); }} // Keyboard accessibility
    >
      <X size={16} />
    </div>
    
    {/* Title */}
    <h3 className="text-gray-800 dark:text-gray-100 font-semibold mb-3 pr-6">About Mars Time</h3> {/* Changed colors, font-semibold, mb-3 */}
    
    {/* Content */}
    <div className="space-y-3 text-gray-700 dark:text-gray-300"> {/* Changed colors, space-y-3 */}
      <p>
        <strong>Mars Sol:</strong> A Martian day (sol) is 24 hours, 39 minutes, and 35 seconds long — about 2.75% longer than an Earth day.
      </p>
      <p>
        <strong>Mars Time Zones:</strong> Like Earth, different locations on Mars have different local times based on longitude. 15° of longitude equals 1 Mars hour difference.
      </p>
      <p>
        <strong>Sol Count:</strong> Mission teams count days on Mars as "sols" since landing. Perseverance landed on February 18, 2021 (Sol 0).
      </p>
      
      {/* Removed the explanation about time slot matching as the underlying issue is fixed. */}
      
      <p className="text-sm mt-3 text-gray-600 dark:text-gray-400"> {/* Changed colors, text-sm, removed italic */}
        NASA mission teams work on "Mars time" during critical phases, shifting their Earth schedules by ~40 minutes daily!
      </p>
    </div>
  </>
);

export default MarsTimeExplanation;
