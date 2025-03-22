'use client';

import Link from 'next/link';

/**
 * Simplified 404 page that avoids importing unnecessary dependencies
 */
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <h1 className="text-5xl font-bold mb-4">404</h1>
      <h2 className="text-2xl mb-6">Page Not Found</h2>
      <p className="mb-8 max-w-md">
        Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
      </p>
      <Link 
        href="/" 
        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
} 