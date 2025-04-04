import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface TimezoneCardProps {
  city: string;
  offset: string;
  currentTime: string;
  currentPeriod: string;
  isDaytime: boolean;
  dayProgress: number;
  onClose?: () => void;
}

interface TimeSlot {
  time: string;
  period: string;
  isPast: boolean;
  isCurrent: boolean;
}

export default function TimezoneCard({ 
  city, 
  offset, 
  currentTime, 
  currentPeriod,
  isDaytime,
  dayProgress,
  onClose 
}: TimezoneCardProps) {
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  // Generate time slots (30-minute intervals)
  const generateTimeSlots = (currentHour: number, currentMinute: number): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    let hour = currentHour - 2; // Start 2 hours before current time
    
    for (let i = 0; i < 8; i++) { // Show 8 slots
      const adjustedHour = hour < 0 ? hour + 24 : hour;
      const time = `${adjustedHour}:${currentMinute < 30 ? '00' : '30'}`;
      const period = adjustedHour >= 12 ? 'PM' : 'AM';
      const formattedHour = adjustedHour > 12 ? adjustedHour - 12 : adjustedHour === 0 ? 12 : adjustedHour;
      
      slots.push({
        time: `${formattedHour}:${currentMinute < 30 ? '00' : '30'}`,
        period,
        isPast: i < 4, // First 4 slots are in the past
        isCurrent: i === 4 // 5th slot is current time
      });
      
      if (currentMinute < 30) {
        currentMinute = 30;
      } else {
        currentMinute = 0;
        hour++;
      }
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots(8, 0); // Example: starting at 8:00

  return (
    <div className="rounded-xl bg-slate-900 p-4 w-full max-w-sm">
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h2 className="text-blue-300 text-lg font-medium">
            {city}<span className="text-gray-400 ml-2">{offset}</span>
          </h2>
          <div className="flex items-center space-x-2">
            <span className="text-4xl font-bold text-gray-100">{currentTime}</span>
            <span className="text-2xl text-gray-400">{currentPeriod}</span>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-700"
          >
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Day/Night Progress */}
      <div className="mb-4">
        <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full ${isDaytime ? 'bg-yellow-400' : 'bg-blue-400'}`}
            style={{ width: `${dayProgress}%` }}
          />
        </div>
        <span className="text-sm text-gray-400 mt-1">
          {isDaytime ? 'Day' : 'Night'}
        </span>
      </div>

      {/* Time Slots */}
      <div className="space-y-2">
        {timeSlots.map((slot, index) => (
          <div 
            key={slot.time}
            className={`
              p-3 rounded-lg flex justify-between items-center
              ${slot.isCurrent ? 'bg-pink-600' : 
                selectedTime === slot.time ? 'bg-blue-600' :
                'hover:bg-gray-800'}
            `}
            onClick={() => setSelectedTime(slot.time)}
          >
            <span className="text-white">
              {slot.time} {slot.period}
            </span>
            <div 
              className={`
                w-2 h-2 rounded-full
                ${slot.isPast ? 'bg-white' : 'border-2 border-white'}
              `}
            />
          </div>
        ))}
      </div>
    </div>
  );
} 