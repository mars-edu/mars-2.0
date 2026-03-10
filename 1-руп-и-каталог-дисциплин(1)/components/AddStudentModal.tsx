import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, Check } from 'lucide-react';
import { Student, Gender } from '../types';
import { SPECIALTIES } from '../constants';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (studentData: any) => void;
  nextId: number;
}

const LANGUAGES = [
  { code: 'ru', name: 'Русский' },
  { code: 'kk', name: 'Казахский' },
];

const BASES = ['9 класс', '11 класс'];
const YEARS = [2021, 2022, 2023, 2024, 2025];

export const AddStudentModal: React.FC<AddStudentModalProps> = ({ isOpen, onClose, onSave, nextId }) => {
  const [formData, setFormData] = useState({
    surname: '',
    name: '',
    patronymic: '',
    year: 2025,
    specialty: '', 
    specialtyName: '',
    language: '',
    languageName: '',
    base: '',
    gender: 'male' as Gender,
    orderNumber: '',
    orderDate: new Date().toISOString().split('T')[0]
  });

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleClick = () => setActiveDropdown(null);
    if (isOpen) {
        window.addEventListener('click', handleClick);
    }
    return () => window.removeEventListener('click', handleClick);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDropdownSelect = (e: React.MouseEvent, type: string, value: any, name?: string) => {
      e.stopPropagation();
      const updates: any = { [type]: value };
      if (name) {
          updates[type + 'Name'] = name;
      }
      setFormData(prev => ({ ...prev, ...updates }));
      setActiveDropdown(null);
  };

  const toggleDropdown = (e: React.MouseEvent, type: string) => {
      e.stopPropagation();
      setActiveDropdown(activeDropdown === type ? null : type);
  };

  const handleSubmit = () => {
    const fullName = `${formData.surname} ${formData.name} ${formData.patronymic}`.trim();
    
    // Pass raw data, parent will handle history creation
    onSave({
        ...formData,
        fullName: fullName || `Student ${nextId}`,
        id: nextId,
        course: 1
    });
    
    // Reset form
    setFormData({
        surname: '',
        name: '',
        patronymic: '',
        year: 2025,
        specialty: '',
        specialtyName: '',
        language: '',
        languageName: '',
        base: '',
        gender: 'male',
        orderNumber: '',
        orderDate: new Date().toISOString().split('T')[0]
    });
    setActiveDropdown(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
        
        <div className="flex items-center justify-between p-6 pb-2 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">Зачисление абитуриента</h2>
            <div className="flex gap-2">
                <button 
                    onClick={onClose}
                    className="px-4 py-2 rounded text-red-500 hover:bg-red-100 hover:text-red-600 text-sm font-medium transition-colors"
                >
                    Отмена
                </button>
                <button 
                    onClick={handleSubmit}
                    className="px-6 py-2 rounded bg-green-500 text-white hover:bg-green-600 hover:shadow-md text-sm font-medium transition-colors shadow-sm"
                >
                    Зачислить
                </button>
            </div>
        </div>

        <div className="p-6 space-y-4">
            {/* Order Info Section */}
            <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mb-4">
                <h3 className="text-sm font-bold text-blue-800 mb-3">Данные приказа о зачислении</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600">Номер приказа</label>
                        <input 
                            type="text" 
                            className="w-full bg-white border border-blue-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 transition-colors hover:bg-blue-50 focus:bg-white hover:border-blue-300"
                            placeholder="Например: №234-К"
                            value={formData.orderNumber}
                            onChange={(e) => handleChange('orderNumber', e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600">Дата приказа</label>
                        <input 
                            type="date" 
                            className="w-full bg-white border border-blue-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 transition-colors hover:bg-blue-50 focus:bg-white hover:border-blue-300"
                            value={formData.orderDate}
                            onChange={(e) => handleChange('orderDate', e.target.value)}
                        />
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Surname */}
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 ml-1">Фамилия</label>
                    <input 
                        type="text" 
                        className="w-full bg-gray-50 border-none rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-300 outline-none hover:bg-gray-200 transition-colors focus:bg-white"
                        value={formData.surname}
                        onChange={(e) => handleChange('surname', e.target.value)}
                    />
                </div>
                {/* Name */}
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 ml-1">Имя</label>
                    <input 
                        type="text" 
                        className="w-full bg-gray-50 border-none rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-300 outline-none hover:bg-gray-200 transition-colors focus:bg-white"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                    />
                </div>
                {/* Patronymic */}
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 ml-1">Отчество</label>
                    <input 
                        type="text" 
                        className="w-full bg-gray-50 border-none rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-300 outline-none hover:bg-gray-200 transition-colors focus:bg-white"
                        value={formData.patronymic}
                        onChange={(e) => handleChange('patronymic', e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Year */}
                <div className="space-y-1 relative">
                    <label className="text-xs font-semibold text-gray-700 ml-1">Год поступления</label>
                    <div className="relative">
                        <button 
                            onClick={(e) => toggleDropdown(e, 'year')}
                            className="w-full bg-white border border-gray-200 rounded px-3 py-2 flex items-center justify-between text-sm hover:bg-gray-200 transition-colors hover:border-gray-300"
                        >
                            <span>{formData.year}</span>
                            <ChevronDown size={14} className="text-gray-400" />
                        </button>
                        {activeDropdown === 'year' && (
                            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-100 rounded-md shadow-lg z-50 max-h-40 overflow-y-auto">
                                {YEARS.map(year => (
                                    <div key={year} onClick={(e) => handleDropdownSelect(e, 'year', year)} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm transition-colors">
                                        {year}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Base */}
                <div className="space-y-1 relative">
                    <label className="text-xs font-semibold text-gray-700 ml-1">База образования</label>
                     <div className="relative">
                        <button 
                            onClick={(e) => toggleDropdown(e, 'base')}
                            className="w-full bg-white border border-gray-200 rounded px-3 py-2 flex items-center justify-between text-sm hover:bg-gray-200 transition-colors hover:border-gray-300"
                        >
                            <span>{formData.base || 'Выбрать...'}</span>
                            <ChevronDown size={14} className="text-gray-400" />
                        </button>
                        {activeDropdown === 'base' && (
                            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-100 rounded-md shadow-lg z-50">
                                {BASES.map(base => (
                                    <div key={base} onClick={(e) => handleDropdownSelect(e, 'base', base)} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm transition-colors">
                                        {base}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Specialty */}
                <div className="space-y-1 relative">
                    <label className="text-xs font-semibold text-gray-700 ml-1">Специальность</label>
                     <div className="relative">
                        <button 
                            onClick={(e) => toggleDropdown(e, 'specialty')}
                            className="w-full bg-white border border-gray-200 rounded px-3 py-2 flex items-center justify-between text-sm hover:bg-gray-200 transition-colors hover:border-gray-300"
                        >
                            <span className="truncate">{formData.specialtyName || 'Выбрать...'}</span>
                            <ChevronDown size={14} className="text-gray-400" />
                        </button>
                        {activeDropdown === 'specialty' && (
                            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-100 rounded-md shadow-lg z-50 max-h-40 overflow-y-auto">
                                {SPECIALTIES.map(spec => (
                                    <div key={spec.code} onClick={(e) => handleDropdownSelect(e, 'specialty', spec.code, spec.name)} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm transition-colors">
                                        {spec.name} ({spec.code})
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                
                 {/* Language */}
                <div className="space-y-1 relative">
                    <label className="text-xs font-semibold text-gray-700 ml-1">Язык</label>
                     <div className="relative">
                        <button 
                            onClick={(e) => toggleDropdown(e, 'language')}
                            className="w-full bg-white border border-gray-200 rounded px-3 py-2 flex items-center justify-between text-sm hover:bg-gray-200 transition-colors hover:border-gray-300"
                        >
                            <span>{formData.languageName || 'Выбрать...'}</span>
                            <ChevronDown size={14} className="text-gray-400" />
                        </button>
                        {activeDropdown === 'language' && (
                            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-100 rounded-md shadow-lg z-50">
                                {LANGUAGES.map(lang => (
                                    <div key={lang.code} onClick={(e) => handleDropdownSelect(e, 'language', lang.code, lang.name)} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm transition-colors">
                                        {lang.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Gender */}
            <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-gray-700 ml-1">Пол</label>
                <div className="flex w-full gap-4">
                    <button 
                        onClick={() => handleChange('gender', 'male')}
                        className={`flex-1 py-2 rounded-md text-sm border transition-colors ${formData.gender === 'male' ? 'bg-white border-blue-500 text-blue-600 shadow-sm ring-1 ring-blue-500' : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400 hover:bg-gray-200'}`}
                    >
                        Мужской
                    </button>
                    <button 
                         onClick={() => handleChange('gender', 'female')}
                        className={`flex-1 py-2 rounded-md text-sm border transition-colors ${formData.gender === 'female' ? 'bg-white border-pink-500 text-pink-600 shadow-sm ring-1 ring-pink-500' : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400 hover:bg-gray-200'}`}
                    >
                        Женский
                    </button>
                </div>
            </div>
            
            <div className="h-4"></div>
        </div>
      </div>
    </div>
  );
};