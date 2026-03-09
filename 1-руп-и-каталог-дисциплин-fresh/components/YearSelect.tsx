import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const YearSelect: React.FC = () => {
  const [year, setYear] = useState('2024');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const years = ['2022', '2023', '2024', '2025', '2026'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-gray-600 font-medium hover:text-gray-900 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
      >
        <span className="text-lg">{year}</span>
        <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => {
                setYear(y);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-500 flex items-center justify-between group cursor-pointer"
            >
              <span>{y}</span>
              {year === y && <Check size={14} className="text-red-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default YearSelect;