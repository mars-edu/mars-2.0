
import React from 'react';

interface ProgressCheckProps {
  isCompleted: boolean;
}

export const ProgressCheck: React.FC<ProgressCheckProps> = ({ isCompleted }) => {
  return (
    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
      isCompleted 
        ? 'bg-orange-500 shadow-md transform scale-100' 
        : 'bg-gray-200 border border-transparent'
    }`}>
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        className={`w-3.5 h-3.5 transition-all duration-300 ${isCompleted ? 'opacity-100' : 'opacity-0'}`}
        stroke="white" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  );
};
