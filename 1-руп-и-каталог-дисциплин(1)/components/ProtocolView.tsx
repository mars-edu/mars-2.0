import React, { useState } from 'react';
import { Check, X, AlertCircle, FileText, User, Info, Clock } from 'lucide-react';
import { ProtocolEvent } from '../types';

interface ProtocolViewProps {
    events: ProtocolEvent[];
    setEvents: React.Dispatch<React.SetStateAction<ProtocolEvent[]>>;
}

export const ProtocolView: React.FC<ProtocolViewProps> = ({ events, setEvents }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<{ id: number, type: 'approve' | 'reject' } | null>(null);

  // Helper to group events by date
  const groupedEvents = events.reduce((acc, event) => {
    if (!acc[event.formattedDate]) {
      acc[event.formattedDate] = [];
    }
    acc[event.formattedDate].push(event);
    return acc;
  }, {} as Record<string, ProtocolEvent[]>);

  // Sort dates descending (newest first)
  const sortedDates = Object.keys(groupedEvents); 

  const handleActionClick = (id: number, type: 'approve' | 'reject') => {
    setSelectedAction({ id, type });
    setModalOpen(true);
  };

  const confirmAction = () => {
    if (!selectedAction) return;

    const { id, type } = selectedAction;
    const now = new Date();
    const formattedDate = 'Суббота, 3 января 2026 года'; // Simulating today is Jan 3rd for context consistency
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // 1. Update the original event status
    const updatedEvents = events.map(ev => {
      if (ev.id === id) {
        return { 
          ...ev, 
          status: type === 'approve' ? 'approved' : 'rejected',
          processedAt: timestamp 
        } as ProtocolEvent;
      }
      return ev;
    });

    // 2. Create a new log entry
    const originalEvent = events.find(e => e.id === id);
    const actionText = type === 'approve' ? 'Одобрено' : 'Отклонено';
    const newLogEntry: ProtocolEvent = {
      id: Math.max(...events.map(e => e.id)) + 1,
      date: '2026-01-03',
      formattedDate: formattedDate,
      title: `Решение администратора`,
      description: `${actionText} администратором 145. Касательно: ${originalEvent?.title}.`,
      source: 'Действие в системе',
      type: 'system',
      status: type === 'approve' ? 'approved' : 'rejected',
      timestamp: timestamp
    };

    // Add new log to top
    setEvents([newLogEntry, ...updatedEvents]);
    setModalOpen(false);
    setSelectedAction(null);
  };

  return (
    <div className="bg-[#f3f4f6] min-h-full p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Протокол изменений и действий</h1>

        <div className="space-y-8">
          {sortedDates.map((dateHeader) => (
            <div key={dateHeader}>
              <h2 className="text-lg font-bold text-gray-700 mb-4 border-b border-gray-200 pb-2">
                {dateHeader}
              </h2>
              
              <div className="space-y-4">
                {groupedEvents[dateHeader].map((event) => (
                  <div key={event.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 relative overflow-hidden transition-all hover:shadow-md">
                    {/* Status Line Indicator */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                        event.status === 'pending' ? 'bg-blue-400' :
                        event.status === 'rejected' ? 'bg-red-400' :
                        event.status === 'approved' ? 'bg-green-400' :
                        'bg-gray-300'
                    }`}></div>

                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Icon & Time */}
                      <div className="flex-shrink-0 flex flex-col items-center gap-2 min-w-[60px]">
                        <div className={`w-3 h-3 rounded-full mt-1.5 ${
                             event.status === 'pending' ? 'bg-blue-500 ring-4 ring-blue-100' :
                             event.status === 'rejected' ? 'bg-red-500 ring-4 ring-red-100' :
                             event.status === 'approved' ? 'bg-green-500 ring-4 ring-green-100' :
                             'bg-gray-400'
                        }`}></div>
                        <span className="text-xs text-gray-400 font-mono">{event.timestamp}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-800 text-sm md:text-base">{event.title}</h3>
                            {event.type === 'system' && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded uppercase font-bold">Система</span>}
                            {event.type === 'request' && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase font-bold">Запрос</span>}
                            {event.type === 'appeal' && <span className="text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded uppercase font-bold">Апелляция</span>}
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed mb-2">
                          {event.description}
                        </p>
                        {event.source && (
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <FileText size={12} />
                            {event.source}
                          </div>
                        )}
                      </div>

                      {/* Status / Actions Column */}
                      <div className="flex-shrink-0 md:w-48 flex flex-col justify-center items-end border-l border-gray-100 pl-4 md:pl-0 md:border-l-0 md:border-transparent">
                        
                        {event.status === 'pending' ? (
                          <div className="flex flex-col gap-2 w-full">
                            <span className="text-xs font-semibold text-gray-500 text-right mb-1 block">Действие:</span>
                            <div className="flex gap-2 justify-end">
                                <button 
                                    onClick={() => handleActionClick(event.id, 'reject')}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded border border-red-200 hover:bg-red-100 transition-colors text-xs font-bold"
                                >
                                    <X size={14} /> Отклонить
                                </button>
                                <button 
                                    onClick={() => handleActionClick(event.id, 'approve')}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 rounded border border-green-200 hover:bg-green-100 transition-colors text-xs font-bold"
                                >
                                    <Check size={14} /> Принять
                                </button>
                            </div>
                          </div>
                        ) : (
                           <div className="text-right">
                              {event.status === 'rejected' && (
                                  <div className="flex items-center gap-1.5 text-red-600 bg-red-50 px-3 py-1.5 rounded-full">
                                      <AlertCircle size={14} />
                                      <span className="text-xs font-bold">Отклонено</span>
                                  </div>
                              )}
                              {event.status === 'approved' && (
                                  <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                                      <Check size={14} />
                                      <span className="text-xs font-bold">Принято</span>
                                  </div>
                              )}
                              {event.status === 'info' && (
                                  <div className="flex items-center gap-1.5 text-gray-500">
                                      <Info size={14} />
                                      <span className="text-xs font-medium">Инфо</span>
                                  </div>
                              )}
                           </div> 
                        )}

                        {event.status !== 'pending' && event.status !== 'info' && (
                            <div className="mt-2 text-[10px] text-gray-400 text-right">
                                Обработано админ. 145 <br/>
                                <span className="font-mono">{event.processedAt}</span>
                            </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)}></div>
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${selectedAction?.type === 'approve' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {selectedAction?.type === 'approve' ? <Check size={24} /> : <AlertCircle size={24} />}
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                        {selectedAction?.type === 'approve' ? 'Принять запрос?' : 'Отклонить запрос?'}
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                        Это действие будет зафиксировано в протоколе и не может быть отменено. Статус запроса будет обновлен.
                    </p>
                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={() => setModalOpen(false)}
                            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded font-medium hover:bg-gray-200 transition-colors"
                        >
                            Отмена
                        </button>
                        <button 
                            onClick={confirmAction}
                            className={`flex-1 px-4 py-2 text-white rounded font-bold shadow-sm transition-colors ${selectedAction?.type === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                        >
                            Подтвердить
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};