import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Pencil, Check, Settings, X, MoreHorizontal, ChevronRight, Copy } from 'lucide-react';
import { ProcessSection, ProcessItem } from '../types';

interface ProcessScheduleViewProps {
    activeYear?: string;
    setActiveYear?: (year: string) => void;
    activeSemester?: string;
    setActiveSemester?: (semester: string) => void;
    sections: ProcessSection[];
    setSections: React.Dispatch<React.SetStateAction<ProcessSection[]>>;
    onCopyFromPreviousSemester?: () => void;
}

export const ProcessScheduleView: React.FC<ProcessScheduleViewProps> = ({ 
    activeYear, 
    setActiveYear, 
    activeSemester, 
    setActiveSemester,
    sections,
    setSections,
    onCopyFromPreviousSemester
}) => {

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, sectionId: string, itemId: number, label: string} | null>(null);
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<ProcessItem | null>(null);
    const [formData, setFormData] = useState({ label: '', details: '', startDate: '', endDate: '' });

    const toggleSection = (id: string) => {
        setSections(prev => prev.map(s => s.id === id ? { ...s, isExpanded: !s.isExpanded } : s));
    };

    const toggleAll = (expand: boolean) => {
        setSections(prev => prev.map(s => ({ ...s, isExpanded: expand })));
    };

    const handleOpenModal = (sectionId: string, item?: ProcessItem) => {
        setActiveSectionId(sectionId);
        if (item) {
            setEditingItem(item);
            // Try to parse dates if they exist in details
            let startDate = '';
            let endDate = '';
            if (item.details && item.details.includes('-')) {
                const parts = item.details.split('-').map(p => p.trim());
                if (parts.length === 2) {
                    // Assuming DD/MM/YYYY format in details, convert to YYYY-MM-DD for input
                    const convert = (d: string) => {
                        const bits = d.split('/');
                        return bits.length === 3 ? `${bits[2]}-${bits[1]}-${bits[0]}` : '';
                    };
                    startDate = convert(parts[0]);
                    endDate = convert(parts[1]);
                }
            }
            setFormData({ label: item.label, details: item.details || '', startDate, endDate });
        } else {
            setEditingItem(null);
            setFormData({ label: '', details: '', startDate: '', endDate: '' });
        }
        setIsModalOpen(true);
    };

    const handleSaveItem = () => {
        if (!activeSectionId || !formData.label) return;

        let finalDetails = formData.details;
        if (formData.startDate && formData.endDate) {
            const format = (d: string) => {
                const bits = d.split('-');
                return bits.length === 3 ? `${bits[2]}/${bits[1]}/${bits[0]}` : d;
            };
            finalDetails = `${format(formData.startDate)} - ${format(formData.endDate)}`;
        }

        setSections(prev => prev.map(section => {
            if (section.id === activeSectionId) {
                if (editingItem) {
                    return {
                        ...section,
                        items: section.items.map(item => item.id === editingItem.id ? { ...item, label: formData.label, details: finalDetails } : item)
                    };
                } else {
                    return {
                        ...section,
                        items: [...section.items, {
                            id: Date.now(),
                            label: formData.label,
                            details: finalDetails
                        }]
                    };
                }
            }
            return section;
        }));

        setIsModalOpen(false);
    };

    const executeToggleActive = (sectionId: string, itemId: number) => {
        // Find the item to get its label before updating state
        if (!sections) return;
        const section = sections.find(s => s.id === sectionId);
        const item = section?.items.find(i => i.id === itemId);

        if (item) {
            if (sectionId === 'academic-year' && setActiveYear) {
                setActiveYear(item.label);
                setConfirmModal(null);
                return; // State is updated by parent
            } else if (sectionId === 'semesters' && setActiveSemester) {
                setActiveSemester(item.label);
                setConfirmModal(null);
                return; // State is updated by parent
            }
        }

        setSections(prev => prev.map(section => {
            if (section.id === sectionId) {
                return {
                    ...section,
                    items: section.items.map(item => {
                        const isNowActive = item.id === itemId;
                        return { 
                            ...item, 
                            isActive: isNowActive
                        };
                    })
                };
            }
            return section;
        }));
        
        setConfirmModal(null);
    };

    const handleToggleActive = (sectionId: string, itemId: number) => {
        const section = sections.find(s => s.id === sectionId);
        const item = section?.items.find(i => i.id === itemId);
        
        if (item && !item.isActive && (sectionId === 'academic-year' || sectionId === 'semesters')) {
            setConfirmModal({
                isOpen: true,
                sectionId,
                itemId,
                label: item.label
            });
        }
    };

    const areAllCollapsed = sections.every(s => !s.isExpanded);

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#F5F5F7] p-6 overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold text-gray-800">График образовательного процесса:</h1>
                <button 
                    onClick={() => toggleAll(areAllCollapsed)}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium shadow-sm hover:bg-gray-800 transition-colors"
                >
                    {areAllCollapsed ? <Plus size={16} /> : <ChevronUp size={16} />}
                    {areAllCollapsed ? 'Развернуть все' : 'Свернуть все'}
                </button>
            </div>

            <div className="space-y-4">
                {sections.map(section => (
                    <div key={section.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 bg-gray-50/50 border-b border-gray-100">
                            <button 
                                onClick={() => toggleSection(section.id)}
                                className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors"
                            >
                                {section.isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                <span className="font-bold text-sm">{section.title}</span>
                            </button>
                            <div className="flex items-center gap-2">
                                {section.id === 'bell-schedule' && (
                                    <button 
                                        onClick={onCopyFromPreviousSemester}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-xs font-bold"
                                        title="Копировать из предыдущего семестра"
                                    >
                                        <Copy size={14} />
                                        Копировать
                                    </button>
                                )}
                                <button 
                                    onClick={() => handleOpenModal(section.id)}
                                    className="p-1.5 bg-[#34C759] text-white rounded-lg hover:bg-[#28a745] transition-colors"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>

                        {section.isExpanded && (
                            <div className="p-6">
                                {section.type === 'grid' ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                        {section.items.map(item => (
                                            <div 
                                                key={item.id} 
                                                onClick={() => (section.id === 'academic-year' || section.id === 'semesters') && handleToggleActive(section.id, item.id)}
                                                className={`relative group p-4 rounded-xl border transition-all cursor-pointer ${
                                                    item.isActive 
                                                    ? 'bg-white border-black ring-1 ring-black/20 shadow-md' 
                                                    : 'bg-[#F9F9FB] border-gray-100 hover:border-gray-200 hover:bg-white hover:shadow-sm'
                                                }`}
                                            >
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className={`text-sm font-bold ${item.isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                                                            {item.label}
                                                        </span>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleOpenModal(section.id, item);
                                                                }}
                                                                className="p-1 text-gray-400 hover:text-[#E14D4D]"
                                                            >
                                                                <Pencil size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {(item.details || (item.isActive && (section.id === 'academic-year' || section.id === 'semesters')) || item.hasCheck !== undefined) && (
                                                        <div className="flex items-center justify-between mt-1">
                                                            <div className="flex flex-col gap-0.5">
                                                                {item.details && item.details !== 'Активный' && (
                                                                    <span className={`text-[10px] uppercase tracking-wider ${item.isActive ? 'text-gray-600 font-medium' : 'text-gray-400 font-bold'}`}>
                                                                        {item.details}
                                                                    </span>
                                                                )}
                                                                {item.isActive && (section.id === 'academic-year' || section.id === 'semesters') && (
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#34C759]">
                                                                        Активный
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {item.hasCheck !== undefined && (
                                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${item.hasCheck ? 'bg-white border-red-200 text-red-500' : 'border-gray-200'}`}>
                                                                    {item.hasCheck && <Check size={10} strokeWidth={3} />}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {section.items.map(item => (
                                            <div key={item.id} className="space-y-2">
                                                <div 
                                                    className="flex items-center justify-between p-4 bg-[#F9F9FB] border border-gray-100 rounded-xl hover:bg-white hover:shadow-sm transition-all group cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <ChevronRight size={16} className="text-gray-400" />
                                                        <span className="text-sm font-bold text-gray-700">{item.label}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenModal(section.id, item);
                                                            }}
                                                            className="p-1.5 text-gray-400 hover:text-[#E14D4D] opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenModal(section.id);
                                                            }}
                                                            className="p-1.5 bg-[#34C759] text-white rounded-lg hover:bg-[#28a745] transition-colors"
                                                        >
                                                            <Plus size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Modal for adding/editing items */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-[#1D1D1F]">
                                {editingItem ? 'Редактировать' : 'Добавить'} в раздел: {sections?.find(s => s.id === activeSectionId)?.title.replace(':', '')}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    {activeSectionId === 'academic-year' ? 'Учебный год' : 
                                     activeSectionId === 'semesters' ? 'Название семестра' :
                                     activeSectionId === 'bell-schedule' ? 'Время начала' :
                                     activeSectionId === 'holidays' ? 'Название каникул' : 'Название'}
                                </label>
                                <input 
                                    type={activeSectionId === 'bell-schedule' ? 'time' : 'text'} 
                                    className={activeSectionId === 'bell-schedule' 
                                        ? "w-full bg-[#F2F2F7] border-0 rounded-xl px-4 py-3 text-center text-lg font-semibold text-[#007AFF] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-all cursor-pointer"
                                        : "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"}
                                    placeholder={activeSectionId === 'academic-year' ? 'Например: 2028-2029' : 'Введите значение...'}
                                    value={formData.label}
                                    onChange={e => setFormData({...formData, label: e.target.value})}
                                />
                            </div>
                            
                            {(activeSectionId === 'semesters' || activeSectionId === 'holidays') ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Дата начала</label>
                                        <input 
                                            type="date" 
                                            className="w-full bg-[#F2F2F7] border-0 rounded-xl px-4 py-3 text-center text-[15px] font-medium text-[#007AFF] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-all cursor-pointer"
                                            value={formData.startDate}
                                            onChange={e => setFormData({...formData, startDate: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Дата окончания</label>
                                        <input 
                                            type="date" 
                                            className="w-full bg-[#F2F2F7] border-0 rounded-xl px-4 py-3 text-center text-[15px] font-medium text-[#007AFF] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-all cursor-pointer"
                                            value={formData.endDate}
                                            onChange={e => setFormData({...formData, endDate: e.target.value})}
                                        />
                                    </div>
                                </div>
                            ) : (activeSectionId !== 'academic-year' && activeSectionId !== 'controls') && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                        {activeSectionId === 'bell-schedule' ? 'Время окончания' : 'Дополнительно'}
                                    </label>
                                    <input 
                                        type={activeSectionId === 'bell-schedule' ? 'time' : 'text'} 
                                        className={activeSectionId === 'bell-schedule' 
                                            ? "w-full bg-[#F2F2F7] border-0 rounded-xl px-4 py-3 text-center text-lg font-semibold text-[#007AFF] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-all cursor-pointer"
                                            : "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"}
                                        placeholder="Введите детали..."
                                        value={formData.details}
                                        onChange={e => setFormData({...formData, details: e.target.value})}
                                    />
                                </div>
                            )}

                            <button 
                                onClick={handleSaveItem}
                                disabled={!formData.label}
                                className="w-full bg-[#34C759] hover:bg-[#28a745] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            >
                                {editingItem ? 'Сохранить' : 'Добавить'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Confirmation Modal */}
            {confirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmModal(null)}></div>
                    <div className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Подтверждение</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Вы уверены, что хотите сделать {confirmModal.sectionId === 'academic-year' ? 'учебный год' : 'семестр'} <strong>{confirmModal.label}</strong> активным?
                            </p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setConfirmModal(null)}
                                    className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                                >
                                    Отмена
                                </button>
                                <button 
                                    onClick={() => executeToggleActive(confirmModal.sectionId, confirmModal.itemId)}
                                    className="flex-1 py-3 px-4 bg-black hover:bg-gray-800 text-white font-bold rounded-xl transition-colors"
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
