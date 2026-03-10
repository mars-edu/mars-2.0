import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { StudentTable } from './components/StudentTable';
import { AddStudentModal } from './components/AddStudentModal';
import { StudentDetailsModal } from './components/StudentDetailsModal';
import { ProtocolView } from './components/ProtocolView';
import { DashboardView } from './components/DashboardView';
import { INITIAL_STUDENTS, INITIAL_PROTOCOL_EVENTS, INITIAL_JOURNALS, INITIAL_RUP, SUBJECTS } from './constants';
import { Student, MovementHistory, ProtocolEvent, ScheduleFormData, Journal, Rup, Subject, ProcessSection } from './types';
import { Plus, ChevronRight, GraduationCap, CheckSquare, Book } from 'lucide-react';

import { ScheduleModal } from './components/ScheduleModal';
import { JournalListView } from './components/JournalListView';
import { JournalView } from './components/JournalView';
import { PlanningView } from './components/PlanningView';
import { RupView } from './components/RupView';
import { ProcessScheduleView } from './components/ProcessScheduleView';

// New Components
import PlanList from './components/PlanList';
import DisciplineCatalog from './components/DisciplineCatalog';
import YearSelect from './components/YearSelect';

export type Theme = 'light' | 'dark' | 'lavender' | 'coral' | 'graphite';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('rup'); // Default to RUP as per user focus
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  
  // Theme State
  const [theme, setTheme] = useState<Theme>('light');

  // Active Schedule State
  const [activeYear, setActiveYear] = useState('2025-2026');
  const [activeSemester, setActiveSemester] = useState('Семестр 2');

  // Journal Selection State
  const [selectedJournalId, setSelectedJournalId] = useState<number | null>(null);
  const [journals, setJournals] = useState<Journal[]>(INITIAL_JOURNALS);

  // RUP State (Old) - kept for compatibility if needed, but we use PlanList now
  const [rupData, setRupData] = useState<Rup[]>(INITIAL_RUP);

  // New RUP/Discipline State
  const [subjects, setSubjects] = useState<Subject[]>(SUBJECTS);

  // New Schedule/Journal State
  const [schedules, setSchedules] = useState<ScheduleFormData[]>([]);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const INITIAL_PROCESS_SECTIONS: ProcessSection[] = [
    {
        id: 'academic-year',
        title: 'Учебный год:',
        isExpanded: true,
        type: 'grid',
        items: [
            { id: 1, label: '2019-2020', hasCheck: true },
            { id: 2, label: '2020-2021', hasCheck: true },
            { id: 3, label: '2021-2022', hasCheck: true },
            { id: 4, label: '2022-2023', hasCheck: true },
            { id: 5, label: '2023-2024', hasCheck: true },
            { id: 6, label: '2024-2025', hasCheck: true },
            { id: 7, label: '2025-2026', isActive: true },
            { id: 8, label: '2026-2027' },
            { id: 9, label: '2027-2028' },
        ]
    },
    {
        id: 'semesters',
        title: 'Семестры:',
        isExpanded: true,
        type: 'grid',
        items: [
            { id: 10, label: 'Семестр 1', details: '01/09/2025-03/01/2026' },
            { id: 11, label: 'Семестр 2', isActive: true, details: '26/01/2026-13/06/2026' },
        ]
    },
    {
        id: 'bell-schedule',
        title: 'Расписание звонков:',
        isExpanded: true,
        type: 'grid',
        items: [
            { id: 12, label: '08:00', details: '08:45', isActive: false },
            { id: 13, label: '08:50', details: '09:35' },
            { id: 14, label: '09:45', details: '10:30' },
            { id: 15, label: '10:35', details: '11:20' },
            { id: 16, label: '11:30', details: '12:15' },
            { id: 17, label: '12:20', details: '13:05' },
            { id: 18, label: '13:05', details: '13:50' },
            { id: 19, label: '14:00', details: '14:45' },
            { id: 20, label: '14:45', details: '15:35' },
            { id: 21, label: '15:45', details: '16:30' },
            { id: 22, label: '16:35', details: '17:20' },
            { id: 23, label: '17:30', details: '18:15' },
            { id: 24, label: '18:25', details: '19:05' },
        ]
    },
    {
        id: 'holidays',
        title: 'Каникулы:',
        isExpanded: true,
        type: 'grid',
        items: [
            { id: 25, label: 'Зимние каникулы', details: '12/01/2026 - 24/01/2026' },
        ]
    },
    {
        id: 'controls',
        title: 'Контроли:',
        isExpanded: true,
        type: 'list',
        items: [
            { id: 26, label: 'Форма итогового контроля:' },
            { id: 27, label: 'Промежуточный контроль:' },
        ]
    }
  ];

  const [processSections, setProcessSections] = useState<ProcessSection[]>(() => {
    const saved = localStorage.getItem('processSections');
    return saved ? JSON.parse(saved) : INITIAL_PROCESS_SECTIONS;
  });

  const [contextData, setContextData] = useState<Record<string, ProcessSection[]>>(() => {
    const saved = localStorage.getItem('contextData');
    return saved ? JSON.parse(saved) : {};
  });

  const [yearSemestersData, setYearSemestersData] = useState<Record<string, ProcessSection>>(() => {
    const saved = localStorage.getItem('yearSemestersData');
    return saved ? JSON.parse(saved) : {};
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('processSections', JSON.stringify(processSections));
    
    // Also update contextData for the current context to keep it in sync
    const key = `${activeYear}-${activeSemester}`;
    const contextualSections = processSections.filter(s => !['academic-year', 'semesters'].includes(s.id));
    
    setContextData(prev => {
        // Only update if data actually changed to avoid unnecessary re-renders
        if (JSON.stringify(prev[key]) === JSON.stringify(contextualSections)) return prev;
        return {
            ...prev,
            [key]: contextualSections
        };
    });

    const semestersSection = processSections.find(s => s.id === 'semesters');
    if (semestersSection) {
        setYearSemestersData(prev => {
            if (JSON.stringify(prev[activeYear]) === JSON.stringify(semestersSection)) return prev;
            return {
                ...prev,
                [activeYear]: semestersSection
            };
        });
    }
  }, [processSections, activeYear, activeSemester]);

  useEffect(() => {
    localStorage.setItem('contextData', JSON.stringify(contextData));
  }, [contextData]);

  useEffect(() => {
    localStorage.setItem('yearSemestersData', JSON.stringify(yearSemestersData));
  }, [yearSemestersData]);

  const handleContextChange = (newYear: string, newSemester: string) => {
    // 1. Save current contextual data for the OLD context
    const oldKey = `${activeYear}-${activeSemester}`;
    const contextualSections = processSections.filter(s => !['academic-year', 'semesters'].includes(s.id));
    
    const updatedContext = {
        ...contextData,
        [oldKey]: contextualSections
    };
    
    setContextData(updatedContext);

    // 2. Load data for the NEW context
    const newKey = `${newYear}-${newSemester}`;
    const newContextualData = updatedContext[newKey];
    const newYearSemestersData = yearSemestersData[newYear];
    
    setProcessSections(prevSections => {
        return prevSections.map(s => {
            // Update isActive state for years and semesters
            if (s.id === 'academic-year') {
                return {
                    ...s,
                    items: s.items.map(item => ({
                        ...item,
                        isActive: item.label === newYear
                    }))
                };
            }
            if (s.id === 'semesters') {
                if (newYearSemestersData) {
                    return {
                        ...newYearSemestersData,
                        items: newYearSemestersData.items.map(item => ({
                            ...item,
                            isActive: item.label === newSemester
                        }))
                    };
                }
                
                return {
                    ...s,
                    items: s.items.map(item => {
                        // Reset semester dates only if the academic year changed, the new year has no saved context, and it's a future year
                        const isYearChanged = newYear !== activeYear;
                        const hasNewYearContext = Object.keys(updatedContext).some(k => k.startsWith(`${newYear}-`));
                        const isFutureYear = parseInt(newYear.split('-')[0]) > 2025;
                        const shouldResetDates = isYearChanged && !hasNewYearContext && isFutureYear;
                        
                        return {
                            ...item,
                            isActive: item.label === newSemester,
                            details: shouldResetDates ? '' : item.details
                        };
                    })
                };
            }

            // Load contextual data for other sections
            if (newContextualData) {
                const newData = newContextualData.find(ns => ns.id === s.id);
                return newData ? { ...s, items: newData.items } : s;
            } else {
                // If no data for new context, reset contextual sections to initial defaults
                const initialSection = INITIAL_PROCESS_SECTIONS.find(is => is.id === s.id);
                const isFutureYear = parseInt(newYear.split('-')[0]) > 2025;
                if (s.id === 'bell-schedule') return initialSection ? { ...initialSection, items: isFutureYear ? [] : initialSection.items } : s;
                return initialSection ? { ...initialSection, items: isFutureYear ? [] : initialSection.items } : s;
            }
        });
    });

    setActiveYear(newYear);
    setActiveSemester(newSemester);
  };

  const handleCopyFromPreviousSemester = () => {
    const currentSemesterNum = parseInt(activeSemester.replace(/\D/g, ''));
    
    let prevKey = '';
    
    if (currentSemesterNum > 1) {
        const prevSemesterLabel = `Семестр ${currentSemesterNum - 1}`;
        prevKey = `${activeYear}-${prevSemesterLabel}`;
    } else {
        const yearParts = activeYear.split('-');
        const prevYearStart = parseInt(yearParts[0]) - 1;
        const prevYearEnd = parseInt(yearParts[1]) - 1;
        const prevYear = `${prevYearStart}-${prevYearEnd}`;
        
        const prevYearSemesters = yearSemestersData[prevYear]?.items || [];
        const lastSemester = prevYearSemesters.length > 0 ? prevYearSemesters[prevYearSemesters.length - 1].label : 'Семестр 2';
        
        prevKey = `${prevYear}-${lastSemester}`;
    }

    const prevData = contextData[prevKey];

    if (prevData) {
        const prevBellSchedule = prevData.find(s => s.id === 'bell-schedule');
        if (prevBellSchedule) {
            setProcessSections(prevSections => prevSections.map(s => {
                if (s.id === 'bell-schedule') {
                    return { ...s, items: prevBellSchedule.items };
                }
                return s;
            }));
        }
    }
  };

  // Protocol / Notification State
  const [protocolEvents, setProtocolEvents] = useState<ProtocolEvent[]>(INITIAL_PROTOCOL_EVENTS);

  // Bulk Action State
  const [isPromotionMode, setIsPromotionMode] = useState(false);
  const [promotionOrder, setPromotionOrder] = useState('');

  const notificationCount = protocolEvents.filter(e => e.status === 'pending').length;

  const handleNavigate = (view: string) => {
      // Always reset journal selection when navigating to journals (or any other view)
      if (view === 'journals') {
          setSelectedJournalId(null);
      }
      setCurrentView(view);
  };

  const handleAddProtocolEvent = (event: ProtocolEvent) => {
    setProtocolEvents(prev => [event, ...prev]);
  };

  const handleAddStudent = (data: any) => {
    // Create initial history record
    const historyRecord: MovementHistory = {
        date: data.orderDate,
        type: 'enrollment',
        orderNumber: data.orderNumber,
        description: `Зачисление на 1 курс. ${data.specialtyName}`
    };

    const newStudent: Student = {
        id: data.id,
        fullName: data.fullName,
        specialty: data.specialty,
        language: data.language,
        course: 1,
        gender: data.gender,
        status: 'active',
        history: [historyRecord],
        surname: data.surname,
        name: data.name,
        patronymic: data.patronymic,
        admissionYear: data.year,
        base: data.base
    };
    setStudents([...students, newStudent]);
    setIsStudentModalOpen(false);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudents(students.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    setViewStudent(updatedStudent); // Update the view if open
  };

  const toggleSelect = (id: number) => {
    if (selectedStudentIds.includes(id)) {
        setSelectedStudentIds(selectedStudentIds.filter(sid => sid !== id));
    } else {
        setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  const toggleAll = (ids: number[]) => {
      if (ids.every(id => selectedStudentIds.includes(id))) {
          // Unselect all visible
          setSelectedStudentIds(selectedStudentIds.filter(id => !ids.includes(id)));
      } else {
          // Select all visible (union)
          const newIds = [...new Set([...selectedStudentIds, ...ids])];
          setSelectedStudentIds(newIds);
      }
  };

  const handleStartPromotion = () => {
      setIsPromotionMode(true);
      setSelectedStudentIds([]); // Start with clean selection
  };

  const handleCancelPromotion = () => {
      setIsPromotionMode(false);
      setSelectedStudentIds([]);
      setPromotionOrder('');
  };

  const handleBulkPromotion = () => {
      if (!promotionOrder) return alert("Введите номер приказа!");
      if (selectedStudentIds.length === 0) return alert("Выберите студентов для перевода!");

      const today = new Date().toISOString().split('T')[0];
      
      const updatedStudents = students.map(student => {
          // If selected, promote course and add history
          if (selectedStudentIds.includes(student.id)) {
              if (student.status !== 'active') return student; // Skip non-active

              return {
                  ...student,
                  course: student.course + 1,
                  history: [
                      {
                          date: today,
                          type: 'promotion',
                          orderNumber: promotionOrder,
                          description: `Перевод на ${student.course + 1} курс`
                      },
                      ...student.history
                  ]
              } as Student;
          } 
          return student;
      });

      setStudents(updatedStudents);
      handleCancelPromotion();
      alert(`Успешно переведено студентов: ${selectedStudentIds.length}`);
  };

  const handleSaveSchedule = (data: ScheduleFormData) => {
    setSchedules(prev => [...prev, data]);
    
    // Create a new Journal entry for the list view
    const newJournal: Journal = {
        id: Date.now(),
        title: data.discipline,
        description: `${data.course} курс, ${data.group}`,
        type: 'course', // Defaulting to course
        courseNumber: parseInt(data.course) || 1,
        studentCount: data.students.length,
        color: 'bg-blue-500', // Default color
        icon: <Book size={20} /> // Default icon
    };
    setJournals(prev => [...prev, newJournal]);
    setIsScheduleModalOpen(false);
  };

  // Theme Helpers
  const getThemeClasses = () => {
    switch (theme) {
      case 'dark': return 'bg-gray-900 text-gray-100';
      case 'lavender': return 'bg-purple-50 text-gray-900';
      case 'coral': return 'bg-orange-50 text-gray-900';
      case 'graphite': return 'bg-slate-100 text-slate-900';
      default: return 'bg-[#F9FAFB] text-gray-900';
    }
  };

  // Render content based on current view
  const renderContent = () => {
    switch (currentView) {
      case 'rup':
        return (
          <div className={`flex-1 flex flex-col min-h-0 m-4 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border overflow-hidden ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
             <div className="flex items-center justify-between px-8 py-6 pb-2 shrink-0">
                <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Рабочие учебные планы:</h1>
                <YearSelect />
             </div>
             <PlanList subjects={subjects} setSubjects={setSubjects} />
          </div>
        );
      case 'disciplines':
        return (
          <div className={`flex-1 flex flex-col min-h-0 m-4 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border overflow-hidden ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
             <div className="flex items-center justify-between px-8 py-6 pb-2 shrink-0">
                <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Каталог дисциплин:</h1>
                <YearSelect />
             </div>
             <DisciplineCatalog subjects={subjects} setSubjects={setSubjects} />
          </div>
        );
      case 'dashboard':
        return <DashboardView onNavigate={handleNavigate} activeSemester={activeSemester} />;
      case 'journals':
        return selectedJournalId ? (
            <JournalView onClose={() => setSelectedJournalId(null)} />
        ) : (
            <JournalListView 
                journals={journals}
                onSelectJournal={setSelectedJournalId}
                onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
                activeYear={activeYear}
                activeSemester={activeSemester}
            />
        );
      case 'planning':
        return (
            <PlanningView 
                schedules={schedules} 
                onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
                activeYear={activeYear}
                activeSemester={activeSemester}
            />
        );
      case 'schedule':
        return (
            <ProcessScheduleView 
                activeYear={activeYear} 
                setActiveYear={(year) => handleContextChange(year, activeSemester)}
                activeSemester={activeSemester}
                setActiveSemester={(sem) => handleContextChange(activeYear, sem)}
                sections={processSections}
                setSections={setProcessSections}
                onCopyFromPreviousSemester={handleCopyFromPreviousSemester}
            />
        );
      case 'protocol':
        return <ProtocolView events={protocolEvents} setEvents={setProtocolEvents} />;
      case 'students':
        return (
            <div className="p-6">
                {/* Page Title */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Картотека обучающихся</h1>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 flex gap-4">
                         {/* Search by Name */}
                        <div className="relative flex-grow max-w-sm">
                            <input 
                                type="text" 
                                placeholder="Поиск по ФИО..." 
                                className={`w-full border border-transparent rounded px-4 py-2 text-sm focus:outline-none shadow-sm transition-colors ${theme === 'dark' ? 'bg-gray-700 text-white placeholder-gray-400 hover:border-gray-600' : 'bg-white hover:border-gray-300 placeholder-gray-400'}`}
                            />
                        </div>
                        {/* Year */}
                        <div className="relative flex-grow max-w-xs">
                            <button className={`w-full rounded px-4 py-2 text-sm flex items-center justify-between shadow-sm transition-colors border border-transparent ${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-500 hover:bg-gray-200 hover:border-gray-300'}`}>
                                <span>Год поступления:</span>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bulk Action Bar (Visible in Promotion Mode) */}
                {isPromotionMode && (
                    <div className="mb-4 bg-white border border-blue-200 rounded-lg p-4 flex items-center justify-between shadow-md animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-blue-800 font-semibold">
                                <CheckSquare size={20} />
                                <span>Режим перевода курса</span>
                            </div>
                            <span className="text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">Выбрано: {selectedStudentIds.length}</span>
                            
                            <div className="h-6 w-px bg-gray-300 mx-2"></div>

                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600 font-medium">№ Приказа:</label>
                                <input 
                                    type="text" 
                                    placeholder="Введите номер..." 
                                    className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 w-48"
                                    value={promotionOrder}
                                    onChange={(e) => setPromotionOrder(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={handleCancelPromotion}
                                className="text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded px-3 py-2 font-medium text-sm transition-colors"
                            >
                                Отмена
                            </button>
                            <button 
                                onClick={handleBulkPromotion}
                                disabled={!promotionOrder || selectedStudentIds.length === 0}
                                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded shadow-sm text-sm font-bold transition-colors"
                            >
                                Подтвердить перевод
                            </button>
                        </div>
                    </div>
                )}

                {/* Secondary Filters & Action Button */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                    <div className="flex flex-wrap gap-4">
                        <button className={`rounded px-4 py-1.5 text-sm flex items-center gap-2 shadow-sm font-medium transition-colors border border-transparent ${theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-600 hover:bg-gray-200 hover:border-gray-300'}`}>
                            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}>Специальность:</span> <span className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>Все</span> <ChevronRight size={14} className="text-gray-300"/>
                        </button>
                        <button className={`rounded px-4 py-1.5 text-sm flex items-center gap-2 shadow-sm font-medium transition-colors border border-transparent ${theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-600 hover:bg-gray-200 hover:border-gray-300'}`}>
                            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}>Пол:</span> <span className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>Все</span> <ChevronRight size={14} className="text-gray-300"/>
                        </button>
                         <button className={`rounded px-4 py-1.5 text-sm flex items-center gap-2 shadow-sm font-medium transition-colors border border-transparent ${theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-600 hover:bg-gray-200 hover:border-gray-300'}`}>
                            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}>Статус:</span> <span className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>Активные</span> <ChevronRight size={14} className="text-gray-300"/>
                        </button>
                    </div>

                    {!isPromotionMode && (
                        <button 
                            onClick={handleStartPromotion}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors text-sm font-medium whitespace-nowrap hover:shadow-md"
                        >
                            <GraduationCap size={18} />
                            Перевести на следующий курс
                        </button>
                    )}
                </div>

                {/* Table */}
                <StudentTable 
                    students={students} 
                    onStudentClick={setViewStudent} 
                    selectedIds={selectedStudentIds}
                    onToggleSelect={toggleSelect}
                    onToggleAll={toggleAll}
                    selectionMode={isPromotionMode}
                />

                {/* Floating Action Button */}
                <div className="fixed bottom-8 right-8 z-40">
                    <button 
                        onClick={() => setIsStudentModalOpen(true)}
                        className="bg-green-500 hover:bg-green-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 hover:shadow-xl"
                    >
                        <Plus size={32} />
                    </button>
                </div>
            </div>
        );
      default:
        return (
           <div className="flex items-center justify-center h-full text-gray-400">
               <div className="text-center">
                   <p>Раздел {currentView} в разработке</p>
               </div>
           </div>
        );
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${getThemeClasses()}`}>
      <Sidebar currentView={currentView} onNavigate={handleNavigate} theme={theme} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header theme={theme} setTheme={setTheme} />
        
        <main className={`flex-1 overflow-auto relative ${['journals', 'protocol', 'dashboard', 'rup', 'disciplines'].includes(currentView) ? '' : 'p-0'}`}>
            {renderContent()}
        </main>
      </div>

      <AddStudentModal 
        isOpen={isStudentModalOpen} 
        onClose={() => setIsStudentModalOpen(false)} 
        onSave={handleAddStudent}
        nextId={students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1}
      />

      <StudentDetailsModal
        student={viewStudent}
        onClose={() => setViewStudent(null)}
        onUpdate={handleUpdateStudent}
      />

      <ScheduleModal 
        isOpen={isScheduleModalOpen} 
        onClose={() => setIsScheduleModalOpen(false)} 
        onSave={handleSaveSchedule} 
        processSections={processSections}
      />
    </div>
  );
};

export default App;
