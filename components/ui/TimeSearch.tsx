'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface TimeSearchProps {
  onSearch: (term: string) => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
  initialValue?: string;
  debounceMs?: number;
}

/**
 * TimeSearch Component
 * 
 * A search input component specialized for time-based searches with debounce functionality.
 * Features clear button, animations, and theme-aware styling.
 */
export default function TimeSearch({
  onSearch,
  onClear,
  placeholder = 'Search for a time in local timezone (e.g. 3:30 PM)',
  className = '',
  initialValue = '',
  debounceMs = 300,
}: TimeSearchProps) {
  const [inputValue, setInputValue] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const { resolvedTheme } = useTheme();
  
  // Debounced search handler
  const debouncedSearch = useCallback(
    (value: string) => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      
      debounceTimeout.current = setTimeout(() => {
        onSearch(value);
      }, debounceMs);
    },
    [onSearch, debounceMs]
  );
  
  // Handle input changes with debounce
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    debouncedSearch(newValue);
  };
  
  // Handle clearing the search
  const handleClear = () => {
    setInputValue('');
    onClear();
    // Focus the input after clearing
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);
  
  return (
    <div 
      className={clsx(
        'relative flex items-center w-full',
        className
      )}
    >
      <div 
        className={clsx(
          'relative flex items-center w-full rounded-lg overflow-hidden',
          'glass-card backdrop-blur-fix',
          resolvedTheme === 'dark' ? 'glass-card-dark' : 'glass-card-light',
          'border border-gray-200 dark:border-gray-700',
          'transition-all duration-200'
        )}
        style={{
          isolation: 'isolate',
          backgroundColor: resolvedTheme === 'dark'
            ? 'rgba(15, 15, 25, 0.2)'
            : 'rgba(255, 255, 255, 0.15)'
        }}
      >
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-[1]">
          <Search 
            className="w-4 h-4 text-gray-500 dark:text-gray-400" 
            aria-hidden="true"
          />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={clsx(
            'w-full py-3 pl-10 pr-10 text-sm bg-transparent z-[1]',
            'text-gray-800 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400',
            'focus:outline-none focus:ring-0 border-none',
            'relative'
          )}
          role="searchbox"
          aria-label="Search for a time"
        />
        
        <AnimatePresence>
          {inputValue.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={handleClear}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 z-[1]"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 