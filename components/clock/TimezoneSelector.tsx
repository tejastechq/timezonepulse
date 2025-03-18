'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getAllTimezones } from '@/lib/utils/timezone';
import { Timezone } from '@/store/timezoneStore';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { FixedSizeList as List } from 'react-window';
import { useDebounce } from '@/lib/hooks';

// Fallback implementation of useDebounce in case the import fails
const useLocalDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

interface TimezoneSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (timezone: Timezone) => void;
  excludeTimezones?: string[];
  [key: string]: any; // Allow for additional props like data attributes
}

/**
 * Reusable Timezone Selector Component
 * Used across different view components for consistent timezone selection
 */
export default function TimezoneSelector({
  isOpen,
  onClose,
  onSelect,
  excludeTimezones = [],
  ...props
}: TimezoneSelectorProps) {
  const [search, setSearch] = useState('');
  // Try to use the imported hook, fall back to local implementation if it fails
  const debouncedSearch = (() => {
    try {
      return useDebounce(search, 300);
    } catch (e) {
      console.warn('Falling back to local useDebounce implementation');
      return useLocalDebounce(search, 300);
    }
  })();
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

  // Filter based on search using debounced value
  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setFilteredTimezones(timezones);
      return;
    }

    const searchLower = debouncedSearch.toLowerCase();
    const filtered = timezones.filter(tz => 
      tz.name.toLowerCase().includes(searchLower) || 
      tz.id.toLowerCase().includes(searchLower) ||
      (tz.city && tz.city.toLowerCase().includes(searchLower)) ||
      (tz.country && tz.country.toLowerCase().includes(searchLower)) ||
      (tz.abbreviation && tz.abbreviation.toLowerCase().includes(searchLower))
    );

    setFilteredTimezones(filtered);
  }, [debouncedSearch, timezones]);

  // Group timezones by region
  const groupedTimezones = useMemo(() => {
    if (!filteredTimezones.length) return {};
    
    return filteredTimezones.reduce((groups: Record<string, Timezone[]>, timezone) => {
      const region = timezone.country || 'Other';
      if (!groups[region]) {
        groups[region] = [];
      }
      groups[region].push(timezone);
      return groups;
    }, {});
  }, [filteredTimezones]);

  // Get sorted region names
  const regions = useMemo(() => {
    return Object.keys(groupedTimezones).sort((a, b) => a.localeCompare(b));
  }, [groupedTimezones]);

  // Flatten grouped timezones for virtualized list with section headers
  const flatListItems = useMemo(() => {
    let items: Array<{ type: 'header' | 'item', region?: string, timezone?: Timezone }> = [];
    
    regions.forEach(region => {
      // Only add headers when not searching
      if (!debouncedSearch) {
        items.push({ type: 'header', region });
      }
      
      groupedTimezones[region].forEach(timezone => {
        items.push({ type: 'item', timezone, region });
      });
    });
    
    return items;
  }, [regions, groupedTimezones, debouncedSearch]);

  // Render an item in the virtualized list
  const renderListItem = useCallback(({ index, style }: { index: number, style: React.CSSProperties }) => {
    const item = flatListItems[index];
    
    if (item.type === 'header') {
      return (
        <div 
          style={style} 
          className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-700 px-4 py-2 font-semibold text-sm text-gray-600 dark:text-gray-300"
          role="presentation"
        >
          {item.region}
        </div>
      );
    }
    
    const tz = item.timezone!;
    
    return (
      <button
        key={tz.id}
        onClick={() => onSelect(tz)}
        style={style}
        className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 
                  transition-colors duration-150 focus:outline-none focus:bg-gray-100 
                  dark:focus:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
        role="option"
        aria-selected="false"
        id={`timezone-option-${tz.id}`}
        tabIndex={0}
        data-timezone-id={tz.id}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onSelect(tz);
            e.preventDefault();
          }
        }}
      >
        <div className="font-medium text-gray-900 dark:text-white flex items-center">
          {tz.city || tz.name}
          {tz.abbreviation && (
            <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded">
              {tz.abbreviation}
            </span>
          )}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 flex justify-between">
          <span>{tz.id}</span>
          <span className="text-gray-400 dark:text-gray-500">{tz.offset}</span>
        </div>
      </button>
    );
  }, [flatListItems, onSelect]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={open => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
        <Dialog.Content 
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                    bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md z-50
                    border border-gray-200 dark:border-gray-700"
          {...props}
        >
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
              Select Timezone or Region
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
              placeholder="Search by city, country or timezone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 rounded-md 
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                        focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="h-80 mb-4 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            {filteredTimezones.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400 h-full flex items-center justify-center">
                No timezones or regions found
              </div>
            ) : (
              <List
                height={320} // 80 viewport height
                width="100%"
                itemCount={flatListItems.length}
                itemSize={64} // Approximate height of each item
                className="timezone-list"
                tabIndex={0}
                role="listbox"
                aria-label="Available timezones and regions"
                overscanCount={5} // Render items above and below the visible area
              >
                {renderListItem}
              </List>
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