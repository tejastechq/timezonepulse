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
  earlyFormattingDelay?: number;
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
 * Offers early colon insertion when users pause after typing 1-2 digits.
 */
export default function TimeSearch({
  onSearch,
  onClear,
  placeholder = 'Search for a time in local timezone (e.g. 3:30 PM)',
  className = '',
  initialValue = '',
  debounceMs = 300,
  autoFormatTime = true,
  earlyFormattingDelay = 500, // ms - Default delay for early formatting
}: TimeSearchProps) {
  const [inputValue, setInputValue] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const [wasFormatted, setWasFormatted] = useState(false);
  
  // Refs for tracking input state and behavior
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const formattingTimeout = useRef<NodeJS.Timeout | null>(null);
  const earlyFormattingTimeout = useRef<NodeJS.Timeout | null>(null); // For early colon insertion
  const lastCursorPosition = useRef<number | null>(null);
  const isFormattingRef = useRef<boolean>(false);
  const selectionStateRef = useRef<{start: number | null, end: number | null}>({
    start: null,
    end: null
  });
  
  // Constants
  const patternFormattingDelay = 100; // ms - For full pattern recognition
  
  const { resolvedTheme } = useTheme();
  
  /**
   * Time formatting utility functions
   */
  
  // Determine if input is eligible for early formatting (1-2 digits)
  const shouldApplyEarlyFormatting = useCallback((input: string): boolean => {
    // Skip if input already has a colon
    if (TIME_PATTERNS.HAS_COLON.test(input)) {
      return false;
    }
    
    // Extract any AM/PM suffix to ignore it for now
    const amPmMatch = input.match(TIME_PATTERNS.AM_PM);
    const numericPart = amPmMatch 
      ? input.substring(0, amPmMatch.index).replace(/[^\d]/g, '')
      : input.replace(/[^\d]/g, '');
    
    // Single digit 0-9 is valid for early formatting
    if (numericPart.length === 1) {
      console.log('Single digit eligible for early formatting:', input);
      return true;
    } 
    // Two digits 00-23 are valid hours
    else if (numericPart.length === 2) {
      const hourValue = parseInt(numericPart, 10);
      console.log('Two digits eligible for early formatting:', input, hourValue >= 0 && hourValue <= 23);
      return hourValue >= 0 && hourValue <= 23;
    }
    
    return false;
  }, []);
  
  // Debounced search handler - moved up before it's used in applyEarlyFormatting
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
  
  // Apply early formatting (colon after 1-2 digits)
  const applyEarlyFormatting = useCallback(() => {
    console.log('Applying early formatting to:', inputValue);
    
    // Skip if formatting is disabled or input has a colon
    if (!autoFormatTime || TIME_PATTERNS.HAS_COLON.test(inputValue)) {
      console.log('Skipping early formatting - formatting disabled or input has colon');
      return;
    }
    
    // Only proceed if input matches early formatting criteria
    if (shouldApplyEarlyFormatting(inputValue)) {
      console.log('Input matches early formatting criteria');
      // Set formatting flag to prevent concurrent formatting operations
      isFormattingRef.current = true;
      
      // Extract any AM/PM suffix to preserve it
      const amPmMatch = inputValue.match(TIME_PATTERNS.AM_PM);
      const amPmSuffix = amPmMatch ? amPmMatch[0] : '';
      const mainPart = amPmMatch ? inputValue.substring(0, amPmMatch.index) : inputValue;
      
      // Format by adding colon after the hour digits
      const numericPart = mainPart.replace(/[^\d]/g, '');
      const formatted = `${numericPart}:${amPmSuffix}`;
      
      console.log('Formatted value will be:', formatted);
      
      // Set the formatted value
      setInputValue(formatted);
      setWasFormatted(true);
      
      // Position cursor after the colon
      setTimeout(() => {
        if (inputRef.current) {
          const newPosition = numericPart.length + 1; // Position after the colon
          inputRef.current.selectionStart = newPosition;
          inputRef.current.selectionEnd = newPosition;
        }
        // Reset formatting flag
        isFormattingRef.current = false;
        console.log('Cursor positioned and formatting flag reset');
      }, 0);
      
      // Trigger search with formatted value
      debouncedSearch(formatted);
    } else {
      console.log('Input does not match early formatting criteria');
      // Reset formatting flag if we're not applying formatting
      isFormattingRef.current = false;
    }
  }, [inputValue, autoFormatTime, shouldApplyEarlyFormatting, debouncedSearch]);
  
  // Format time string by inserting a colon where appropriate (for pattern-based formatting)
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
    
    console.log('⭐ Input changed to:', newValue);
    
    // Store selection state
    lastCursorPosition.current = cursorPos;
    selectionStateRef.current = {
      start: cursorPos,
      end: selectionEnd
    };
    
    // First set the raw value to ensure responsiveness
    setInputValue(newValue);
    setWasFormatted(false);
    
    // Clear any pending early formatting timeout
    if (earlyFormattingTimeout.current) {
      clearTimeout(earlyFormattingTimeout.current);
      earlyFormattingTimeout.current = null;
      console.log('Cleared existing early formatting timeout');
    }
    
    // If auto-formatting is enabled
    if (autoFormatTime) {
      // SIMPLIFIED APPROACH: Directly check if this is a single digit (0-9)
      // or a valid two-digit hour (00-23)
      const singleDigitMatch = /^[0-9]$/.test(newValue);
      const twoDigitHourMatch = /^(0[0-9]|1[0-9]|2[0-3])$/.test(newValue);
      
      if ((singleDigitMatch || twoDigitHourMatch) && !newValue.includes(':')) {
        console.log(`✅ Setting up SIMPLIFIED early formatting for: "${newValue}"`);
        
        // Schedule early formatting with the specified delay
        earlyFormattingTimeout.current = setTimeout(() => {
          console.log(`⌛ Early formatting timeout triggered for: "${newValue}"`);
          
          // Directly format the value we captured, not using state
          // This avoids any state closure issues
          const formatted = `${newValue}:`;
          console.log(`📝 SIMPLIFIED direct formatting - value will be: "${formatted}"`);
          
          // Update the input
          setInputValue(formatted);
          setWasFormatted(true);
          
          // Position cursor after the colon
          setTimeout(() => {
            if (inputRef.current) {
              const newPosition = newValue.length + 1; // Position after the colon
              inputRef.current.selectionStart = newPosition;
              inputRef.current.selectionEnd = newPosition;
              console.log(`⬅️ Positioned cursor at position: ${newPosition}`);
            }
            isFormattingRef.current = false;
          }, 0);
          
          // Trigger search with formatted value
          debouncedSearch(formatted);
          
        }, earlyFormattingDelay);
        console.log(`⏱️ Early formatting timeout set with delay: ${earlyFormattingDelay}ms`);
      }
      
      // Also set up pattern-based formatting with shorter debouncing
      // but only if the input doesn't match the single/double digit patterns
      // to avoid conflicts
      if (formattingTimeout.current) {
        clearTimeout(formattingTimeout.current);
      }
      
      // Skip pattern formatting for 1-2 digit inputs to avoid conflicts
      if (!isFormattingRef.current && !singleDigitMatch && !twoDigitHourMatch) {
        formattingTimeout.current = setTimeout(() => {
          // Clear early formatting timeout to avoid conflicts
          if (earlyFormattingTimeout.current) {
            clearTimeout(earlyFormattingTimeout.current);
            earlyFormattingTimeout.current = null;
          }
          
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
        }, patternFormattingDelay); // Shorter delay than early formatting
      }
    }
    
    // Always trigger search with the new value regardless of formatting
    debouncedSearch(newValue);
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
      if (earlyFormattingTimeout.current) {
        clearTimeout(earlyFormattingTimeout.current);
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
          Time entries will be auto-formatted. For example, typing 3 and pausing will become 3:, and typing 300 will become 3:00.
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