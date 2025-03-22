'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@/components/icons';

/**
 * ThemeToggle component allows users to switch between light, dark, and system themes
 * Uses next-themes for theme handling
 */
export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only show theme toggle after component mounts to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex items-center justify-center space-x-2 bg-white/90 dark:bg-gray-800/90 p-2 rounded-full shadow-lg backdrop-blur-sm border border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded-full ${
          theme === 'light' 
            ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-600/20 dark:text-yellow-400' 
            : 'text-gray-500 hover:text-yellow-600 dark:text-gray-400 dark:hover:text-yellow-300'
        }`}
        aria-label="Light mode"
      >
        <SunIcon className="w-5 h-5" />
      </button>
      
      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded-full ${
          theme === 'dark' 
            ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-600/20 dark:text-indigo-300' 
            : 'text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-300'
        }`}
        aria-label="Dark mode"
      >
        <MoonIcon className="w-5 h-5" />
      </button>
      
      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded-full ${
          theme === 'system' 
            ? 'bg-blue-100 text-blue-600 dark:bg-blue-600/20 dark:text-blue-300' 
            : 'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-300'
        }`}
        aria-label="System theme"
      >
        <ComputerDesktopIcon className="w-5 h-5" />
      </button>
    </div>
  );
} 