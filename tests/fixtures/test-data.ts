export const testUsers = {
  teacher: {
    email: 'teacher@test.com',
    password: 'testPassword123',
    role: 'teacher',
  },
  student: {
    email: 'student@test.com',
    password: 'testPassword123',
    role: 'student',
  },
  admin: {
    email: 'admin@test.com',
    password: 'adminPassword123',
    role: 'admin',
  },
};

export const testDisciplines = [
  {
    id: 1,
    name: 'Математика',
    code: 'MATH-101',
    credits: 4,
  },
  {
    id: 2,
    name: 'Физика',
    code: 'PHYS-101',
    credits: 3,
  },
  {
    id: 3,
    name: 'Информатика',
    code: 'CS-101',
    credits: 4,
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
    teacher: 'Иванов И.И.',
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
