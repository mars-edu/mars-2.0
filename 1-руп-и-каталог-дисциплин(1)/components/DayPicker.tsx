
import React from 'react';
import { DayOfWeek } from '../types';

interface DayPickerProps {
  selectedDays: DayOfWeek[];
  onToggle: (day: DayOfWeek) => void;
}

export const DayPicker: React.FC<DayPickerProps> = ({ selectedDays, onToggle }) => {
  const days = Object.values(DayOfWeek);

  return (
    <div className="grid grid-cols-7 gap-1.5 w-full">
      {days.map((day) => {
        const isSelected = selectedDays.includes(day);
        return (
          <button
            key={day}
            onClick={() => onToggle(day)}
            className={`w-full h-10 rounded-xl text-[12px] font-semibold flex items-center justify-center transition-all duration-200 ${
              isSelected 
                ? 'bg-black text-white shadow-md transform scale-[1.02]' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 active:scale-95'
            }`}
          >
            {day}
          </button>
        );
      })}
    </div>
  );
};
