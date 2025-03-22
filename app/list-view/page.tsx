"use client";

import React, { useState, useEffect, useMemo } from "react";
import ListView from "@/components/views/ListView";
import { DateTime } from "luxon";
import { Timezone } from "@/store/timezoneStore";
import { getLocalTimezone } from "@/lib/utils/timezone";

export default function ListViewPage() {
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
    <div className="w-full min-h-screen flex flex-col p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">World Clock - List View</h1>
      
      <div className="flex-1 border rounded-md overflow-hidden w-full">
        <ListView
          selectedTimezones={selectedTimezones}
          userLocalTimezone={userLocalTimezone}
          timeSlots={timeSlots}
          localTime={localTime}
          highlightedTime={highlightedTime}
          handleTimeSelection={handleTimeSelection}
          roundToNearestIncrement={roundToNearestIncrement}
        />
      </div>
    </div>
  );
} 