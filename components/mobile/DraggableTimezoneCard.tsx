'use client';

import React from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'; // Removed AnimatePresence as it's not used here
import { Trash2 } from 'lucide-react';
import { Timezone } from '@/store/timezoneStore';
import MobileTimezoneCard from './MobileTimezoneCard'; // The actual card content

interface DraggableTimezoneCardProps {
  timezone: Timezone;
  isLocal: boolean;
  onRemove: (id: string) => void;
  // Pass down all props needed by MobileTimezoneCard
  localTime: Date | null;
  highlightedTime: Date | null;
  timeSlots: Date[];
  handleTimeSelection: (time: Date | null) => void;
  roundToNearestIncrement: (date: Date, increment: number) => Date;
  isExpanded: boolean;
  onToggleExpand: (timezoneId: string) => void;
}

const DraggableTimezoneCard: React.FC<DraggableTimezoneCardProps> = ({
  timezone,
  isLocal,
  onRemove,
  ...mobileCardProps // Pass remaining props to MobileTimezoneCard
}) => {
  // Hooks are now correctly at the top level of this component
  const dragX = useMotionValue(0);
  // Map dragX (-100 to -20) to opacity (1 to 0) for the background
  const backgroundOpacity = useTransform(dragX, [-100, -20], [1, 0]); // Fade out quicker
  // Map dragX (-100 to -50) to scale (1 to 0.8) for the icon
  const iconScale = useTransform(dragX, [-100, -50], [1, 0.8], { clamp: true }); // Clamp ensures scale doesn't go below 0.8

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const threshold = -100; // Drag distance threshold to trigger remove
    if (!isLocal && info.offset.x < threshold) {
      // Call the actual remove function passed as a prop
      onRemove(timezone.id);
      // Note: The exit animation is handled by AnimatePresence in the parent (app/page.tsx)
    }
  };

  return (
    <motion.div
      key={timezone.id} // Key for AnimatePresence in parent
      layout // Animate layout changes
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -300, transition: { duration: 0.2 } }} // Slide out on removal
      className="relative" // Needed for absolute positioning
    >
      {/* Background Remove Button - Conditionally Rendered & Opacity Controlled */}
       {!isLocal && (
         <motion.div
           className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-600 text-white w-24 pointer-events-none z-0" // Increased width, removed rounded-r-lg
           style={{ opacity: backgroundOpacity }} // Control opacity via motion value
         >
           {/* Wrap icon in motion.div to apply scale */}
           <motion.div style={{ scale: iconScale }}>
             <Trash2 size={24} />
           </motion.div>
        </motion.div>
      )}

      {/* Draggable Card Wrapper */}
      <motion.div
        drag={!isLocal ? "x" : false} // Disable drag for local timezone
        dragConstraints={!isLocal ? { left: -100, right: 0 } : undefined}
        dragSnapToOrigin
        style={{ x: dragX }} // Link motion value to style
        onDragEnd={handleDragEnd}
        className="relative z-10 rounded-lg shadow-md" // Ensure card is above background
      >
        {/* Render the actual card content */}
        <MobileTimezoneCard
          timezone={timezone}
          {...mobileCardProps} // Spread the rest of the props
        />
      </motion.div>
    </motion.div>
  );
};

export default DraggableTimezoneCard;
