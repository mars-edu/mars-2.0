import React, { useState } from 'react';
import { X, Clock, AlertTriangle, ArrowRight, UserX, UserCheck, GraduationCap } from 'lucide-react';
import { Student } from '../types';
import { SPECIALTIES } from '../constants';

interface StudentDetailsModalProps {
  student: Student | null;
  onClose: () => void;
  onUpdate: (updatedStudent: Student) => void;
}

export const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({ student, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'actions'>('info');
  const [actionType, setActionType] = useState<'transfer' | 'expel' | 'status' | null>(null);
  
  // Action Form States
  const [orderNumber, setOrderNumber] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  if (!student) return null;

  const handleTransfer = () => {
    if (!newSpecialty || !orderNumber) return;
    
    const updatedStudent: Student = {
        ...student,
        specialty: newSpecialty,
        history: [
            {
                date: orderDate,
                type: 'transfer',
                orderNumber: orderNumber,
                description: `Перевод с специальности ${student.specialty} на ${newSpecialty}`
            },
            ...student.history
        ]
    };
    onUpdate(updatedStudent);
    setActionType(null);
  };

  const handleExpel = () => {
    if (!orderNumber || !reason) return;
    if (reason === 'other' && !customReason) return;

    let statusToSet: any = 'expelled';
    let typeToSet: any = 'expulsion';
    let descriptionText = `Отчисление. Причина: ${reason}`;

    if (reason === 'academic_leave') {
        statusToSet = 'academic_leave';
        typeToSet = 'status_change';
        descriptionText = 'Уход в академический отпуск';
    } else if (reason === 'other') {
        descriptionText = `Отчисление/Изменение статуса. Причина: ${customReason}`;
    }

    const updatedStudent: Student = {
        ...student,
        status: statusToSet,
        history: [
            {
                date: orderDate,
                type: typeToSet,
                orderNumber: orderNumber,
                description: descriptionText
            },
            ...student.history
        ]
    };
    onUpdate(updatedStudent);
    setActionType(null);
  };

  const renderStatus = (status: string) => {
    const map: any = {
        active: { text: 'Учится', color: 'bg-green-100 text-green-800' },
        expelled: { text: 'Отчислен', color: 'bg-red-100 text-red-800' },
        academic_leave: { text: 'В академ. отпуске', color: 'bg-orange-100 text-orange-800' },
        debt: { text: 'Имеет задолженность', color: 'bg-yellow-100 text-yellow-800' },
        graduated: { text: 'Выпускник', color: 'bg-blue-100 text-blue-800' },
    };
    const s = map[status] || { text: status, color: 'bg-gray-100' };
    return <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${s.color}`}>{s.text}</span>;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-800 text-white p-6 flex justify-between items-start">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">{student.fullName}</h2>
                    {renderStatus(student.status)}
                </div>
                <p className="text-slate-300 text-sm">ID: {student.id} • Курс: {student.course} • {student.gender === 'male' ? 'Мужской' : 'Женский'}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors hover:bg-slate-700">
                <X size={24} />
            </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
            <button 
                onClick={() => setActiveTab('info')}
                className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
            >
                Основная информация
            </button>
            <button 
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
            >
                История приказов
            </button>
            <button 
                onClick={() => setActiveTab('actions')}
                className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'actions' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
            >
                Движение контингента
            </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
            
            {/* Info Tab */}
            {activeTab === 'info' && (
                <div className="grid grid-cols-2 gap-6">
                    {/* Swapped: Personal Data First (Left) */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Личные данные</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between border-b border-gray-50 pb-2">
                                <span className="text-gray-500">Фамилия</span>
                                <span className="font-medium text-gray-800">{student.surname || student.fullName.split(' ')[0]}</span>
                            </div>
                             <div className="flex justify-between border-b border-gray-50 pb-2">
                                <span className="text-gray-500">Имя</span>
                                <span className="font-medium text-gray-800">{student.name || student.fullName.split(' ')[1]}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-50 pb-2">
                                <span className="text-gray-500">Отчество</span>
                                <span className="font-medium text-gray-800">{student.patronymic || student.fullName.split(' ')[2] || '-'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Academic Data Second (Right) */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Академические данные</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between border-b border-gray-50 pb-2">
                                <span className="text-gray-500">Специальность</span>
                                <span className="font-medium text-gray-800">{student.specialty}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-50 pb-2">
                                <span className="text-gray-500">Язык обучения</span>
                                <span className="font-medium text-gray-800 uppercase">{student.language}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-50 pb-2">
                                <span className="text-gray-500">Курс</span>
                                <span className="font-medium text-gray-800">{student.course}</span>
                            </div>
                             <div className="flex justify-between border-b border-gray-50 pb-2">
                                <span className="text-gray-500">Год поступления</span>
                                <span className="font-medium text-gray-800">{student.admissionYear || '2023'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
                <div className="space-y-4">
                    {student.history && student.history.length > 0 ? (
                        student.history.map((record, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                <div>
                                    <div className="font-semibold text-gray-800">{record.description}</div>
                                </div>
                                <div className="text-right flex items-center gap-4">
                                    <div className="text-xs font-bold bg-gray-100 px-3 py-1.5 rounded text-gray-700 border border-gray-200 shadow-sm">
                                        Приказ {record.orderNumber}
                                    </div>
                                    <div className="text-xs font-medium text-gray-500">
                                        {record.date}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-gray-400">История пуста</div>
                    )}
                </div>
            )}

            {/* Actions Tab */}
            {activeTab === 'actions' && (
                <div className="flex gap-6 h-full">
                    {/* Sidebar for actions */}
                    <div className="w-1/3 flex flex-col gap-3">
                         <button 
                            onClick={() => { setActionType('transfer'); setOrderNumber(''); }}
                            className={`p-4 rounded-lg border text-left flex items-center gap-3 transition-all ${actionType === 'transfer' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-gray-200 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md'}`}
                         >
                            <div className="bg-blue-100 p-2 rounded-full text-blue-600"><ArrowRight size={18} /></div>
                            <div>
                                <div className="font-semibold text-gray-800 text-sm">Перевод</div>
                                <div className="text-xs text-gray-500">Смена специальности</div>
                            </div>
                         </button>

                         <button 
                            onClick={() => { setActionType('expel'); setOrderNumber(''); }}
                            className={`p-4 rounded-lg border text-left flex items-center gap-3 transition-all ${actionType === 'expel' ? 'bg-red-50 border-red-500 ring-1 ring-red-500' : 'bg-white border-gray-200 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md'}`}
                         >
                            <div className="bg-red-100 p-2 rounded-full text-red-600"><UserX size={18} /></div>
                            <div>
                                <div className="font-semibold text-gray-800 text-sm">Отчисление / Статус</div>
                                <div className="text-xs text-gray-500">Прекращение обучения</div>
                            </div>
                         </button>

                         <button 
                            onClick={() => alert("Функционал восстановления в разработке")}
                            className="p-4 rounded-lg border bg-white border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-left flex items-center gap-3 opacity-60 cursor-not-allowed transition-colors hover:shadow-md"
                         >
                            <div className="bg-green-100 p-2 rounded-full text-green-600"><UserCheck size={18} /></div>
                            <div>
                                <div className="font-semibold text-gray-800 text-sm">Восстановление</div>
                                <div className="text-xs text-gray-500">Возврат к обучению</div>
                            </div>
                         </button>
                    </div>

                    {/* Action Panel */}
                    <div className="w-2/3 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        {!actionType && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <Clock size={48} className="mb-4 opacity-20" />
                                <p>Выберите действие слева</p>
                            </div>
                        )}

                        {actionType === 'transfer' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Оформление перевода</h3>
                                
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Новая специальность</label>
                                    <select 
                                        className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-blue-500 transition-colors hover:bg-gray-50"
                                        value={newSpecialty}
                                        onChange={(e) => setNewSpecialty(e.target.value)}
                                    >
                                        <option value="">Выберите специальность...</option>
                                        {SPECIALTIES.filter(s => s.code !== student.specialty).map(s => (
                                            <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">Номер приказа</label>
                                        <input 
                                            type="text" 
                                            className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-blue-500 transition-colors hover:bg-gray-50"
                                            placeholder="№..."
                                            value={orderNumber}
                                            onChange={(e) => setOrderNumber(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">Дата приказа</label>
                                        <input 
                                            type="date" 
                                            className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-blue-500 transition-colors hover:bg-gray-50"
                                            value={orderDate}
                                            onChange={(e) => setOrderDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button 
                                        onClick={handleTransfer}
                                        disabled={!newSpecialty || !orderNumber}
                                        className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
                                    >
                                        Подтвердить перевод
                                    </button>
                                </div>
                            </div>
                        )}

                        {actionType === 'expel' && (
                             <div className="space-y-4">
                                <h3 className="text-lg font-bold text-red-700 border-b pb-2">Изменение статуса / Отчисление</h3>
                                
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Причина / Действие</label>
                                    <select 
                                        className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-red-500 transition-colors hover:bg-gray-50"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                    >
                                        <option value="">Выберите причину...</option>
                                        <option value="academic_leave">Академический отпуск</option>
                                        <option value="По собственному желанию">По собственному желанию</option>
                                        <option value="Академическая неуспеваемость">Академическая неуспеваемость</option>
                                        <option value="Нарушение правил внутреннего распорядка">Нарушение правил</option>
                                        <option value="Финансовая задолженность">Финансовая задолженность</option>
                                        <option value="other">Свой вариант...</option>
                                    </select>
                                </div>

                                {reason === 'other' && (
                                     <div className="space-y-1 animate-in slide-in-from-top-2">
                                        <label className="text-sm font-medium text-gray-700">Укажите причину</label>
                                        <input 
                                            type="text" 
                                            className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-red-500 transition-colors hover:bg-gray-50"
                                            placeholder="Введите текст..."
                                            value={customReason}
                                            onChange={(e) => setCustomReason(e.target.value)}
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">Номер приказа</label>
                                        <input 
                                            type="text" 
                                            className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-red-500 transition-colors hover:bg-gray-50"
                                            placeholder="№..."
                                            value={orderNumber}
                                            onChange={(e) => setOrderNumber(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">Дата приказа</label>
                                        <input 
                                            type="date" 
                                            className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-red-500 transition-colors hover:bg-gray-50"
                                            value={orderDate}
                                            onChange={(e) => setOrderDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                                
                                <div className="bg-red-50 p-3 rounded text-xs text-red-600 border border-red-100 flex gap-2">
                                    <AlertTriangle size={16} />
                                    <p>Внимание! Статус студента изменится. Это действие отразится в истории.</p>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button 
                                        onClick={handleExpel}
                                        disabled={!reason || !orderNumber || (reason === 'other' && !customReason)}
                                        className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 disabled:opacity-50 text-sm font-medium transition-colors"
                                    >
                                        Подтвердить
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};