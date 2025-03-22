'use client';

import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from '@vercel/analytics/react';
import ThemeToggle from '@/components/ThemeToggle';
import MobileMenu from '@/components/MobileMenu';
import Link from 'next/link';
import { Suspense } from 'react';
import { Settings } from 'lucide-react';

/**
 * Loading fallback component that reserves space to prevent CLS
 */
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

/**
 * Client layout component that handles all client-side functionality
 * This component is used by the server RootLayout component
 */
export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Performance monitoring */}
      <SpeedInsights />
      <Analytics />
      
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <Link 
              href="/settings" 
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Settings"
              title="Settings"
            >
              <Settings size={20} />
            </Link>
            <Link href="/" className="text-xl font-bold">World Clock</Link>
            <nav className="hidden md:flex space-x-6">
              <Link href="/" className="hover:text-primary-500 transition-colors">Home</Link>
              <Link href="/about" className="hover:text-primary-500 transition-colors">About</Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <MobileMenu />
          </div>
        </div>
      </header>
      
      <main className="min-h-screen py-8">
        <Suspense fallback={<LoadingFallback />}>
          {children}
        </Suspense>
      </main>
      
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>World Clock - A global time management application</p>
          <div className="mt-2 flex justify-center space-x-4">
            <Link href="/" className="hover:text-primary-500 transition-colors">Home</Link>
            <Link href="/about" className="hover:text-primary-500 transition-colors">About</Link>
            <Link href="/settings" className="hover:text-primary-500 transition-colors">Settings</Link>
          </div>
        </div>
      </footer>
    </>
  );
} 