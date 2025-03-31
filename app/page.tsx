'use client'; // Convert to Client Component

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Metadata } from 'next'; // Keep for potential future use, though metadata is usually static
import { JsonLd } from '@/components/seo/JsonLd';
import HeadingMCP from './HeadingMCP'; // Keep for desktop view

// --- Mobile View Imports ---
import { DateTime } from 'luxon';
import { useTimezoneStore, Timezone } from '@/store/timezoneStore'; // Remove direct import of removeTimezone
import { getLocalTimezone } from '@/lib/utils/timezone';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'; // Import the hook
// MobileTimezoneCard is now used within DraggableTimezoneCard
import TimezoneSelector from '@/components/clock/TimezoneSelector';
import { MobileMenu } from '@/components/MobileMenu'; // Import the MobileMenu component
import { motion, AnimatePresence } from 'framer-motion'; // Remove unused hooks PanInfo, useMotionValue, useTransform
import DraggableTimezoneCard from '@/components/mobile/DraggableTimezoneCard'; // Import the new component
import { Plus } from 'lucide-react'; // Remove unused Trash2 icon import

// Define mobile breakpoint (adjust as needed, e.g., Tailwind's 'md' breakpoint)
const MOBILE_BREAKPOINT = '(max-width: 768px)';

// Load WorldClockWrapper dynamically (for desktop view)
const WorldClockWrapper = dynamic(
  () => import('@/components/clock/WorldClockWrapper'),
  {
    ssr: true, // Keep SSR for desktop initial load if possible
    loading: () => {
      // Need to check for landscape mode here since we're outside the component
      const isMobileLandscapeCheck = typeof window !== 'undefined' ? 
        window.matchMedia('(max-width: 932px) and (max-height: 430px)').matches : false;
      
      return (
        <div className="min-h-screen p-8">
          {!isMobileLandscapeCheck && <HeadingMCP />}
          <div className="flex items-center justify-center pt-8">
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      );
    }
  }
);

// Note: Static metadata export might not work as expected in Client Components.
// Consider moving metadata to layout.tsx or using dynamic metadata generation if needed.
// export const metadata: Metadata = { ... };

export default function Home() {
  // --- State and Logic (Moved from app/mobile/page.tsx) ---
  const [localTime, setLocalTime] = useState<Date | null>(null); // Initialize null to avoid hydration mismatch
  const [highlightedTime, setHighlightedTime] = useState<Date | null>(null);
  const [expandedTimezoneId, setExpandedTimezoneId] = useState<string | null>(null); // State for accordion
  const [isMounted, setIsMounted] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const { timezones, addTimezone, removeTimezone } = useTimezoneStore(); // Add removeTimezone from store
  const userLocalTimezone = useMemo(() => getLocalTimezone(), []);

  // Media Query Hook
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);
  // Add media query for horizontal mobile view
  const isMobileLandscape = useMediaQuery('(max-width: 932px) and (max-height: 430px)');

  useEffect(() => {
    setIsMounted(true);
    setLocalTime(new Date()); // Set initial time on mount
    // Update local time every second
    const interval = setInterval(() => {
      setLocalTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Manage inert attribute for main content when modal is open on mobile ---
  useEffect(() => {
    const mainContent = document.getElementById('main-content');
    // Only apply inert if we are on mobile and the main content element exists
    if (isMobile && mainContent) {
      if (isSelectorOpen) {
        mainContent.inert = true;
      } else {
        mainContent.inert = false;
      }
      // Cleanup function to ensure inert is removed if component unmounts while modal is open
      return () => {
        // Check if mainContent still exists in the DOM before trying to modify it
        if (document.body.contains(mainContent)) {
          mainContent.inert = false;
        }
      };
    }
  }, [isSelectorOpen, isMobile]); // Rerun effect when modal state or mobile status changes
  // --- End of inert management ---

  const timeSlots = useMemo(() => {
    const slots: Date[] = [];
    const now = localTime || new Date(); // Use current time or fallback
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    for (let i = 0; i < 48; i++) {
      const slotTime = new Date(startOfDay);
      slotTime.setMinutes(i * 30);
      slots.push(slotTime);
    }
    return slots;
  }, [localTime]);

  const handleTimeSelection = useCallback((time: Date | null) => {
    setHighlightedTime(time);
    setExpandedTimezoneId(null); // Collapse accordion on selection
  }, []);

  // Handler for toggling card expansion
  const handleToggleExpand = useCallback((timezoneId: string) => {
    setExpandedTimezoneId(prevId => (prevId === timezoneId ? null : timezoneId));
  }, []);

  const roundToNearestIncrement = useCallback((date: Date, increment: number): Date => {
    if (!date) return new Date(); // Should not happen with isMounted check, but safety first
    const minutes = date.getMinutes();
    const remainder = minutes % increment;
    let roundedMinutes;
    if (remainder < increment / 2) {
      roundedMinutes = minutes - remainder;
    } else {
      roundedMinutes = minutes + (increment - remainder);
    }
    const rounded = new Date(date);
    if (roundedMinutes >= 60) {
        rounded.setHours(rounded.getHours() + 1);
        rounded.setMinutes(roundedMinutes - 60);
    } else {
        rounded.setMinutes(roundedMinutes);
    }
    rounded.setSeconds(0);
    rounded.setMilliseconds(0);
    return rounded;
  }, []);

  const handleAddTimezone = useCallback((timezone: Timezone) => {
    addTimezone(timezone);
    setIsSelectorOpen(false);
  }, [addTimezone]);
  // --- End of Moved Logic ---

  // JSON-LD for SEO (remains the same)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'TimezonePulse',
    applicationCategory: 'UtilityApplication',
    description: 'Effortlessly track, compare, and convert time across multiple timezones with TimezonePulse. Stay synchronized with the world, whether for work or travel.',
    operatingSystem: 'Any',
    url: 'https://www.timezonepulse.com',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', ratingCount: '1256', bestRating: '5', worstRating: '1' },
  };

  // Render loading state or null until mounted to prevent hydration mismatch
  if (!isMounted) {
     // Render a basic loading state consistent with dynamic import loading
     return (
       <div className="min-h-screen p-8">
         {!isMobileLandscape && <HeadingMCP />}
         <div className="flex items-center justify-center pt-8">
           <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
         </div>
       </div>
     );
  }

  // --- Conditional Rendering ---
  if (isMobile) {
    // Render Mobile View
    // Removed bg-gradient-to-b from-navy-start to-black-end to allow layout background to show
    return (
      <div className="flex flex-col min-h-screen text-white p-4 font-sans" id="main-content">
         <JsonLd data={jsonLd} /> {/* Keep SEO */}
         {/* Mobile Header */}
         <header className="flex items-center justify-between mb-4">
           <MobileMenu /> {/* Replace the placeholder button with the MobileMenu component */}
           <h1 className="text-xl font-bold uppercase">TimeZonePulse</h1>
           <button
             onClick={() => setIsSelectorOpen(true)}
             className="p-2 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
             aria-label="Add Timezone"
           >
             <Plus size={20} />
           </button>
     </header>

     {/* Mobile Timezone Cards */}
     <main className="flex-grow space-y-4 overflow-hidden"> {/* Add overflow-hidden */}
       <AnimatePresence initial={false}> {/* Wrap list for exit animations */}
         {timezones.map((tz: Timezone) => {
           const isLocal = tz.id === userLocalTimezone;
           // Removed hooks and handleDragEnd from here

           return (
             <DraggableTimezoneCard
               key={tz.id} // Key remains for AnimatePresence
               timezone={tz}
               isLocal={isLocal}
               onRemove={removeTimezone} // Pass the remove function from the store
               // Pass down all props needed by MobileTimezoneCard
               localTime={localTime}
               highlightedTime={highlightedTime}
               timeSlots={timeSlots}
               handleTimeSelection={handleTimeSelection}
               roundToNearestIncrement={roundToNearestIncrement}
               isExpanded={expandedTimezoneId === tz.id}
               onToggleExpand={handleToggleExpand}
             />
           );
         })}
       </AnimatePresence>
       {timezones.length === 0 && (
         <div className="text-center text-gray-400 mt-10">
           <p>No timezones added yet.</p>
               <button
                 onClick={() => setIsSelectorOpen(true)}
                 className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
               >
                 <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                 Add Timezone
               </button>
             </div>
           )}
         </main>

         {/* Timezone Selection Modal */}
         <AnimatePresence>
           {isSelectorOpen && (
             <TimezoneSelector
               key="mobile-timezone-selector"
               isOpen={true}
               onClose={() => setIsSelectorOpen(false)}
               onSelect={handleAddTimezone}
               excludeTimezones={[userLocalTimezone, ...timezones.map(tz => tz.id)]}
             />
           )}
         </AnimatePresence>
       </div>
    );
  } else {
    // Render Desktop View
    return (
      <main className="min-h-screen">
        <JsonLd data={jsonLd} />
        {!isMobileLandscape && <HeadingMCP />}
        <WorldClockWrapper />
      </main>
    );
  }
}
