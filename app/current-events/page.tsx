'use client';

import React, { useEffect } from 'react';
import CurrentEventsCard from '@/components/views/CurrentEventsCard';
import { useTimezoneStore } from '@/store/timezoneStore';
import TimezoneSelector from '@/components/clock/TimezoneSelector';
import { Plus } from 'lucide-react';

export default function CurrentEventsPage() {
  const {
    timezones,
    localTimezone,
    addTimezone,
    removeTimezone,
    isTimezoneSelectorOpen,
    openTimezoneSelector,
    closeTimezoneSelector,
    hydrate
  } = useTimezoneStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <main className="min-h-screen mobile-desktop-container">
      <div className="clock-container w-full max-w-screen-xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Current Events by Timezone</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {timezones.map((tz) => (
            <CurrentEventsCard
              key={tz.id}
              timezone={tz}
              userLocalTimezone={localTimezone}
              onRemove={removeTimezone}
            />
          ))}
          {/* Add Timezone ghost card */}
          <div className="relative group">
            <button
              onClick={openTimezoneSelector}
              className="flex flex-col justify-center items-center border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-lg hover:border-primary-500 hover:dark:border-primary-400 hover:bg-primary-50/20 dark:hover:bg-primary-900/20 transition-colors cursor-pointer"
              style={{ minHeight: '350px', minWidth: '280px', height: '100%', width: '100%' }}
              aria-label="Add a new timezone or region"
            >
              <Plus className="w-8 h-8 mb-3 opacity-70" />
              <span className="font-medium text-lg">Add Timezone</span>
            </button>
          </div>
        </div>
        {/* TimezoneSelector Modal */}
        <TimezoneSelector
          isOpen={isTimezoneSelectorOpen}
          onClose={closeTimezoneSelector}
          onSelect={addTimezone}
          excludeTimezones={[localTimezone, ...timezones.map(tz => tz.id)]}
        />
      </div>
    </main>
  );
}
