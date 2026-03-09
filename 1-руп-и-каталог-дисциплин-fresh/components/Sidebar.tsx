import React from 'react';
import { SidebarItem } from '../types';
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from '../constants';
import { Theme } from '../App';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  theme?: Theme;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, theme = 'light' }) => {
  
  const handleItemClick = (id: string) => {
    onNavigate(id);
  };

  const getSidebarBg = () => {
    switch (theme) {
      case 'dark': return 'bg-gray-900 border-gray-800';
      case 'lavender': return 'bg-purple-50/50 border-purple-100';
      case 'coral': return 'bg-orange-50/50 border-orange-100';
      case 'graphite': return 'bg-slate-100 border-slate-200';
      default: return 'bg-white border-gray-100';
    }
  };

  const getLogoBg = () => {
    switch (theme) {
      case 'dark': return 'bg-gray-800 text-white';
      case 'lavender': return 'bg-purple-600 text-white';
      case 'coral': return 'bg-orange-500 text-white';
      case 'graphite': return 'bg-slate-700 text-white';
      default: return 'bg-gray-900 text-white';
    }
  };

  const renderItem = (item: SidebarItem) => {
    const isActive = currentView === item.id;

    // Apple-style: Active is a white "card" with shadow, Inactive is transparent
    let containerClass = '';
    let iconClass = '';

    if (theme === 'dark') {
       containerClass = isActive
        ? 'bg-gray-800 text-white shadow-sm ring-1 ring-white/10' 
        : 'text-gray-400 hover:text-white hover:bg-white/5';
       iconClass = isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300';
    } else {
       containerClass = isActive
        ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' 
        : 'text-gray-500 hover:text-gray-900 hover:bg-black/5';
       iconClass = isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600';
    }

    return (
      <button
        key={item.id}
        onClick={() => handleItemClick(item.id)}
        className={`w-full flex items-center gap-4 px-3.5 h-11 rounded-xl transition-all duration-200 group/item ${containerClass}`}
      >
        <item.icon 
          size={22} 
          strokeWidth={2} 
          className={`shrink-0 ${iconClass}`} 
        />
        <span className={`truncate leading-none font-bold text-[13px] transition-all duration-300 whitespace-nowrap ${
          isActive ? 'opacity-100' : 'opacity-0 group-hover/sidebar:opacity-100'
        }`}>
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <aside className={`w-20 hover:w-64 group/sidebar flex flex-col h-screen shrink-0 font-sans border-r transition-all duration-300 z-50 overflow-hidden ${getSidebarBg()}`}>
      {/* Logo Area */}
      <div className="h-16 flex items-center px-5 shrink-0 mb-2">
        <div 
          className="flex items-center gap-4 cursor-pointer group" 
          onClick={() => onNavigate('dashboard')}
        >
          <div className={`relative w-9 h-9 flex items-center justify-center rounded-xl shadow-md transition-all group-hover:scale-110 ${getLogoBg()}`}>
             <span className="font-bold text-sm">M</span>
          </div>
          <span className={`font-bold text-lg tracking-tight transition-all duration-300 opacity-0 group-hover/sidebar:opacity-100 whitespace-nowrap ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Mars</span>
        </div>
      </div>

      {/* Main Menu */}
      <div className="flex-1 overflow-y-auto px-2 space-y-2 custom-scrollbar">
        <div className="py-1 space-y-2">
          {SIDEBAR_ITEMS.map(renderItem)}
        </div>
      </div>

      {/* Bottom Menu */}
      <div className={`p-2 mt-auto border-t transition-colors duration-300 ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200/60'}`}>
        <div className="space-y-2">
          {BOTTOM_SIDEBAR_ITEMS.map(renderItem)}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
