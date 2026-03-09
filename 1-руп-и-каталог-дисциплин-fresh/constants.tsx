import React from 'react';
import { Student, ProtocolEvent, Journal, Rup, SidebarItem, Specialty, Subject } from './types';
import { Book, Users, User, ChevronRight, GraduationCap, LayoutGrid, Home, BookOpen, CalendarDays, Layout, FileText, PieChart, BarChart2, Calendar, Settings, LogOut } from 'lucide-react';

export const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'dashboard', label: 'Главная', icon: Home },
  { id: 'planning', label: 'Планирование', icon: CalendarDays },
  { id: 'journals', label: 'Журналы', icon: Book },
  { id: 'ktp', label: 'КТП', icon: LayoutGrid }, // Placeholder icon
  { id: 'reports', label: 'Отчеты', icon: FileText },
  { id: 'testing', label: 'Тестирование', icon: Layout }, // Placeholder
  { id: 'courses', label: 'Курсы', icon: GraduationCap },
  { id: 'protocol', label: 'Протокол', icon: Layout },
  { id: 'analytics', label: 'Аналитика', icon: PieChart },
  { id: 'rup', label: 'РУП', icon: FileText },
  { id: 'schedule', label: 'График', icon: Calendar },
  { id: 'specialties', label: 'Специальности', icon: BookOpen },
  { id: 'students', label: 'Обучающиеся', icon: Users },
  { id: 'disciplines', label: 'Дисциплины', icon: Book },
  { id: 'teachers', label: 'Преподаватели', icon: User },
  { id: 'settings', label: 'Настройки', icon: Settings },
];

export const BOTTOM_SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'profile', label: 'Профиль', icon: User },
  { id: 'logout', label: 'Выйти', icon: LogOut },
];

export const SPECIALTIES: Specialty[] = [
  { id: 'F', label: 'Ф', code: 'F', name: 'Фортепиано', hasInfo: true },
  { id: 'S', label: 'С', code: 'S', name: 'Струнные инструменты', hasInfo: true },
  { id: 'D', label: 'Д', code: 'D', name: 'Духовые инструменты', hasInfo: true },
  { id: 'K', label: 'К', code: 'K', name: 'Кобызовые инструменты', hasInfo: true },
  { id: 'R', label: 'Р', code: 'R', name: 'Русские народные инструменты', hasInfo: true },
  { id: 'E', label: 'Э', code: 'E', name: 'Эстрадное искусство', hasInfo: true },
  { id: 'T', label: 'Т', code: 'T', name: 'Теория музыки', hasInfo: true },
  { id: 'Vt', label: 'Вт', code: 'Vt', name: 'Вокальное искусство (академическое)', hasInfo: true },
  { id: 'Va', label: 'Ва', code: 'Va', name: 'Вокальное искусство (эстрадное)', hasInfo: true },
  { id: 'Ve', label: 'Вэ', code: 'Ve', name: 'Вокальное искусство (традиционное)', hasInfo: true },
  { id: 'X', label: 'Х', code: 'X', name: 'Хоровое дирижирование', hasInfo: true },
  { id: 'M', label: 'М', code: 'M', name: 'Музыковедение', hasInfo: true },
];

export const SUBJECTS: Subject[] = [
  { 
    id: 1, 
    code: 'ООД 06', 
    title: 'История Казахстана', 
    subtitle: 'История Казахстана', 
    base: '9',
    languages: ['ru'],
    localizedInfo: {
      ru: { code: 'ООД 06', title: 'История Казахстана', subtitle: 'История Казахстана' }
    },
    credits: '3',
    totalHours: '90',
    semesters: [
      { id: 1, year: '2025-2026', semester: '1 семестр', hours: '', groupHours: '90', srsHours: '', srspHours: '', practiceHours: '', individualHours: '', control: 'Экзамен' }
    ]
  },
  { 
    id: 2, 
    code: 'ПМ 1', 
    title: 'Применение музыкально-теоретических навыков', 
    subtitle: 'Р.О. 1.1. Владеть основными элементами музыкальной грамоты', 
    base: '9',
    languages: ['ru'],
    localizedInfo: {
      ru: { code: 'ПМ 1', title: 'Применение музыкально-теоретических навыков', subtitle: 'Р.О. 1.1. Владеть основными элементами музыкальной грамоты' }
    },
    credits: '5',
    totalHours: '150',
    semesters: [
      { id: 1, year: '2025-2026', semester: '1 семестр', hours: '', groupHours: '75', srsHours: '', srspHours: '', practiceHours: '', individualHours: '', control: 'Зачет' },
      { id: 2, year: '2025-2026', semester: '2 семестр', hours: '', groupHours: '75', srsHours: '', srspHours: '', practiceHours: '', individualHours: '', control: 'Экзамен' }
    ]
  },
  { 
    id: 3, 
    code: 'ООД 1', 
    title: 'Қазақ тілі', 
    subtitle: 'Қазақ тілі', 
    base: '11',
    languages: ['kz'],
    localizedInfo: {
      kz: { code: 'ООД 1', title: 'Қазақ тілі', subtitle: 'Қазақ тілі' }
    },
    credits: '4',
    totalHours: '120',
    semesters: [
      { id: 1, year: '2025-2026', semester: '1 семестр', hours: '', groupHours: '120', srsHours: '', srspHours: '', practiceHours: '', individualHours: '', control: 'Экзамен' }
    ]
  },
  { 
    id: 4, 
    code: 'ООД 2', 
    title: 'Қазақ әдебиеті', 
    subtitle: 'Қазақ әдебиеті', 
    base: '11',
    languages: ['kz'],
    localizedInfo: {
      kz: { code: 'ООД 2', title: 'Қазақ әдебиеті', subtitle: 'Қазақ әдебиеті' }
    },
    credits: '2',
    totalHours: '60',
    semesters: [
      { id: 1, year: '2025-2026', semester: '2 семестр', hours: '', groupHours: '60', srsHours: '', srspHours: '', practiceHours: '', individualHours: '', control: 'Зачет' }
    ]
  }
];

export const INITIAL_RUP: Rup[] = [
  {
    id: 1,
    specialty: '00102461',
    course: 1,
    semester: 1,
    discipline: 'История Казахстана',
    lectureHours: 30,
    practiceHours: 15,
    labHours: 0,
    credits: 3,
    controlForm: 'exam'
  },
  {
    id: 2,
    specialty: '00102461',
    course: 1,
    semester: 1,
    discipline: 'Иностранный язык',
    lectureHours: 0,
    practiceHours: 45,
    labHours: 0,
    credits: 3,
    controlForm: 'diff_credit'
  },
  {
    id: 3,
    specialty: '01564140',
    course: 2,
    semester: 3,
    discipline: 'Сольфеджио',
    lectureHours: 15,
    practiceHours: 30,
    labHours: 0,
    credits: 2,
    controlForm: 'exam'
  },
  {
    id: 4,
    specialty: '016054361',
    course: 3,
    semester: 5,
    discipline: 'Гармония',
    lectureHours: 30,
    practiceHours: 30,
    labHours: 0,
    credits: 4,
    controlForm: 'exam'
  }
];

export const INITIAL_JOURNALS: Journal[] = [
    // Courses
    { 
        id: 1, 
        title: 'История Казахстана', 
        description: 'Лекционные и семинарские занятия', 
        type: 'course', 
        courseNumber: 1,
        studentCount: 24, 
        color: 'bg-blue-500',
        icon: <GraduationCap size={20} />
    },
    { 
        id: 2, 
        title: 'Философия', 
        description: 'Основной курс философии', 
        type: 'course', 
        courseNumber: 2,
        studentCount: 18, 
        color: 'bg-indigo-500',
        icon: <Book size={20} />
    },
    { 
        id: 6, 
        title: 'Социология', 
        description: 'Введение в социологию', 
        type: 'course', 
        courseNumber: 2,
        studentCount: 20, 
        color: 'bg-indigo-500',
        icon: <Book size={20} />
    },
    { 
        id: 7, 
        title: 'Политология', 
        description: 'Политические системы', 
        type: 'course', 
        courseNumber: 3,
        studentCount: 15, 
        color: 'bg-teal-500',
        icon: <Book size={20} />
    },
    // Mixed
    { 
        id: 3, 
        title: 'Смешанная группа (IT + Design)', 
        description: 'Элективный курс: История искусств', 
        type: 'mixed', 
        studentCount: 32, 
        color: 'bg-purple-500',
        icon: <LayoutGrid size={20} />
    },
    // Individual
    { 
        id: 4, 
        title: 'Индивидуальный план (Иванов А.)', 
        description: 'Академическая разница', 
        type: 'individual', 
        studentCount: 1, 
        color: 'bg-orange-500',
        icon: <User size={20} />
    },
    { 
        id: 5, 
        title: 'Индивидуальный план (Петрова С.)', 
        description: 'Подготовка к олимпиаде', 
        type: 'individual', 
        studentCount: 1, 
        color: 'bg-pink-500',
        icon: <User size={20} />
    },
];


const createHistory = (year: number): any[] => [
  { date: `${year}-09-01`, type: 'enrollment', orderNumber: `№${year}-KM`, description: 'Зачисление на 1 курс' },
  { date: `${year+1}-06-25`, type: 'promotion', orderNumber: `№${year+1}-PR`, description: 'Перевод на 2 курс' }
];

export const INITIAL_STUDENTS: Student[] = [
  { id: 1, fullName: 'Иванов Иван Иванович', specialty: '00102461', language: 'ru', course: 2, gender: 'male', status: 'active', history: createHistory(2023) },
  { id: 2, fullName: 'Петрова Анна Сергеевна', specialty: '01564140', language: 'ru', course: 2, gender: 'female', status: 'active', history: createHistory(2023) },
  { id: 3, fullName: 'Сидоров Алексей Петрович', specialty: '016054361', language: 'ru', course: 2, gender: 'male', status: 'active', history: createHistory(2023) },
  { id: 4, fullName: 'Смирнова Елена Дмитриевна', specialty: '00102461', language: 'ru', course: 2, gender: 'female', status: 'debt', history: createHistory(2023) },
  { id: 5, fullName: 'Кузнецова Мария Александровна', specialty: '010413613636', language: 'ru', course: 2, gender: 'female', status: 'active', history: createHistory(2023) },
  { id: 6, fullName: 'Попов Дмитрий Викторович', specialty: '00102461', language: 'ru', course: 2, gender: 'male', status: 'active', history: createHistory(2023) },
  { id: 7, fullName: 'Васильева Ольга Игоревна', specialty: '010413613636', language: 'ru', course: 2, gender: 'female', status: 'academic_leave', history: [...createHistory(2023), { date: '2024-10-10', type: 'status_change', orderNumber: '№234-AL', description: 'Академический отпуск' }] },
  { id: 8, fullName: 'Соколов Андрей Михайлович', specialty: '016054361', language: 'ru', course: 2, gender: 'male', status: 'active', history: createHistory(2023) },
  { id: 9, fullName: 'Михайлова Татьяна Николаевна', specialty: '016054361', language: 'ru', course: 2, gender: 'female', status: 'active', history: createHistory(2023) },
  { id: 10, fullName: 'Новикова Юлия Владимировна', specialty: '016054361', language: 'ru', course: 2, gender: 'female', status: 'expelled', history: [{ date: '2023-09-01', type: 'enrollment', orderNumber: '№2023-KM', description: 'Зачисление' }, { date: '2024-01-15', type: 'expulsion', orderNumber: '№12-EX', description: 'Отчисление по собственному желанию' }] },
  { id: 11, fullName: 'Федоров Николай Васильевич', specialty: '01564140', language: 'ru', course: 2, gender: 'male', status: 'active', history: createHistory(2023) },
  { id: 12, fullName: 'Морозова Светлана Павловна', specialty: '01564140', language: 'ru', course: 2, gender: 'female', status: 'active', history: createHistory(2023) },
  { id: 13, fullName: 'Волков Сергей Александрович', specialty: '01564140', language: 'ru', course: 2, gender: 'male', status: 'active', history: createHistory(2023) },
  { id: 14, fullName: 'Алексеева Екатерина Юрьевна', specialty: '010413613636', language: 'ru', course: 2, gender: 'female', status: 'active', history: createHistory(2023) },
  { id: 15, fullName: 'Лебедев Павел Андреевич', specialty: '010413613636', language: 'ru', course: 2, gender: 'male', status: 'active', history: createHistory(2023) },
];

export const INITIAL_PROTOCOL_EVENTS: ProtocolEvent[] = [
    {
      id: 1,
      date: '2026-01-03',
      formattedDate: 'Суббота, 3 января 2026 года',
      title: 'Установлена замена',
      description: 'Журнал БМ4 Владеть основами философских знаний 3 Курса – 3 РЭХТ (русская группа) преподавателя Қилаш Расул Жаншелдыұлы переведен преподавателю Садвакасава Динара Балтабековна в период с 27.12.2025 г. по 03.12.2026 г.',
      source: 'на основании служебного письма от 25.12.2025 г.',
      type: 'info',
      status: 'info',
      timestamp: '10:00'
    },
    {
      id: 2,
      date: '2026-01-03',
      formattedDate: 'Суббота, 3 января 2026 года',
      title: 'Назначена пересдача (Запрос)',
      description: 'Преподаватель Килаш Расул Жангелдыулы назначил пересдачу экзамена в журнале БМ4 Владеть основами философских знаний 3 курса – 3 РЭХТ (русская группа) студенту Рахимов Мадияр.',
      source: 'на основании собственного подтверждения',
      type: 'request',
      status: 'pending',
      timestamp: '14:30'
    },
    {
      id: 3,
      date: '2026-01-02',
      formattedDate: 'Пятница, 2 января 2026 года',
      title: 'Решение по апелляции',
      description: 'Отклонено администратором 145. Причина: Недостаточно оснований для пересмотра оценки согласно регламенту проведения экзамена.',
      source: 'Системная запись',
      type: 'system',
      status: 'rejected',
      timestamp: '16:45'
    },
    {
      id: 4,
      date: '2026-01-02',
      formattedDate: 'Пятница, 2 января 2026 года',
      title: 'Установлена апелляция',
      description: 'Студент Шульга Александр подал апелляцию на оценку по экзамену "История Казахстана". Основание: Технический сбой во время тестирования.',
      source: 'на основании запроса студента',
      type: 'appeal',
      status: 'rejected',
      timestamp: '12:00'
    },
    {
      id: 5,
      date: '2025-12-27',
      formattedDate: 'Понедельник, 27 декабря 2025 года',
      title: 'Установлена замена',
      description: 'Журнал ООД 06 История Казахстана переведен преподавателю Ахметов А.А.',
      source: 'на основании приказа №45',
      type: 'info',
      status: 'info',
      timestamp: '09:00'
    }
  ];
