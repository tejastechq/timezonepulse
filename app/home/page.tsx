'use client';

import { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import { 
  XMarkIcon,
  ClockIcon,
  GlobeAltIcon,
  CalendarDaysIcon,
  StarIcon,
  NewspaperIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  PlusCircleIcon
} from '@heroicons/react/24/outline';

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Configure swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedRight: () => setSidebarOpen(true),
    onSwipedLeft: () => setSidebarOpen(false),
    trackMouse: false,
    delta: 50, // minimum swipe distance (px)
    preventScrollOnSwipe: true,
    swipeDuration: 500, // maximum time for swipe motion (ms)
  });

  return (
    <main className="min-h-screen mobile-desktop-container" {...swipeHandlers}>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 flex items-center justify-between h-14 px-4 border-b border-white/10 bg-[#1E1F22]/60 backdrop-blur-md z-50 shadow-lg">
        {/* Left - Profile icon */}
        <button 
          aria-label="Menu" 
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors duration-150"
          onClick={toggleSidebar}
        >
          <UserCircleIcon className="w-7 h-7 text-gray-200" />
        </button>
        
        {/* Center - Logo */}
        <div className="flex items-center justify-center">
          <ClockIcon className="w-8 h-8 text-blue-500" />
        </div>
        
        {/* Right side - Empty for now */}
        <div className="w-8 h-8">
        </div>
      </div>
      
      {/* Sidebar with overlay */}
      <>
        {/* Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
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
      </>
      
      {/* Page content */}
      <div className="pt-16 px-4">
      </div>
    </main>
  );
} 