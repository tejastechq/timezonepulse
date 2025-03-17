'use client';

import { useState, useEffect } from 'react';
import { getAllTimezones } from '@/lib/utils/timezone';
import { Timezone } from '@/store/timezoneStore';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X } from 'lucide-react';

interface TimezoneSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (timezone: Timezone) => void;
  excludeTimezones?: string[];
}

/**
 * Reusable Timezone Selector Component
 * Used across different view components for consistent timezone selection
 */
export default function TimezoneSelector({
  isOpen,
  onClose,
  onSelect,
  excludeTimezones = []
}: TimezoneSelectorProps) {
  const [search, setSearch] = useState('');
  const [timezones, setTimezones] = useState<Timezone[]>([]);
  const [filteredTimezones, setFilteredTimezones] = useState<Timezone[]>([]);

  // Load all available timezones
  useEffect(() => {
    const allTimezones = getAllTimezones();
    // Filter out already selected timezones
    const availableTimezones = allTimezones.filter(tz => 
      !excludeTimezones.includes(tz.id)
    );
    setTimezones(availableTimezones);
    setFilteredTimezones(availableTimezones);
  }, [excludeTimezones]);

  // Filter based on search
  useEffect(() => {
    if (!search.trim()) {
      setFilteredTimezones(timezones);
      return;
    }

    const searchLower = search.toLowerCase();
    const filtered = timezones.filter(tz => 
      tz.name.toLowerCase().includes(searchLower) || 
      tz.id.toLowerCase().includes(searchLower) ||
      (tz.city && tz.city.toLowerCase().includes(searchLower)) ||
      (tz.country && tz.country.toLowerCase().includes(searchLower))
    );

    setFilteredTimezones(filtered);
  }, [search, timezones]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={open => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
        <Dialog.Content 
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                    bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md z-50
                    border border-gray-200 dark:border-gray-700"
        >
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
              Select Timezone
            </Dialog.Title>
            <Dialog.Close className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-500">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>
          
          <div className="mb-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search timezones..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 rounded-md 
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                        focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="max-h-80 overflow-y-auto mb-4 rounded-md border border-gray-200 dark:border-gray-700">
            {filteredTimezones.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No timezones found
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTimezones.map(tz => (
                  <button
                    key={tz.id}
                    onClick={() => onSelect(tz)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 
                              transition-colors duration-150 focus:outline-none focus:bg-gray-100 
                              dark:focus:bg-gray-700"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{tz.city || tz.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {tz.id} ({tz.offset})
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                        text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700
                        transition-colors duration-150"
            >
              Cancel
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 