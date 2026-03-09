
import React, { useState } from 'react';
import { Book, Users, User, ChevronRight, GraduationCap, LayoutGrid, Plus, Filter } from 'lucide-react';
import { Journal } from '../types';

interface JournalListViewProps {
    onSelectJournal: (journalId: number) => void;
    journals: Journal[];
    onOpenScheduleModal: () => void;
}

export const JournalListView: React.FC<JournalListViewProps> = ({ onSelectJournal, journals, onOpenScheduleModal }) => {
    const [activeFilter, setActiveFilter] = useState<'all' | 'course-1' | 'course-2' | 'course-3' | 'course-4' | 'mixed' | 'individual'>('all');

    const filters = [
        { id: 'all', label: 'Все' },
        { id: 'course-1', label: '1 Курс' },
        { id: 'course-2', label: '2 Курс' },
        { id: 'course-3', label: '3 Курс' },
        { id: 'course-4', label: '4 Курс' },
        { id: 'mixed', label: 'Смешанные' },
        { id: 'individual', label: 'Индивидуальные' },
    ];

    const filteredJournals = journals.filter(j => {
        if (activeFilter === 'all') return true;
        if (activeFilter.startsWith('course-')) {
            const courseNum = parseInt(activeFilter.split('-')[1]);
            return j.type === 'course' && j.courseNumber === courseNum;
        }
        return j.type === activeFilter;
    });

    return (
        <div className="h-full flex flex-col bg-[#F5F5F7] p-6 md:p-8">
            <div className="mb-6 flex flex-col gap-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-[#1D1D1F] tracking-tight">Журналы</h1>
                        <p className="text-gray-500 font-medium mt-1">Выберите журнал для работы</p>
                    </div>
                    <button 
                        onClick={onOpenScheduleModal}
                        className="bg-[#34C759] hover:bg-[#28a745] text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm transition-all flex items-center gap-2 active:scale-95"
                    >
                        <Plus size={18} />
                        <span>Создать журнал</span>
                    </button>
                </div>

                {/* Filter Bar */}
                <div className="flex items-center gap-1 bg-gray-200/50 p-1 rounded-xl self-start overflow-x-auto no-scrollbar max-w-full">
                    {filters.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setActiveFilter(f.id as any)}
                            className={`
                                px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-200 whitespace-nowrap
                                ${activeFilter === f.id 
                                    ? 'bg-white text-gray-900 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}
                            `}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredJournals.map(journal => (
                        <div 
                            key={journal.id}
                            onClick={() => onSelectJournal(journal.id)}
                            className="bg-white p-4 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-white hover:border-blue-200 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden flex flex-col"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${journal.color.replace('bg-', 'bg-opacity-10 text-').replace('500', '600')}`}>
                                    {React.cloneElement(journal.icon as React.ReactElement, { size: 20, className: journal.color.replace('bg-', 'text-').replace('500', '600') })}
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    {journal.courseNumber && (
                                        <div className="bg-blue-50 px-2 py-0.5 rounded-md text-[9px] font-bold text-blue-600 uppercase tracking-wide">
                                            {journal.courseNumber} Курс
                                        </div>
                                    )}
                                    <div className="bg-[#F5F5F7] px-2 py-0.5 rounded-md text-[9px] font-bold text-gray-500 group-hover:bg-gray-100 transition-colors">
                                        {journal.studentCount} студ.
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-[15px] font-bold text-[#1D1D1F] leading-tight mb-1 group-hover:text-[#007AFF] transition-colors line-clamp-1">
                                    {journal.title}
                                </h3>
                                <p className="text-[12px] text-gray-500 leading-relaxed line-clamp-2">
                                    {journal.description}
                                </p>
                            </div>

                            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                <div className="w-7 h-7 bg-[#F5F5F7] rounded-full flex items-center justify-center text-[#007AFF]">
                                    <ChevronRight size={14} />
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {filteredJournals.length === 0 && (
                        <div className="col-span-full h-40 rounded-[24px] border-2 border-dashed border-gray-200/60 flex flex-col items-center justify-center text-gray-400 gap-3">
                            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                                <Filter size={24} className="opacity-40" />
                            </div>
                            <span className="text-sm font-medium opacity-60">В этой категории нет журналов</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
