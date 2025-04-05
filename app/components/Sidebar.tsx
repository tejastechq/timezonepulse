'use client';

import { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { XMarkIcon, ClockIcon, GlobeAltIcon, CalendarDaysIcon, StarIcon, 
  NewspaperIcon, ChartBarIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, 
  PlusCircleIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { UserCircleIcon } from '@heroicons/react/24/solid';

interface SidebarProps {
  children: React.ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

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
        <div className="fixed top-0 left-0 right-0 flex items-center h-14 px-4 bg-slate-900/90 backdrop-blur-md z-40 border-b border-gray-800">
          <button 
            onClick={toggleSidebar}
            className="p-2 text-gray-200 hover:bg-gray-800 rounded-full"
            aria-label="Toggle menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="ml-4 flex items-center">
            <ClockIcon className="h-6 w-6 text-blue-500 mr-2" />
            <span className="font-semibold text-white">TimezonePulse</span>
          </div>
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
            className={`fixed top-0 left-0 h-full w-72 bg-slate-900 border-r border-gray-800 z-50 transform transition-transform duration-300 ease-in-out ${
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
                
                <div className="flex space-x-5 mb-6 text-sm">
                  <div>
                    <span className="font-bold text-white">5</span>
                    <span className="text-gray-400 ml-1">Saved zones</span>
                  </div>
                  <div>
                    <span className="font-bold text-white">3</span>
                    <span className="text-gray-400 ml-1">Time plans</span>
                  </div>
                </div>
              </div>
              
              {/* Menu items */}
              <nav className="mt-2">
                <ul className="space-y-1">
                  <li>
                    <a href="#" className="flex items-center space-x-3 px-3 py-3 rounded-full hover:bg-gray-800">
                      <ClockIcon className="w-6 h-6 text-gray-200" />
                      <span className="text-white">World Clock</span>
                    </a>
                  </li>
                  <li>
                    <a href="#" className="flex items-center space-x-3 px-3 py-3 rounded-full hover:bg-gray-800">
                      <CalendarDaysIcon className="w-6 h-6 text-gray-200" />
                      <span className="text-white">Time Travel</span>
                    </a>
                  </li>
                  <li>
                    <a href="#" className="flex items-center space-x-3 px-3 py-3 rounded-full hover:bg-gray-800">
                      <StarIcon className="w-6 h-6 text-gray-200" />
                      <span className="text-white">Saved Times</span>
                    </a>
                  </li>
                  <li>
                    <a href="#" className="flex items-center space-x-3 px-3 py-3 rounded-full hover:bg-gray-800">
                      <PlusCircleIcon className="w-6 h-6 text-gray-200" />
                      <span className="text-white">Add Timezone</span>
                    </a>
                  </li>
                  
                  {/* Divider */}
                  <div className="my-2 border-t border-gray-800"></div>
                  
                  {/* Global Info Section */}
                  <li>
                    <a href="#" className="flex items-center space-x-3 px-3 py-3 rounded-full hover:bg-gray-800">
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