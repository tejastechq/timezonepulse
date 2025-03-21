'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error component for handling and displaying application errors
 * This is used by Next.js to display errors that occur during rendering
 */
export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center">
      <h1 className="text-4xl font-bold text-red-600 mb-4">Something went wrong</h1>
      <p className="mb-6 text-lg max-w-xl">
        We're sorry, but an unexpected error occurred. Our team has been notified.
      </p>
      
      {/* Show error details in development mode */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-6 max-w-2xl w-full text-left">
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-auto max-h-[200px]">
            <p className="font-bold mb-2">Error: {error.message}</p>
            {error.digest && <p className="text-sm text-gray-600 dark:text-gray-400">Digest: {error.digest}</p>}
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{error.stack}</p>
          </div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-4 mt-2">
        <button
          onClick={reset}
          className="px-6 py-3 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-6 py-3 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
} 