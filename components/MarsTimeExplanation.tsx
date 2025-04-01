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
        if (
          header.textContent?.includes('🔴') || 
          header.textContent?.includes('Mars') ||
          header.querySelector('img[src="/mars.png"]')
        ) {
          // Find the closest parent card
          const card = header.closest('[class*="glass-card"]');
          
          if (card) {
            // Extract the Mars timezone id from the text content
            const timezoneName = header.textContent
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
            className={`fixed z-50 top-20 w-80 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg shadow-lg border border-red-200 dark:border-red-800/40 text-sm ${position === 'right' ? 'right-8' : 'left-8'}`}
            style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
          >
            {/* Speech bubble pointer - pointing up */}
            <div 
              className="absolute w-4 h-4 bg-red-50 dark:bg-red-900/20 border-t border-l border-red-200 dark:border-red-800/40 transform rotate-45"
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
            className="absolute z-50 w-80 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg shadow-lg border border-red-200 dark:border-red-800/40 text-sm"
            style={{ 
              top: '0',
              [position === 'right' ? 'left' : 'right']: 'calc(100% + 20px)',
              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
            }}
          >
            {/* Speech bubble pointer - pointing sideways */}
            <div 
              className="absolute w-4 h-4 bg-red-50 dark:bg-red-900/20 border-t border-l border-red-200 dark:border-red-800/40"
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
  </>
);

export default MarsTimeExplanation; 