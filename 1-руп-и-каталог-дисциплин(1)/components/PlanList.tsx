import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Info, GripVertical, Copy, Plus, FileText, X, Trash2, Check, ArrowDown, Link as LinkIcon, HelpCircle, AlertTriangle, AlertCircle, Languages, Pencil, Clock, GraduationCap } from 'lucide-react';
import { SPECIALTIES } from '../constants';
import { Subject, Semester, LocalizedSubjectInfo } from '../types';
import { Theme } from '../App';

// Reusable Input Component moved OUTSIDE the main component to prevent re-renders losing focus
const FormInput = ({ 
  label, 
  value, 
  onChange, 
  onClear,
  isNumber = false,
  hasDistribute = false,
  onDistribute,
  className = "",
  theme = 'light'
}: { 
  label: string, 
  value: string, 
  onChange: (val: string) => void, 
  onClear?: () => void,
  isNumber?: boolean,
  hasDistribute?: boolean,
  onDistribute?: () => void,
  className?: string,
  theme?: Theme
}) => {
  const inputBg = theme === 'dark' ? 'bg-gray-700 text-white focus:ring-blue-500 focus:bg-gray-600' : 'bg-gray-100 text-gray-900 focus:ring-red-100 focus:bg-white';
  const labelColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className={`text-sm font-medium ${labelColor}`}>{label}</label>
      <div className="relative group/input">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full border-none rounded-lg py-2.5 px-4 font-medium focus:ring-2 transition-all ${hasDistribute ? 'pr-20' : 'pr-10'} ${inputBg}`}
        />
        
        {/* Actions Container */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {hasDistribute && (
             <button
              onClick={onDistribute}
              title="Распределить по семестрам"
              className={`p-1 rounded-md transition-all ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-600' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-200'}`}
             >
               <ArrowDown size={16} />
             </button>
          )}
  
          {value && (
            <button 
              onClick={() => onClear ? onClear() : onChange(isNumber ? '0' : '')}
              className={`rounded-full p-0.5 transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white bg-gray-600 hover:bg-gray-500' : 'text-gray-400 hover:text-gray-600 bg-gray-200 hover:bg-gray-300'}`}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

type LanguageKey = 'kz' | 'ru' | 'en';

interface PlanListProps {
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  theme?: Theme;
}

const PlanList: React.FC<PlanListProps> = ({ subjects, setSubjects, theme = 'light' }) => {
  // State for the main list
  // subjects state is now passed as prop
  const [activeBaseTab, setActiveBaseTab] = useState<'9' | '11'>('9');
  
  // UI State
  const [selectedSpecialty, setSelectedSpecialty] = useState('F');
  const [isSpecialtiesOpen, setIsSpecialtiesOpen] = useState(true);
  const [isPlanOpen, setIsPlanOpen] = useState(true);
  
  // Modal State
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  const [formBase, setFormBase] = useState<'9' | '11'>('9'); 
  const [editingId, setEditingId] = useState<number | null>(null); // Track if we are editing an existing item
  const [viewSubject, setViewSubject] = useState<Subject | null>(null); // Subject currently being viewed
  
  // Theme Colors Helper
  const colors = {
    bg: theme === 'dark' ? 'bg-gray-800' : 'bg-white',
    bgSecondary: theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50',
    border: theme === 'dark' ? 'border-gray-700' : 'border-gray-100',
    text: theme === 'dark' ? 'text-white' : 'text-gray-900',
    textSecondary: theme === 'dark' ? 'text-gray-400' : 'text-gray-500',
    hover: theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50',
    divider: theme === 'dark' ? 'divide-gray-700' : 'divide-gray-100',
    modalBg: theme === 'dark' ? 'bg-gray-800' : 'bg-white',
  };

  // Confirmation & Error Modals
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Dropdown states for table rows
  const [activeDropdown, setActiveDropdown] = useState<{id: number, field: string} | null>(null);

  // Form Data State
  const [formSelectedSpecialties, setFormSelectedSpecialties] = useState<string[]>(SPECIALTIES.map(s => s.id));
  const [isSpecialtiesDropdownOpen, setIsSpecialtiesDropdownOpen] = useState(false);
  const specialtiesDropdownRef = useRef<HTMLDivElement>(null);
  const [isFreeFilterChecked, setIsFreeFilterChecked] = useState(false);
  
  // Language Support
  const [formLanguages, setFormLanguages] = useState<LanguageKey[]>(['ru']);

  // Connect State
  const [isConnectChecked, setIsConnectChecked] = useState(false);
  const [connectYear, setConnectYear] = useState('');
  const [connectSubjectId, setConnectSubjectId] = useState('');
  const [availableConnectYears, setAvailableConnectYears] = useState<string[]>([]);
  const [availableConnectSubjects, setAvailableConnectSubjects] = useState<Subject[]>([]);
  
  // Ref for auto-scrolling
  const semesterEndRef = useRef<HTMLDivElement>(null);

  // Column Visibility State for the Table
  const [visibleColumns, setVisibleColumns] = useState({
    srs: false,
    srsp: false,
    practice: false,
    individual: false
  });

  // Common numeric fields
  const [commonFormData, setCommonFormData] = useState({
    credits: '',
    totalHours: '',
    theoretical: '',
    labPractice: '',
    three: '',
    srsp: '',
    srs: '',
    practice: '',
    individual: '',
    individualMain: '',
  });

  // Localized fields
  const [localizedFormData, setLocalizedFormData] = useState<Record<LanguageKey, { index: string, moduleName: string, disciplineName: string }>>({
    ru: { index: '', moduleName: '', disciplineName: '' },
    kz: { index: '', moduleName: '', disciplineName: '' },
    en: { index: '', moduleName: '', disciplineName: '' },
  });

  const [semesters, setSemesters] = useState<Semester[]>([
    { 
      id: 1, 
      year: '2025-2026', 
      semester: '1 семестр', 
      hours: '', 
      groupHours: '', 
      srsHours: '',
      srspHours: '',
      practiceHours: '',
      individualHours: '', 
      control: 'Нет' 
    }
  ]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (specialtiesDropdownRef.current && !specialtiesDropdownRef.current.contains(event.target as Node)) {
        setIsSpecialtiesDropdownOpen(false);
      }
      
      // Close row dropdowns if clicking outside
      const target = event.target as Element;
      if (activeDropdown && 
          !target.closest('.row-dropdown-trigger') && 
          !target.closest('.row-dropdown-menu')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  // Effect to populate available years for Connect
  useEffect(() => {
    if (formBase === '11') {
      const base9Subjects = subjects.filter(s => s.base === '9');
      const years = Array.from(new Set(base9Subjects.map(s => s.creationYear || '2024'))).sort();
      setAvailableConnectYears(years);
    }
  }, [formBase, subjects, isFormModalOpen]);

  // Effect to populate subjects when year changes
  useEffect(() => {
    if (formBase === '11' && connectYear) {
      const filtered = subjects.filter(s => s.base === '9' && (s.creationYear || '2024') === connectYear);
      setAvailableConnectSubjects(filtered);
    } else {
      setAvailableConnectSubjects([]);
    }
  }, [connectYear, formBase, subjects]);


  // Handlers
  const handleOpenForm = (base: '9' | '11') => {
    setFormBase(base);
    setEditingId(null);
    
    // RESET FORM DATA
    setCommonFormData({
        credits: '',
        totalHours: '',
        theoretical: '',
        labPractice: '',
        three: '',
        srsp: '',
        srs: '',
        practice: '',
        individual: '',
        individualMain: '',
    });
    setLocalizedFormData({
      ru: { index: '', moduleName: '', disciplineName: '' },
      kz: { index: '', moduleName: '', disciplineName: '' },
      en: { index: '', moduleName: '', disciplineName: '' },
    });
    setFormLanguages(['ru']);

    // RESET SEMESTERS
    setSemesters([{
      id: 1,
      year: '2025-2026',
      semester: '1 семестр',
      hours: '',
      groupHours: '',
      srsHours: '',
      srspHours: '',
      practiceHours: '',
      individualHours: '',
      control: 'Нет'
    }]);
    // RESET COLUMNS
    setVisibleColumns({
        srs: false,
        srsp: false,
        practice: false,
        individual: false
    });
    
    // Reset Connect fields
    setConnectYear('');
    setConnectSubjectId('');
    setIsConnectChecked(false);
    
    // Reset Free Filter
    setIsFreeFilterChecked(false);

    setFormSelectedSpecialties(SPECIALTIES.map(s => s.id));

    setIsSelectionModalOpen(false);
    setIsFormModalOpen(true);
    setIsCloseConfirmOpen(false);
    setValidationError(null);
  };

  const handleViewDetails = (subject: Subject) => {
    setViewSubject(subject);
    setIsDetailsModalOpen(true);
  };

  const handleEdit = (subject: Subject) => {
    setEditingId(subject.id);
    setFormBase(subject.base || '9');
    
    // Load common fields
    setCommonFormData({
      credits: subject.credits || '',
      totalHours: subject.totalHours || '',
      theoretical: subject.theoretical || '',
      labPractice: subject.labPractice || '',
      three: subject.three || '',
      srsp: subject.srsp || '',
      srs: subject.srs || '',
      practice: subject.practice || '',
      individual: subject.individual || '',
      individualMain: subject.individualMain || '',
    });

    // Load Localized Data
    const newLocalized = {
      ru: { index: '', moduleName: '', disciplineName: '' },
      kz: { index: '', moduleName: '', disciplineName: '' },
      en: { index: '', moduleName: '', disciplineName: '' },
    };

    if (subject.localizedInfo) {
      if (subject.localizedInfo.ru) {
        newLocalized.ru = { 
          index: subject.localizedInfo.ru.code, 
          moduleName: subject.localizedInfo.ru.title, 
          disciplineName: subject.localizedInfo.ru.subtitle 
        };
      }
      if (subject.localizedInfo.kz) {
        newLocalized.kz = { 
          index: subject.localizedInfo.kz.code, 
          moduleName: subject.localizedInfo.kz.title, 
          disciplineName: subject.localizedInfo.kz.subtitle 
        };
      }
      if (subject.localizedInfo.en) {
        newLocalized.en = { 
          index: subject.localizedInfo.en.code, 
          moduleName: subject.localizedInfo.en.title, 
          disciplineName: subject.localizedInfo.en.subtitle 
        };
      }
    } else {
      newLocalized.ru = {
        index: subject.code,
        moduleName: subject.title,
        disciplineName: subject.subtitle
      };
    }
    setLocalizedFormData(newLocalized);

    // Load Languages
    setFormLanguages(subject.languages || ['ru']);

    // Load Semesters
    if (subject.semesters) {
      setSemesters(subject.semesters.map(s => ({...s}))); // Deep copy
      
      // Calculate column visibility based on data presence
      let hasSrs = false, hasSrsp = false, hasPractice = false, hasIndividual = false;
      subject.semesters.forEach(s => {
        if (s.srsHours && s.srsHours !== '0') hasSrs = true;
        if (s.srspHours && s.srspHours !== '0') hasSrsp = true;
        if (s.practiceHours && s.practiceHours !== '0') hasPractice = true;
        if (s.individualHours && s.individualHours !== '0') hasIndividual = true;
      });
      setVisibleColumns({
        srs: hasSrs,
        srsp: hasSrsp,
        practice: hasPractice,
        individual: hasIndividual
      });
    } else {
       setSemesters([]);
    }

    // Load Specialties
    setFormSelectedSpecialties(subject.selectedSpecialties || SPECIALTIES.map(s => s.id));
    
    // Load boolean flags
    setIsFreeFilterChecked(!!subject.isFreeFilter);
    setIsConnectChecked(false); // Default connect to false when editing for now

    setIsSelectionModalOpen(false);
    setIsFormModalOpen(true);
    setIsCloseConfirmOpen(false);
    setValidationError(null);
  };

  const handleCloseRequest = () => {
    setIsCloseConfirmOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormModalOpen(false);
    setIsCloseConfirmOpen(false);
    setValidationError(null);
    setEditingId(null);
  };

  const handleSave = () => {
    // 1. Validate Total Hours
    const totalPlanHours = parseInt(commonFormData.totalHours || '0', 10);
    let distributedHours = 0;

    semesters.forEach(sem => {
      distributedHours += parseInt(sem.groupHours || '0', 10);
      if (visibleColumns.srs) distributedHours += parseInt(sem.srsHours || '0', 10);
      if (visibleColumns.srsp) distributedHours += parseInt(sem.srspHours || '0', 10);
      if (visibleColumns.practice) distributedHours += parseInt(sem.practiceHours || '0', 10);
      if (visibleColumns.individual) distributedHours += parseInt(sem.individualHours || '0', 10);
    });

    if (totalPlanHours !== distributedHours) {
      setValidationError(`Общее количество часов (${totalPlanHours}) не соответствует распределенным по семестрам часам (${distributedHours})`);
      return;
    }

    // Determine ID (New or Existing)
    const idToUse = editingId !== null ? editingId : (Math.max(...subjects.map(s => s.id), 0) + 1);
    
    // Determine main display fields (default to RU, then KZ, then EN)
    const primaryLang = formLanguages.includes('ru') ? 'ru' : formLanguages[0];
    const displayInfo = localizedFormData[primaryLang];

    // Create a full subject object with all form data
    const subjectData: Subject = {
      id: idToUse,
      code: displayInfo.index || 'Без кода',
      title: displayInfo.moduleName || 'Без названия',
      subtitle: displayInfo.disciplineName || 'Без описания',
      
      languages: formLanguages,
      localizedInfo: {
        ru: { code: localizedFormData.ru.index, title: localizedFormData.ru.moduleName, subtitle: localizedFormData.ru.disciplineName },
        kz: { code: localizedFormData.kz.index, title: localizedFormData.kz.moduleName, subtitle: localizedFormData.kz.disciplineName },
        en: { code: localizedFormData.en.index, title: localizedFormData.en.moduleName, subtitle: localizedFormData.en.disciplineName },
      },

      semesters: [...semesters],
      
      // Save persistence data
      base: formBase,
      creationYear: '2024',
      selectedSpecialties: formSelectedSpecialties,
      isFreeFilter: isFreeFilterChecked,
      
      // Save form fields
      credits: commonFormData.credits,
      totalHours: commonFormData.totalHours,
      theoretical: commonFormData.theoretical,
      labPractice: commonFormData.labPractice,
      three: commonFormData.three,
      srsp: commonFormData.srsp,
      srs: commonFormData.srs,
      practice: commonFormData.practice,
      individual: commonFormData.individual,
      individualMain: commonFormData.individualMain,
    };
    
    if (editingId !== null) {
      // Update existing
      setSubjects(prev => prev.map(s => s.id === editingId ? subjectData : s));
    } else {
      // Create new
      setSubjects(prev => [...prev, subjectData]);
    }

    handleCloseForm();
  };

  const handleConnect = (subjectId: string) => {
    setConnectSubjectId(subjectId);
    const sourceSubject = subjects.find(s => s.id.toString() === subjectId);
    if (sourceSubject) {
      // ... same connect logic ...
      if (sourceSubject.localizedInfo) {
        setLocalizedFormData(prev => {
          const newState = { ...prev };
          if (sourceSubject.localizedInfo?.ru) newState.ru = { index: sourceSubject.localizedInfo.ru.code, moduleName: sourceSubject.localizedInfo.ru.title, disciplineName: sourceSubject.localizedInfo.ru.subtitle };
          if (sourceSubject.localizedInfo?.kz) newState.kz = { index: sourceSubject.localizedInfo.kz.code, moduleName: sourceSubject.localizedInfo.kz.title, disciplineName: sourceSubject.localizedInfo.kz.subtitle };
          if (sourceSubject.localizedInfo?.en) newState.en = { index: sourceSubject.localizedInfo.en.code, moduleName: sourceSubject.localizedInfo.en.title, disciplineName: sourceSubject.localizedInfo.en.subtitle };
          return newState;
        });
      } else {
        setLocalizedFormData(prev => ({
          ...prev,
          ru: { index: sourceSubject.code, moduleName: sourceSubject.title, disciplineName: sourceSubject.subtitle }
        }));
      }
      if (sourceSubject.languages) setFormLanguages(sourceSubject.languages);
      setCommonFormData({
        credits: sourceSubject.credits || '',
        totalHours: sourceSubject.totalHours || '',
        theoretical: sourceSubject.theoretical || '',
        labPractice: sourceSubject.labPractice || '',
        three: sourceSubject.three || '',
        srsp: sourceSubject.srsp || '',
        srs: sourceSubject.srs || '',
        practice: sourceSubject.practice || '',
        individual: sourceSubject.individual || '',
        individualMain: sourceSubject.individualMain || '',
      });
      if (sourceSubject.semesters) setSemesters(sourceSubject.semesters.map(s => ({...s})));
      if (sourceSubject.selectedSpecialties) setFormSelectedSpecialties([...sourceSubject.selectedSpecialties]);
      setVisibleColumns({
        srs: !!sourceSubject.srs,
        srsp: !!sourceSubject.srsp,
        practice: !!sourceSubject.practice,
        individual: !!sourceSubject.individual
      });
    }
  };

  const handleAddSemester = () => {
    const newId = Math.max(...semesters.map(s => s.id), 0) + 1;
    setSemesters(prev => [...prev, {
      id: newId, year: '2025-2026', semester: '1 семестр', hours: '0', groupHours: '0', srsHours: '0', srspHours: '0', practiceHours: '0', individualHours: '0', control: 'Нет'
    }]);
    setTimeout(() => semesterEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
  };

  const handleDeleteSemester = (id: number) => setSemesters(semesters.filter(s => s.id !== id));
  const handleCommonInputChange = (field: string, value: string) => setCommonFormData(prev => ({ ...prev, [field]: value }));
  const handleLocalizedInputChange = (lang: LanguageKey, field: 'index' | 'moduleName' | 'disciplineName', value: string) => setLocalizedFormData(prev => ({ ...prev, [lang]: { ...prev[lang], [field]: value } }));
  const handleSemesterChange = (id: number, field: keyof Semester, value: string) => setSemesters(semesters.map(s => s.id === id ? { ...s, [field]: value } : s));
  
  const toggleSpecialty = (id: string) => setFormSelectedSpecialties(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  
  const toggleLanguage = (lang: LanguageKey) => {
    setFormLanguages(prev => {
      const exists = prev.includes(lang);
      if (exists) {
        if (prev.length === 1) return prev;
        return prev.filter(l => l !== lang);
      }
      return [...prev, lang];
    });
  };

  const toggleRowDropdown = (id: number, field: string) => {
    if (activeDropdown?.id === id && activeDropdown?.field === field) setActiveDropdown(null);
    else setActiveDropdown({ id, field });
  };

  const handleDistribute = (columnKey: keyof typeof visibleColumns) => setVisibleColumns(prev => ({ ...prev, [columnKey]: true }));

  // Determine grid columns
  const hourColumnsCount = 1 + (visibleColumns.srs ? 1 : 0) + (visibleColumns.srsp ? 1 : 0) + (visibleColumns.practice ? 1 : 0) + (visibleColumns.individual ? 1 : 0);
  
  const gridStyle = {
    gridTemplateColumns: `160px 140px repeat(${hourColumnsCount}, 100px) minmax(180px, 1fr) 40px`
  };

  const filteredSubjects = subjects.filter(s => (s.base || '9') === activeBaseTab);

  const renderLanguageBadge = (lang: string) => {
    let colorClass = "bg-gray-100 text-gray-600";
    if (lang === 'kz') colorClass = "bg-teal-100 text-teal-700";
    if (lang === 'ru') colorClass = "bg-indigo-100 text-indigo-700";
    if (lang === 'en') colorClass = "bg-purple-100 text-purple-700";
    
    return (
      <span key={lang} className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ml-1 ${colorClass}`}>
        {lang === 'kz' ? 'Kz' : lang === 'ru' ? 'Ru' : 'En'}
      </span>
    );
  };

  const getLanguageLabel = (lang: LanguageKey) => {
    switch(lang) {
      case 'kz': return 'Қазақ тілі';
      case 'ru': return 'Русский язык';
      case 'en': return 'English';
      default: return lang;
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
        <div className="w-full space-y-6 pb-20">
          
          {/* Specialties Section */}
          <div className={`${colors.bg} rounded-lg shadow-sm border ${colors.border} overflow-hidden`}>
             {/* ... (kept same) ... */}
            <button 
              onClick={() => setIsSpecialtiesOpen(!isSpecialtiesOpen)}
              className={`w-full flex items-center gap-3 px-6 py-4 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50/50'} border-b ${colors.border} ${colors.hover} transition-colors`}
            >
              <ChevronDown size={18} className={`${colors.textSecondary} transition-transform ${isSpecialtiesOpen ? '' : '-rotate-90'}`} />
              <h2 className={`text-lg font-medium ${colors.text}`}>Специальности:</h2>
            </button>
            
            {isSpecialtiesOpen && (
              <div className="p-6">
                <div className="flex flex-wrap gap-3">
                  {SPECIALTIES.map((spec) => {
                    const isSelected = selectedSpecialty === spec.id;
                    return (
                      <button
                        key={spec.id}
                        onClick={() => setSelectedSpecialty(spec.id)}
                        className={`
                          group flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200
                          ${isSelected 
                            ? 'border-red-500 bg-red-50 text-gray-900' 
                            : `${colors.border} ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-700'} hover:border-gray-300 hover:shadow-sm`
                          }
                        `}
                      >
                        <span className={`font-semibold ${isSelected ? 'text-gray-900' : (theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}`}>
                          {spec.label}
                        </span>
                        {spec.hasInfo && (
                          <Info 
                            size={14} 
                            className={`${isSelected ? 'text-red-400' : 'text-gray-400 group-hover:text-gray-500'}`} 
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Curriculum Plan Section */}
          <div className={`${colors.bg} rounded-lg shadow-sm border ${colors.border} overflow-hidden`}>
            <div className={`flex items-center justify-between px-6 py-3 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50/50'} border-b ${colors.border}`}>
               <div className="flex items-center gap-6">
                 <button 
                    onClick={() => setIsPlanOpen(!isPlanOpen)}
                    className={`flex items-center gap-3 ${theme === 'dark' ? 'hover:text-gray-300' : 'hover:text-gray-600'} transition-colors`}
                  >
                    <ChevronDown size={18} className={`${colors.textSecondary} transition-transform ${isPlanOpen ? '' : '-rotate-90'}`} />
                    <h2 className={`text-lg font-medium ${colors.text}`}>Рабочий учебный план:</h2>
                  </button>

                  {/* Base Selection Tabs */}
                  <div className={`flex p-1 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <button
                      onClick={() => setActiveBaseTab('9')}
                      className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 ${
                        activeBaseTab === '9'
                          ? `${theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'} shadow-sm`
                          : `${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`
                      }`}
                    >
                      База 9 класса
                    </button>
                    <button
                      onClick={() => setActiveBaseTab('11')}
                      className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 ${
                        activeBaseTab === '11'
                          ? `${theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'} shadow-sm`
                          : `${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`
                      }`}
                    >
                      База 11 класса
                    </button>
                 </div>
               </div>

                <div className="flex items-center gap-2">
                  <button className="p-2 text-yellow-600 bg-yellow-50 hover:bg-yellow-100 rounded-full transition-colors">
                    <FileText size={18} />
                  </button>
                  <button 
                    onClick={() => handleOpenForm(activeBaseTab)}
                    className="p-2 text-white bg-green-500 hover:bg-green-600 rounded-full transition-colors shadow-sm hover:shadow"
                  >
                    <Plus size={18} />
                  </button>
                </div>
            </div>

            {isPlanOpen && (
              <div className={`divide-y ${colors.divider}`}>
                {filteredSubjects.length > 0 ? (
                  filteredSubjects.map((subject) => (
                    <div 
                      key={subject.id} 
                      className={`group flex items-start gap-4 p-4 ${colors.hover} transition-colors relative cursor-pointer`}
                      onClick={() => handleViewDetails(subject)}
                    >
                      {/* Drag Handle */}
                      <div 
                        className="mt-1.5 cursor-move text-gray-300 hover:text-gray-400 transition-colors"
                        onClick={(e) => e.stopPropagation()} 
                      >
                        <GripVertical size={20} />
                      </div>

                      {/* Number */}
                      <div className={`mt-1 w-8 h-8 flex items-center justify-center rounded text-sm font-medium shrink-0 ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                        {subject.id}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className={`font-bold ${colors.text}`}>{subject.code}</span>
                          <span className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'} truncate`}>{subject.title}</span>
                          {/* Badge showing base */}
                          {subject.base && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ${subject.base === '9' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-800'}`}>
                                База {subject.base} кл
                              </span>
                          )}
                          {/* Language Badges */}
                          {subject.languages && subject.languages.map(lang => renderLanguageBadge(lang))}
                          
                          {subject.isFreeFilter && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide bg-purple-100 text-purple-700 ml-1">
                              Своб. фильтр
                            </span>
                          )}
                        </div>
                        <p className={`text-sm truncate ${colors.textSecondary}`}>{subject.subtitle}</p>
                        
                        {/* SAVED DATA INDICATORS */}
                        {subject.semesters && subject.semesters.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-2">
                            {subject.semesters.map((sem, idx) => (
                              <div key={idx} className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-red-50 border border-red-100 text-xs font-medium text-red-700">
                                  <span>{sem.semester}</span>
                                  <span className="w-1 h-1 rounded-full bg-red-300"></span>
                                  <span>{sem.groupHours || 0} ч.</span>
                                  <span className="w-1 h-1 rounded-full bg-red-300"></span>
                                  <span>{sem.control}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                         {/* Button removed from here - click row to view, then edit */}
                        <button 
                          className={`p-2 rounded-md transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'}`}
                          title="Копировать"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Copy size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`p-8 text-center ${colors.textSecondary}`}>
                    <p>Нет дисциплин для выбранной базы.</p>
                  </div>
                )}
                <div className="h-4"></div>
              </div>
            )}
          </div>
        </div>
        
        {/* Floating Action Button (FAB) */}
        <button 
          className="fixed bottom-8 right-8 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 transform hover:scale-105 active:scale-95"
          title="Добавить"
          onClick={() => handleOpenForm(activeBaseTab)}
        >
          <Plus size={32} />
        </button>

      </div>

      {/* Details View Modal */}
      {isDetailsModalOpen && viewSubject && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
          onClick={() => setIsDetailsModalOpen(false)}
        >
           <div 
             className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
             onClick={(e) => e.stopPropagation()}
           >
              {/* Header */}
              <div className="flex items-start justify-between p-6 border-b border-gray-100">
                 <div>
                    <div className="flex items-center gap-3 mb-1">
                       <h2 className="text-2xl font-bold text-gray-900">{viewSubject.code}</h2>
                       <div className="flex gap-1">
                          {viewSubject.languages?.map(lang => renderLanguageBadge(lang))}
                       </div>
                       {viewSubject.base && (
                          <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wide ${viewSubject.base === '9' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-800'}`}>
                            База {viewSubject.base} кл
                          </span>
                       )}
                    </div>
                    <h3 className="text-xl font-medium text-gray-800">{viewSubject.title}</h3>
                    <p className="text-gray-500">{viewSubject.subtitle}</p>
                 </div>
                 <button 
                   onClick={() => setIsDetailsModalOpen(false)}
                   className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                 >
                    <X size={20} />
                 </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
                 
                 {/* Localized Info */}
                 {viewSubject.localizedInfo && Object.keys(viewSubject.localizedInfo).length > 0 && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(viewSubject.localizedInfo).map(([lang, info]) => {
                        // Fix: Cast info to LocalizedSubjectInfo to resolve 'unknown' type error
                        const localInfo = info as LocalizedSubjectInfo;
                        // Skip if info matches main display (optional check, keeping simple)
                        return (
                          <div key={lang} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                             <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${lang === 'kz' ? 'bg-teal-500' : lang === 'ru' ? 'bg-indigo-500' : 'bg-purple-500'}`}></span>
                                {getLanguageLabel(lang as LanguageKey)}
                             </h4>
                             <p className="font-semibold text-gray-900">{localInfo.code} - {localInfo.title}</p>
                             <p className="text-sm text-gray-600 mt-1">{localInfo.subtitle}</p>
                          </div>
                        )
                      })}
                   </div>
                 )}

                 {/* Key Metrics */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                       <div className="text-yellow-600 mb-1"><GraduationCap size={20} /></div>
                       <div className="text-2xl font-bold text-gray-900">{viewSubject.credits || 0}</div>
                       <div className="text-xs font-medium text-gray-500 uppercase">Кредитов</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                       <div className="text-green-500 mb-1"><Clock size={20} /></div>
                       <div className="text-2xl font-bold text-gray-900">{viewSubject.totalHours || 0}</div>
                       <div className="text-xs font-medium text-gray-500 uppercase">Всего часов</div>
                    </div>
                     {/* Specialties */}
                    <div className="col-span-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="text-gray-500 mb-2 font-medium text-sm uppercase">Специальности</div>
                        <div className="flex flex-wrap gap-2">
                           {viewSubject.selectedSpecialties?.map(sId => {
                              const spec = SPECIALTIES.find(s => s.id === sId);
                              return spec ? (
                                <span key={sId} className="px-2 py-1 bg-white border border-gray-200 rounded text-sm font-medium text-gray-700 shadow-sm">
                                  {spec.label}
                                </span>
                              ) : null;
                           })}
                        </div>
                    </div>
                 </div>
                 
                 {/* Detailed Hours */}
                 <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">Структура часов</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-8 text-sm">
                       <div>
                          <span className="text-gray-500 block">Теоретических</span>
                          <span className="font-semibold text-gray-900">{viewSubject.theoretical || '-'}</span>
                       </div>
                       <div>
                          <span className="text-gray-500 block">Лаб/Практ</span>
                          <span className="font-semibold text-gray-900">{viewSubject.labPractice || '-'}</span>
                       </div>
                       <div>
                          <span className="text-gray-500 block">СРС</span>
                          <span className="font-semibold text-gray-900">{viewSubject.srs || '-'}</span>
                       </div>
                       <div>
                          <span className="text-gray-500 block">СРСП</span>
                          <span className="font-semibold text-gray-900">{viewSubject.srsp || '-'}</span>
                       </div>
                       <div>
                          <span className="text-gray-500 block">Практика (ПО/АС)</span>
                          <span className="font-semibold text-gray-900">{viewSubject.practice || '-'}</span>
                       </div>
                        <div>
                          <span className="text-gray-500 block">Индивидуальные</span>
                          <span className="font-semibold text-gray-900">{viewSubject.individualMain || '-'}</span>
                       </div>
                    </div>
                 </div>

                 {/* Semesters Table */}
                 {viewSubject.semesters && viewSubject.semesters.length > 0 && (
                   <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">Семестровый план</h4>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                         <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                               <tr>
                                  <th className="px-4 py-3">Год / Семестр</th>
                                  <th className="px-4 py-3 text-center">Групп</th>
                                  <th className="px-4 py-3 text-center">СРС</th>
                                  <th className="px-4 py-3 text-center">СРСП</th>
                                  {/* Conditional Individual Hours Column */}
                                  {viewSubject.semesters.some(s => s.individualHours && s.individualHours !== '0') && (
                                    <th className="px-4 py-3 text-center">Индив.</th>
                                  )}
                                  <th className="px-4 py-3 text-center">Контроль</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                               {viewSubject.semesters.map((sem, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                     <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{sem.year}</div>
                                        <div className="text-xs text-gray-500">{sem.semester}</div>
                                     </td>
                                     <td className="px-4 py-3 text-center font-medium">{sem.groupHours || '-'}</td>
                                     <td className="px-4 py-3 text-center text-gray-600">{sem.srsHours || '-'}</td>
                                     <td className="px-4 py-3 text-center text-gray-600">{sem.srspHours || '-'}</td>
                                     
                                     {/* Conditional Individual Hours Cell */}
                                     {viewSubject.semesters?.some(s => s.individualHours && s.individualHours !== '0') && (
                                       <td className="px-4 py-3 text-center text-gray-600">{sem.individualHours || '-'}</td>
                                     )}

                                     <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${sem.control === 'Экзамен' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                                           {sem.control}
                                        </span>
                                     </td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </div>
                 )}
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                 <button 
                   onClick={() => setIsDetailsModalOpen(false)}
                   className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-white transition-colors"
                 >
                   Закрыть
                 </button>
                 <button 
                   onClick={() => {
                      setIsDetailsModalOpen(false);
                      handleEdit(viewSubject);
                   }}
                   className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-yellow-500 text-white font-medium hover:bg-yellow-600 transition-colors shadow-sm"
                 >
                   <Pencil size={18} />
                   Редактировать
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Selection Modal - Existing ... */}
      {isSelectionModalOpen && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
          onClick={() => setIsSelectionModalOpen(false)}
        >
          {/* ... */}
           <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              <h3 className="text-center text-lg font-bold text-gray-900 mb-6">Выбрать</h3>
              <div className="space-y-4">
                <button 
                  onClick={() => handleOpenForm('9')}
                  className="w-full py-3.5 px-4 bg-gray-500 hover:bg-red-500 text-white font-semibold rounded-xl transition-colors shadow-sm active:scale-[0.98]"
                >
                  На базе 9 класса
                </button>
                <button 
                  onClick={() => handleOpenForm('11')}
                  className="w-full py-3.5 px-4 bg-gray-500 hover:bg-red-500 text-white font-semibold rounded-xl transition-colors shadow-sm active:scale-[0.98]"
                >
                  На базе 11 класса
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal (Centered Overlay) */}
      {isFormModalOpen && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
          onClick={handleCloseRequest}
        >
          {/* ... existing form modal content ... */}
          <div 
             className="bg-white rounded-2xl w-full max-w-6xl h-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 relative"
             onClick={(e) => e.stopPropagation()}
          >
            {/* Confirmation Overlay */}
            {isCloseConfirmOpen && (
              <div className="absolute inset-0 z-[80] bg-white/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200 rounded-2xl">
                 <div className="bg-white border border-gray-200 shadow-2xl rounded-2xl p-8 max-w-md w-full text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Закрыть форму?</h3>
                    <p className="text-sm text-gray-500 mb-6">
                      Все несохраненные данные будут потеряны. Вы действительно хотите закрыть окно?
                    </p>
                    <div className="flex gap-3 justify-center">
                       <button 
                         onClick={() => setIsCloseConfirmOpen(false)}
                         className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                       >
                         Продолжить редактирование
                       </button>
                       <button 
                         onClick={handleCloseForm}
                         className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
                       >
                         Закрыть
                       </button>
                    </div>
                 </div>
              </div>
            )}

            {/* Validation Error Overlay */}
            {validationError && (
              <div className="absolute inset-0 z-[80] bg-white/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200 rounded-2xl">
                 <div className="bg-white border border-gray-200 shadow-2xl rounded-2xl p-8 max-w-md w-full text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mb-4">
                      <AlertCircle className="h-6 w-6 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Ошибка валидации</h3>
                    <p className="text-sm text-gray-500 mb-6">
                      {validationError}
                    </p>
                    <div className="flex justify-center">
                       <button 
                         onClick={() => setValidationError(null)}
                         className="px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
                       >
                         Понятно
                       </button>
                    </div>
                 </div>
              </div>
            )}

            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 z-10 px-6 py-4 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-3">
                  <button 
                    onClick={handleCloseRequest}
                    className="px-6 py-2 rounded-lg border border-red-500 text-red-500 font-medium hover:bg-red-50 transition-colors"
                  >
                    Отменить
                  </button>
                  <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                     {formBase === '9' ? 'База 9 классов' : 'База 11 классов'}
                  </span>
               </div>
              
              <button 
                onClick={handleCloseRequest}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-red-50 text-red-500 font-medium hover:bg-red-100 transition-colors"
              >
                <Trash2 size={18} />
                Удалить
              </button>
              
              <button 
                onClick={handleSave}
                className="px-6 py-2 rounded-lg border border-green-500 text-green-500 font-medium hover:bg-green-50 transition-colors"
              >
                Сохранить
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="max-w-5xl mx-auto space-y-4 pb-10">

                {/* Combined Top Controls */}
                <div className="transition-all duration-300">
                    
                    <div className={`flex items-center justify-between ${formBase === '11' ? 'px-1 py-0' : 'pt-0'}`}>
                       {/* Left Side: Connect Toggle */}
                       {formBase === '11' ? (
                           <label className="flex items-center gap-2 cursor-pointer select-none">
                              <div className="relative flex items-center">
                                <input 
                                  type="checkbox" 
                                  checked={isConnectChecked}
                                  onChange={(e) => setIsConnectChecked(e.target.checked)}
                                  className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 shadow-sm checked:bg-yellow-500 checked:border-yellow-500 transition-all"
                                />
                                <Check size={14} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={3} />
                              </div>
                              <div className="flex items-center gap-2 text-gray-700 font-medium">
                                 <LinkIcon size={18} className={isConnectChecked ? 'text-yellow-600' : 'text-gray-400'} />
                                 <span>Связать с базой 9 класса</span>
                              </div>
                           </label>
                       ) : (
                          <div></div> 
                       )}

                       {/* Right Side: Free Filter */}
                       <label className="flex items-center gap-2 cursor-pointer group relative select-none">
                          <div className="relative flex items-center">
                            <input 
                              type="checkbox" 
                              checked={isFreeFilterChecked}
                              onChange={(e) => setIsFreeFilterChecked(e.target.checked)}
                              className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 shadow-sm checked:bg-green-500 checked:border-green-500 transition-all"
                            />
                            <Check size={14} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={3} />
                          </div>
                          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Установить свободный фильтр</span>
                          <div className="p-1 text-gray-400 group-hover:text-gray-500">
                             <HelpCircle size={16} />
                          </div>
                          {/* Tooltip */}
                          <div className="absolute top-full right-0 mt-2 w-80 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-50 pointer-events-none">
                             Установив свободный фильтр, вы позволите свободно выбирать обучающихся данного плана с другими курсами при планировании учебного процесса внутри выбранных специальностей
                             <div className="absolute top-0 right-8 -mt-1.5 w-3 h-3 bg-gray-800 transform rotate-45"></div>
                          </div>
                       </label>
                    </div>

                    {/* Expanded Content for Connect - Now containing the Border/Background */}
                    {formBase === '11' && (
                        <div className={`grid transition-all duration-300 ease-in-out ${isConnectChecked ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 overflow-hidden'}`}>
                          <div className="overflow-hidden">
                              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm text-gray-500 font-medium">Год поступления (база 9 кл)</label>
                                        <div className="relative">
                                        <select 
                                            value={connectYear}
                                            onChange={(e) => setConnectYear(e.target.value)}
                                            className="w-full bg-white border border-gray-300 rounded-lg py-2.5 px-4 text-gray-900 font-medium appearance-none focus:ring-2 focus:ring-yellow-100 focus:border-yellow-400 outline-none transition-all"
                                        >
                                            <option value="">Выберите год</option>
                                            {availableConnectYears.map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm text-gray-500 font-medium">Предмет</label>
                                        <div className="relative">
                                        <select 
                                            value={connectSubjectId}
                                            onChange={(e) => handleConnect(e.target.value)}
                                            disabled={!connectYear}
                                            className="w-full bg-white border border-gray-300 rounded-lg py-2.5 px-4 text-gray-900 font-medium appearance-none focus:ring-2 focus:ring-yellow-100 focus:border-yellow-400 outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400"
                                        >
                                            <option value="">Выберите предмет</option>
                                            {availableConnectSubjects.map(sub => (
                                                <option key={sub.id} value={sub.id}>{sub.title} ({sub.code})</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 mt-3">
                                    Выберите предмет из сохраненной базы 9 класса, чтобы автоматически заполнить все поля и связи.
                                </p>
                              </div>
                          </div>
                        </div>
                    )}
                </div>
                
                {/* Specialties Select */}
                <div className="space-y-2 relative" ref={specialtiesDropdownRef}>
                  <label className="text-sm font-medium text-gray-700">Специальности</label>
                  <div 
                    className="w-full bg-gray-100 rounded-lg p-3 cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => setIsSpecialtiesDropdownOpen(!isSpecialtiesDropdownOpen)}
                  >
                     <div className="flex flex-wrap gap-2 mb-2">
                        {formSelectedSpecialties.map(id => {
                          const specialty = SPECIALTIES.find(s => s.id === id);
                          if (!specialty) return null;
                          return (
                            <span key={id} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-300 rounded-md text-sm text-gray-800 font-medium">
                              {specialty.label}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSpecialty(id);
                                }}
                                className="bg-gray-400 rounded-full p-0.5 hover:bg-gray-500 text-white transition-colors"
                              >
                                <X size={10} />
                              </button>
                            </span>
                          );
                        })}
                     </div>
                     <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{formSelectedSpecialties.length} элементов выбрано</span>
                        <ChevronDown size={16} className={`transition-transform ${isSpecialtiesDropdownOpen ? 'rotate-180' : ''}`} />
                     </div>
                  </div>
                  
                  {/* Dropdown Menu */}
                  {isSpecialtiesDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                      {SPECIALTIES.map(specialty => {
                        const isSelected = formSelectedSpecialties.includes(specialty.id);
                        return (
                          <div 
                            key={specialty.id}
                            onClick={() => toggleSpecialty(specialty.id)}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 cursor-pointer transition-colors"
                          >
                            <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${isSelected ? 'bg-red-500 border-red-500' : 'border-gray-300 bg-white'}`}>
                              {isSelected && <Check size={12} className="text-white" />}
                            </div>
                            <span className="text-sm font-medium text-gray-700">{specialty.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <p className="text-xs text-gray-400">Выберите одну или несколько специальностей для данного модуля</p>
                </div>

                {/* Language Selection */}
                <div className="space-y-2">
                   <div className="flex items-center gap-2 mb-2">
                      <Languages size={18} className="text-gray-400"/>
                      <label className="text-sm font-medium text-gray-700">Языки обучения</label>
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {(['kz', 'ru', 'en'] as const).map(lang => (
                         <button
                           key={lang}
                           onClick={() => toggleLanguage(lang)}
                           className={`
                             px-4 py-2 rounded-lg font-medium text-sm transition-all
                             ${formLanguages.includes(lang) 
                               ? (lang === 'kz' ? 'bg-teal-500 text-white' : lang === 'ru' ? 'bg-indigo-500 text-white' : 'bg-purple-500 text-white')
                               : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                             }
                           `}
                         >
                           {lang === 'kz' ? 'Қазақша' : lang === 'ru' ? 'Русский' : 'English'}
                         </button>
                      ))}
                   </div>
                </div>

                {/* Localized Fields */}
                <div className="space-y-6">
                  {formLanguages.map(lang => (
                    <div key={lang} className="p-4 bg-gray-50 rounded-xl border border-gray-100 animate-in fade-in duration-300">
                       <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${lang === 'kz' ? 'bg-teal-500' : lang === 'ru' ? 'bg-indigo-500' : 'bg-purple-500'}`}></span>
                          {getLanguageLabel(lang)}
                       </h4>
                       <div className="space-y-4">
                          <FormInput 
                            label="Индекс модуля/дисциплины" 
                            value={localizedFormData[lang].index} 
                            onChange={(v) => handleLocalizedInputChange(lang, 'index', v)} 
                            onClear={() => handleLocalizedInputChange(lang, 'index', '')}
                            className="bg-white"
                          />
                          <FormInput 
                            label="Наименование модуля" 
                            value={localizedFormData[lang].moduleName} 
                            onChange={(v) => handleLocalizedInputChange(lang, 'moduleName', v)} 
                            onClear={() => handleLocalizedInputChange(lang, 'moduleName', '')}
                            className="bg-white"
                          />
                          <FormInput 
                            label="Наименование результата обучения/дисциплина" 
                            value={localizedFormData[lang].disciplineName} 
                            onChange={(v) => handleLocalizedInputChange(lang, 'disciplineName', v)} 
                            onClear={() => handleLocalizedInputChange(lang, 'disciplineName', '')}
                            className="bg-white"
                          />
                       </div>
                    </div>
                  ))}
                </div>

                {/* Numeric Grid */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t border-gray-100">
                  <FormInput label="Всего кредитов" value={commonFormData.credits} onChange={(v) => handleCommonInputChange('credits', v)} isNumber />
                  <FormInput label="Всего часов" value={commonFormData.totalHours} onChange={(v) => handleCommonInputChange('totalHours', v)} isNumber />
                  
                  <FormInput label="Теоретических" value={commonFormData.theoretical} onChange={(v) => handleCommonInputChange('theoretical', v)} isNumber />
                  <FormInput label="Лабараторно-практических" value={commonFormData.labPractice} onChange={(v) => handleCommonInputChange('labPractice', v)} isNumber />
                  
                  <FormInput label="3" value={commonFormData.three} onChange={(v) => handleCommonInputChange('three', v)} isNumber />
                  <FormInput 
                    label="Самостоятельная работа студента с педагогом" 
                    value={commonFormData.srsp} 
                    onChange={(v) => handleCommonInputChange('srsp', v)} 
                    isNumber 
                    hasDistribute 
                    onDistribute={() => handleDistribute('srsp')} 
                  />
                  
                  <FormInput 
                    label="Самостоятельная работа студента" 
                    value={commonFormData.srs} 
                    onChange={(v) => handleCommonInputChange('srs', v)} 
                    isNumber 
                    hasDistribute 
                    onDistribute={() => handleDistribute('srs')} 
                  />
                  <FormInput 
                    label="Производственное обучение / профессиональная практика" 
                    value={commonFormData.practice} 
                    onChange={(v) => handleCommonInputChange('practice', v)} 
                    isNumber 
                  />
                  
                  <FormInput 
                    label="Индивидуальные" 
                    value={commonFormData.individualMain} 
                    onChange={(v) => handleCommonInputChange('individualMain', v)} 
                    isNumber 
                  />

                  <FormInput 
                    label="Индивидуальные (дополнительно)" 
                    value={commonFormData.individual} 
                    onChange={(v) => handleCommonInputChange('individual', v)} 
                    isNumber 
                    hasDistribute 
                    onDistribute={() => handleDistribute('individual')} 
                  />
                </div>

                {/* Semester Distribution - COMPACT VERSION */}
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Распределение по курсам и семестрам</h3>
                    <button 
                      onClick={handleAddSemester}
                      className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Plus size={16} />
                      Добавить
                    </button>
                  </div>

                  {/* Table Container - Removed overflow-y to show full content immediately */}
                  <div className="border border-gray-200 rounded-lg flex flex-col mt-1">
                       <div className="overflow-x-auto pb-1">
                          
                          {/* Header */}
                          <div className="grid gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 items-center" style={gridStyle}>
                              <div>Учебный год</div>
                              <div>Семестр</div>
                              {/* Removed Total Column */}
                              <div className="text-center">Групп</div>
                              {visibleColumns.srs && <div className="text-center">СРС</div>}
                              {visibleColumns.srsp && <div className="text-center">СРСП</div>}
                              {visibleColumns.practice && <div className="text-center">ПО/АС</div>}
                              {visibleColumns.individual && <div className="text-center">Индив</div>}
                              <div>Форма контроля</div>
                              <div></div>
                          </div>

                          {/* Rows */}
                          <div className="divide-y divide-gray-100 bg-white">
                              {semesters.map((sem) => (
                                <div key={sem.id} className="grid gap-2 px-3 py-1.5 items-center group" style={gridStyle}>
                                  {/* Year */}
                                  <div className="relative">
                                    <div 
                                      className="row-dropdown-trigger flex items-center justify-between bg-white px-3 py-1.5 text-sm text-gray-900 cursor-pointer border border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
                                      onClick={() => toggleRowDropdown(sem.id, 'year')}
                                    >
                                      {sem.year}
                                      <ChevronDown size={14} className="text-gray-400" />
                                    </div>
                                    {activeDropdown?.id === sem.id && activeDropdown.field === 'year' && (
                                      <div className="row-dropdown-menu absolute top-full left-0 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl z-20 py-1">
                                        {['2024-2025', '2025-2026', '2026-2027', '2027-2028'].map(y => (
                                          <div 
                                            key={y} 
                                            className="px-3 py-2 text-sm hover:bg-red-50 hover:text-red-500 cursor-pointer"
                                            onClick={() => {
                                              handleSemesterChange(sem.id, 'year', y);
                                              setActiveDropdown(null);
                                            }}
                                          >
                                            {y}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Semester */}
                                  <div className="relative">
                                     <div 
                                      className="row-dropdown-trigger flex items-center justify-between bg-white px-3 py-1.5 text-sm text-gray-900 cursor-pointer border border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
                                      onClick={() => toggleRowDropdown(sem.id, 'semester')}
                                     >
                                      {sem.semester}
                                      <ChevronDown size={14} className="text-gray-400" />
                                    </div>
                                    {activeDropdown?.id === sem.id && activeDropdown.field === 'semester' && (
                                      <div className="row-dropdown-menu absolute top-full left-0 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl z-20 py-1">
                                        {['1 семестр', '2 семестр'].map(s => (
                                          <div 
                                            key={s} 
                                            className="px-3 py-2 text-sm hover:bg-red-50 hover:text-red-500 cursor-pointer"
                                            onClick={() => {
                                              handleSemesterChange(sem.id, 'semester', s);
                                              setActiveDropdown(null);
                                            }}
                                          >
                                            {s}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Total Hours Input REMOVED */}

                                  {/* Group Hours */}
                                  <div className="relative">
                                     <input 
                                       type="text" 
                                       value={sem.groupHours}
                                       onChange={(e) => handleSemesterChange(sem.id, 'groupHours', e.target.value)}
                                       className="w-full bg-gray-50 hover:bg-gray-100 focus:bg-white rounded-lg px-2 py-1.5 text-sm text-gray-900 text-center focus:ring-2 focus:ring-red-100 outline-none transition-all"
                                     />
                                  </div>

                                  {/* Optional: SRS */}
                                  {visibleColumns.srs && (
                                    <div className="relative animate-in fade-in slide-in-from-left-2 duration-300">
                                       <input 
                                         type="text" 
                                         value={sem.srsHours}
                                         onChange={(e) => handleSemesterChange(sem.id, 'srsHours', e.target.value)}
                                         className="w-full bg-gray-50 hover:bg-gray-100 focus:bg-white rounded-lg px-2 py-1.5 text-sm text-gray-900 text-center focus:ring-2 focus:ring-red-100 outline-none transition-all"
                                       />
                                    </div>
                                  )}

                                  {/* Optional: SRSP */}
                                  {visibleColumns.srsp && (
                                    <div className="relative animate-in fade-in slide-in-from-left-2 duration-300">
                                       <input 
                                         type="text" 
                                         value={sem.srspHours}
                                         onChange={(e) => handleSemesterChange(sem.id, 'srspHours', e.target.value)}
                                         className="w-full bg-gray-50 hover:bg-gray-100 focus:bg-white rounded-lg px-2 py-1.5 text-sm text-gray-900 text-center focus:ring-2 focus:ring-red-100 outline-none transition-all"
                                       />
                                    </div>
                                  )}

                                  {/* Optional: Practice */}
                                  {visibleColumns.practice && (
                                    <div className="relative animate-in fade-in slide-in-from-left-2 duration-300">
                                       <input 
                                         type="text" 
                                         value={sem.practiceHours}
                                         onChange={(e) => handleSemesterChange(sem.id, 'practiceHours', e.target.value)}
                                         className="w-full bg-gray-50 hover:bg-gray-100 focus:bg-white rounded-lg px-2 py-1.5 text-sm text-gray-900 text-center focus:ring-2 focus:ring-red-100 outline-none transition-all"
                                       />
                                    </div>
                                  )}

                                   {/* Optional: Individual */}
                                   {visibleColumns.individual && (
                                    <div className="relative animate-in fade-in slide-in-from-left-2 duration-300">
                                       <input 
                                         type="text" 
                                         value={sem.individualHours}
                                         onChange={(e) => handleSemesterChange(sem.id, 'individualHours', e.target.value)}
                                         className="w-full bg-gray-50 hover:bg-gray-100 focus:bg-white rounded-lg px-2 py-1.5 text-sm text-gray-900 text-center focus:ring-2 focus:ring-red-100 outline-none transition-all"
                                       />
                                    </div>
                                  )}

                                  {/* Control */}
                                   <div className="relative">
                                     <div 
                                      className="row-dropdown-trigger flex items-center justify-between bg-white px-3 py-1.5 text-sm text-gray-700 cursor-pointer border border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
                                      onClick={() => toggleRowDropdown(sem.id, 'control')}
                                     >
                                      {sem.control}
                                      <ChevronDown size={14} className="text-gray-400" />
                                    </div>
                                    {activeDropdown?.id === sem.id && activeDropdown.field === 'control' && (
                                      <div className="row-dropdown-menu absolute top-full right-0 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl z-20 py-1">
                                        {['Нет', 'Экзамен', 'Зачет', 'Контрольный урок'].map(c => (
                                          <div 
                                            key={c} 
                                            className="px-3 py-2 text-sm hover:bg-red-50 hover:text-red-500 cursor-pointer"
                                            onClick={() => {
                                              handleSemesterChange(sem.id, 'control', c);
                                              setActiveDropdown(null);
                                            }}
                                          >
                                            {c}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Delete */}
                                  <div className="flex justify-end">
                                     <button 
                                       onClick={() => handleDeleteSemester(sem.id)}
                                       className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                      >
                                       <Trash2 size={16} />
                                     </button>
                                  </div>
                                </div>
                              ))}
                              <div ref={semesterEndRef} />
                          </div>
                       </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PlanList;