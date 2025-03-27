'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DateTime } from 'luxon';

export type CalendarProps = {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onClose: () => void;
  minDate?: Date;
  maxDate?: Date;
};

export function Calendar({
  selectedDate = new Date(),
  onDateSelect,
  onClose,
  minDate,
  maxDate,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(() => {
    return DateTime.fromJSDate(selectedDate).startOf('month');
  });

  // Create calendar grid for the current month
  const calendarDays = React.useMemo(() => {
    const days = [];
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    
    // Start from the beginning of the week containing the first day of the month
    let currentDay = startOfMonth.startOf('week');
    
    // Add days until we reach the end of the week containing the last day of the month
    while (currentDay <= endOfMonth.endOf('week')) {
      days.push(currentDay);
      currentDay = currentDay.plus({ days: 1 });
    }
    
    return days;
  }, [currentMonth]);

  // Handle navigation between months
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => prev.minus({ months: 1 }));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => prev.plus({ months: 1 }));
  };

  // Handle date selection
  const handleDateClick = (day: DateTime) => {
    onDateSelect(day.toJSDate());
    onClose();
  };

  // Check if a date is selectable based on min/max constraints
  const isDateSelectable = (date: DateTime) => {
    if (minDate && date < DateTime.fromJSDate(minDate)) return false;
    if (maxDate && date > DateTime.fromJSDate(maxDate)) return false;
    return true;
  };

  return (
    <div className="p-3 bg-background border rounded-lg shadow-lg">
      {/* Calendar header with month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        <h2 className="font-medium">
          {currentMonth.toFormat('MMMM yyyy')}
        </h2>
        
        <button
          type="button"
          onClick={goToNextMonth}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2 text-center text-xs font-medium text-muted-foreground">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const isCurrentMonth = day.month === currentMonth.month;
          const isToday = day.hasSame(DateTime.local(), 'day');
          const isSelected = day.hasSame(DateTime.fromJSDate(selectedDate), 'day');
          const isSelectable = isDateSelectable(day);
          
          return (
            <button
              key={day.toISO()}
              type="button"
              onClick={() => isSelectable && handleDateClick(day)}
              disabled={!isSelectable}
              className={`
                h-9 w-9 rounded-full flex items-center justify-center text-sm
                ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground opacity-50'}
                ${isToday ? 'border border-primary/50' : ''}
                ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                ${isSelectable && !isSelected ? 'hover:bg-accent' : ''}
                ${!isSelectable ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {day.day}
            </button>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            const today = DateTime.local().startOf('day');
            if (isDateSelectable(today)) {
              onDateSelect(today.toJSDate());
              onClose();
            }
          }}
          className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          Today
        </button>
        
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
} 