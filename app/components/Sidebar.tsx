'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSwipeable } from 'react-swipeable';
import { XMarkIcon, ClockIcon, GlobeAltIcon, CalendarDaysIcon, StarIcon, 
  NewspaperIcon, ChartBarIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, 
  PlusCircleIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import { DatePickerSidebarTrigger } from '@/components/DatePickerSidebarTrigger';

interface SidebarProps {
  children: React.ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const pathname = usePathname() ?? '';

  // Check if the device is mobile or tablet on mount and on resize
  useEffect(() => {
    const checkDeviceSize = () => {
      setIsMobileOrTablet(window.innerWidth <= 1024); // Consider devices <= 1024px as mobile/tablet
    };
    
    // Check on initial load
    checkDeviceSize();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkDeviceSize);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkDeviceSize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Configure swipe handlers - only activate on mobile/tablet
  const swipeHandlers = useSwipeable({
    onSwipedRight: () => isMobileOrTablet && setSidebarOpen(true),
    onSwipedLeft: () => isMobileOrTablet && setSidebarOpen(false),
    trackMouse: false,
    delta: 50, // minimum swipe distance (px)
    preventScrollOnSwipe: false, // Don't prevent scrolling
    swipeDuration: 500, // maximum time for swipe motion (ms)
  });

  // Handle sidebar open/close with a gesture area on the left edge
  const gestureAreaHandlers = useSwipeable({
    onSwipedRight: () => isMobileOrTablet && setSidebarOpen(true),
    trackMouse: false,
    delta: 10, // Lower threshold for the edge gesture area
    preventScrollOnSwipe: false
  });

  return (
    <div className="relative flex min-h-screen">
      {/* Left edge gesture area - only on mobile/tablet */}
      {isMobileOrTablet && (
        <div 
          {...gestureAreaHandlers}
          className="fixed left-0 top-0 w-6 h-full z-30"
          style={{ touchAction: 'pan-y' }}
        />
      )}
      
      {/* Main content area with swipe handlers */}
      <div className="flex-grow" {...(isMobileOrTablet ? swipeHandlers : {})}>
        {/* Top header with menu toggle - visible on all devices now */}
        <div className="fixed top-0 left-0 right-0 flex items-center h-14 px-4 bg-slate-900/60 backdrop-blur-lg backdrop-saturate-150 border border-white/10 shadow-lg z-50 transition-all duration-300 rounded-b-xl">
          <button 
            onClick={toggleSidebar}
            className="p-2 text-gray-200 hover:bg-gray-800 rounded-full"
            aria-label="Toggle menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          {/* Centered logo and text */}
          <div className="flex-1 flex justify-center items-center">
            <div className="flex items-center">
              <ClockIcon className="h-6 w-6 text-blue-500 mr-2" />
              <span className="font-semibold text-white">TimezonePulse</span>
            </div>
          </div>
          
          {/* Empty div to balance the header */}
          <div className="w-10" />
        </div>
        
        {/* Content padding to account for the header on all devices */}
        <div className="pt-14">
          {/* Overlay */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity md:transition-opacity"
              onClick={toggleSidebar}
            />
          )}
          
          {/* Sidebar */}
          <div 
            className={`fixed top-0 left-0 h-full w-72 bg-slate-900/50 backdrop-blur-lg backdrop-saturate-150 border border-white/10 shadow-xl rounded-r-2xl z-50 transform transition-transform duration-300 ease-in-out ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="p-4">
              {/* Close button */}
              <button 
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-800"
                onClick={toggleSidebar}
                aria-label="Close sidebar"
              >
                <XMarkIcon className="w-6 h-6 text-gray-200" />
              </button>
              
              {/* Account section */}
              <div className="pt-2">
                <div className="flex items-start space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                    <UserCircleIcon className="w-10 h-10 text-gray-400" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white">My Timezones</h2>
                    <p className="text-sm text-gray-400">Manage your time</p>
                  </div>
                </div>
              </div>
              
              {/* Menu items */}
              <nav className="mt-2">
                <ul className="space-y-1">
                  <li>
                    <a
                      href="/"
                      className={`flex items-center space-x-3 px-3 py-3 rounded-full hover:bg-gray-800 ${
                        pathname === '/' ? 'bg-primary-700 text-white font-semibold' : ''
                      }`}
                    >
                      <ClockIcon className="w-6 h-6 text-gray-200" />
                      <span className="text-white">World Clock</span>
                    </a>
                  </li>
                  <li>
                    {/* TASK_002: Replace 'Time Travel' with 'Select Date' and show DatePicker popup */}
                    <DatePickerSidebarTrigger onSidebarCollapse={() => setSidebarOpen(false)} />
                  </li>
                  <li>
                    <a
                      href="/saved"
                      className={`flex items-center space-x-3 px-3 py-3 rounded-full hover:bg-gray-800 ${
                        pathname.startsWith('/saved') ? 'bg-primary-700 text-white font-semibold' : ''
                      }`}
                    >
                      <StarIcon className="w-6 h-6 text-gray-200" />
                      <span className="text-white">Saved Times</span>
                    </a>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        try {
                          const store = require('@/store/timezoneStore');
                          store.useTimezoneStore.getState().openTimezoneSelector();
                        } catch (e) {
                          console.error('Failed to open timezone selector modal', e);
                        }
                        setSidebarOpen(false);
                      }}
                      className={`flex items-center space-x-3 px-3 py-3 rounded-full hover:bg-gray-800 ${
                        pathname.startsWith('/add') ? 'bg-primary-700 text-white font-semibold' : ''
                      }`}
                    >
                      <PlusCircleIcon className="w-6 h-6 text-gray-200" />
                      <span className="text-white">Add Timezone</span>
                    </button>
                  </li>
                  
                  {/* Divider */}
                  <div className="my-2 border-t border-gray-800"></div>
                  
                  {/* Global Info Section */}
                  <li>
                    <a
                      href="/current-events"
                      className={`flex items-center space-x-3 px-3 py-3 rounded-full hover:bg-gray-800 ${
                        pathname.startsWith('/current-events') ? 'bg-primary-700 text-white font-semibold' : ''
                      }`}
                    >
                      <NewspaperIcon className="w-6 h-6 text-gray-200" />
                      <span className="text-white">Current Events</span>
                    </a>
                  </li>
                  
                  {/* Divider */}
                  <div className="my-2 border-t border-gray-800"></div>
                  
                  {/* Settings Section */}
                  <li>
                    <a href="#" className="flex items-center space-x-3 px-3 py-3 rounded-full hover:bg-gray-800">
                      <Cog6ToothIcon className="w-6 h-6 text-gray-200" />
                      <span className="text-white">Settings</span>
                    </a>
                  </li>
                  <li>
                    <a href="#" className="flex items-center space-x-3 px-3 py-3 rounded-full hover:bg-gray-800">
                      <ArrowRightOnRectangleIcon className="w-6 h-6 text-gray-200" />
                      <span className="text-white">Log out</span>
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
          
          {/* Page content */}
          {children}
        </div>
      </div>
    </div>
  );
}
