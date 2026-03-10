import React, { useState } from 'react';
import { Rup } from '../types';
import { Plus, Filter, Search } from 'lucide-react';
import { SPECIALTIES } from '../constants';

interface RupViewProps {
  rupData: Rup[];
  onAddRup: () => void;
}

export const RupView: React.FC<RupViewProps> = ({ rupData, onAddRup }) => {
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<number | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = rupData.filter(item => {
    const matchesSpecialty = selectedSpecialty === 'all' || item.specialty === selectedSpecialty;
    const matchesCourse = selectedCourse === 'all' || item.course === selectedCourse;
    const matchesSearch = item.discipline.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSpecialty && matchesCourse && matchesSearch;
  });

  return (
    <div className="h-full flex flex-col bg-[#F5F5F7] p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1D1D1F] tracking-tight">Рабочий учебный план (РУП)</h1>
            <p className="text-gray-500 font-medium mt-1">Управление учебным планом</p>
          </div>
          <button 
            onClick={onAddRup}
            className="bg-[#007AFF] hover:bg-[#0062CC] text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus size={18} />
            <span>Добавить дисциплину</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
            <div className="relative flex-grow max-w-xs">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Поиск дисциплины..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent hover:border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
            </div>
            
            <div className="h-8 w-px bg-gray-200 mx-2 hidden md:block"></div>

            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-medium">Специальность:</span>
                <select 
                    value={selectedSpecialty} 
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="bg-gray-50 border border-transparent hover:border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
                >
                    <option value="all">Все специальности</option>
                    {SPECIALTIES.map(s => (
                        <option key={s.code} value={s.code}>{s.name}</option>
                    ))}
                </select>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-medium">Курс:</span>
                <select 
                    value={selectedCourse} 
                    onChange={(e) => setSelectedCourse(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                    className="bg-gray-50 border border-transparent hover:border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
                >
                    <option value="all">Все курсы</option>
                    <option value={1}>1 Курс</option>
                    <option value={2}>2 Курс</option>
                    <option value={3}>3 Курс</option>
                    <option value={4}>4 Курс</option>
                </select>
            </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[24px] shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                        <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-semibold text-gray-500 border-b border-gray-100">Дисциплина</th>
                        <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-semibold text-gray-500 border-b border-gray-100">Специальность</th>
                        <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-semibold text-gray-500 border-b border-gray-100 text-center">Курс / Семестр</th>
                        <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-semibold text-gray-500 border-b border-gray-100 text-center">Часы (Л/П/Лб)</th>
                        <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-semibold text-gray-500 border-b border-gray-100 text-center">Кредиты</th>
                        <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-semibold text-gray-500 border-b border-gray-100 text-center">Контроль</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {filteredData.length > 0 ? (
                        filteredData.map((item) => (
                            <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-gray-900">{item.discipline}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-600">
                                        {SPECIALTIES.find(s => s.code === item.specialty)?.name || item.specialty}
                                    </div>
                                    <div className="text-xs text-gray-400 font-mono mt-0.5">{item.specialty}</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        {item.course} курс, {item.semester} сем.
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                                        <span title="Лекции" className="text-blue-600">{item.lectureHours}</span>
                                        <span className="text-gray-300">/</span>
                                        <span title="Практика" className="text-green-600">{item.practiceHours}</span>
                                        <span className="text-gray-300">/</span>
                                        <span title="Лабораторные" className="text-orange-600">{item.labHours}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="font-bold text-gray-800">{item.credits}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`
                                        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                        ${item.controlForm === 'exam' ? 'bg-red-100 text-red-800' : 
                                          item.controlForm === 'diff_credit' ? 'bg-yellow-100 text-yellow-800' : 
                                          'bg-green-100 text-green-800'}
                                    `}>
                                        {item.controlForm === 'exam' ? 'Экзамен' : 
                                         item.controlForm === 'diff_credit' ? 'Диф. зачет' : 'Зачет'}
                                    </span>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                <div className="flex flex-col items-center gap-2">
                                    <Filter size={32} className="opacity-20" />
                                    <span>Дисциплины не найдены</span>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
            <span>Всего дисциплин: {filteredData.length}</span>
            <div className="flex gap-4">
                <span>Лекций: {filteredData.reduce((acc, i) => acc + i.lectureHours, 0)} ч.</span>
                <span>Практики: {filteredData.reduce((acc, i) => acc + i.practiceHours, 0)} ч.</span>
            </div>
        </div>
      </div>
    </div>
  );
};
