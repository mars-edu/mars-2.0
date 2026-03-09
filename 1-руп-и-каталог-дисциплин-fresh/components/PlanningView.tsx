import React, { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, User } from 'lucide-react';
import { ScheduleFormData, DayOfWeek } from '../types';

interface PlanningViewProps {
    schedules: ScheduleFormData[];
    onOpenScheduleModal: () => void;
}

export const PlanningView: React.FC<PlanningViewProps> = ({ schedules, onOpenScheduleModal }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 = Sunday
    
    // Adjust for Monday start (0 = Monday, 6 = Sunday)
    const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];

    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const getSchedulesForDay = (day: number) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dayOfWeekIndex = date.getDay(); // 0 = Sun, 1 = Mon...
        
        // Map JS getDay() to our DayOfWeek enum/string
        // JS: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
        // App: 'Monday', 'Tuesday', etc.
        const dayMap: { [key: number]: DayOfWeek } = {
            1: DayOfWeek.MON,
            2: DayOfWeek.TUE,
            3: DayOfWeek.WED,
            4: DayOfWeek.THU,
            5: DayOfWeek.FRI,
            6: DayOfWeek.SAT,
            0: DayOfWeek.SUN
        };
        
        const targetDayName = dayMap[dayOfWeekIndex];

        return schedules.filter(schedule => 
            schedule.days.includes(targetDayName)
        ).map(schedule => {
            const timeSlots = schedule.dayTimes[targetDayName];
            const firstSlot = Array.isArray(timeSlots) && timeSlots.length > 0 ? timeSlots[0] : null;
            return {
                ...schedule,
                time: firstSlot?.start || ''
            };
        }).sort((a, b) => a.time.localeCompare(b.time));
    };

    const renderCalendarDays = () => {
        const days = [];
        
        // Empty cells for previous month
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="bg-gray-50/30 min-h-[120px] border-r border-b border-gray-100"></div>);
        }

        // Days of current month
        for (let i = 1; i <= daysInMonth; i++) {
            const daySchedules = getSchedulesForDay(i);
            const isToday = 
                i === new Date().getDate() && 
                currentDate.getMonth() === new Date().getMonth() && 
                currentDate.getFullYear() === new Date().getFullYear();

            days.push(
                <div key={i} className={`min-h-[120px] border-r border-b border-gray-100 p-2 transition-colors hover:bg-gray-50 ${isToday ? 'bg-blue-50/30' : 'bg-white'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-[#007AFF] text-white' : 'text-gray-700'}`}>
                            {i}
                        </span>
                        {daySchedules.length > 0 && (
                            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md">
                                {daySchedules.length}
                            </span>
                        )}
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                        {daySchedules.map((schedule, idx) => (
                            <div key={idx} className="bg-white border border-blue-100 rounded-lg p-2 shadow-sm hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-[#007AFF]">
                                <div className="text-[11px] font-bold text-gray-900 line-clamp-1 leading-tight mb-0.5">
                                    {schedule.discipline}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <Clock size={10} />
                                        <span>{schedule.time}</span>
                                    </div>
                                    {schedule.audience && (
                                        <div className="flex items-center gap-1">
                                            <MapPin size={10} />
                                            <span>{schedule.audience}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return days;
    };

    return (
        <div className="h-full flex flex-col bg-[#F5F5F7] p-6 md:p-8 overflow-hidden">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-[#1D1D1F] tracking-tight">Планирование</h1>
                    <p className="text-gray-500 font-medium mt-1">Календарь занятий и мероприятий</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                        <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <div className="px-4 font-semibold text-gray-900 min-w-[140px] text-center">
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </div>
                        <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-colors">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                    <button 
                        onClick={onOpenScheduleModal}
                        className="bg-[#34C759] hover:bg-[#28a745] text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm transition-all flex items-center gap-2 active:scale-95"
                    >
                        <Plus size={18} />
                        <span>Создать</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-[24px] shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/50">
                    {dayNames.map((day, index) => (
                        <div key={index} className="py-3 text-center text-sm font-semibold text-gray-500 uppercase tracking-wide">
                            {day}
                        </div>
                    ))}
                </div>
                
                {/* Calendar Grid */}
                <div className="flex-1 grid grid-cols-7 overflow-y-auto no-scrollbar">
                    {renderCalendarDays()}
                </div>
            </div>
        </div>
    );
};
