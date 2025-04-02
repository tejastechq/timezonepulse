'use client';

import React from 'react';
// Removed drag-related imports: useMotionValue, useTransform, PanInfo, useDragControls
import { motion } from 'framer-motion';
// Removed Trash2 icon as swipe-to-remove is disabled
import { Timezone } from '@/store/timezoneStore';
import MobileTimezoneCard from './MobileTimezoneCard'; // The actual card content

interface DraggableTimezoneCardProps {
  timezone: Timezone;
  isLocal: boolean;
  onRemove: (id: string) => void;
  isExpanded: boolean; // Ensure isExpanded is here if needed by Draggable logic, otherwise remove if only needed by MobileTimezoneCard
  onToggleExpand: (timezoneId: string) => void; // Ensure onToggleExpand is here if needed
  // Pass down all props needed by MobileTimezoneCard
  localTime: Date | null;
  highlightedTime: Date | null;
  timeSlots: Date[];
  handleTimeSelection: (time: Date | null) => void;
  roundToNearestIncrement: (date: Date, increment: number) => Date;
  // Removed isExpanded and onToggleExpand from here as they are passed via mobileCardProps if only needed there
}

const DraggableTimezoneCard: React.FC<DraggableTimezoneCardProps> = ({
  timezone,
  isLocal,
  onRemove,
  // Destructure specific props needed here if any, otherwise keep using spread
  ...mobileCardProps // Pass remaining props to MobileTimezoneCard
}) => {
  // Removed drag-related hooks and logic

  return (
    <motion.div
      key={timezone.id} // Key for AnimatePresence in parent
      layout // Animate layout changes
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -300, transition: { duration: 0.2 } }} // Slide out on removal
      className="relative" // Keep relative for potential future absolute elements if needed
    >
      {/* Removed Background Remove Button */}

      {/* Card Wrapper - Removed drag props */}
      <motion.div
        // Removed drag-related props: drag, dragConstraints, dragListener, dragControls, style, onDragEnd
        className="relative z-10 rounded-lg shadow-md" // Keep basic styling
      >
        {/* Render the actual card content, removed dragControls prop */}
        <MobileTimezoneCard
          timezone={timezone}
          // Removed dragControls prop
          isLocal={isLocal} // Pass isLocal down if needed by MobileTimezoneCard
          {...mobileCardProps} // Spread the rest of the props
        />
      </motion.div>
    </motion.div>
  );
};

export default DraggableTimezoneCard;
