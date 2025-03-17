'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h2 className="text-4xl font-bold mb-4">Something went wrong!</h2>
      <p className="text-xl mb-8 text-gray-600 dark:text-gray-400">
        We apologize for the inconvenience. An unexpected error has occurred.
      </p>
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors"
        >
          Try again
        </button>
        <Link 
          href="/" 
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
} 