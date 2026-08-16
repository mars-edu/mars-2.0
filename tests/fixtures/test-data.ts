export const testUsers = {
  teacher: {
    username: 'Килаш Расул Жангелдыулы',
    fullName: 'Килаш Расул Жангелдыулы',
    email: 'teacher@test.com',
    password: 'teachertest',
    role: 'teacher',
  },
  student: {
    username: 'Студент',
    fullName: 'Тестовый Студент',
    email: 'student@test.com',
    password: 'studentPassword123',
    role: 'student',
  },
  admin: {
    username: 'Администратор',
    fullName: 'Главный Администратор',
    email: 'admin@test.com',
    password: 'adminPassword123',
    role: 'admin',
  },
};

export const testThemes = [
  { name: 'light', label: 'Светлая', className: '' },
  { name: 'dark', label: 'Темная', className: 'dark' },
  { name: 'lavanda', label: 'Лавандовая', className: 'lavanda' },
  { name: 'coral', label: 'Коралловая', className: 'coral' },
  { name: 'graphite', label: 'Графитовая', className: 'graphite' },
] as const;

export const testLocales = [
  { code: 'ru', label: 'RU', name: 'Русский' },
  { code: 'kk', label: 'KK', name: 'Қазақша' },
  { code: 'en', label: 'EN', name: 'English' },
] as const;

export const testDisciplines = [
  {
    id: 1,
    name: 'Математика',
    code: 'MATH-101',
    credits: 4,
    hours: 60,
  },
  {
    id: 2,
    name: 'Физика',
    code: 'PHYS-101',
    credits: 3,
    hours: 45,
  },
  {
    id: 3,
    name: 'Информатика',
    code: 'CS-101',
    credits: 4,
    hours: 60,
  },
];

export const testSpecialties = [
  {
    id: 'spec-1',
    codeName: 'ИС-21',
    code: '06130100',
    name: 'Информационные системы',
    year: 2024,
  },
  {
    id: 'spec-2',
    codeName: 'ВТ-22',
    code: '06120100',
    name: 'Вычислительная техника',
    year: 2024,
  },
];

export const testCabinets = [
  {
    id: 'cab-1',
    name: '101',
    capacity: 30,
    type: 'lecture',
    description: 'Лекционная аудитория',
    isActive: true,
  },
  {
    id: 'cab-2',
    name: '202-К',
    capacity: 20,
    type: 'lab',
    description: 'Компьютерный класс',
    isActive: true,
  },
];

export const testJournals = [
  {
    id: 1,
    disciplineId: 1,
    groupName: 'ИТ-21',
    semester: 1,
    year: 2024,
  },
  {
    id: 2,
    disciplineId: 2,
    groupName: 'ИТ-22',
    semester: 1,
    year: 2024,
  },
];

export const testSchedule = [
  {
    id: 1,
    dayOfWeek: 1,
    timeSlot: '09:00-10:30',
    discipline: 'Математика',
    room: '201',
    teacher: 'Килаш Расул Жангелдыулы',
  },
  {
    id: 2,
    dayOfWeek: 1,
    timeSlot: '10:45-12:15',
    discipline: 'Физика',
    room: '305',
    teacher: 'Петров П.П.',
  },
];
