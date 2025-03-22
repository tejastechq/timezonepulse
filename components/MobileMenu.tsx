'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Mobile menu component for navigation on small screens
 */
export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Toggle the menu
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  
  // Close the menu
  const closeMenu = () => {
    setIsOpen(false);
  };
  
  return (
    <div className="md:hidden">
      {/* Menu button */}
      <button
        onClick={toggleMenu}
        className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>
      
      {/* Mobile menu overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={closeMenu}
            />
            
            {/* Menu panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-64 bg-white dark:bg-gray-800 z-50 shadow-xl"
            >
              <div className="p-4 flex flex-col h-full">
                <div className="flex justify-end mb-6">
                  <button
                    onClick={closeMenu}
                    className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Close menu"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                
                <nav className="flex flex-col space-y-4">
                  <Link
                    href="/"
                    className="px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={closeMenu}
                  >
                    Home
                  </Link>
                  <Link
                    href="/about"
                    className="px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={closeMenu}
                  >
                    About
                  </Link>
                </nav>
                
                <div className="mt-auto">
                  <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    World Clock - A global time management application
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
} 