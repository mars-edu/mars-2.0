import React, { useState } from 'react';
import { Search, Bell, User, ChevronDown, Check } from 'lucide-react';
import { Theme } from '../App';

interface HeaderProps {
  theme?: Theme;
  setTheme?: (theme: Theme) => void;
}

const Header: React.FC<HeaderProps> = ({ theme = 'light', setTheme }) => {
  const [lang, setLang] = useState<'kz' | 'ru'>('ru');
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const themes: { id: Theme; color: string; label: string }[] = [
    { id: 'light', color: '#ffffff', label: 'Светлая' },
    { id: 'dark', color: '#1f2937', label: 'Темная' },
    { id: 'lavender', color: '#f3e8ff', label: 'Лавандовая' },
    { id: 'coral', color: '#fff7ed', label: 'Коралловая' },
    { id: 'graphite', color: '#f1f5f9', label: 'Графитовая' },
  ];

  const getHeaderBg = () => {
    switch (theme) {
      case 'dark': return 'bg-gray-800 border-gray-700';
      case 'lavender': return 'bg-white/80 border-purple-100 backdrop-blur-md';
      case 'coral': return 'bg-white/80 border-orange-100 backdrop-blur-md';
      case 'graphite': return 'bg-white/80 border-slate-200 backdrop-blur-md';
      default: return 'bg-white/80 border-gray-100 backdrop-blur-md';
    }
  };

  return (
    <header className={`h-16 flex items-center justify-between px-6 shrink-0 z-10 transition-colors duration-300 border-b ${getHeaderBg()}`}>
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Поиск..."
            className={`block w-full pl-10 pr-3 py-2 border border-transparent rounded-full text-sm transition-all focus:ring-4 focus:ring-blue-500/10 ${
              theme === 'dark' 
                ? 'bg-gray-700 text-white placeholder-gray-400 focus:bg-gray-600' 
                : 'bg-[#F2F2F7] text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500/20 shadow-inner'
            }`}
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 ml-4">
        
        {/* Language Switcher - Compact Toggle */}
        <div className={`flex p-0.5 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
           <button 
             onClick={() => setLang('kz')}
             className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${lang === 'kz' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
           >
             KZ
           </button>
           <button 
             onClick={() => setLang('ru')}
             className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${lang === 'ru' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
           >
             RU
           </button>
        </div>

        <div className="h-6 w-px bg-gray-200 mx-1"></div>

        {/* Theme Switcher - Color Dots */}
        <div className={`flex items-center gap-2 p-1.5 rounded-full border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-100 shadow-sm'}`}>
           {themes.map((t) => (
             <button
               key={t.id}
               onClick={() => setTheme?.(t.id)}
               title={t.label}
               className={`w-5 h-5 rounded-full border transition-transform hover:scale-110 flex items-center justify-center ${theme === t.id ? 'ring-2 ring-offset-1 ring-blue-500 scale-110' : 'border-gray-200'}`}
               style={{ backgroundColor: t.color }}
             >
               {theme === t.id && <Check size={10} className={t.id === 'dark' ? 'text-white' : 'text-gray-600'} />}
             </button>
           ))}
        </div>

        {/* Notifications */}
        <button className={`p-2 rounded-full transition-colors relative ${theme === 'dark' ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* Profile */}
        <button className="ml-1 flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
          <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-sm">
            <span className="font-bold text-xs">AK</span>
          </div>
          <ChevronDown size={14} className="text-gray-400" />
        </button>
      </div>
    </header>
  );
};

export default Header;
