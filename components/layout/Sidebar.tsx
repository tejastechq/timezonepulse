'use client'; // Add this directive

import React from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Import Next Image
// Import necessary icons from lucide-react
import { Home, Plus, Crown, User, ChevronRight, History, Star as LucideStar } from 'lucide-react'; // Removed Asterisk
import { useTimezoneStore } from '@/store/timezoneStore'; // Import the store

const Sidebar = () => {
  const { openTimezoneSelector } = useTimezoneStore(); // Get the action from the store

  return (
    // Main container: Floating, glassmorphism (adjusted opacity), rounded corners, padding, margin
    <div className="fixed left-4 top-4 h-[calc(100vh-2rem)] w-[72px] bg-[#1E1F22]/60 backdrop-blur-md text-white flex flex-col items-center py-4 space-y-4 rounded-2xl z-50 border border-white/10 shadow-lg"> {/* Changed opacity from /75 to /60 */}
      {/* Logo */}
      <div className="w-12 h-12 flex items-center justify-center mb-2">
        <Image
          src="/timezonepulse.png"
          alt="TimezonePulse Logo"
          width={48}
          height={48}
          className="rounded-lg" // Optional: Add rounding if needed
        />
      </div>

      <hr className="w-10 border-gray-600" />

      {/* Add Icon */}
      <button 
        className="p-3 rounded-2xl bg-white text-gray-900 hover:bg-gray-200 transition-colors duration-150"
        onClick={openTimezoneSelector} // Add onClick handler
        aria-label="Add timezone"
      >
        <Plus size={24} />
      </button>

      {/* Home Icon */}
      <Link href="/" passHref>
        <button className="p-3 rounded-2xl bg-[#313338] hover:bg-[#3F4147] transition-colors duration-150">
          <Home size={20} />
        </button>
      </Link>

      {/* Small Icons */}
      <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#313338] transition-colors duration-150">
        <History size={18} /> {/* Using History icon */}
      </button>
      <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#313338] transition-colors duration-150">
        <LucideStar size={18} /> {/* Using Star icon */}
      </button>

      {/* Spacer */}
      <div className="flex-grow"></div>

      {/* Crown Icon */}
      <button className="p-3 rounded-2xl bg-[#5865F2] hover:bg-[#4752C4] transition-colors duration-150">
        <Crown size={20} />
      </button>

      {/* User Avatar */}
      <button className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden hover:opacity-90 transition-opacity duration-150">
        {/* Placeholder: Needs actual image */}
        <User size={20} />
      </button>

      {/* Removed Collapse/Expand Arrow */}
       {/* <button className="absolute top-5 -right-[10px] p-[2px] bg-[#2B2D31]/80 backdrop-blur-sm rounded-full text-gray-400 hover:bg-gray-600 transition-colors duration-150 shadow-md border border-white/10">
        <ChevronRight size={16} />
      </button> */}
    </div>
  );
};

export default Sidebar;
