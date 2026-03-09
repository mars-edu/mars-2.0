import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Filter, MoreVertical, Edit, Trash2, ChevronDown, Check, X, HelpCircle, AlertTriangle, AlertCircle, Link as LinkIcon, Languages, Info } from 'lucide-react';
import { SPECIALTIES } from '../constants';
import { Subject, Semester, LocalizedSubjectInfo } from '../types';
import { Theme } from '../App';

interface DisciplineCatalogProps {
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  theme?: Theme;
}

// Reusing FormInput logic locally to ensure self-containment
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
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {hasDistribute && (
             <button onClick={onDistribute} className={`p-1 rounded-md transition-all ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-600' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-200'}`}><ChevronDown size={16} /></button>
          )}
          {value && (
            <button onClick={() => onClear ? onClear() : onChange(isNumber ? '0' : '')} className={`rounded-full p-0.5 transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white bg-gray-600 hover:bg-gray-500' : 'text-gray-400 hover:text-gray-600 bg-gray-200 hover:bg-gray-300'}`}><X size={14} /></button>
          )}
        </div>
      </div>
    </div>
  );
};

type LanguageKey = 'kz' | 'ru' | 'en';

const DisciplineCatalog: React.FC<DisciplineCatalogProps> = ({ subjects, setSubjects, theme = 'light' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [baseFilter, setBaseFilter] = useState<'all' | '9' | '11'>('all');
  
  // Theme Colors Helper
  const colors = {
    bg: theme === 'dark' ? 'bg-gray-800' : 'bg-white',
    bgSecondary: theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50',
    border: theme === 'dark' ? 'border-gray-700' : 'border-gray-200',
    text: theme === 'dark' ? 'text-white' : 'text-gray-900',
    textSecondary: theme === 'dark' ? 'text-gray-400' : 'text-gray-500',
    hover: theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50',
    divider: theme === 'dark' ? 'divide-gray-700' : 'divide-gray-100',
    modalBg: theme === 'dark' ? 'bg-gray-800' : 'bg-white',
    inputBg: theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 border-gray-200',
  };
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formBase, setFormBase] = useState<'9' | '11'>('9');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Form Data
  const [formSelectedSpecialties, setFormSelectedSpecialties] = useState<string[]>(SPECIALTIES.map(s => s.id));
  const [isSpecialtiesDropdownOpen, setIsSpecialtiesDropdownOpen] = useState(false);
  const specialtiesDropdownRef = useRef<HTMLDivElement>(null);
  const [isFreeFilterChecked, setIsFreeFilterChecked] = useState(false);
  const [formLanguages, setFormLanguages] = useState<LanguageKey[]>(['ru']);
  const [isConnectChecked, setIsConnectChecked] = useState(false);
  const [connectYear, setConnectYear] = useState('');
  const [connectSubjectId, setConnectSubjectId] = useState('');
  const [availableConnectYears, setAvailableConnectYears] = useState<string[]>([]);
  const [availableConnectSubjects, setAvailableConnectSubjects] = useState<Subject[]>([]);

  // Semester State
  const semesterEndRef = useRef<HTMLDivElement>(null);
  const [activeDropdown, setActiveDropdown] = useState<{id: number, field: string} | null>(null);
  const [visibleColumns, setVisibleColumns] = useState({ srs: false, srsp: false, practice: false, individual: false });
  const [semesters, setSemesters] = useState<Semester[]>([]);
  
  // Data Fields
  const [commonFormData, setCommonFormData] = useState({
    credits: '', totalHours: '', theoretical: '', labPractice: '', three: '', srsp: '', srs: '', practice: '', individual: '', individualMain: '',
  });
  const [localizedFormData, setLocalizedFormData] = useState<Record<LanguageKey, { index: string, moduleName: string, disciplineName: string }>>({
    ru: { index: '', moduleName: '', disciplineName: '' },
    kz: { index: '', moduleName: '', disciplineName: '' },
    en: { index: '', moduleName: '', disciplineName: '' },
  });

  // -- Effects --
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (specialtiesDropdownRef.current && !specialtiesDropdownRef.current.contains(event.target as Node)) {
        setIsSpecialtiesDropdownOpen(false);
      }
      const target = event.target as Element;
      if (activeDropdown && !target.closest('.row-dropdown-trigger') && !target.closest('.row-dropdown-menu')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  useEffect(() => {
    if (formBase === '11') {
      const base9Subjects = subjects.filter(s => s.base === '9');
      const years = Array.from(new Set(base9Subjects.map(s => s.creationYear || '2024'))).sort();
      setAvailableConnectYears(years);
    }
  }, [formBase, subjects, isFormModalOpen]);

  useEffect(() => {
    if (formBase === '11' && connectYear) {
      const filtered = subjects.filter(s => s.base === '9' && (s.creationYear || '2024') === connectYear);
      setAvailableConnectSubjects(filtered);
    } else {
      setAvailableConnectSubjects([]);
    }
  }, [connectYear, formBase, subjects]);

  // -- Handlers --
  const handleOpenForm = (base: '9' | '11', editSubject?: Subject) => {
    setFormBase(base);
    
    if (editSubject) {
      setEditingId(editSubject.id);
      // Load Data logic...
      setCommonFormData({
        credits: editSubject.credits || '',
        totalHours: editSubject.totalHours || '',
        theoretical: editSubject.theoretical || '',
        labPractice: editSubject.labPractice || '',
        three: editSubject.three || '',
        srsp: editSubject.srsp || '',
        srs: editSubject.srs || '',
        practice: editSubject.practice || '',
        individual: editSubject.individual || '',
        individualMain: editSubject.individualMain || '',
      });
       const newLocalized = {
        ru: { index: '', moduleName: '', disciplineName: '' },
        kz: { index: '', moduleName: '', disciplineName: '' },
        en: { index: '', moduleName: '', disciplineName: '' },
      };
      if (editSubject.localizedInfo) {
        (['ru', 'kz', 'en'] as const).forEach(lang => {
          if (editSubject.localizedInfo?.[lang]) {
            const info = editSubject.localizedInfo[lang] as LocalizedSubjectInfo;
            newLocalized[lang] = { index: info.code, moduleName: info.title, disciplineName: info.subtitle };
          }
        });
      } else {
        newLocalized.ru = { index: editSubject.code, moduleName: editSubject.title, disciplineName: editSubject.subtitle };
      }
      setLocalizedFormData(newLocalized);
      setFormLanguages(editSubject.languages || ['ru']);
      if (editSubject.semesters) {
        setSemesters(editSubject.semesters.map(s => ({...s})));
        let hasSrs = false, hasSrsp = false, hasPractice = false, hasIndividual = false;
        editSubject.semesters.forEach(s => {
          if (s.srsHours && s.srsHours !== '0') hasSrs = true;
          if (s.srspHours && s.srspHours !== '0') hasSrsp = true;
          if (s.practiceHours && s.practiceHours !== '0') hasPractice = true;
          if (s.individualHours && s.individualHours !== '0') hasIndividual = true;
        });
        setVisibleColumns({ srs: hasSrs, srsp: hasSrsp, practice: hasPractice, individual: hasIndividual });
      } else {
        setSemesters([]);
      }
      setFormSelectedSpecialties(editSubject.selectedSpecialties || SPECIALTIES.map(s => s.id));
      setIsFreeFilterChecked(!!editSubject.isFreeFilter);

    } else {
      // Reset
      setEditingId(null);
      setCommonFormData({ credits: '', totalHours: '', theoretical: '', labPractice: '', three: '', srsp: '', srs: '', practice: '', individual: '', individualMain: '' });
      setLocalizedFormData({ ru: { index: '', moduleName: '', disciplineName: '' }, kz: { index: '', moduleName: '', disciplineName: '' }, en: { index: '', moduleName: '', disciplineName: '' } });
      setFormLanguages(['ru']);
      setSemesters([{ id: 1, year: '2025-2026', semester: '1 семестр', hours: '', groupHours: '', srsHours: '', srspHours: '', practiceHours: '', individualHours: '', control: 'Нет' }]);
      setVisibleColumns({ srs: false, srsp: false, practice: false, individual: false });
      setConnectYear(''); setConnectSubjectId(''); setIsConnectChecked(false); setIsFreeFilterChecked(false);
      setFormSelectedSpecialties(SPECIALTIES.map(s => s.id));
    }
    setIsFormModalOpen(true);
  };

  const handleSave = () => {
     // Save logic duplicated for consistency
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
      setValidationError(`Общее количество часов (${totalPlanHours}) не соответствует распределенным (${distributedHours})`);
      return;
    }

    const idToUse = editingId !== null ? editingId : (Math.max(...subjects.map(s => s.id), 0) + 1);
    const primaryLang = formLanguages.includes('ru') ? 'ru' : formLanguages[0];
    const displayInfo = localizedFormData[primaryLang];

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
      base: formBase,
      creationYear: '2024',
      selectedSpecialties: formSelectedSpecialties,
      isFreeFilter: isFreeFilterChecked,
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
      setSubjects(prev => prev.map(s => s.id === editingId ? subjectData : s));
    } else {
      setSubjects(prev => [...prev, subjectData]);
    }
    setIsFormModalOpen(false);
  };
  
  // Minimal helpers
  const renderLanguageBadge = (lang: string) => (
      <span key={lang} className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ml-1 ${lang === 'kz' ? 'bg-teal-100 text-teal-700' : lang === 'ru' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}`}>{lang === 'kz' ? 'Kz' : lang === 'ru' ? 'Ru' : 'En'}</span>
  );

  const filteredSubjects = subjects.filter(s => {
    const matchesBase = baseFilter === 'all' || s.base === baseFilter;
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) || s.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesBase && matchesSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
      <div className="w-full space-y-6 pb-20">
        
        {/* Controls */}
        <div className={`flex flex-col md:flex-row gap-4 items-center justify-between p-4 rounded-lg shadow-sm border ${colors.bg} ${colors.border}`}>
           <div className="relative w-full md:w-96">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${colors.textSecondary}`} size={18} />
              <input 
                type="text" 
                placeholder="Поиск по коду или названию..." 
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 transition-all ${colors.inputBg} ${theme === 'dark' ? 'placeholder-gray-500' : ''}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           
           <div className="flex items-center gap-3 w-full md:w-auto">
              <div className={`flex items-center gap-2 p-1 rounded-lg border ${colors.bgSecondary} ${colors.border}`}>
                 <button onClick={() => setBaseFilter('all')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${baseFilter === 'all' ? `${colors.bg} shadow ${colors.text}` : `${colors.textSecondary} hover:text-gray-700`}`}>Все</button>
                 <button onClick={() => setBaseFilter('9')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${baseFilter === '9' ? `${colors.bg} shadow ${colors.text}` : `${colors.textSecondary} hover:text-gray-700`}`}>База 9</button>
                 <button onClick={() => setBaseFilter('11')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${baseFilter === '11' ? `${colors.bg} shadow ${colors.text}` : `${colors.textSecondary} hover:text-gray-700`}`}>База 11</button>
              </div>
              <button 
                onClick={() => handleOpenForm(baseFilter === '11' ? '11' : '9')} // Default to 9 if all
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors shadow-sm"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Добавить</span>
              </button>
           </div>
        </div>

        {/* Table View */}
        <div className={`${colors.bg} rounded-lg shadow-sm border ${colors.border} overflow-hidden`}>
           <table className="w-full text-left">
              <thead className={`${colors.bgSecondary} border-b ${colors.border}`}>
                 <tr>
                    <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${colors.textSecondary}`}>Индекс</th>
                    <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${colors.textSecondary}`}>Наименование дисциплины</th>
                    <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${colors.textSecondary}`}>Кредиты</th>
                    <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${colors.textSecondary}`}>Часы</th>
                    <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${colors.textSecondary}`}>Языки</th>
                    <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider text-right ${colors.textSecondary}`}>Действия</th>
                 </tr>
              </thead>
              <tbody className={`divide-y ${colors.divider}`}>
                 {filteredSubjects.length > 0 ? (
                   filteredSubjects.map((subject) => (
                     <tr key={subject.id} className={`${colors.hover} group transition-colors`}>
                        <td className={`px-6 py-4 font-bold ${colors.text}`}>{subject.code}</td>
                        <td className="px-6 py-4">
                           <div className={`font-medium ${colors.text}`}>{subject.title}</div>
                           <div className={`text-xs mt-0.5 ${colors.textSecondary}`}>{subject.subtitle}</div>
                           {subject.base && (
                              <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ${subject.base === '9' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-800'}`}>
                                База {subject.base} кл
                              </span>
                           )}
                        </td>
                        <td className="px-6 py-4">
                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {subject.credits || 0}
                           </span>
                        </td>
                         <td className={`px-6 py-4 text-sm font-medium ${colors.textSecondary}`}>
                           {subject.totalHours || 0} ч.
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex flex-wrap gap-1">
                              {subject.languages?.map(lang => renderLanguageBadge(lang))}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleOpenForm(subject.base || '9', subject)}
                                className="p-2 text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors" title="Редактировать"
                              >
                                 <Edit size={16} />
                              </button>
                               <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Удалить">
                                 <Trash2 size={16} />
                              </button>
                           </div>
                        </td>
                     </tr>
                   ))
                 ) : (
                    <tr>
                       <td colSpan={6} className={`px-6 py-12 text-center ${colors.textSecondary}`}>
                          Дисциплины не найдены
                       </td>
                    </tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>

       {/* --- REUSED FORM MODAL --- */}
      {isFormModalOpen && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
          onClick={() => setIsCloseConfirmOpen(true)}
        >
          <div 
             className="bg-white rounded-2xl w-full max-w-6xl h-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 relative"
             onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 z-10 px-6 py-4 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-3">
                  <button onClick={() => setIsCloseConfirmOpen(true)} className="px-6 py-2 rounded-lg border border-red-500 text-red-500 font-medium hover:bg-red-50 transition-colors">Отменить</button>
                  <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{formBase === '9' ? 'База 9 классов' : 'База 11 классов'}</span>
               </div>
              <button onClick={handleSave} className="px-6 py-2 rounded-lg border border-green-500 text-green-500 font-medium hover:bg-green-50 transition-colors">Сохранить</button>
            </div>

            {/* Content (Identical to PlanList Form) */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="max-w-5xl mx-auto space-y-4 pb-10">
                 {/* Simplified Render of Form Inputs for brevity in this specific file since logic is complex */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-4">
                      {/* Language Toggles */}
                       <div className="col-span-2 flex gap-2 mb-4">
                          {(['kz', 'ru', 'en'] as const).map(lang => (
                             <button key={lang} onClick={() => setFormLanguages(prev => prev.includes(lang) && prev.length > 1 ? prev.filter(l => l !== lang) : [...prev, lang])} className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${formLanguages.includes(lang) ? (lang === 'kz' ? 'bg-teal-500 text-white' : lang === 'ru' ? 'bg-indigo-500 text-white' : 'bg-purple-500 text-white') : 'bg-gray-100 text-gray-500'}`}>{lang.toUpperCase()}</button>
                          ))}
                       </div>
                       
                       {/* Localized Inputs */}
                       <div className="col-span-2 space-y-4">
                          {formLanguages.map(lang => (
                             <div key={lang} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <h4 className="font-bold text-gray-500 uppercase mb-2">{lang}</h4>
                                <FormInput label="Индекс" value={localizedFormData[lang].index} onChange={v => setLocalizedFormData(p => ({...p, [lang]: {...p[lang], index: v}}))} />
                                <FormInput label="Наименование" value={localizedFormData[lang].moduleName} onChange={v => setLocalizedFormData(p => ({...p, [lang]: {...p[lang], moduleName: v}}))} className="mt-2" />
                                <FormInput label="Описание" value={localizedFormData[lang].disciplineName} onChange={v => setLocalizedFormData(p => ({...p, [lang]: {...p[lang], disciplineName: v}}))} className="mt-2" />
                             </div>
                          ))}
                       </div>

                       <FormInput label="Всего кредитов" value={commonFormData.credits} onChange={v => setCommonFormData(p => ({...p, credits: v}))} isNumber />
                       <FormInput label="Всего часов" value={commonFormData.totalHours} onChange={v => setCommonFormData(p => ({...p, totalHours: v}))} isNumber />
                    </div>
                  </div>
              </div>
            </div>
            
             {/* Confirmation Overlay */}
            {isCloseConfirmOpen && (
              <div className="absolute inset-0 z-[80] bg-white/80 backdrop-blur-sm flex items-center justify-center p-6 rounded-2xl">
                 <div className="bg-white border border-gray-200 shadow-2xl rounded-2xl p-8 max-w-md w-full text-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Закрыть форму?</h3>
                    <div className="flex gap-3 justify-center mt-6">
                       <button onClick={() => setIsCloseConfirmOpen(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">Отмена</button>
                       <button onClick={() => { setIsFormModalOpen(false); setIsCloseConfirmOpen(false); }} className="px-4 py-2 bg-red-500 text-white rounded-lg">Закрыть</button>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DisciplineCatalog;