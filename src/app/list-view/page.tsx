"use client";

import React, { useState } from "react";
import { ListView } from "@/components/ListView";
import { getCommonTimezones, TimezoneInfo } from "@/lib/timezone-utils";
import { DateTime } from "luxon";

export default function ListViewPage() {
  const [timezones, setTimezones] = useState<TimezoneInfo[]>(getCommonTimezones());
  const [selectedTime, setSelectedTime] = useState<DateTime | undefined>(undefined);

  const handleAddTimezone = () => {
    // In a real app, you would show a modal or dropdown to select a new timezone
    alert("In a real app, this would open a timezone selector");
  };

  const handleRemoveTimezone = (id: string) => {
    setTimezones(timezones.filter(tz => tz.id !== id));
  };

  const handleTimezoneReorder = (fromIndex: number, toIndex: number) => {
    const newTimezones = [...timezones];
    const [movedItem] = newTimezones.splice(fromIndex, 1);
    newTimezones.splice(toIndex, 0, movedItem);
    setTimezones(newTimezones);
  };

  const handleTimeSelect = (time: DateTime) => {
    setSelectedTime(time);
  };

  return (
    <div className="container mx-auto h-screen flex flex-col p-4">
      <h1 className="text-2xl font-bold mb-4">World Clock - List View</h1>
      
      <div className="flex-1 border rounded-md overflow-hidden">
        <ListView
          timezones={timezones}
          onAddTimezone={handleAddTimezone}
          onRemoveTimezone={handleRemoveTimezone}
          onTimezoneReorder={handleTimezoneReorder}
          onTimeSelect={handleTimeSelect}
          selectedTime={selectedTime}
          defaultView="day"
          showBusinessHours={true}
        />
      </div>
    </div>
  );
} 