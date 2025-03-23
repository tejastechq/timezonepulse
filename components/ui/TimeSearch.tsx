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
  autoFormatTime?: boolean;
}

// Regular expressions for time pattern matching
const TIME_PATTERNS = {
  // Match 1-2 digits that could be hours (0-23)
  HOURS: /^([0-9]|0[0-9]|1[0-9]|2[0-3])$/,
  // Match 3 digits (1 hour digit + 2 minute digits)
  THREE_DIGITS: /^([0-9])([0-5][0-9])$/,
  // Match 4 digits (2 hour digits + 2 minute digits)
  FOUR_DIGITS: /^(0[0-9]|1[0-9]|2[0-3])([0-5][0-9])$/,
  // Match valid 12-hour format time without colon
  TWELVE_HOUR: /^(0?[1-9]|1[0-2])([0-5][0-9])?$/,
  // Check if input already has a colon
  HAS_COLON: /:/,
  // Extract AM/PM suffix
  AM_PM: /\s*(am|pm|AM|PM)$/,
};

/**
 * TimeSearch Component
 * 
 * A search input component specialized for time-based searches with debounce functionality.
 * Features clear button, animations, and theme-aware styling.
 * Includes auto-formatting for time inputs (e.g., "300" -> "3:00").
 */
export default function TimeSearch({
  onSearch,
  onClear,
  placeholder = 'Search for a time in local timezone (e.g. 3:30 PM)',
  className = '',
  initialValue = '',
  debounceMs = 300,
  autoFormatTime = true,
}: TimeSearchProps) {
  const [inputValue, setInputValue] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const [wasFormatted, setWasFormatted] = useState(false);
  
  // Refs for tracking input state and behavior
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const formattingTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastCursorPosition = useRef<number | null>(null);
  const isFormattingRef = useRef<boolean>(false);
  const selectionStateRef = useRef<{start: number | null, end: number | null}>({
    start: null,
    end: null
  });
  
  const { resolvedTheme } = useTheme();
  
  /**
   * Time formatting utility functions
   */
  
  // Format time string by inserting a colon where appropriate
  const formatTimeInput = useCallback((input: string): { formatted: string, cursorOffset: number } => {
    // Skip formatting if disabled or input already contains a colon
    if (!autoFormatTime || TIME_PATTERNS.HAS_COLON.test(input)) {
      return { formatted: input, cursorOffset: 0 };
    }
    
    // Extract any AM/PM suffix to preserve it
    const amPmMatch = input.match(TIME_PATTERNS.AM_PM);
    const amPmSuffix = amPmMatch ? amPmMatch[0] : '';
    let numericPart = amPmMatch ? input.substring(0, amPmMatch.index) : input;
    
    // Remove any non-digit characters from the numeric part
    numericPart = numericPart.replace(/[^\d]/g, '');
    
    let formatted: string;
    let cursorOffset = 0;
    
    // Apply formatting based on the number of digits
    if (numericPart.length === 2 && TIME_PATTERNS.HOURS.test(numericPart)) {
      // Format as "HH:" (e.g., "12" -> "12:")
      formatted = `${numericPart}:`;
      cursorOffset = 1; // Cursor moves right by 1 due to colon insertion
    } else if (numericPart.length === 3) {
      // Format as "H:MM" (e.g., "130" -> "1:30")
      const match = numericPart.match(TIME_PATTERNS.THREE_DIGITS);
      if (match) {
        formatted = `${match[1]}:${match[2]}`;
        cursorOffset = 1; // Cursor moves right by 1 due to colon insertion
      } else {
        formatted = numericPart;
      }
    } else if (numericPart.length === 4) {
      // Format as "HH:MM" (e.g., "1430" -> "14:30")
      const match = numericPart.match(TIME_PATTERNS.FOUR_DIGITS);
      if (match) {
        formatted = `${match[1]}:${match[2]}`;
        cursorOffset = 1; // Cursor moves right by 1 due to colon insertion
      } else {
        formatted = numericPart;
      }
    } else {
      // For other cases, keep as is
      formatted = numericPart;
    }
    
    // Reapply AM/PM suffix if present
    return { 
      formatted: formatted + amPmSuffix,
      cursorOffset
    };
  }, [autoFormatTime]);
  
  // Calculate new cursor position after formatting
  const calculateCursorPosition = useCallback((
    originalPosition: number,
    originalValue: string,
    formattedValue: string,
    cursorOffset: number
  ): number => {
    // If cursor was at the end, keep it at the end
    if (originalPosition === originalValue.length) {
      return formattedValue.length;
    }
    
    // If cursor was before or at the position where colon is inserted, keep it the same
    if (originalPosition <= 2 && formattedValue.length > originalValue.length) {
      return originalPosition;
    }
    
    // Otherwise, adjust cursor position by the offset
    return originalPosition + cursorOffset;
  }, []);
  
  // Debounced search handler - MOVED UP before any functions that use it
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
  
  // Handle special keydown events for better user experience
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Save selection state
    if (inputRef.current) {
      selectionStateRef.current = {
        start: inputRef.current.selectionStart,
        end: inputRef.current.selectionEnd
      };
    }
    
    // Handle backspace specially to improve UX when deleting across a colon
    if (e.key === 'Backspace' && inputRef.current) {
      const cursorPos = inputRef.current.selectionStart;
      const value = inputRef.current.value;
      
      // If cursor is right after a colon, delete both the colon and the character before it
      if (cursorPos && cursorPos > 0 && value[cursorPos - 1] === ':') {
        e.preventDefault();
        const newValue = value.substring(0, cursorPos - 2) + value.substring(cursorPos);
        setInputValue(newValue);
        
        // Update cursor position
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.selectionStart = cursorPos - 2;
            inputRef.current.selectionEnd = cursorPos - 2;
          }
        }, 0);
        
        // Trigger search with the new value
        debouncedSearch(newValue);
      }
    }
  }, [debouncedSearch]);
  
  // Handle paste events to format pasted time values
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    if (!autoFormatTime) return;
    
    // Get pasted content
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText) return;
    
    // Check if pasted content matches a time pattern that needs formatting
    if (!TIME_PATTERNS.HAS_COLON.test(pastedText) && 
        (pastedText.match(/^\d{3,4}$/) || pastedText.match(/^\d{1,2}$/))) {
      
      // Get current input value and selection
      const input = inputRef.current;
      if (!input) return;
      
      const cursorPos = input.selectionStart || 0;
      const selectionEnd = input.selectionEnd || cursorPos;
      const currentValue = input.value;
      
      // Create the new value by replacing the selected text with pasted content
      const beforeSelection = currentValue.substring(0, cursorPos);
      const afterSelection = currentValue.substring(selectionEnd);
      const newRawValue = beforeSelection + pastedText + afterSelection;
      
      // Format the new value
      const { formatted, cursorOffset } = formatTimeInput(newRawValue);
      
      // If formatting changed the value, prevent default and set the formatted value
      if (formatted !== newRawValue) {
        e.preventDefault();
        setInputValue(formatted);
        
        // Calculate new cursor position
        const newCursorPos = cursorPos + pastedText.length + cursorOffset;
        
        // Set cursor position after state update
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.selectionStart = newCursorPos;
            inputRef.current.selectionEnd = newCursorPos;
          }
        }, 0);
        
        // Set formatting flag and trigger search
        setWasFormatted(true);
        debouncedSearch(formatted);
      }
    }
  }, [autoFormatTime, formatTimeInput, debouncedSearch]);
  
  // Handle select event to track selection state
  const handleSelect = useCallback(() => {
    if (inputRef.current) {
      selectionStateRef.current = {
        start: inputRef.current.selectionStart,
        end: inputRef.current.selectionEnd
      };
    }
  }, []);
  
  // Handle input changes with debounce and auto-formatting
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Get the new input value and cursor position
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    const selectionEnd = e.target.selectionEnd;
    
    // Store selection state
    lastCursorPosition.current = cursorPos;
    selectionStateRef.current = {
      start: cursorPos,
      end: selectionEnd
    };
    
    // First set the raw value to ensure responsiveness
    setInputValue(newValue);
    setWasFormatted(false);
    
    // If auto-formatting is enabled and we're not already in a formatting operation
    if (autoFormatTime && !isFormattingRef.current) {
      // Apply formatting with debouncing to avoid jarring experience
      if (formattingTimeout.current) {
        clearTimeout(formattingTimeout.current);
      }
      
      formattingTimeout.current = setTimeout(() => {
        // Prevent recursive formatting
        isFormattingRef.current = true;
        
        // Apply formatting
        const { formatted, cursorOffset } = formatTimeInput(newValue);
        
        // Only update if formatting changed the value
        if (formatted !== newValue) {
          setInputValue(formatted);
          setWasFormatted(true);
          
          // Calculate and set new cursor position
          if (cursorPos !== null && inputRef.current) {
            // Handle text selection case
            let newCursorPos;
            let newSelectionEnd;
            
            // If there's a selection range
            if (selectionEnd !== null && selectionEnd !== cursorPos) {
              newCursorPos = calculateCursorPosition(
                cursorPos, 
                newValue, 
                formatted, 
                cursorOffset
              );
              newSelectionEnd = calculateCursorPosition(
                selectionEnd, 
                newValue, 
                formatted, 
                cursorOffset
              );
            } else {
              // No selection, just cursor position
              newCursorPos = calculateCursorPosition(
                cursorPos, 
                newValue, 
                formatted, 
                cursorOffset
              );
              newSelectionEnd = newCursorPos;
            }
            
            // Use setTimeout to ensure the cursor position is set after the value update
            setTimeout(() => {
              if (inputRef.current) {
                inputRef.current.selectionStart = newCursorPos;
                inputRef.current.selectionEnd = newSelectionEnd;
              }
              isFormattingRef.current = false;
            }, 0);
          } else {
            isFormattingRef.current = false;
          }
          
          // Trigger search with formatted value
          debouncedSearch(formatted);
        } else {
          isFormattingRef.current = false;
          // Trigger search with unchanged value
          debouncedSearch(newValue);
        }
      }, 100); // Small delay to allow for continuous typing
    } else {
      // No formatting, just trigger search
      debouncedSearch(newValue);
    }
  };
  
  // Handle clearing the search
  const handleClear = () => {
    setInputValue('');
    setWasFormatted(false);
    onClear();
    // Focus the input after clearing
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Announce formatting changes to screen readers
  useEffect(() => {
    if (wasFormatted && autoFormatTime) {
      // Create or get the live region for announcements
      let ariaLiveRegion = document.getElementById('time-format-announcer');
      if (!ariaLiveRegion) {
        ariaLiveRegion = document.createElement('div');
        ariaLiveRegion.id = 'time-format-announcer';
        ariaLiveRegion.setAttribute('aria-live', 'polite');
        ariaLiveRegion.setAttribute('aria-atomic', 'true');
        ariaLiveRegion.className = 'sr-only';
        document.body.appendChild(ariaLiveRegion);
      }
      
      // Announce the formatting change
      ariaLiveRegion.textContent = `Time formatted to ${inputValue}`;
      
      // Reset the formatting flag
      setWasFormatted(false);
    }
  }, [wasFormatted, inputValue, autoFormatTime]);
  
  // Clean up timeouts and ARIA live region on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      if (formattingTimeout.current) {
        clearTimeout(formattingTimeout.current);
      }
      
      // Remove the live region if we created one
      const ariaLiveRegion = document.getElementById('time-format-announcer');
      if (ariaLiveRegion) {
        document.body.removeChild(ariaLiveRegion);
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
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onSelect={handleSelect}
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
          aria-live="polite"
          aria-atomic="true"
          aria-describedby="time-search-description"
        />
        
        {/* Hidden description for screen readers */}
        <div id="time-search-description" className="sr-only">
          Time entries will be auto-formatted. For example, typing 300 will become 3:00.
        </div>
        
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