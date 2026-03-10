import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Users, TrendingUp, BookOpen, ChevronRight, MoreHorizontal, Bell, Plus, FileText, ArrowUpRight, Megaphone, AlertTriangle, Info, Trophy, Star, X } from 'lucide-react';

interface DashboardViewProps {
    onNavigate: (view: string) => void;
    activeSemester?: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, activeSemester = 'Семестр 1' }) => {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [announcementFilter, setAnnouncementFilter] = useState('all');
    const [selectedScheduleItem, setSelectedScheduleItem] = useState<any | null>(null);

    // Announcement Creation State
    const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState({
        title: '',
        description: '',
        date: '',
        category: 'academic', 
        type: 'info' 
    });

    // Mock Schedule Data
    const scheduleItems = [
        { id: 1, time: '09:00', endTime: '10:15', subject: 'История Казахстана', group: '2 ВаВэСФ', room: '213', type: 'lecture', color: 'bg-blue-500' },
        { id: 2, time: '10:30', endTime: '11:45', subject: 'Философия', group: '3 РЭХТ', room: '101', type: 'seminar', color: 'bg-orange-500' },
        { id: 3, time: '13:00', endTime: '14:15', subject: 'Культурология', group: '1 ИС', room: '205', type: 'lecture', color: 'bg-purple-500' },
        { id: 4, time: '14:30', endTime: '15:45', subject: 'История (Консультация)', group: '2 ВаВэСФ', room: 'Кафедра', type: 'lab', color: 'bg-green-500' },
    ];

    // Mock Announcements Data
    const [announcements, setAnnouncements] = useState([
        { id: 1, title: 'Заседание кафедры', date: '5 января, 15:00', type: 'info', category: 'academic', description: 'Обсуждение плана на 2 семестр. Явка обязательна.', color: 'bg-blue-50 text-blue-600' },
        { id: 2, title: 'Срок сдачи ведомостей', date: 'до 10 января', type: 'alert', category: 'academic', description: 'Необходимо закрыть все электронные журналы до конца недели.', color: 'bg-red-50 text-red-600' },
        { id: 3, title: 'Обновление системы', date: '6 января', type: 'system', category: 'other', description: 'Плановые технические работы с 22:00 до 00:00.', color: 'bg-gray-100 text-gray-600' },
        { id: 4, title: 'Конкурс "Лучший куратор"', date: 'Заявки до 20.01', type: 'info', category: 'contests', description: 'Открыт прием заявок на ежегодный конкурс.', color: 'bg-yellow-50 text-yellow-600' },
        { id: 5, title: 'Новогодний концерт', date: '29 декабря', type: 'info', category: 'events', description: 'Праздничное мероприятие в актовом зале.', color: 'bg-purple-50 text-purple-600' },
    ]);

    const announcementFilters = [
        { id: 'all', label: 'Все' },
        { id: 'academic', label: 'Учебная часть' },
        { id: 'contests', label: 'Конкурсы' },
        { id: 'events', label: 'Мероприятия' },
        { id: 'other', label: 'Прочее' },
    ];

    const filteredAnnouncements = announcements.filter(item => 
        announcementFilter === 'all' || item.category === announcementFilter
    );

    const handleAddAnnouncement = () => {
        if (!newAnnouncement.title || !newAnnouncement.description) return;

        const newItem = {
            id: Date.now(),
            ...newAnnouncement,
            color: newAnnouncement.type === 'alert' ? 'bg-red-50 text-red-600' : 
                   newAnnouncement.type === 'system' ? 'bg-gray-100 text-gray-600' :
                   newAnnouncement.category === 'contests' ? 'bg-yellow-50 text-yellow-600' :
                   newAnnouncement.category === 'events' ? 'bg-purple-50 text-purple-600' :
                   'bg-blue-50 text-blue-600'
        };
        
        setAnnouncements([newItem, ...announcements]);
        setIsAnnouncementModalOpen(false);
        setNewAnnouncement({ title: '', description: '', date: '', category: 'academic', type: 'info' });
    };

    // Calendar Helper
    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay(); // 0 = Sun

    const renderCalendar = () => {
        const days = daysInMonth(selectedDate);
        const startDay = firstDayOfMonth(selectedDate) === 0 ? 6 : firstDayOfMonth(selectedDate) - 1; // Adjust for Mon start
        const daysArray = Array.from({ length: days }, (_, i) => i + 1);
        const emptyStart = Array.from({ length: startDay }, (_, i) => i);

        const currentDay = new Date().getDate();
        const isCurrentMonth = new Date().getMonth() === selectedDate.getMonth();

        return (
            <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center text-sm mb-6">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
                    <div key={d} className="text-gray-400 text-xs font-medium uppercase">{d}</div>
                ))}
                {emptyStart.map(d => <div key={`empty-${d}`} />)}
                {daysArray.map(day => {
                    const isToday = isCurrentMonth && day === currentDay;
                    const isSelected = day === selectedDate.getDate();
                    // Mock event indicator logic
                    const hasEvent = [3, 15, 22, 27].includes(day);

                    return (
                        <div 
                            key={day} 
                            onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day))}
                            className={`
                                relative h-8 w-8 flex items-center justify-center rounded-full cursor-pointer transition-all duration-200
                                ${isSelected ? 'bg-[#FF3B30] text-white shadow-md font-bold' : 'hover:bg-gray-100 text-gray-700'}
                                ${isToday && !isSelected ? 'text-[#FF3B30] font-bold' : ''}
                            `}
                        >
                            {day}
                            {hasEvent && !isSelected && (
                                <div className="absolute bottom-1 w-1 h-1 bg-gray-300 rounded-full"></div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex h-full bg-transparent p-6 gap-6 overflow-hidden relative">
            {/* Center / Left Content - Fluid Width */}
            <div className="flex-1 flex flex-col overflow-y-auto pr-2 no-scrollbar">
                
                {/* Welcome Section */}
                <div className="mb-8 animate-in slide-in-from-bottom-4 duration-500">
                    <h1 className="text-3xl font-bold text-[#1D1D1F] mb-1 tracking-tight">Доброе утро, Расул Жангелдыулы!</h1>
                    <p className="text-gray-500 text-sm font-medium">Сегодня суббота, 3 января 2026 года</p>
                </div>

                {/* Stats Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-in slide-in-from-bottom-5 duration-700">
                    <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-white/50 flex flex-col justify-between h-36 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all cursor-default">
                        <div className="flex justify-between items-start">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-full">
                                <Users size={20} />
                            </div>
                            <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                                <TrendingUp size={12} /> +2.4%
                            </span>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-[#1D1D1F]">305</div>
                            <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">Всего студентов</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-white/50 flex flex-col justify-between h-36 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all cursor-default">
                        <div className="flex justify-between items-start">
                            <div className="p-2.5 bg-orange-50 text-orange-600 rounded-full">
                                <CalendarIcon size={20} />
                            </div>
                            <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{activeSemester}</span>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-[#1D1D1F]">18 неделя</div>
                            <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">Текущая неделя</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-white/50 flex flex-col justify-between h-36 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all cursor-default">
                        <div className="flex justify-between items-start">
                            <div className="p-2.5 bg-red-50 text-red-600 rounded-full">
                                <Clock size={20} />
                            </div>
                            <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full">-1.2%</span>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-[#1D1D1F]">94%</div>
                            <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">Посещаемость</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Recent Activity */}
                    <div className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-white/50 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-[#1D1D1F]">Последняя активность</h3>
                            <button onClick={() => onNavigate('protocol')} className="text-[#007AFF] text-sm font-medium hover:opacity-70 transition-opacity">Показать все</button>
                        </div>
                        <div className="space-y-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex gap-4 group cursor-pointer">
                                    <div className="mt-1">
                                        <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                            <FileText size={18} />
                                        </div>
                                    </div>
                                    <div className="border-b border-gray-100 pb-6 w-full group-last:border-0">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-bold text-[#1D1D1F]">Назначена пересдача (Запрос)</span>
                                            <span className="text-xs text-gray-400">14:30</span>
                                        </div>
                                        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                                            Преподаватель Килаш Расул Жангелдыулы назначил пересдачу экзамена в журнале БМ4 Владеть основами философских знаний.
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions (Report & Add Announcement) */}
                    <div className="flex flex-col gap-6">
                        {/* Report Card */}
                        <div className="bg-white rounded-[32px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-white/50 cursor-pointer hover:bg-gray-50 transition-colors group flex flex-col justify-between min-h-[180px]">
                             <div>
                                 <div className="flex justify-between items-start mb-6">
                                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                        <FileText size={28} />
                                    </div>
                                    <ArrowUpRight size={24} className="text-gray-300 group-hover:text-blue-500 transition-colors"/>
                                 </div>
                                 <h3 className="text-xl font-bold text-[#1D1D1F]">Сформировать отчет</h3>
                                 <p className="text-gray-500 text-sm mt-2 leading-relaxed">Выгрузка статистики успеваемости и посещаемости за текущий месяц.</p>
                             </div>
                             <div className="mt-4 pt-4 border-t border-gray-100">
                                 <span className="text-[#007AFF] text-sm font-bold flex items-center gap-1">Начать <ChevronRight size={14} /></span>
                             </div>
                        </div>

                        {/* Add Announcement Card */}
                         <div onClick={() => setIsAnnouncementModalOpen(true)} className="bg-white rounded-[32px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-white/50 cursor-pointer hover:bg-gray-50 transition-colors group flex flex-col justify-between min-h-[180px]">
                             <div>
                                 <div className="flex justify-between items-start mb-6">
                                    <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                                        <Megaphone size={28} />
                                    </div>
                                    <Plus size={24} className="text-gray-300 group-hover:text-orange-500 transition-colors"/>
                                 </div>
                                 <h3 className="text-xl font-bold text-[#1D1D1F]">Создать объявление</h3>
                                 <p className="text-gray-500 text-sm mt-2 leading-relaxed">Опубликовать новость для студентов или преподавателей.</p>
                             </div>
                             <div className="mt-4 pt-4 border-t border-gray-100">
                                 <span className="text-orange-500 text-sm font-bold flex items-center gap-1">Создать <ChevronRight size={14} /></span>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Announcements Section */}
                <div className="bg-white rounded-[32px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-white/50 animate-in slide-in-from-bottom-6 duration-700">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-100 text-orange-600 p-2 rounded-xl">
                                <Megaphone size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-[#1D1D1F]">Объявления и новости</h3>
                        </div>
                        
                        {/* Filter Tabs */}
                        <div className="flex p-1 bg-[#F5F5F7] rounded-xl overflow-x-auto no-scrollbar max-w-full">
                            {announcementFilters.map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => setAnnouncementFilter(filter.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                                        announcementFilter === filter.id 
                                        ? 'bg-white text-black shadow-sm' 
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredAnnouncements.length > 0 ? (
                            filteredAnnouncements.map((item) => (
                                <div key={item.id} className="p-5 rounded-[24px] border border-gray-100 bg-[#F9F9F9] hover:bg-white hover:shadow-md transition-all cursor-default group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide ${item.color}`}>
                                            {item.type === 'alert' ? 'Важно' : item.type === 'system' ? 'Система' : 'Инфо'}
                                        </div>
                                        <span className="text-xs text-gray-400 font-medium">{item.date}</span>
                                    </div>
                                    <h4 className="text-sm font-bold text-[#1D1D1F] mb-2 leading-tight group-hover:text-[#007AFF] transition-colors">{item.title}</h4>
                                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                                        {item.description}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-3 text-center py-8 text-gray-400 text-sm">Нет объявлений в этой категории</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Panel - Calendar & Schedule */}
            <div className="w-[400px] flex-shrink-0 flex flex-col gap-6 animate-in slide-in-from-right-4 duration-500">
                <div className="bg-white rounded-[32px] p-6 shadow-[0_12px_60px_rgba(0,0,0,0.05)] border border-white/60 h-full flex flex-col">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6 px-2">
                        <h2 className="text-lg font-bold text-[#1D1D1F]">Календарь</h2>
                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                            <MoreHorizontal size={20} />
                        </button>
                    </div>

                    {/* Calendar Widget */}
                    <div className="mb-8 border-b border-gray-100 pb-6">
                        <div className="flex justify-between items-center mb-4 px-2">
                            <span className="text-sm font-bold capitalize text-gray-800">
                                {selectedDate.toLocaleString('ru', { month: 'long', year: 'numeric' })}
                            </span>
                            <div className="flex gap-1">
                                <button className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-black transition-colors"><ChevronRight size={16} className="rotate-180" /></button>
                                <button className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-black transition-colors"><ChevronRight size={16} /></button>
                            </div>
                        </div>
                        {renderCalendar()}
                    </div>

                    {/* Schedule List */}
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        <div className="flex justify-between items-end mb-4 px-2">
                            <h3 className="text-base font-bold text-[#1D1D1F]">Расписание</h3>
                            <span className="text-xs text-gray-400 font-medium uppercase">Сегодня</span>
                        </div>

                        <div className="space-y-3">
                            {scheduleItems.map((item) => (
                                <div 
                                    key={item.id}
                                    onClick={() => setSelectedScheduleItem(item)}
                                    className="group p-4 rounded-[20px] bg-[#F5F5F7] hover:bg-white border border-transparent hover:border-gray-100 hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)] cursor-pointer transition-all duration-300 flex items-stretch gap-4"
                                >
                                    <div className="flex flex-col justify-center min-w-[48px]">
                                        <span className="text-[15px] font-bold text-[#1D1D1F] leading-none">{item.time}</span>
                                        <span className="text-[11px] text-gray-400 font-medium mt-1">{item.endTime}</span>
                                    </div>
                                    
                                    {/* Color Line */}
                                    <div className={`w-1 rounded-full ${item.color} opacity-40 group-hover:opacity-100 transition-opacity`}></div>

                                    <div className="flex-1 py-0.5">
                                        <div className="text-[14px] font-bold text-[#1D1D1F] mb-0.5 leading-tight group-hover:text-blue-600 transition-colors">
                                            {item.subject}
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium bg-white group-hover:bg-gray-100 px-2 py-1 rounded-md transition-colors">
                                                <Users size={12} />
                                                {item.group}
                                            </div>
                                            <div className="text-xs text-gray-400 font-medium">
                                                Ауд. {item.room}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {/* Empty State Mock */}
                            <div className="p-4 rounded-[20px] border border-dashed border-gray-200 flex items-center justify-center text-gray-400 text-xs font-medium cursor-pointer hover:bg-white hover:border-blue-300 hover:text-blue-500 transition-all">
                                <Plus size={14} className="mr-2" /> Добавить пару
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Schedule Item Modal */}
            {selectedScheduleItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedScheduleItem(null)}></div>
                    <div className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-3 rounded-2xl ${selectedScheduleItem.color.replace('bg-', 'bg-').replace('500', '100')} ${selectedScheduleItem.color.replace('bg-', 'text-').replace('500', '600')}`}>
                                <BookOpen size={24} />
                            </div>
                            <button 
                                onClick={() => setSelectedScheduleItem(null)}
                                className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 block">{selectedScheduleItem.type === 'lecture' ? 'Лекция' : 'Семинар'}</span>
                            <h3 className="text-2xl font-bold text-[#1D1D1F] mb-2 leading-tight">{selectedScheduleItem.subject}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-md">
                                    <Clock size={14} /> {selectedScheduleItem.time} - {selectedScheduleItem.endTime}
                                </div>
                                <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-md">
                                    <Users size={14} /> {selectedScheduleItem.group}
                                </div>
                            </div>
                            <div className="mt-3 text-sm text-gray-500 flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                Аудитория {selectedScheduleItem.room}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button 
                                onClick={() => onNavigate('journals')}
                                className="w-full bg-[#FF9500] hover:bg-[#E08300] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <FileText size={18} />
                                Открыть журнал
                            </button>
                            <button 
                                onClick={() => setSelectedScheduleItem(null)}
                                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-xl transition-all active:scale-95"
                            >
                                Закрыть
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Announcement Modal */}
            {isAnnouncementModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAnnouncementModalOpen(false)}></div>
                    <div className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-[#1D1D1F]">Новое объявление</h2>
                            <button onClick={() => setIsAnnouncementModalOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Заголовок</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="Например: Собрание старост"
                                    value={newAnnouncement.title}
                                    onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Дата</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        placeholder="Например: 10 января"
                                        value={newAnnouncement.date}
                                        onChange={e => setNewAnnouncement({...newAnnouncement, date: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Категория</label>
                                    <select 
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                        value={newAnnouncement.category}
                                        onChange={e => setNewAnnouncement({...newAnnouncement, category: e.target.value})}
                                    >
                                        <option value="academic">Учебная</option>
                                        <option value="contests">Конкурсы</option>
                                        <option value="events">Мероприятия</option>
                                        <option value="other">Прочее</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Тип важности</label>
                                <div className="flex bg-gray-50 p-1 rounded-xl">
                                    {['info', 'alert', 'system'].map(t => (
                                        <button 
                                            key={t}
                                            onClick={() => setNewAnnouncement({...newAnnouncement, type: t})}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${newAnnouncement.type === t ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            {t === 'info' ? 'Инфо' : t === 'alert' ? 'Важно' : 'Система'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Описание</label>
                                <textarea 
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[100px] resize-none"
                                    placeholder="Текст объявления..."
                                    value={newAnnouncement.description}
                                    onChange={e => setNewAnnouncement({...newAnnouncement, description: e.target.value})}
                                ></textarea>
                            </div>

                            <button 
                                onClick={handleAddAnnouncement}
                                disabled={!newAnnouncement.title || !newAnnouncement.description}
                                className="w-full bg-[#007AFF] hover:bg-[#0063cc] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            >
                                Опубликовать
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};