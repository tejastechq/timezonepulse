"use client";

import { useState, useMemo, useEffect } from 'react';
import ListView from '@/components/views/ListView';
import { Timezone } from '@/store/timezoneStore';
import { getLocalTimezone } from '@/lib/utils/timezone';

export default function Home() {
  const [activeTab, setActiveTab] = useState('list');
  
  // State for managing time slots 
  const [localTime, setLocalTime] = useState<Date | null>(new Date());
  const [highlightedTime, setHighlightedTime] = useState<Date | null>(null);
  const [selectedTimezones, setSelectedTimezones] = useState<Timezone[]>([
    { id: "America/New_York", name: "New York (America/New_York)", city: "New York", country: "United States" },
    { id: "Europe/London", name: "London (Europe/London)", city: "London", country: "United Kingdom" },
    { id: "Asia/Tokyo", name: "Tokyo (Asia/Tokyo)", city: "Tokyo", country: "Japan" },
  ]);
  
  // Local timezone
  const userLocalTimezone = getLocalTimezone();
  
  // Generate time slots for the day
  const timeSlots = useMemo(() => {
    const slots: Date[] = [];
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    
    // Generate 48 slots (24 hours with 30-minute intervals)
    for (let i = 0; i < 48; i++) {
      const slot = new Date(startOfDay);
      slot.setMinutes(i * 30);
      slots.push(slot);
    }
    
    return slots;
  }, []);
  
  // Update local time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setLocalTime(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Handle time selection
  const handleTimeSelection = (time: Date | null) => {
    setHighlightedTime(time);
  };
  
  // Round time to nearest increment (for snapping to time slots)
  const roundToNearestIncrement = (date: Date, increment: number) => {
    const minutes = date.getMinutes();
    const remainder = minutes % increment;
    const roundedMinutes = remainder < increment / 2 
      ? minutes - remainder 
      : minutes + (increment - remainder);
    
    const rounded = new Date(date);
    rounded.setMinutes(roundedMinutes);
    rounded.setSeconds(0);
    rounded.setMilliseconds(0);
    
    return rounded;
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold text-center">World Clock</h1>
      </header>
      
      <nav className="flex p-2 bg-gray-100 dark:bg-gray-800">
        <button 
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 rounded-md flex items-center ${activeTab === 'list' ? 'bg-blue-500 text-white' : 'bg-transparent'}`}
        >
          <span className="mr-2">☰</span> List
        </button>
        <button 
          onClick={() => setActiveTab('clocks')}
          className={`px-4 py-2 rounded-md flex items-center ${activeTab === 'clocks' ? 'bg-blue-500 text-white' : 'bg-transparent'}`}
        >
          <span className="mr-2">⏱</span> Clocks
        </button>
        <button 
          onClick={() => setActiveTab('digital')}
          className={`px-4 py-2 rounded-md flex items-center ${activeTab === 'digital' ? 'bg-blue-500 text-white' : 'bg-transparent'}`}
        >
          <span className="mr-2">🔢</span> Digital
        </button>
      </nav>
      
      <main className="p-4">
        {activeTab === 'list' && (
          <ListView
            selectedTimezones={selectedTimezones}
            userLocalTimezone={userLocalTimezone}
            timeSlots={timeSlots}
            localTime={localTime}
            highlightedTime={highlightedTime}
            handleTimeSelection={handleTimeSelection}
            roundToNearestIncrement={roundToNearestIncrement}
          />
        )}
        {activeTab === 'clocks' && <div>Clocks View (Not Implemented)</div>}
        {activeTab === 'digital' && <div>Digital View (Not Implemented)</div>}
      </main>
    </div>
  );
} 