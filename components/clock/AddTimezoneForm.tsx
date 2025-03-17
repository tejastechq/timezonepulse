'use client';

import { useState, useEffect } from 'react';
import { getAllTimezones, isValidTimezone } from '@/lib/utils/timezone';
import * as Dialog from '@radix-ui/react-dialog';
import { useCombobox } from 'downshift';
import { motion, AnimatePresence } from 'framer-motion';

interface AddTimezoneFormProps {
  onAddTimezone: (timezone: { name: string; id: string; city?: string; country?: string }) => void;
  onCancel: () => void;
}

/**
 * Component for adding a new timezone
 */
export default function AddTimezoneForm({ onAddTimezone, onCancel }: AddTimezoneFormProps) {
  // State for the timezone search
  const [inputValue, setInputValue] = useState('');
  const [timezones, setTimezones] = useState<Array<{ id: string; name: string; city?: string; country?: string }>>([]);
  const [filteredTimezones, setFilteredTimezones] = useState<Array<{ id: string; name: string; city?: string; country?: string }>>([]);
  
  // Load all available timezones
  useEffect(() => {
    const allTimezones = getAllTimezones();
    setTimezones(allTimezones);
    setFilteredTimezones(allTimezones);
  }, []);
  
  // Filter timezones based on input
  useEffect(() => {
    if (!inputValue.trim()) {
      setFilteredTimezones(timezones);
      return;
    }
    
    const filtered = timezones.filter((tz) => {
      const searchTerm = inputValue.toLowerCase();
      return (
        tz.name.toLowerCase().includes(searchTerm) ||
        tz.id.toLowerCase().includes(searchTerm) ||
        (tz.city && tz.city.toLowerCase().includes(searchTerm)) ||
        (tz.country && tz.country.toLowerCase().includes(searchTerm))
      );
    });
    
    setFilteredTimezones(filtered);
  }, [inputValue, timezones]);
  
  // Set up Downshift combobox
  const {
    isOpen,
    getToggleButtonProps,
    getMenuProps,
    getInputProps,
    getLabelProps,
    getItemProps,
    highlightedIndex,
    selectedItem,
    setInputValue: setDownshiftInputValue,
  } = useCombobox({
    items: filteredTimezones,
    itemToString: (item) => (item ? item.name : ''),
    onInputValueChange: ({ inputValue }) => {
      setInputValue(inputValue || '');
    },
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        onAddTimezone(selectedItem);
      }
    },
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If a timezone is selected, add it
    if (selectedItem) {
      onAddTimezone(selectedItem);
      return;
    }
    
    // If the input is a valid timezone, add it
    if (isValidTimezone(inputValue)) {
      onAddTimezone({
        id: inputValue,
        name: inputValue,
      });
      return;
    }
    
    // If there are filtered results, add the first one
    if (filteredTimezones.length > 0) {
      onAddTimezone(filteredTimezones[0]);
    }
  };
  
  return (
    <Dialog.Root open={true} onOpenChange={(open) => !open && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
          <Dialog.Title className="text-xl font-semibold mb-4">
            Add Timezone
          </Dialog.Title>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label {...getLabelProps()} className="block text-sm font-medium mb-1">Timezone</label>
              <div className="relative">
                <input
                  {...getInputProps()}
                  placeholder="Search for a timezone..."
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  {...getToggleButtonProps()}
                  aria-label="toggle menu"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md max-h-60 overflow-y-auto"
                    {...getMenuProps()}
                  >
                    {filteredTimezones.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">No timezones found</div>
                    ) : (
                      filteredTimezones.map((timezone, index) => (
                        <div
                          key={timezone.id}
                          {...getItemProps({ item: timezone, index })}
                          className={`
                            p-2 cursor-pointer text-sm
                            ${highlightedIndex === index ? 'bg-primary-100 dark:bg-primary-900' : ''}
                            ${selectedItem === timezone ? 'bg-primary-200 dark:bg-primary-800' : ''}
                          `}
                        >
                          <div className="font-medium">{timezone.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{timezone.id}</div>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
              >
                Add
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 