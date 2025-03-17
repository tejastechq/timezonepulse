"use client";

import React, { useState, useEffect, useMemo } from "react";
import { DateTime } from "luxon";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Calendar, 
  Sun, 
  Moon,
  Plus,
  Settings2
} from "lucide-react";

// Types for our timezone data
interface TimezoneInfo {
  id: string;
  name: string;
  city: string;
  abbreviation: string;
  offset: number;
  isDST: boolean;
  utcOffset: string;
}

interface TimeSlot {
  hour: number;
  minute: number;
  isBusinessHour: boolean;
  isSelected: boolean;
}

interface ListViewProps {
  timezones: TimezoneInfo[];
  onAddTimezone?: () => void;
  onRemoveTimezone?: (id: string) => void;
  onTimezoneReorder?: (fromIndex: number, toIndex: number) => void;
  onTimeSelect?: (time: DateTime) => void;
  selectedTime?: DateTime;
  defaultView?: "day" | "week";
  showBusinessHours?: boolean;
}

/**
 * ListView Component for World Clock Application
 * 
 * Displays a virtualized list of times across multiple timezones with options
 * for day/week view and meeting planning functionality
 */
export function ListView({
  timezones = [],
  onAddTimezone,
  onRemoveTimezone,
  onTimezoneReorder,
  onTimeSelect,
  selectedTime,
  defaultView = "day",
  showBusinessHours = true,
}: ListViewProps) {
  const [currentTime, setCurrentTime] = useState<DateTime>(DateTime.now());
  const [selectedDate, setSelectedDate] = useState<DateTime>(DateTime.now());
  const [view, setView] = useState<"day" | "week">(defaultView);
  const [displayHours, setDisplayHours] = useState<number>(24);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<Set<string>>(new Set());
  
  // Convert business hours from UTC to local timezone (typically 9 AM - 5 PM)
  const businessHoursStart = 9;
  const businessHoursEnd = 17;

  // Update the current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(DateTime.now());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Generate time slots for the current view
  const timeSlots = useMemo(() => {
    const slots: TimeSlot[] = [];
    const hoursToShow = view === "day" ? displayHours : displayHours * (view === "week" ? 7 : 1);
    
    for (let i = 0; i < hoursToShow; i++) {
      // For a day view, we show each hour
      if (view === "day") {
        const hour = i % 24;
        const isBusinessHour = hour >= businessHoursStart && hour < businessHoursEnd;
        
        slots.push({
          hour,
          minute: 0,
          isBusinessHour,
          isSelected: false
        });
        
        // Add 30-minute slots
        slots.push({
          hour,
          minute: 30,
          isBusinessHour,
          isSelected: false
        });
      } else {
        // For a week view, we generate 7 days worth of hourly slots
        const dayOffset = Math.floor(i / 24);
        const hour = i % 24;
        const isBusinessHour = hour >= businessHoursStart && hour < businessHoursEnd;
        
        slots.push({
          hour,
          minute: 0,
          isBusinessHour,
          isSelected: false
        });
      }
    }
    
    return slots;
  }, [view, displayHours]);

  // Create a virtualized list for better performance
  const parentRef = React.useRef<HTMLDivElement>(null);
  
  const rowVirtualizer = useVirtualizer({
    count: timeSlots.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // estimated row height
    overscan: 10,
  });

  // Column virtualizer for timezones
  const columnVirtualizer = useVirtualizer({
    count: timezones.length,
    getScrollElement: () => parentRef.current,
    horizontal: true,
    estimateSize: () => 200, // estimated column width
    overscan: 2,
  });

  // Format the time for display
  const formatTime = (timezone: TimezoneInfo, hour: number, minute: number): string => {
    const date = selectedDate
      .setZone(timezone.name)
      .set({ hour, minute, second: 0, millisecond: 0 });
    
    return date.toFormat("hh:mm a");
  };

  // Check if a time is in business hours for a timezone
  const isBusinessHour = (timezone: TimezoneInfo, hour: number): boolean => {
    if (!showBusinessHours) return false;
    
    const localDateTime = selectedDate
      .setZone(timezone.name)
      .set({ hour, minute: 0, second: 0, millisecond: 0 });
    
    // Convert to the timezone's business hours
    const localHour = localDateTime.hour;
    
    // Check if it's a weekday (Monday to Friday)
    const isWeekday = localDateTime.weekday >= 1 && localDateTime.weekday <= 5;
    
    return isWeekday && localHour >= businessHoursStart && localHour < businessHoursEnd;
  };

  // Handle time slot selection for meeting planning
  const handleTimeSlotSelect = (hour: number, minute: number) => {
    const timeKey = `${hour}:${minute}`;
    const newSelectedTimeSlots = new Set(selectedTimeSlots);
    
    if (newSelectedTimeSlots.has(timeKey)) {
      newSelectedTimeSlots.delete(timeKey);
    } else {
      newSelectedTimeSlots.add(timeKey);
    }
    
    setSelectedTimeSlots(newSelectedTimeSlots);
    
    // If callback provided, trigger it with the selected time
    if (onTimeSelect) {
      const newSelectedTime = selectedDate.set({ hour, minute, second: 0, millisecond: 0 });
      onTimeSelect(newSelectedTime);
    }
  };

  // Navigate to previous/next day or week
  const navigateDays = (direction: "prev" | "next") => {
    const daysToShift = view === "day" ? 1 : 7;
    if (direction === "prev") {
      setSelectedDate(selectedDate.minus({ days: daysToShift }));
    } else {
      setSelectedDate(selectedDate.plus({ days: daysToShift }));
    }
  };

  // Handle view change between day and week
  const handleViewChange = (newView: "day" | "week") => {
    setView(newView);
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Controls Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigateDays("prev")}
            aria-label="Previous day or week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="font-semibold">
            {view === "day" 
              ? selectedDate.toFormat("MMMM d, yyyy") 
              : `${selectedDate.toFormat("MMM d")} - ${selectedDate.plus({ days: 6 }).toFormat("MMM d, yyyy")}`
            }
          </div>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigateDays("next")}
            aria-label="Next day or week"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedDate(DateTime.now())}
            aria-label="Today"
          >
            Today
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <TabsList>
            <TabsTrigger 
              value="day" 
              onClick={() => handleViewChange("day")}
              aria-selected={view === "day"}
            >
              <Clock className="h-4 w-4 mr-1" />
              Day
            </TabsTrigger>
            <TabsTrigger 
              value="week" 
              onClick={() => handleViewChange("week")}
              aria-selected={view === "week"}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Week
            </TabsTrigger>
          </TabsList>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onAddTimezone}
            aria-label="Add timezone"
          >
            <Plus className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            aria-label="Settings"
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Hours Display Slider */}
      <div className="px-4 py-2 flex items-center gap-2 border-b">
        <span className="text-sm">Hours to display:</span>
        <div className="w-48">
          <Slider
            defaultValue={[displayHours]}
            min={12}
            max={48}
            step={12}
            onValueChange={(values) => setDisplayHours(values[0])}
          />
        </div>
        <span className="text-sm">{displayHours}h</span>
        
        <div className="ml-auto flex items-center gap-1">
          <Badge variant="outline" className="flex items-center gap-1">
            <Sun className="h-3 w-3" />
            Business Hours
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Moon className="h-3 w-3" />
            After Hours
          </Badge>
        </div>
      </div>

      {/* Timezones Header */}
      <div className="grid grid-cols-[120px_1fr] border-b">
        <div className="p-3 font-medium text-sm border-r">Time</div>
        <div className="overflow-x-auto">
          <div
            className="flex"
            style={{
              width: `${timezones.length * 200}px`,
            }}
          >
            {timezones.map((timezone, index) => (
              <div 
                key={timezone.id} 
                className="w-[200px] p-3 font-medium text-sm border-r flex items-center justify-between"
              >
                <div>
                  <div>{timezone.city}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <span>{timezone.abbreviation}</span>
                    <span>({timezone.utcOffset})</span>
                    {timezone.isDST && (
                      <Badge variant="outline" className="text-xs px-1 h-4">DST</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Virtualized Time Grid */}
      <div 
        ref={parentRef} 
        className="overflow-auto flex-1 grid grid-cols-[120px_1fr]"
      >
        {/* Time Column */}
        <div className="border-r">
          <div
            className="relative"
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const timeSlot = timeSlots[virtualRow.index];
              return (
                <div
                  key={virtualRow.index}
                  className="absolute top-0 left-0 w-full border-b p-3 flex items-center text-sm"
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {timeSlot.hour.toString().padStart(2, "0")}:
                  {timeSlot.minute.toString().padStart(2, "0")}
                </div>
              );
            })}
          </div>
        </div>

        {/* Timezone Columns */}
        <div className="overflow-x-auto">
          <div
            style={{
              width: `${columnVirtualizer.getTotalSize()}px`,
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const timeSlot = timeSlots[virtualRow.index];
              
              return columnVirtualizer.getVirtualItems().map((virtualCol) => {
                const timezone = timezones[virtualCol.index];
                const isWorkingHour = isBusinessHour(timezone, timeSlot.hour);
                const timeKey = `${timeSlot.hour}:${timeSlot.minute}`;
                const isSelected = selectedTimeSlots.has(timeKey);
                
                return (
                  <div
                    key={`${virtualRow.index}-${virtualCol.index}`}
                    className={cn(
                      "absolute border-b border-r p-3 flex items-center justify-center cursor-pointer",
                      isWorkingHour ? "bg-green-50" : "",
                      isSelected ? "bg-blue-100 border-blue-400" : "",
                    )}
                    style={{
                      top: `${virtualRow.start}px`,
                      left: `${virtualCol.start}px`,
                      width: `${virtualCol.size}px`,
                      height: `${virtualRow.size}px`,
                    }}
                    onClick={() => handleTimeSlotSelect(timeSlot.hour, timeSlot.minute)}
                  >
                    {formatTime(timezone, timeSlot.hour, timeSlot.minute)}
                    
                    {/* Show current time indicator */}
                    {currentTime.hour === timeSlot.hour && 
                     Math.floor(currentTime.minute / 30) * 30 === timeSlot.minute && 
                     currentTime.toFormat("ZZZZ") === timezone.name && (
                      <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                    )}
                  </div>
                );
              });
            })}
          </div>
        </div>
      </div>

      {/* Meeting Planner Panel (only visible when times are selected) */}
      {selectedTimeSlots.size > 0 && (
        <Card className="m-4">
          <CardHeader>
            <CardTitle>Meeting Planner</CardTitle>
            <CardDescription>
              {selectedTimeSlots.size} time slot{selectedTimeSlots.size !== 1 ? 's' : ''} selected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="text-sm">Selected times across timezones:</div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {Array.from(selectedTimeSlots).map(timeKey => {
                  const [hour, minute] = timeKey.split(':').map(Number);
                  
                  return (
                    <div key={timeKey} className="p-2 border rounded-md">
                      <div className="font-medium">{selectedDate.set({ hour, minute }).toFormat("hh:mm a")}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {timezones.map(tz => (
                          <div key={`${timeKey}-${tz.id}`} className="flex justify-between">
                            <span>{tz.city}:</span>
                            <span>
                              {selectedDate
                                .set({ hour, minute })
                                .setZone(tz.name)
                                .toFormat("hh:mm a")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedTimeSlots(new Set())}
                >
                  Clear Selection
                </Button>
                <Button>
                  Create Meeting
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 