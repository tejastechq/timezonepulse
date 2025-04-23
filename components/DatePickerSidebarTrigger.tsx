import { useState } from 'react';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { DatePicker } from './ui/date-picker';

interface DatePickerSidebarTriggerProps {
  onSidebarCollapse: () => void;
}

export function DatePickerSidebarTrigger({ onSidebarCollapse }: DatePickerSidebarTriggerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleOpen = () => {
    onSidebarCollapse();
    setShowPicker(true);
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setShowPicker(false);
    // Optionally: trigger any global state update here
  };

  return (
    <>
      <button
        className="flex items-center space-x-3 px-3 py-3 rounded-full hover:bg-gray-800 w-full"
        onClick={handleOpen}
        type="button"
      >
        <CalendarDaysIcon className="w-6 h-6 text-gray-200" />
        <span className="text-white">Select Date</span>
      </button>
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowPicker(false)} />
          <div className="relative z-10">
            <DatePicker
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
            />
          </div>
        </div>
      )}
    </>
  );
} 