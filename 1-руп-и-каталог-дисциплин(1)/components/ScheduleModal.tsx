
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ProgressCheck } from './ProgressCheck';
import { DayPicker } from './DayPicker';
import { DayOfWeek, ScheduleFormData, DayTime, IndividualJournal, ProcessSection } from '../types';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ScheduleFormData) => void;
  processSections: ProcessSection[];
}

// Full Spectrum Palette with Shades
const FULL_COLOR_PALETTE = [
  { name: 'Red', shades: ['#FF3B30', '#FF3B30', '#FF3B30', '#FF3B30', '#FF3B30'] },
  { name: 'Orange', shades: ['#FF9500', '#FF9500', '#FF9500', '#FF9500', '#FF9500'] },
  { name: 'Yellow', shades: ['#FFCC00', '#FFCC00', '#FFCC00', '#FFCC00', '#FFCC00'] },
  { name: 'Green', shades: ['#34C759', '#34C759', '#34C759', '#34C759', '#34C759'] },
  { name: 'Mint', shades: ['#00C7BE', '#00C7BE', '#00C7BE', '#00C7BE', '#00C7BE'] },
  { name: 'Teal', shades: ['#30B0C7', '#30B0C7', '#30B0C7', '#30B0C7', '#30B0C7'] },
  { name: 'Cyan', shades: ['#32ADE6', '#32ADE6', '#32ADE6', '#32ADE6', '#32ADE6'] },
  { name: 'Blue', shades: ['#007AFF', '#007AFF', '#007AFF', '#007AFF', '#007AFF'] },
  { name: 'Indigo', shades: ['#5856D6', '#5856D6', '#5856D6', '#5856D6', '#5856D6'] },
  { name: 'Purple', shades: ['#AF52DE', '#AF52DE', '#AF52DE', '#AF52DE', '#AF52DE'] },
  { name: 'Pink', shades: ['#FF2D55', '#FF2D55', '#FF2D55', '#FF2D55', '#FF2D55'] },
  { name: 'Brown', shades: ['#A2845E', '#A2845E', '#A2845E', '#A2845E', '#A2845E'] },
  { name: 'Gray', shades: ['#8E8E93', '#8E8E93', '#8E8E93', '#8E8E93', '#8E8E93'] },
];

const MOCK_STUDENTS_LIST = [
  { id: '1', name: 'Иван Иванов', specialty: 'Хоровое дирижирование', course: '1 курс', language: 'RU', gender: 'М' },
  { id: '2', name: 'Мария Петрова', specialty: 'Вокальное искусство', course: '2 курс', language: 'RU', gender: 'Ж' },
  { id: '3', name: 'Алексей Сидоров', specialty: 'Духовые и ударные инструменты', course: '1 курс', language: 'KK', gender: 'М' },
  { id: '4', name: 'Елена Кузнецова', specialty: 'Струнные инструменты', course: '3 курс', language: 'RU', gender: 'Ж' },
  { id: '5', name: 'Дмитрий Попов', specialty: 'Хоровое дирижирование', course: '2 курс', language: 'KK', gender: 'М' },
  { id: '6', name: 'Анна Васильева', specialty: 'Вокальное искусство', course: '1 курс', language: 'RU', gender: 'Ж' },
  { id: '7', name: 'Сергей Соколов', specialty: 'Духовые и ударные инструменты', course: '2 курс', language: 'RU', gender: 'М' },
  { id: '8', name: 'Ольга Морозова', specialty: 'Струнные инструменты', course: '3 курс', language: 'KK', gender: 'Ж' },
  { id: '9', name: 'Никита Волков', specialty: 'Хоровое дирижирование', course: '2 курс', language: 'RU', gender: 'М' },
  { id: '10', name: 'Юлия Новикова', specialty: 'Вокальное искусство', course: '1 курс', language: 'KK', gender: 'Ж' },
  { id: '11', name: 'Арман Сериков', specialty: 'Духовые и ударные инструменты', course: '2 курс', language: 'KK', gender: 'М' },
  { id: '12', name: 'Гульнара Абишева', specialty: 'Струнные инструменты', course: '1 курс', language: 'KK', gender: 'Ж' },
  { id: '13', name: 'Виктор Цой', specialty: 'Хоровое дирижирование', course: '2 курс', language: 'RU', gender: 'М' },
];

const SPECIALTIES = [
  'Хоровое дирижирование',
  'Вокальное искусство',
  'Духовые и ударные инструменты',
  'Струнные инструменты'
];
const COURSES = Array.from(new Set(MOCK_STUDENTS_LIST.map(s => s.course))).sort();
const LANGUAGES = ['RU', 'KK'];
const GENDERS = ['М', 'Ж'];

const DISCIPLINES_LIST = [
  "Р.О. 1.1. Владеть основными элементами музыкальной грамоты (2023)",
  "Р.О. 1.2. Определять важнейшие элементы музыкального языка в их взаимосвязи (2024)",
  "РО 1.1 Совершенствовать физические качества и психо-физические способности (2025)",
  "ООД 07 Всемирная история (2025)"
];

const INITIAL_DATA_BASE: Partial<ScheduleFormData> = {
  discipline: '',
  course: '',
  group: '',
  customPeriod: false,
  customPeriodValue: '',
  students: [],
  color: '#007AFF', // System Blue Default
  days: [],
  dayTimes: {},
  rupKtp: '',
  useIndividualJournals: false,
  individualJournals: [],
  gradingType: '',
};

const STEPS = [
  { id: 1, title: 'Основное', subtitle: 'Дисциплина' },
  { id: 2, title: 'Время', subtitle: 'Расписание' },
  { id: 3, title: 'Студенты', subtitle: 'Группа' },
  { id: 4, title: 'Программа', subtitle: 'Материалы' },
  { id: 5, title: 'Индивидуально', subtitle: 'Траектории' }
];

const PLANNED_PROGRAM_HOURS = 96;
const PLANNED_SEMESTER_HOURS = 36;
const WEEKS_IN_SEMESTER = 15;

export const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose, onSave, processSections }) => {
  const timeSlots = useMemo(() => {
    if (!processSections) return [];
    const bellSection = processSections.find(s => s.id === 'bell-schedule');
    if (!bellSection) return [];
    return bellSection.items.map((item, index) => ({
      id: item.id,
      label: `${index + 1} пара`,
      start: item.label,
      end: item.details || ''
    }));
  }, [processSections]);

  const activeSemesterData = useMemo(() => {
    if (!processSections) return {
      label: 'Семестр 1',
      period: '01/09/2025 - 03/01/2026'
    };
    const semesterSection = processSections.find(s => s.id === 'semesters');
    const activeItem = semesterSection?.items.find(i => i.isActive);
    return {
      label: activeItem?.label || 'Семестр 1',
      period: activeItem?.details || '01/09/2025 - 03/01/2026'
    };
  }, [processSections]);

  const initialData = useMemo(() => ({
    ...INITIAL_DATA_BASE,
    period: activeSemesterData.period,
    semester: activeSemesterData.label,
  } as ScheduleFormData), [activeSemesterData]);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ScheduleFormData>(initialData);

  // Sync initial data when active semester changes and modal is closed
  React.useEffect(() => {
    if (!isOpen) {
      setFormData(initialData);
    }
  }, [initialData, isOpen]);
  
  // Student Filters
  const [langFilters, setLangFilters] = useState<string[]>([]);
  const [specFilters, setSpecFilters] = useState<string[]>([]);
  const [courseFilters, setCourseFilters] = useState<string[]>([]);
  const [genderFilters, setGenderFilters] = useState<string[]>([]);
  
  // UI States
  const [showSpecDropdown, setShowSpecDropdown] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [openStudentSelectorId, setOpenStudentSelectorId] = useState<string | null>(null);
  const [activeJournalId, setActiveJournalId] = useState<string | null>(null);
  const [showProgramSelector, setShowProgramSelector] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showDisciplineDropdown, setShowDisciplineDropdown] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColorGroup, setSelectedColorGroup] = useState<string | null>('Blue');

  // Filter Helpers
  const toggleSpecFilter = (spec: string) => setSpecFilters(prev => prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]);
  const toggleCourseFilter = (c: string) => setCourseFilters(prev => prev.includes(c) ? prev.filter(v => v !== c) : [...prev, c]);
  const toggleLangFilter = (l: string) => setLangFilters(prev => prev.includes(l) ? prev.filter(v => v !== l) : [...prev, l]);
  const toggleGenderFilter = (g: string) => setGenderFilters(prev => prev.includes(g) ? prev.filter(v => v !== g) : [...prev, g]);

  const filteredStudents = useMemo(() => {
    return MOCK_STUDENTS_LIST.filter(s => {
      if (langFilters.length > 0 && !langFilters.includes(s.language)) return false;
      if (specFilters.length > 0 && !specFilters.includes(s.specialty)) return false;
      if (courseFilters.length > 0 && !courseFilters.includes(s.course)) return false;
      if (genderFilters.length > 0 && !genderFilters.includes(s.gender)) return false;
      return true;
    });
  }, [langFilters, specFilters, courseFilters, genderFilters]);

  const handleSelectAllFiltered = () => {
       const ids = filteredStudents.map(s => s.id);
       setFormData(prev => ({ ...prev, students: Array.from(new Set([...prev.students, ...ids])) }));
  };

  const handleDeselectAllFiltered = () => {
       const ids = filteredStudents.map(s => s.id);
       setFormData(prev => ({ ...prev, students: prev.students.filter(id => !ids.includes(id)) }));
  };

  // Calculations & Validation
  const calculateTotalHours = (days: DayOfWeek[], times: Record<string, DayTime[]>): number => {
    let weeklyHours = 0;
    days.forEach(day => {
      const daySlots = Array.isArray(times[day]) ? times[day] : [];
      daySlots.forEach(t => {
        if (t.start && t.end) {
          const [startH, startM] = t.start.split(':').map(Number);
          const [endH, endM] = t.end.split(':').map(Number);
          const startVal = startH + startM / 60;
          const endVal = endH + endM / 60;
          if (endVal > startVal) weeklyHours += (endVal - startVal);
        }
      });
    });
    return Math.round(weeklyHours * WEEKS_IN_SEMESTER);
  };

  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case 1: return formData.discipline.length > 0 && formData.color.length > 0;
      case 2:
        if (formData.customPeriod && !formData.customPeriodValue) return false;
        if (formData.days.length === 0) return false;
        return formData.days.every(d => {
            const slots = formData.dayTimes[d];
            return slots && Array.isArray(slots) && slots.length > 0 && slots.every(slot => slot.start && slot.end);
        });
      case 3: return formData.students.length > 0;
      case 4: return true;
      case 5:
        if (!formData.useIndividualJournals) return true;
        if (formData.individualJournals.length === 0) return false;
        if (!formData.gradingType) return false;
        return formData.individualJournals.every(j => 
          j.studentIds.length > 0 && 
          j.days.length > 0 && 
          j.days.every(d => {
              const slots = j.dayTimes[d];
              return slots && Array.isArray(slots) && slots.length > 0 && slots.every(slot => slot.start && slot.end);
          })
        );
      default: return false;
    }
  }, [formData, currentStep]);

  const handleNext = () => {
    if (currentStep < STEPS.length && isStepValid) setCurrentStep(curr => curr + 1);
    else if (currentStep === STEPS.length && isStepValid) {
      onSave(formData);
      handleResetAndClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(curr => curr - 1);
    else handleExit();
  };

  const handleExit = () => {
    if (JSON.stringify(formData) !== JSON.stringify(initialData)) setShowExitConfirm(true);
    else handleResetAndClose();
  };

  const handleResetAndClose = () => {
    onClose();
    setTimeout(() => {
      setFormData(initialData);
      setCurrentStep(1);
      setShowProgramSelector(false);
      setShowExitConfirm(false);
      setShowDisciplineDropdown(false);
      setShowColorPicker(false);
      setSpecFilters([]);
      setCourseFilters([]);
      setLangFilters([]);
      setGenderFilters([]);
    }, 200);
  };

  // --- Logic Helpers ---
  const toggleDay = (day: DayOfWeek) => {
    setFormData(prev => {
      const isSelected = prev.days.includes(day);
      const newDays = isSelected ? prev.days.filter(d => d !== day) : [...prev.days, day];
      const newDayTimes = { ...prev.dayTimes };
      if (!isSelected && (!newDayTimes[day] || !Array.isArray(newDayTimes[day]))) {
         newDayTimes[day] = [{ start: '', end: '' }];
      }
      return { ...prev, days: newDays, dayTimes: newDayTimes };
    });
  };

  const setDayTime = (day: DayOfWeek, index: number, field: keyof DayTime, value: string) => {
    setFormData(prev => {
        const slots = Array.isArray(prev.dayTimes[day]) ? [...prev.dayTimes[day]] : [];
        if (slots[index]) slots[index] = { ...slots[index], [field]: value };
        return { ...prev, dayTimes: { ...prev.dayTimes, [day]: slots } };
    });
  };

  const addTimeSlot = (day: DayOfWeek) => {
      setFormData(prev => {
          const slots = Array.isArray(prev.dayTimes[day]) ? [...prev.dayTimes[day]] : [];
          slots.push({ start: '', end: '' });
          return { ...prev, dayTimes: { ...prev.dayTimes, [day]: slots } };
      });
  };

  const removeTimeSlot = (day: DayOfWeek, index: number) => {
      setFormData(prev => {
          const slots = Array.isArray(prev.dayTimes[day]) ? [...prev.dayTimes[day]] : [];
          if (slots.length > 1) slots.splice(index, 1);
          return { ...prev, dayTimes: { ...prev.dayTimes, [day]: slots } };
      });
  };

  const handleProgramAttach = (file: string) => {
    if (activeJournalId) {
       setFormData(prev => ({ ...prev, individualJournals: prev.individualJournals.map(j => j.id === activeJournalId ? { ...j, rupKtp: file } : j) }));
       setActiveJournalId(null);
    } else {
      setFormData(prev => ({ ...prev, rupKtp: file }));
    }
    setShowProgramSelector(false);
  };

  const toggleMainStudent = (studentId: string) => {
    setFormData(prev => {
      const isSelected = prev.students.includes(studentId);
      const newStudents = isSelected ? prev.students.filter(id => id !== studentId) : [...prev.students, studentId];
      let newJournals = prev.individualJournals;
      if (isSelected) newJournals = prev.individualJournals.map(j => ({ ...j, studentIds: j.studentIds.filter(id => id !== studentId) }));
      return { ...prev, students: newStudents, individualJournals: newJournals };
    });
  };

  const addJournal = () => {
    setFormData(prev => ({ ...prev, individualJournals: [...prev.individualJournals, {
      id: Math.random().toString(36).substr(2, 9),
      studentIds: [],
      days: [],
      dayTimes: {},
      rupKtp: ''
    }] }));
  };

  const toggleJournalStudent = (journalId: string, studentId: string) => {
    setFormData(prev => ({
      ...prev,
      individualJournals: prev.individualJournals.map(j => {
        if (j.id === journalId) {
          const isSelected = j.studentIds.includes(studentId);
          return { ...j, studentIds: isSelected ? j.studentIds.filter(id => id !== studentId) : [...j.studentIds, studentId] };
        }
        if (j.studentIds.includes(studentId)) return { ...j, studentIds: j.studentIds.filter(id => id !== studentId) };
        return j;
      })
    }));
  };
  
  const toggleJournalDay = (journalId: string, day: DayOfWeek) => {
    setFormData(prev => {
        const journals = prev.individualJournals.map(j => {
            if (j.id === journalId) {
                const isSelected = j.days.includes(day);
                const newDays = isSelected ? j.days.filter(d => d !== day) : [...j.days, day];
                const newDayTimes = { ...j.dayTimes };
                if (!isSelected && (!newDayTimes[day] || !Array.isArray(newDayTimes[day]))) newDayTimes[day] = [{ start: '', end: '' }];
                return { ...j, days: newDays, dayTimes: newDayTimes };
            }
            return j;
        });
        return { ...prev, individualJournals: journals };
    });
  };

  const setJournalDayTime = (journalId: string, day: DayOfWeek, index: number, field: keyof DayTime, value: string) => {
    setFormData(prev => {
        const journals = prev.individualJournals.map(j => {
            if (j.id === journalId) {
                const slots = Array.isArray(j.dayTimes[day]) ? [...j.dayTimes[day]] : [];
                if (slots[index]) slots[index] = { ...slots[index], [field]: value };
                return { ...j, dayTimes: { ...j.dayTimes, [day]: slots } };
            }
            return j;
        });
        return { ...prev, individualJournals: journals };
    });
  };
  
  const addJournalTimeSlot = (journalId: string, day: DayOfWeek) => {
     setFormData(prev => {
        const journals = prev.individualJournals.map(j => {
           if (j.id === journalId) {
              const slots = Array.isArray(j.dayTimes[day]) ? [...j.dayTimes[day]] : [];
              slots.push({ start: '', end: '' });
              return { ...j, dayTimes: { ...j.dayTimes, [day]: slots } };
           }
           return j;
        });
        return { ...prev, individualJournals: journals };
     });
  };
  
  const removeJournalTimeSlot = (journalId: string, day: DayOfWeek, index: number) => {
     setFormData(prev => {
        const journals = prev.individualJournals.map(j => {
           if (j.id === journalId) {
              const slots = Array.isArray(j.dayTimes[day]) ? [...j.dayTimes[day]] : [];
              if (slots.length > 1) slots.splice(index, 1);
              return { ...j, dayTimes: { ...j.dayTimes, [day]: slots } };
           }
           return j;
        });
        return { ...prev, individualJournals: journals };
     });
  };

  if (!isOpen) return null;

  // Renderers

  const renderStep1 = () => (
    <div className="space-y-8 pb-10">
      <div className="space-y-2">
        <label className="text-gray-900 font-semibold text-[13px] ml-1 uppercase tracking-wide opacity-70">Дисциплина</label>
        <div className="relative">
          <button
            onClick={() => setShowDisciplineDropdown(!showDisciplineDropdown)}
            className={`w-full bg-[#F2F2F7] hover:bg-[#E5E5EA] active:bg-[#D1D1D6] rounded-xl px-4 py-4 text-[17px] font-normal text-gray-900 text-left flex justify-between items-center transition-colors duration-200 outline-none ${showDisciplineDropdown ? 'ring-2 ring-[#007AFF] bg-white' : ''}`}
          >
             <span className="truncate pr-4">{formData.discipline || <span className="text-gray-400">Выберите дисциплину</span>}</span>
             <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
          </button>
          {showDisciplineDropdown && (
            <>
               <div className="fixed inset-0 z-10" onClick={() => setShowDisciplineDropdown(false)} />
               <div className="absolute top-full left-0 right-0 mt-2 bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
                  {DISCIPLINES_LIST.map((discipline) => (
                    <div 
                      key={discipline}
                      onClick={() => {
                        setFormData({...formData, discipline});
                        setShowDisciplineDropdown(false);
                      }}
                      className="p-3.5 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                    >
                       <span className={`text-[15px] font-medium leading-snug ${formData.discipline === discipline ? 'text-[#007AFF]' : 'text-gray-900'}`}>{discipline}</span>
                    </div>
                  ))}
               </div>
            </>
          )}
        </div>
      </div>

      <div className="space-y-2">
          <label className="text-gray-900 font-semibold text-[13px] ml-1 uppercase tracking-wide opacity-70">Нагрузка</label>
          <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between h-32">
                   <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">План</div>
                   <div className="text-3xl font-bold text-gray-900 tracking-tight">{PLANNED_PROGRAM_HOURS} ч.</div>
                   <div className="text-[11px] font-medium text-gray-400">Полный курс</div>
              </div>
              <div className="p-5 bg-orange-50/50 rounded-2xl border border-orange-100 shadow-[0_4px_20px_rgba(255,149,0,0.05)] flex flex-col justify-between h-32">
                   <div className="text-[11px] font-semibold text-orange-600 uppercase tracking-widest">Семестр</div>
                   <div className="text-3xl font-bold text-orange-600 tracking-tight">{PLANNED_SEMESTER_HOURS} ч.</div>
                   <div className="text-[11px] font-semibold text-orange-500">К распределению</div>
              </div>
          </div>
      </div>

      <div className="space-y-2">
          <label className="text-gray-900 font-semibold text-[13px] ml-1 uppercase tracking-wide opacity-70">Цвет</label>
          <div className="relative">
              <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className={`w-full bg-[#F2F2F7] hover:bg-[#E5E5EA] rounded-xl px-4 py-3 flex items-center justify-between transition-all duration-200 ${showColorPicker ? 'ring-2 ring-[#007AFF] bg-white' : ''}`}
              >
                  <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full shadow-sm ring-1 ring-black/5" style={{ backgroundColor: formData.color }}></div>
                      <span className="text-[17px] text-gray-900">{selectedColorGroup}</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
              </button>

              {showColorPicker && (
                  <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowColorPicker(false)} />
                      <div className="absolute top-full mt-2 right-0 left-0 bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] p-4 z-20 animate-in fade-in zoom-in-95 duration-200">
                          <div className="flex flex-wrap gap-3 justify-center">
                              {FULL_COLOR_PALETTE.map((group) => (
                                  <button
                                      key={group.name}
                                      onClick={() => {
                                          setSelectedColorGroup(group.name);
                                          setFormData({ ...formData, color: group.shades[0] });
                                          setShowColorPicker(false);
                                      }}
                                      className={`w-10 h-10 rounded-full transition-transform hover:scale-110 shadow-sm ring-1 ring-black/5 ${selectedColorGroup === group.name ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                                      style={{ backgroundColor: group.shades[0] }}
                                      title={group.name}
                                  />
                              ))}
                          </div>
                      </div>
                  </>
              )}
          </div>
      </div>
    </div>
  );

  const renderStep2 = () => {
    const calculatedHours = calculateTotalHours(formData.days, formData.dayTimes);
    const isHoursMatching = calculatedHours === PLANNED_SEMESTER_HOURS;
    const daysList = Object.values(DayOfWeek);

    return (
    <div className="space-y-8">
       <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
              <label htmlFor="customPeriod" className="text-[17px] text-gray-900 cursor-pointer">Свой период</label>
              <div className="relative inline-block w-12 h-7 rounded-full cursor-pointer">
                  <input 
                    id="customPeriod" 
                    type="checkbox" 
                    checked={formData.customPeriod}
                    onChange={(e) => setFormData({...formData, customPeriod: e.target.checked})}
                    className="peer appearance-none w-12 h-7 absolute bg-gray-200 rounded-full cursor-pointer transition-colors duration-300 checked:bg-green-500"
                  />
                  <label htmlFor="customPeriod" className="w-6 h-6 bg-white rounded-full shadow-sm absolute top-0.5 left-0.5 peer-checked:left-5.5 transition-all duration-300 cursor-pointer"></label>
              </div>
          </div>
          
          <div className={`rounded-xl p-3 transition-all ${formData.customPeriod ? 'bg-gray-50' : ''}`}>
              {formData.customPeriod ? (
                <button type="button" onClick={() => setFormData({...formData, customPeriodValue: '01/10/2025 - 01/01/2026'})} className="text-[#007AFF] text-[17px] font-medium w-full text-left">
                  {formData.customPeriodValue || 'Выбрать даты...'}
                </button>
              ) : (
                <div className="flex justify-between items-center">
                   <p className="text-gray-900 text-[17px]">{formData.period}</p>
                   <span className="px-2 py-0.5 bg-gray-100 rounded text-[12px] font-medium text-gray-500">{formData.semester}</span>
                </div>
              )}
          </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
            <label className="text-gray-900 font-semibold text-[13px] uppercase tracking-wide opacity-70">Расписание</label>
            <div className={`text-[12px] font-medium px-2 py-1 rounded-lg ${isHoursMatching ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {calculatedHours} / {PLANNED_SEMESTER_HOURS} ч.
            </div>
        </div>
        
        <DayPicker selectedDays={formData.days} onToggle={toggleDay} />
      </div>

      {formData.days.length > 0 && (
        <div className="space-y-3 animate-in slide-in-from-bottom-2 fade-in duration-300">
           {formData.days.map(day => {
              const daySlots = Array.isArray(formData.dayTimes[day]) ? formData.dayTimes[day] : [];
              return (
              <div key={day} className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-start">
                 <div className="flex flex-col items-center gap-2 pt-1">
                   <span className="font-semibold text-gray-900 text-[13px] w-8 text-center">{day}</span>
                   <button onClick={() => addTimeSlot(day)} className="w-8 h-8 rounded-full bg-gray-50 text-blue-500 hover:bg-blue-50 flex items-center justify-center transition-colors">
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                   </button>
                 </div>
                 
                 <div className="flex-1 space-y-3">
                   {daySlots.map((currentTime, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                        <div className="relative flex-1">
                           <select
                              value={currentTime.start}
                              onChange={(e) => {
                                  const selectedSlot = timeSlots.find(s => s.start === e.target.value);
                                  setDayTime(day, idx, 'start', e.target.value);
                                  if (selectedSlot && selectedSlot.end) {
                                      setDayTime(day, idx, 'end', selectedSlot.end);
                                  }
                              }}
                              className="w-full bg-[#F2F2F7] rounded-lg px-3 py-2 text-[15px] text-gray-900 appearance-none outline-none focus:ring-2 focus:ring-blue-500/20"
                           >
                              <option value="" disabled>Начало</option>
                              {timeSlots.map(slot => (<option key={`start-${slot.id}`} value={slot.start}>{slot.start}</option>))}
                           </select>
                        </div>
                        <span className="text-gray-300">–</span>
                        <div className="relative flex-1">
                           <select
                              value={currentTime.end}
                              onChange={(e) => setDayTime(day, idx, 'end', e.target.value)}
                              className="w-full bg-[#F2F2F7] rounded-lg px-3 py-2 text-[15px] text-gray-900 appearance-none outline-none focus:ring-2 focus:ring-blue-500/20"
                           >
                              <option value="" disabled>Конец</option>
                              {timeSlots.map(slot => (<option key={`end-${slot.id}`} value={slot.end}>{slot.end}</option>))}
                           </select>
                        </div>
                        {daySlots.length > 1 && (
                            <button onClick={() => removeTimeSlot(day, idx)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                        )}
                    </div>
                   ))}
                 </div>
              </div>
              );
           })}
        </div>
      )}
    </div>
  );
  };

  const renderStep3 = () => {
    return (
      <div className="flex flex-col h-full space-y-4">
         <div className="space-y-3 pb-2 border-b border-gray-100">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {/* Specialty Dropdown */}
              <div className="relative">
                 <button onClick={() => setShowSpecDropdown(!showSpecDropdown)} className={`whitespace-nowrap bg-gray-100 hover:bg-gray-200 rounded-full px-4 py-1.5 text-[13px] font-medium text-gray-900 transition-colors ${specFilters.length ? 'bg-black text-white hover:bg-black' : ''}`}>
                    {specFilters.length ? `Спец: ${specFilters.length}` : 'Специальность'}
                 </button>
                 {showSpecDropdown && (
                   <div className="absolute top-full mt-2 left-0 z-20 bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-xl rounded-2xl p-2 w-64 max-h-64 overflow-y-auto">
                      <div onClick={() => setSpecFilters([])} className={`px-3 py-2 text-[13px] font-medium cursor-pointer rounded-lg flex items-center gap-2 ${specFilters.length === 0 ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-900'}`}>
                         Все
                      </div>
                      {SPECIALTIES.map(s => (
                        <div key={s} onClick={() => toggleSpecFilter(s)} className={`px-3 py-2 text-[13px] font-medium cursor-pointer rounded-lg flex items-center gap-2 ${specFilters.includes(s) ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-900'}`}>
                           {s}
                           {specFilters.includes(s) && <svg className="w-3 h-3 ml-auto text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                      ))}
                   </div>
                 )}
              </div>
              
              {/* Course Dropdown */}
              <div className="relative">
                 <button onClick={() => setShowCourseDropdown(!showCourseDropdown)} className={`whitespace-nowrap bg-gray-100 hover:bg-gray-200 rounded-full px-4 py-1.5 text-[13px] font-medium text-gray-900 transition-colors ${courseFilters.length ? 'bg-black text-white hover:bg-black' : ''}`}>
                    {courseFilters.length ? `Курс: ${courseFilters.length}` : 'Курс'}
                 </button>
                 {showCourseDropdown && (
                   <div className="absolute top-full mt-2 left-0 z-20 bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-xl rounded-2xl p-2 w-32 max-h-48 overflow-y-auto">
                      <div onClick={() => setCourseFilters([])} className={`px-3 py-2 text-[13px] font-medium cursor-pointer rounded-lg flex items-center gap-2 ${courseFilters.length === 0 ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-900'}`}>
                         Все
                      </div>
                      {COURSES.map(s => (
                        <div key={s} onClick={() => toggleCourseFilter(s)} className={`px-3 py-2 text-[13px] font-medium cursor-pointer rounded-lg flex items-center gap-2 ${courseFilters.includes(s) ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-900'}`}>
                           {s}
                           {courseFilters.includes(s) && <svg className="w-3 h-3 ml-auto text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                      ))}
                   </div>
                 )}
              </div>

              {/* Language Dropdown */}
              <div className="relative">
                 <button onClick={() => setShowLangDropdown(!showLangDropdown)} className={`whitespace-nowrap bg-gray-100 hover:bg-gray-200 rounded-full px-4 py-1.5 text-[13px] font-medium text-gray-900 transition-colors ${langFilters.length ? 'bg-black text-white hover:bg-black' : ''}`}>
                    {langFilters.length ? `Язык: ${langFilters.length}` : 'Язык'}
                 </button>
                 {showLangDropdown && (
                   <div className="absolute top-full mt-2 left-0 z-20 bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-xl rounded-2xl p-2 w-32 max-h-48 overflow-y-auto">
                      <div onClick={() => setLangFilters([])} className={`px-3 py-2 text-[13px] font-medium cursor-pointer rounded-lg flex items-center gap-2 ${langFilters.length === 0 ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-900'}`}>
                         Все
                      </div>
                      {LANGUAGES.map(l => (
                        <div key={l} onClick={() => toggleLangFilter(l)} className={`px-3 py-2 text-[13px] font-medium cursor-pointer rounded-lg flex items-center gap-2 ${langFilters.includes(l) ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-900'}`}>
                           {l}
                           {langFilters.includes(l) && <svg className="w-3 h-3 ml-auto text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                      ))}
                   </div>
                 )}
              </div>

              {/* Gender Dropdown */}
              <div className="relative">
                 <button onClick={() => setShowGenderDropdown(!showGenderDropdown)} className={`whitespace-nowrap bg-gray-100 hover:bg-gray-200 rounded-full px-4 py-1.5 text-[13px] font-medium text-gray-900 transition-colors ${genderFilters.length ? 'bg-black text-white hover:bg-black' : ''}`}>
                    {genderFilters.length ? `Пол: ${genderFilters.length}` : 'Пол'}
                 </button>
                 {showGenderDropdown && (
                   <div className="absolute top-full mt-2 left-0 z-20 bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-xl rounded-2xl p-2 w-32 max-h-48 overflow-y-auto">
                      <div onClick={() => setGenderFilters([])} className={`px-3 py-2 text-[13px] font-medium cursor-pointer rounded-lg flex items-center gap-2 ${genderFilters.length === 0 ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-900'}`}>
                         Все
                      </div>
                      {GENDERS.map(g => (
                        <div key={g} onClick={() => toggleGenderFilter(g)} className={`px-3 py-2 text-[13px] font-medium cursor-pointer rounded-lg flex items-center gap-2 ${genderFilters.includes(g) ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-900'}`}>
                           {g}
                           {genderFilters.includes(g) && <svg className="w-3 h-3 ml-auto text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                      ))}
                   </div>
                 )}
              </div>
            </div>

            <div className="flex gap-2">
                 <button onClick={handleSelectAllFiltered} className="flex-1 bg-gray-50 hover:bg-gray-100 text-[#007AFF] rounded-xl py-2 text-[13px] font-medium transition-colors">
                    Выбрать всех
                 </button>
                 <button onClick={handleDeselectAllFiltered} className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl py-2 text-[13px] font-medium transition-colors">
                    Сбросить
                 </button>
            </div>
            
            <div className="flex justify-between items-center px-1">
               <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Найдено: {filteredStudents.length}</span>
               <span className="text-[11px] font-semibold text-gray-900 uppercase tracking-widest">Выбрано: {formData.students.length}</span>
            </div>
         </div>
         
         <div className="flex-1 overflow-y-auto -mx-2 px-2 pt-2 space-y-2 no-scrollbar">
            {filteredStudents.map(student => {
               const isSelected = formData.students.includes(student.id);
               return (
                  <div key={student.id} onClick={() => toggleMainStudent(student.id)} className={`flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer border transition-all duration-200 group ${isSelected ? 'bg-[#636366] border-[#636366] shadow-lg shadow-gray-300/50' : 'bg-white border-transparent hover:bg-gray-200 hover:shadow-sm'}`}>
                     <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-white' : 'bg-gray-100 group-hover:bg-white'}`}>
                        {isSelected && <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                     </div>
                     <div className="min-w-0">
                        <p className={`text-[15px] font-semibold truncate ${isSelected ? 'text-white' : 'text-gray-900'}`}>{student.name}</p>
                        <p className={`text-[11px] font-medium uppercase tracking-wide truncate ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>{student.specialty} • {student.course}</p>
                     </div>
                     <div className="ml-auto">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-gray-500 text-gray-100' : 'bg-gray-100 text-gray-500 group-hover:bg-white'}`}>{student.language}</span>
                     </div>
                  </div>
               )
            })}
         </div>
      </div>
    );
  };

  const renderStep4 = () => (
    <div className="space-y-6 flex flex-col justify-center h-full">
        <div className="bg-white rounded-[32px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] text-center space-y-6 border border-gray-100">
            <div className="w-20 h-20 bg-blue-50 text-[#007AFF] rounded-full flex items-center justify-center mx-auto">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <div>
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Программа обучения</h3>
                <p className="text-[15px] text-gray-500 max-w-xs mx-auto mt-2 leading-relaxed">Загрузите PDF или DOCX файл с рабочей программой (РУП/КТП).</p>
            </div>
            
            <button 
              onClick={() => setShowProgramSelector(true)} 
              className={`w-full border border-dashed rounded-2xl px-6 py-8 flex flex-col items-center justify-center gap-3 transition-all duration-300 group ${
                formData.rupKtp 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-[#F2F2F7] border-gray-300 hover:bg-[#E5E5EA]'
              }`}
            >
              {formData.rupKtp ? (
                  <>
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-500">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <div>
                        <div className="font-semibold text-[15px] text-gray-900">{formData.rupKtp}</div>
                        <div className="text-[11px] font-medium uppercase tracking-wider text-blue-600 mt-1">Загружено</div>
                    </div>
                  </>
              ) : (
                  <>
                    <span className="text-[#007AFF] font-medium text-[15px] group-hover:scale-105 transition-transform">Выбрать файл</span>
                  </>
              )}
            </button>
        </div>
    </div>
  );

  const renderStep5 = () => {
    let totalIndividualHours = 0;
    formData.individualJournals.forEach(j => { totalIndividualHours += calculateTotalHours(j.days, j.dayTimes); });
    const isHoursMatching = totalIndividualHours === PLANNED_SEMESTER_HOURS;
    const daysList = Object.values(DayOfWeek);

    return (
      <div className="space-y-6">
         <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
               <div className="flex-1">
                  <h3 className="text-gray-900 font-bold text-[17px]">Индивидуальные журналы</h3>
                  <p className="text-[13px] text-gray-500">Траектории для отдельных студентов</p>
               </div>
               <div 
                 className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors duration-300 ${formData.useIndividualJournals ? 'bg-green-500' : 'bg-gray-200'}`} 
                 onClick={() => setFormData({...formData, useIndividualJournals: !formData.useIndividualJournals})}
               >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${formData.useIndividualJournals ? 'translate-x-6' : ''}`} />
               </div>
            </div>

            {formData.useIndividualJournals && (
               <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex justify-between items-center bg-[#F2F2F7] rounded-xl px-4 py-3">
                      <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">План: {PLANNED_SEMESTER_HOURS} ч</div>
                      <div className={`text-[13px] font-bold ${isHoursMatching ? 'text-green-600' : 'text-red-500'}`}>
                         {totalIndividualHours} ч
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <button 
                        onClick={() => setFormData({...formData, gradingType: 'combined'})}
                        className={`p-4 rounded-2xl text-left transition-all duration-200 border ${formData.gradingType === 'combined' ? 'bg-black text-white border-black shadow-lg hover:bg-gray-900' : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-100'}`}
                     >
                        <div className="text-[15px] font-semibold mb-1">Общая</div>
                        <div className={`text-[11px] leading-tight opacity-70`}>Суммируется с основным</div>
                     </button>
                     <button 
                        onClick={() => setFormData({...formData, gradingType: 'separate'})}
                        className={`p-4 rounded-2xl text-left transition-all duration-200 border ${formData.gradingType === 'separate' ? 'bg-black text-white border-black shadow-lg hover:bg-gray-900' : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-100'}`}
                     >
                        <div className="text-[15px] font-semibold mb-1">Раздельная</div>
                        <div className={`text-[11px] leading-tight opacity-70`}>Отдельная ведомость</div>
                     </button>
                  </div>

                  <div className="space-y-4">
                     {formData.individualJournals.map((journal, idx) => (
                        <div key={journal.id} className="bg-[#F9F9FB] rounded-[20px] p-5 border border-gray-100 space-y-4 relative">
                           <div className="flex justify-between items-center">
                              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Журнал #{idx + 1}</span>
                              <button onClick={() => setFormData(p => ({...p, individualJournals: p.individualJournals.filter(j => j.id !== journal.id)}))} className="text-red-400 hover:text-red-600">
                                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                           </div>

                           <div className="relative">
                              <button onClick={() => setOpenStudentSelectorId(openStudentSelectorId === journal.id ? null : journal.id)} className="w-full bg-white border border-gray-200/60 rounded-xl px-4 py-3 text-[15px] font-medium text-left flex justify-between items-center shadow-sm">
                                 <span className={journal.studentIds.length ? 'text-gray-900' : 'text-gray-400'}>{journal.studentIds.length ? `Студентов: ${journal.studentIds.length}` : 'Выберите студентов'}</span>
                                 <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                              </button>
                              
                              {openStudentSelectorId === journal.id && (
                                 <div className="absolute top-full mt-2 left-0 right-0 z-20 bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-xl rounded-2xl p-2 max-h-48 overflow-y-auto">
                                    {MOCK_STUDENTS_LIST.filter(s => formData.students.includes(s.id)).map(s => {
                                          const takenByOther = formData.individualJournals.some(j => j.id !== journal.id && j.studentIds.includes(s.id));
                                          const isSelected = journal.studentIds.includes(s.id);
                                          if (takenByOther) return null;
                                          return (
                                             <div key={s.id} onClick={() => toggleJournalStudent(journal.id, s.id)} className={`px-3 py-2 rounded-lg text-[13px] font-medium cursor-pointer mb-1 flex justify-between items-center transition-colors ${isSelected ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}>
                                                <span>{s.name}</span>
                                                {isSelected && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}
                                             </div>
                                          )
                                    })}
                                 </div>
                              )}
                           </div>

                           <DayPicker selectedDays={journal.days} onToggle={(d) => toggleJournalDay(journal.id, d)} />
                           
                           {journal.days.map(d => {
                              const daySlots = Array.isArray(journal.dayTimes[d]) ? journal.dayTimes[d] : [];
                              return (
                              <div key={d} className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 flex gap-3 items-start">
                                 <div className="flex flex-col items-center gap-1 pt-1">
                                    <span className="font-semibold text-gray-900 text-[12px] w-6 text-center">{d}</span>
                                    <button onClick={() => addJournalTimeSlot(journal.id, d)} className="w-6 h-6 rounded-full bg-gray-50 text-blue-500 hover:bg-blue-50 flex items-center justify-center">
                                       <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                    </button>
                                 </div>
                                 <div className="flex-1 space-y-2">
                                    {daySlots.map((time, idx) => (
                                       <div key={idx} className="flex gap-2 items-center">
                                          <select 
                                             value={time.start} 
                                             onChange={(e) => {
                                                 const selectedSlot = timeSlots.find(s => s.start === e.target.value);
                                                 setJournalDayTime(journal.id, d, idx, 'start', e.target.value);
                                                 if (selectedSlot && selectedSlot.end) {
                                                     setJournalDayTime(journal.id, d, idx, 'end', selectedSlot.end);
                                                 }
                                             }} 
                                             className="w-full bg-[#F2F2F7] rounded-lg px-2 py-1.5 text-[13px] outline-none"
                                          >
                                             <option value="" disabled>Начало</option>
                                             {timeSlots.map(slot => (<option key={`start-${slot.id}`} value={slot.start}>{slot.start}</option>))}
                                          </select>
                                          <span className="text-gray-300">-</span>
                                          <select 
                                             value={time.end} 
                                             onChange={(e) => setJournalDayTime(journal.id, d, idx, 'end', e.target.value)} 
                                             className="w-full bg-[#F2F2F7] rounded-lg px-2 py-1.5 text-[13px] outline-none"
                                          >
                                             <option value="" disabled>Конец</option>
                                             {timeSlots.map(slot => (<option key={`end-${slot.id}`} value={slot.end}>{slot.end}</option>))}
                                          </select>
                                          {daySlots.length > 1 && (
                                              <button onClick={() => removeJournalTimeSlot(journal.id, d, idx)} className="text-gray-400 hover:text-red-500"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                                          )}
                                       </div>
                                    ))}
                                 </div>
                              </div>
                              );
                           })}
                           
                           <button onClick={() => { setActiveJournalId(journal.id); setShowProgramSelector(true); }} className="w-full text-center text-[13px] font-medium text-blue-500 hover:text-blue-600 py-3 rounded-xl hover:bg-blue-50 transition-colors">
                              {journal.rupKtp ? 'Программа прикреплена' : 'Прикрепить КТП/РУП'}
                           </button>
                        </div>
                     ))}
                     <button onClick={addJournal} className="w-full py-4 border border-dashed border-gray-300 rounded-2xl text-gray-500 font-medium text-[13px] hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        Добавить журнал
                     </button>
                  </div>
               </div>
            )}
         </div>
      </div>
    );
  };

  // --- Overlays ---
  if (showProgramSelector) {
     return createPortal(
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={() => setShowProgramSelector(false)} />
           <div className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-[19px] font-bold text-gray-900 tracking-tight">Программа</h3>
                 <button onClick={() => setShowProgramSelector(false)} className="w-8 h-8 rounded-full bg-[#F2F2F7] flex items-center justify-center text-gray-500 hover:text-gray-900"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <div className="space-y-3">
                 <div onClick={() => handleProgramAttach('Educational_Plan_2026.pdf')} className="p-4 bg-[#F9F9FB] rounded-2xl hover:bg-[#F2F2F7] cursor-pointer flex items-center gap-4 transition-colors">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-500">PDF</div>
                    <div>
                       <p className="text-[15px] font-semibold text-gray-900">Plan_2026.pdf</p>
                       <p className="text-[12px] text-gray-500">2.4 MB</p>
                    </div>
                 </div>
                 <div className="p-6 border border-dashed border-gray-300 rounded-2xl text-center text-gray-400 text-[13px] font-medium cursor-pointer">
                    Загрузить файл
                 </div>
              </div>
           </div>
        </div>,
        document.body
     );
  }

  if (showExitConfirm) {
    return createPortal(
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
         <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
         <div className="relative bg-white rounded-[24px] p-8 w-full max-w-xs text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-[19px] font-bold text-gray-900">Закрыть?</h3>
            <p className="text-[15px] text-gray-500 leading-relaxed">Несохраненные данные будут утеряны.</p>
            <div className="grid grid-cols-2 gap-3 pt-2">
               <button onClick={() => setShowExitConfirm(false)} className="py-3 rounded-xl bg-[#F2F2F7] text-gray-900 font-semibold text-[15px] hover:bg-[#E5E5EA]">Нет</button>
               <button onClick={handleResetAndClose} className="py-3 rounded-xl bg-red-500 text-white font-semibold text-[15px] hover:bg-red-600">Да, закрыть</button>
            </div>
         </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-md transition-opacity" onClick={handleExit}/>
      
      <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
        
        <div className="px-8 pt-8 pb-4 relative z-10">
           <div className="flex justify-between items-center mb-8">
              <div>
                 <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{STEPS[currentStep-1].title}</h2>
                 <p className="text-[15px] font-medium text-gray-500 mt-0.5">{STEPS[currentStep-1].subtitle}</p>
              </div>
              <button onClick={handleExit} className="w-9 h-9 rounded-full bg-[#F2F2F7] flex items-center justify-center text-gray-500 hover:bg-[#E5E5EA] transition-colors">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
           </div>
           
           <div className="flex gap-1.5">
              {STEPS.map(step => (
                 <div key={step.id} className="h-1 flex-1 rounded-full overflow-hidden bg-gray-100">
                    <div className={`h-full bg-black transition-all duration-500 ease-out ${step.id <= currentStep ? 'w-full' : 'w-0'}`} />
                 </div>
              ))}
           </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-4 scroll-smooth no-scrollbar">
           {currentStep === 1 && renderStep1()}
           {currentStep === 2 && renderStep2()}
           {currentStep === 3 && renderStep3()}
           {currentStep === 4 && renderStep4()}
           {currentStep === 5 && renderStep5()}
        </div>

        <div className="px-8 py-6 flex items-center justify-between shrink-0 relative z-10 border-t border-gray-50 bg-white/80 backdrop-blur-xl">
           <button 
             onClick={handleBack} 
             className="px-6 py-3.5 rounded-2xl font-semibold text-[15px] text-gray-500 hover:bg-gray-50 transition-colors"
           >
              {currentStep === 1 ? 'Отмена' : 'Назад'}
           </button>
           
           <button 
             onClick={handleNext}
             disabled={!isStepValid}
             className={`px-8 py-3.5 rounded-full font-semibold text-[15px] shadow-lg transition-all transform active:scale-95 ${
               isStepValid 
                 ? (currentStep === STEPS.length 
                      ? 'bg-[#34C759] text-white hover:bg-[#2DB34A] shadow-green-200' 
                      : 'bg-[#FFCC00] text-black hover:bg-[#F5C300] shadow-yellow-200')
                 : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
             }`}
           >
              {currentStep === STEPS.length ? 'Создать' : 'Далее'}
           </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
