
import React from 'react';
import { ScheduleFormData, StudentInfo } from '../types';

interface JournalCardViewProps {
  schedules: ScheduleFormData[];
  onOpenModal: () => void;
}

const STUDENTS_INFO: Record<string, StudentInfo> = {
  '1': { id: '1', name: 'Мигаль Дарья Алексеевна', specialty: 'Хоровое дирижирование', course: '1к', score: 87.1 },
  '2': { id: '2', name: 'Науменко София Николаевна', specialty: 'Вокальное искусство', course: '2к', score: 95.0 },
  '3': { id: '3', name: 'Сергеева Елизавета Сергеевна', specialty: 'Духовые инструменты', course: '1к', score: 95.0 },
  '4': { id: '4', name: 'Гафурова Амина Манцуровна', specialty: 'Струнные инструменты', course: '3к', score: 52.0 },
  '5': { id: '5', name: 'Ким Вирсавия Витальевна', specialty: 'Хоровое дирижирование', course: '2к', score: 50.0 },
  '6': { id: '6', name: 'Герасименко Вениамин Иванович', specialty: 'Вокальное искусство', course: '1к', score: 1.0 },
  '7': { id: '7', name: 'Горбовская Анастасия Андреевна', specialty: 'Духовые инструменты', course: '2к', score: 1.0 },
  '8': { id: '8', name: 'Иванова Анжелина Евгеньевна', specialty: 'Струнные инструменты', course: '3к', score: 1.0 },
  '9': { id: '9', name: 'Козак Владимир Юрьевич', specialty: 'Хоровое дирижирование', course: '2к', score: 1.0 },
  '10': { id: '10', name: 'Лысенко Виктор Витальевич', specialty: 'Вокальное искусство', course: '1к', score: 1.0 },
  '11': { id: '11', name: 'Айдагазы Акниет Жәнібекқызы', specialty: 'Струнные инструменты', course: '2к' },
  '12': { id: '12', name: 'Габайдулина Лина Рамильевна', specialty: 'Хоровое дирижирование', course: '1к' },
};

export const JournalCardView: React.FC<JournalCardViewProps> = ({ schedules, onOpenModal }) => {
  return (
    <div className="p-10">
        <header className="flex justify-between items-center mb-10 animate-in slide-in-from-top-4 duration-700 ease-out">
          <div>
            <h1 className="text-[34px] font-bold text-black tracking-tight mb-0.5">Журналы</h1>
            <p className="text-[15px] font-medium text-gray-500">Управление учебным процессом</p>
          </div>
          <div className="flex gap-4">
             <button onClick={onOpenModal} className="bg-[#34C759] text-white px-6 py-3.5 rounded-full font-semibold text-[15px] hover:bg-[#2DB34A] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-green-200 flex items-center gap-2.5 group">
                <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                Создать
             </button>
             <div className="w-12 h-12 bg-white rounded-full border border-gray-200 flex items-center justify-center shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
                   <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">A</div>
                </div>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {schedules.length === 0 ? (
                <div className="col-span-full py-24 text-center border border-dashed border-gray-300 rounded-[32px] bg-white/50 backdrop-blur-sm">
                <div className="w-20 h-20 bg-white rounded-[24px] flex items-center justify-center mx-auto text-gray-300 mb-6 shadow-xl shadow-gray-100">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Нет журналов</h3>
                <p className="text-gray-500 text-[15px] mt-2 max-w-sm mx-auto leading-relaxed">Ваш список пуст. Нажмите кнопку "Создать", чтобы добавить первый учебный журнал.</p>
                </div>
            ) : (
                schedules.map((schedule, idx) => (
                <div key={idx} className="bg-white p-6 rounded-[32px] shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 group relative overflow-hidden hover:-translate-y-1 border border-gray-100">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-5">
                            <div className="w-14 h-14 rounded-[20px] flex items-center justify-center text-white font-bold text-xl shadow-lg ring-4 ring-white" style={{ backgroundColor: schedule.color }}>
                            {schedule.discipline.charAt(0)}
                            </div>
                            <div className="px-3 py-1.5 bg-[#F5F5F7] rounded-full text-[11px] font-bold uppercase tracking-wider text-gray-500">
                            {schedule.semester}
                            </div>
                        </div>
                        <h3 className="font-bold text-gray-900 text-[19px] leading-tight mb-3 line-clamp-2 min-h-[3rem] tracking-tight" title={schedule.discipline}>{schedule.discipline}</h3>
                        <div className="flex flex-wrap gap-2 mb-6">
                        {schedule.days.map(d => (
                            <span key={d} className="text-[11px] font-bold bg-[#F5F5F7] text-gray-500 px-2 py-1 rounded-lg">{d}</span>
                        ))}
                        </div>
                        
                        <div className="flex items-center gap-3 pt-5 border-t border-gray-50">
                            <div className="flex -space-x-3">
                            {schedule.students.slice(0, 3).map((sid) => (
                                <div key={sid} className="w-9 h-9 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 uppercase shadow-sm" title={STUDENTS_INFO[sid]?.name}>
                                    {STUDENTS_INFO[sid]?.name.charAt(0) || '?'}
                                </div>
                            ))}
                            {schedule.students.length > 3 && (
                                <div className="w-9 h-9 rounded-full border-2 border-white bg-black text-white flex items-center justify-center text-[11px] font-bold shadow-sm">
                                    +{schedule.students.length - 3}
                                </div>
                            )}
                            </div>
                            <div className="ml-auto text-[13px] font-medium text-gray-400">
                            {schedule.students.length} студентов
                            </div>
                        </div>
                    </div>
                </div>
                ))
            )}
        </div>
    </div>
  );
};
