import React, { useState } from 'react';
import { ChevronLeft, FileText, Settings, Clock, XCircle, Download, Upload, Share2, Calculator, Minus, FileSpreadsheet, RefreshCw, CheckCircle, ArrowLeft, AlertCircle, Plus, Calendar, MoreVertical, Search, Filter, Trash2, Edit, Paperclip, Eye, Check, X, RotateCcw, Sparkles, User, Users, ChevronRight, MoreHorizontal, HelpCircle, Shuffle, Timer, Library, List, CheckCircle2, Save, PlusCircle, BarChart3, Target, FolderOpen, Pencil } from 'lucide-react';
import { ProtocolEvent } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

interface StudentGrade {
  id: number;
  name: string;
  badge: number | null;
  grades: Record<string, [string, string]>;
  rk1: string;
  rk1_retake: string;
  rk2: string;
  rk2_retake: string;
  exam: string;
  exam_retake: string;
  total: string;
  total_final: string;
  status?: 'active' | 'expelled';
  expulsionDate?: string; // YYYY-MM-DD
  expulsionOrder?: string;
}

interface Assignment {
  id: number;
  topic: string; // Lesson Topic
  title: string;
  description: string;
  deadline: string;
  gradingDate: string; // Date from journal
  createdAt: string;
  status: 'active' | 'draft' | 'closed';
  submissionsCount: number;
  totalStudents: number;
  assignedStudentIds?: number[]; // IDs of assigned students, empty/undefined implies all
}

interface Test {
    id: number;
    title: string;
    topic: string;
    date: string;
    startTime: string;
    duration: number; // minutes
    questionsCount: number;
    status: 'scheduled' | 'active' | 'completed' | 'draft';
    type: 'exam' | 'quiz' | 'midterm';
    isPractice: boolean;
    submissionsCount?: number;
    totalStudents?: number;
}

interface Question {
    id: number;
    text: string;
    options: string[];
    correctIndex: number;
}

interface LibraryTest {
    id: number;
    title: string;
    topic: string;
    description: string;
    questionsCount: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    questions: Question[];
}

interface JournalViewProps {
    onAddProtocolEvent?: (event: ProtocolEvent) => void;
    protocolEvents?: ProtocolEvent[];
    onClose?: () => void;
}

export const JournalView: React.FC<JournalViewProps> = ({ onAddProtocolEvent, protocolEvents = [], onClose }) => {
  const [activeTab, setActiveTab] = useState('Журнал');
  const [viewMode, setViewMode] = useState<'general' | 'individual' | 'monitoring'>('general');
  
  // Retake Modal State
  const [isRetakeModalOpen, setIsRetakeModalOpen] = useState(false);
  const [retakeStep, setRetakeStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [retakeStudentIds, setRetakeStudentIds] = useState<number[]>([]);
  const [retakeType, setRetakeType] = useState<string>('rk1');
  const [retakeReason, setRetakeReason] = useState<string>('');

  // Assignments State
  const [assignments, setAssignments] = useState<Assignment[]>([
    { id: 1, topic: 'Становление независимости', title: 'Эссе "История независимости"', description: 'Написать эссе на тему становления независимости Казахстана. Объем 500-700 слов. Использовать не менее 3 источников.', deadline: '2025-10-15', gradingDate: '15.09', createdAt: '2025-10-01', status: 'closed', submissionsCount: 14, totalStudents: 15 },
    { id: 2, topic: 'Исторические источники', title: 'Анализ источников по теме №5', description: 'Провести сравнительный анализ исторических источников по теме лекции 5. Заполнить таблицу в приложении.', deadline: '2025-11-20', gradingDate: '22.09', createdAt: '2025-11-10', status: 'active', submissionsCount: 5, totalStudents: 15 },
    { id: 3, topic: 'Культура кочевников', title: 'Подготовка к семинару', description: 'Прочитать главы 3-4 учебника. Подготовить устные ответы на вопросы в конце главы.', deadline: '2026-01-10', gradingDate: '29.12', createdAt: '2026-01-03', status: 'active', submissionsCount: 0, totalStudents: 15 },
  ]);
  const [assignmentViewMode, setAssignmentViewMode] = useState<'list' | 'create' | 'details'>('list');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);

  // New Assignment Form State
  const [newAssignmentTopic, setNewAssignmentTopic] = useState('');
  const [isCustomTopic, setIsCustomTopic] = useState(false);
  const [newAssignmentGradingDate, setNewAssignmentGradingDate] = useState('');
  const [assignToAll, setAssignToAll] = useState(true);
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<number[]>([]);

  // Testing State
  const [testViewMode, setTestViewMode] = useState<'list' | 'create' | 'details' | 'library' | 'edit-template'>('list');
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [viewStudentAnswersId, setViewStudentAnswersId] = useState<number | null>(null);

  const [tests, setTests] = useState<Test[]>([
      { id: 1, title: 'Рубежный контроль 1', topic: 'Этногенез казахов', date: '2025-10-20', startTime: '10:00', duration: 45, questionsCount: 25, status: 'completed', type: 'midterm', isPractice: false, submissionsCount: 15, totalStudents: 15 },
      { id: 2, title: 'Тест по лекции 5', topic: 'Культура кочевников', date: '2025-11-15', startTime: '14:30', duration: 20, questionsCount: 15, status: 'completed', type: 'quiz', isPractice: true, submissionsCount: 12, totalStudents: 15 },
      { id: 3, title: 'Экзаменационное тестирование', topic: 'Итоговый контроль', date: '2026-01-10', startTime: '09:00', duration: 90, questionsCount: 50, status: 'scheduled', type: 'exam', isPractice: false, submissionsCount: 0, totalStudents: 15 },
  ]);
  const [newTest, setNewTest] = useState({
      title: '',
      topic: '',
      date: '',
      time: '',
      duration: 45,
      randomize: true,
      isPractice: false,
      source: 'manual' as 'manual' | 'upload' | 'library'
  });

  // Manual Question Builder State
  const [addedQuestions, setAddedQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
      id: 0,
      text: '',
      options: ['', '', '', ''],
      correctIndex: 0
  });

  // Library State
  const [libraryTests, setLibraryTests] = useState<LibraryTest[]>([
      {
          id: 101,
          title: 'История Казахстана: Древний период',
          topic: 'Введение в предмет. Методология истории',
          description: 'Базовый тест по эпохе бронзы и ранним кочевникам.',
          questionsCount: 20,
          difficulty: 'Easy',
          questions: [] // Mock empty for brevity
      },
      {
          id: 102,
          title: 'Образование Казахского ханства',
          topic: 'Образование Казахского ханства',
          description: 'Тест на знание ханов, дат и ключевых битв.',
          questionsCount: 25,
          difficulty: 'Medium',
          questions: []
      },
      {
          id: 103,
          title: 'Культура и быт кочевников',
          topic: 'Культура кочевников',
          description: 'Вопросы по материальной и духовной культуре.',
          questionsCount: 15,
          difficulty: 'Easy',
          questions: []
      },
      {
          id: 104,
          title: 'Итоговый тест (XX век)',
          topic: 'Советский период истории Казахстана',
          description: 'Сложный тест, охватывающий период с 1917 по 1991 год.',
          questionsCount: 40,
          difficulty: 'Hard',
          questions: []
      }
  ]);
  const [selectedLibraryId, setSelectedLibraryId] = useState<number | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<LibraryTest | null>(null);

  // Submission Action State
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);
  const [submissionConfirmModal, setSubmissionConfirmModal] = useState<{
      isOpen: boolean;
      studentId: number | null;
      studentName: string;
      action: 'accept' | 'reject' | 'revise' | null;
  }>({
      isOpen: false,
      studentId: null,
      studentName: '',
      action: null
  });

  // AI Grading State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiAnalysisState, setAiAnalysisState] = useState<'idle' | 'analyzing' | 'complete'>('idle');
  const [aiResult, setAiResult] = useState<{grade: number, strengths: string[], weaknesses: string[], summary: string} | null>(null);
  const [currentAiStudentId, setCurrentAiStudentId] = useState<number | null>(null);

  const lessonTopics = [
      "Введение в предмет. Методология истории",
      "Этногенез казахов",
      "Образование Казахского ханства",
      "Казахстан в составе Российской империи",
      "Национально-освободительные движения",
      "Культура кочевников",
      "Советский период истории Казахстана",
      "Становление независимости"
  ];

  // Mock Data
  const [students, setStudents] = useState<StudentGrade[]>([
    { id: 1, name: 'Биянова Даниля А', badge: 22.7, grades: { '01.09': ['12', ''], '08.09': ['23', '12'], '06.10': ['23', '12'], '22.12': ['60', ''], '29.12': ['23', ''] }, rk1: '17.5', rk1_retake: '', rk2: '30.9', rk2_retake: '', exam: '85', exam_retake: '', total: '24.2', total_final: '24.2' },
    { id: 2, name: 'Мигаль Дарья Алексеевна', badge: 21.3, grades: { '08.09': ['32', '+'], '27.10': ['23', ''], '29.12': ['12', ''] }, rk1: '27.5', rk1_retake: '', rk2: '12.0', rk2_retake: '25.0', exam: '70', exam_retake: '', total: '19.8', total_final: '35.0' },
    { id: 3, name: 'Науменко София Николаевна', badge: 20.7, grades: { '08.09': ['12', '23'], '06.10': ['23', ''], '29.12': ['23', ''] }, rk1: '20.3', rk1_retake: '', rk2: '23.0', rk2_retake: '', exam: '75', exam_retake: '', total: '21.6', total_final: '21.6' },
    { id: 4, name: 'Сергеева Елизавета Сергеевна', badge: 21.6, grades: { '01.09': ['12', '23'], '29.12': ['34', ''] }, rk1: '14.8', rk1_retake: '20.0', rk2: '34.0', rk2_retake: '', exam: '80', exam_retake: '', total: '24.4', total_final: '30.0' },
    { id: 5, name: 'Гафурова Амина Манцуровна', badge: 35.5, grades: { '01.09': ['30', ''], '08.09': ['30', ''], '15.09': ['30', ''], '22.09': ['30', ''], '03.11': ['40', ''], '10.11': ['40', ''], '17.11': ['40', ''], '24.11': ['40', ''], '01.12': ['40', ''] }, rk1: '30.0', rk1_retake: '', rk2: '40.0', rk2_retake: '', exam: '95', exam_retake: '', total: '35.0', total_final: '35.0' },
    { 
        id: 6, 
        name: 'Ким Вирсавия Витальевна', 
        badge: 19.3, 
        grades: { '01.09': ['12', ''], '08.09': ['23', ''], '15.09': ['23', ''] }, 
        rk1: '19.3', rk1_retake: '', rk2: '', rk2_retake: '', exam: '', exam_retake: '', total: '-', total_final: '-',
        status: 'expelled',
        expulsionDate: '2025-09-25', // Expelled after 22.09
        expulsionOrder: '№12/4-К'
    },
    { id: 7, name: 'Айдагазы Ақниет Жәнібекқызы', badge: null, grades: {}, rk1: '', rk1_retake: '', rk2: '', rk2_retake: '', exam: '', exam_retake: '', total: '-', total_final: '-' },
    { id: 8, name: 'Байғараева Гүлназ', badge: null, grades: {}, rk1: '', rk1_retake: '', rk2: '', rk2_retake: '', exam: '', exam_retake: '', total: '-', total_final: '-' },
  ]);

  const dates = [
    { date: '01.09', year: '2025' },
    { date: '08.09', year: '2025' },
    { date: '15.09', year: '2025' },
    { date: '22.09', year: '2025' },
    { date: '29.09', year: '2025' },
    { date: '06.10', year: '2025' },
    { date: '13.10', year: '2025' },
    { date: '20.10', year: '2025' },
    { date: '27.10', year: '2025' },
  ];

  const rk2Dates = [
    { date: '03.11', year: '2025' },
    { date: '10.11', year: '2025' },
    { date: '17.11', year: '2025' },
    { date: '24.11', year: '2025' },
    { date: '01.12', year: '2025' },
    { date: '08.12', year: '2025' },
    { date: '15.12', year: '2025' },
    { date: '22.12', year: '2025' },
    { date: '29.12', year: '2025' },
  ];

  const allJournalDates = [...dates, ...rk2Dates];

  const handleGradeChange = (id: number, dateKey: string, index: number, value: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        const currentGrades = s.grades[dateKey] || ['', ''];
        const newGrades = [...currentGrades] as [string, string];
        newGrades[index] = value;
        return { ...s, grades: { ...s.grades, [dateKey]: newGrades } };
      }
      return s;
    }));
  };

  const handleMonitoringChange = (id: number, field: keyof StudentGrade, value: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, [field]: value };
      }
      return s;
    }));
  };

  const toggleRetakeStudent = (id: number) => {
      if (retakeStudentIds.includes(id)) {
          setRetakeStudentIds(prev => prev.filter(sid => sid !== id));
      } else {
          setRetakeStudentIds(prev => [...prev, id]);
      }
  };

  const openRetakeModal = () => {
      setIsRetakeModalOpen(true);
      setRetakeStep('form');
  };

  const closeRetakeModal = () => {
      setIsRetakeModalOpen(false);
      setRetakeStudentIds([]);
      setRetakeReason('');
      setRetakeStep('form');
  };

  const handleRetakeSubmit = () => {
      if (retakeStudentIds.length === 0 || !retakeType) return;
      setRetakeStep('confirm');
  };

  const confirmSendRequest = () => {
      if (onAddProtocolEvent) {
          const selectedStudents = students.filter(s => retakeStudentIds.includes(s.id));
          const names = selectedStudents.map(s => s.name).join(', ');
          const now = new Date();
          const event: ProtocolEvent = {
              id: Date.now(), // Simple unique ID
              date: now.toISOString().split('T')[0],
              formattedDate: 'Суббота, 3 января 2026 года', // Keeping context date
              title: 'Назначена пересдача (Запрос)',
              description: `Преподаватель назначил пересдачу (${retakeType}) студентам: ${names}.${retakeReason ? ` Основание: ${retakeReason}` : ''}`,
              source: 'на основании собственного подтверждения',
              type: 'request',
              status: 'pending',
              timestamp: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
              metadata: {
                  studentIds: retakeStudentIds,
                  retakeType: retakeType
              }
          };
          onAddProtocolEvent(event);
      }
      setRetakeStep('success');
  };

  const handleTabClick = (tab: string) => {
      setActiveTab(tab);
      if (tab === 'Журнал') {
          setViewMode('general');
      } else if (tab === 'Задания') {
          setAssignmentViewMode('list');
          setSelectedAssignmentId(null);
      } else if (tab === 'Тестирование') {
          setTestViewMode('list');
          setSelectedTestId(null);
      }
  };

  const toggleAssignee = (id: number) => {
      if (selectedAssigneeIds.includes(id)) {
          setSelectedAssigneeIds(prev => prev.filter(sid => sid !== id));
      } else {
          setSelectedAssigneeIds(prev => [...prev, id]);
      }
  };

  // Add Question Logic
  const handleAddQuestion = () => {
      if (!currentQuestion.text || currentQuestion.options.some(opt => !opt)) return;
      
      const newQuestion = { ...currentQuestion, id: Date.now() };
      setAddedQuestions([...addedQuestions, newQuestion]);
      setCurrentQuestion({
          id: 0,
          text: '',
          options: ['', '', '', ''],
          correctIndex: 0
      });
  };

  const handleDeleteQuestion = (id: number) => {
      setAddedQuestions(addedQuestions.filter(q => q.id !== id));
  };

  const handleSelectLibraryTest = (test: LibraryTest) => {
      setSelectedLibraryId(test.id);
      setNewTest({
          ...newTest,
          title: test.title,
          topic: test.topic,
      });
  };

  const handleCreateTest = () => {
      if (!newTest.title) return;

      const newTestObj: Test = {
          id: Date.now(),
          title: newTest.title,
          topic: newTest.topic,
          date: newTest.date,
          startTime: newTest.time,
          duration: newTest.duration,
          questionsCount: newTest.source === 'library' ? (libraryTests.find(t => t.id === selectedLibraryId)?.questionsCount || 0) : addedQuestions.length,
          status: 'scheduled',
          type: 'midterm', // Default type
          isPractice: newTest.isPractice,
          submissionsCount: 0,
          totalStudents: students.length
      };

      setTests([newTestObj, ...tests]);
      setTestViewMode('list');
      // Reset state
      setNewTest({
          title: '',
          topic: '',
          date: '',
          time: '',
          duration: 45,
          randomize: true,
          isPractice: false,
          source: 'manual'
      });
      setAddedQuestions([]);
      setSelectedLibraryId(null);
  };

  const handleEditTemplate = (template: LibraryTest) => {
      setEditingTemplate(template);
      setAddedQuestions(template.questions || []);
      setTestViewMode('edit-template');
  };

  const handleSaveTemplate = () => {
      if (!editingTemplate) return;

      const updatedTemplate: LibraryTest = {
          ...editingTemplate,
          questions: addedQuestions,
          questionsCount: addedQuestions.length
      };

      if (libraryTests.find(t => t.id === updatedTemplate.id)) {
          setLibraryTests(libraryTests.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
      } else {
          setLibraryTests([...libraryTests, updatedTemplate]);
      }
      
      setTestViewMode('library');
      setEditingTemplate(null);
      setAddedQuestions([]);
  };

  const handleDeleteTemplate = (id: number) => {
      if (window.confirm('Вы уверены, что хотите удалить этот тест из библиотеки?')) {
          setLibraryTests(libraryTests.filter(t => t.id !== id));
      }
  };

  // AI Analysis Logic
  const analyzeSubmission = async (studentId: number, studentName: string, assignmentTitle: string) => {
    setAiAnalysisState('analyzing');
    setIsAiModalOpen(true);
    setCurrentAiStudentId(studentId);

    try {
        const apiKey = process.env.GEMINI_API_KEY || '';
        
        // Mocking submission text since we don't have files
        const mockSubmissionText = "История независимости Казахстана – это сложный и многогранный процесс, который уходит корнями в глубокую древность. Ключевым моментом стало принятие декларации о суверенитете. Однако, в работе не хватает детального анализа экономических последствий."; 
        
        let result;

        if (apiKey) {
            const ai = new GoogleGenAI({ apiKey });
            const model = "gemini-3-flash-preview";
            const prompt = `You are a strict history professor. Analyze the following student essay on "${assignmentTitle}". 
            Student Name: ${studentName}.
            Submission: "${mockSubmissionText}".
            
            Return a JSON response with:
            - grade: number (0-100)
            - strengths: string[] (short bullet points)
            - weaknesses: string[] (short bullet points)
            - summary: string (2 sentences max)
            `;

            const response = await ai.models.generateContent({
                model: model,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            grade: { type: Type.INTEGER },
                            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                            summary: { type: Type.STRING }
                        }
                    }
                }
            });
            result = JSON.parse(response.text || '{}');
        } else {
            // Fallback mock if no API key
             await new Promise(resolve => setTimeout(resolve, 2000));
             result = {
                grade: 88,
                strengths: ["Отличное знание хронологии", "Правильное использование терминов", "Логичная структура"],
                weaknesses: ["Недостаточно ссылок на источники", "Есть стилистические погрешности"],
                summary: "Работа выполнена на высоком уровне, студент демонстрирует глубокое понимание темы."
            };
        }
        
        setAiResult(result);
        setAiAnalysisState('complete');

    } catch (error) {
        console.error("AI Error", error);
        // Fallback on error
        setAiResult({
            grade: 0,
            strengths: [],
            weaknesses: [],
            summary: "Ошибка анализа. Попробуйте позже."
        });
        setAiAnalysisState('complete');
    }
  };

  const applyAiGrade = () => {
      // In a real app, this would update the student's submission grade in the DB
      // Here we just close the modal
      setIsAiModalOpen(false);
      setAiResult(null);
      // You could also toast a success message here
  };

  // Helper to check if retake is unlocked for a student and type
  const isRetakeUnlocked = (studentId: number, type: string) => {
    return protocolEvents.some(event => 
        event.status === 'approved' && 
        event.metadata?.studentIds.includes(studentId) && 
        event.metadata?.retakeType === type
    );
  };

  // Grade Statistics Helper
  const getLetterGrade = (score: string) => {
      const numScore = parseFloat(score);
      if (isNaN(numScore)) return null;
      if (numScore >= 95) return 'A';
      if (numScore >= 90) return 'A-';
      if (numScore >= 85) return 'B+';
      if (numScore >= 80) return 'B';
      if (numScore >= 75) return 'B-';
      if (numScore >= 70) return 'C+';
      if (numScore >= 65) return 'C';
      if (numScore >= 60) return 'C-';
      if (numScore >= 55) return 'D+';
      if (numScore >= 50) return 'D';
      return 'F';
  };

  const calculateGradeStats = () => {
      const stats: Record<string, number> = { 'A': 0, 'A-': 0, 'B+': 0, 'B': 0, 'B-': 0, 'C+': 0, 'C': 0, 'C-': 0, 'D+': 0, 'D': 0, 'F': 0 };
      let totalCount = 0;

      students.forEach(student => {
          const letter = getLetterGrade(student.total_final);
          if (letter) {
              stats[letter] = (stats[letter] || 0) + 1;
              totalCount++;
          }
      });
      return { stats, totalCount };
  };

  const gradeStats = calculateGradeStats();

  // Helper function to mock status dots
  const getGradeStatus = (studentId: number, dateStr: string, index: number, value: string) => {
      if (value && value.trim() !== '') {
          return { color: 'bg-green-500', title: 'Проверено / Оценено' };
      }
      
      // Mock logic for "Sent/Under Review" (Yellow)
      // Showing for some students on specific recent dates if empty
      if (!value && ['22.09', '06.10', '13.10'].includes(dateStr) && (studentId + index) % 4 === 0) {
           return { color: 'bg-yellow-400', title: 'Отправлено на проверку' };
      }

      // Mock logic for "Overdue" (Red)
      // Showing for past dates if empty
      if (!value && ['01.09', '08.09', '15.09'].includes(dateStr)) {
          return { color: 'bg-red-500', title: 'Просрочено / Не сдано' };
      }

      return null;
  };

  // Handlers for Submission Actions
  const handleSubmissionActionClick = (studentId: number, studentName: string, action: 'accept' | 'reject' | 'revise') => {
      setSubmissionConfirmModal({
          isOpen: true,
          studentId,
          studentName,
          action
      });
      setOpenActionMenuId(null);
  };

  const confirmSubmissionAction = () => {
      // Here you would normally update the state/backend
      // For now, just close the modal
      setSubmissionConfirmModal({ isOpen: false, studentId: null, studentName: '', action: null });
      alert("Действие выполнено успешно!");
  };

  const handleSaveState = () => {
    const stateToSave = {
      students,
      assignments,
      tests,
      libraryTests,
    };
    const jsonString = JSON.stringify(stateToSave, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `journal_state_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoadState = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const loadedState = JSON.parse(event.target?.result as string);
          if (loadedState.students) setStudents(loadedState.students);
          if (loadedState.assignments) setAssignments(loadedState.assignments);
          if (loadedState.tests) setTests(loadedState.tests);
          if (loadedState.libraryTests) setLibraryTests(loadedState.libraryTests);
          alert('Данные успешно загружены!');
        } catch (error) {
          console.error('Error parsing JSON:', error);
          alert('Ошибка при загрузке файла.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const tabs = [
    'Журнал', 'Участники', 'Тематическое планирование', 'Задания', 'Чат', 'Файлы', 'Тестирование', 'Сервисы'
  ];

  const tools = [
    { icon: <FileText size={16} />, label: 'РУП', action: () => {} },
    { icon: <Settings size={16} />, label: 'Настройки', action: () => {} },
    { icon: <Clock size={16} />, label: 'История', action: () => {} },
    { icon: <XCircle size={16} />, label: 'Закрыть журнал', action: onClose || (() => {}) },
    { icon: <Download size={16} />, label: 'Сохранить', action: handleSaveState },
    { icon: <Upload size={16} />, label: 'Загрузить', action: handleLoadState },
    { icon: <Share2 size={16} />, label: 'Поделиться', action: () => {} },
    { icon: <Calculator size={16} />, label: 'Рассчитать', action: () => {} },
  ];

  // Helper to parse date for comparison
  const parseDate = (dayMonth: string, year: string) => {
    const [day, month] = dayMonth.split('.').map(Number);
    return new Date(parseInt(year), month - 1, day);
  };

  // Helper to render row cells with expulsion logic
  const renderStudentCells = (student: StudentGrade) => {
    // Define the chronological sequence of columns
    const columns = [
        ...dates.map((d, i) => ({ type: 'date', dateStr: d.date, year: d.year, key: `d1-${i}` })),
        { type: 'rk1', dateStr: '30.10', year: '2025', key: 'rk1' }, // Approx after P1
        ...rk2Dates.map((d, i) => ({ type: 'date', dateStr: d.date, year: d.year, key: `d2-${i}` })),
        { type: 'rk2', dateStr: '30.12', year: '2025', key: 'rk2' }, // Approx after P2
        { type: 'total', dateStr: '01.01', year: '2026', key: 'total' }
    ];

    const expDate = student.expulsionDate ? new Date(student.expulsionDate) : null;
    let expulsionRendered = false;

    return columns.map((col, index) => {
        // If we already rendered the expulsion colspan, skip remaining cells
        if (expulsionRendered) return null;

        const [d, m] = col.dateStr.split('.').map(Number);
        const colDate = new Date(parseInt(col.year), m - 1, d);

        // Check if student is expelled and current column is after expulsion date
        if (student.status === 'expelled' && expDate && colDate > expDate) {
            expulsionRendered = true;
            const remaining = columns.length - index;
            const dateDisplay = student.expulsionDate?.split('-').reverse().join('.');
            return (
                <td key="expelled" colSpan={remaining} className="border-b border-gray-100 p-2 text-center bg-[#F5F5F7] text-[#86868b] italic text-xs">
                    Отчислен Приказ {student.expulsionOrder} от {dateDisplay}
                </td>
            );
        }

        // Render normal cells based on type
        if (col.type === 'date') {
            return (
                <td key={col.key} className="border-r border-b border-gray-100 p-1 text-center align-top">
                    <div className="flex flex-col gap-1">
                        {[0, 1].map(gradeIndex => {
                             const gradeValue = student.grades[col.dateStr || '']?.[gradeIndex] || '';
                             const status = getGradeStatus(student.id, col.dateStr || '', gradeIndex, gradeValue);
                             return (
                                <div key={gradeIndex} className="relative w-full px-1">
                                    <input 
                                        type="text" 
                                        value={gradeValue}
                                        onChange={(e) => handleGradeChange(student.id, col.dateStr || '', gradeIndex, e.target.value)}
                                        className="w-full h-6 bg-gray-50/50 hover:bg-white focus:bg-white border border-gray-200/60 rounded-md text-center focus:ring-2 focus:ring-[#FF3B30]/20 text-[12px] text-[#1D1D1F] font-medium transition-all outline-none"
                                    />
                                    {status && (
                                        <div 
                                            className={`absolute top-1 right-1.5 w-1 h-1 rounded-full ${status.color}`} 
                                            title={status.title}
                                        />
                                    )}
                                </div>
                             )
                        })}
                    </div>
                </td>
            );
        }

        if (col.type === 'rk1') {
             return (
                <td key={col.key} className={`border-r border-b border-gray-100 p-1 text-center align-middle ${student.rk1_retake ? 'bg-[#FFF4CE]/30' : 'bg-[#F5F5F7]/30'}`}>
                    <div className={`py-1 px-2 rounded-lg text-xs font-semibold inline-block min-w-[32px] ${student.rk1_retake ? 'bg-[#FFF4CE] text-[#F5A623]' : 'bg-[#F2F2F7] text-[#8E8E93]'}`}>
                        {student.rk1_retake || student.rk1}
                    </div>
                </td>
            );
        }

        if (col.type === 'rk2') {
             return (
                <td key={col.key} className={`border-r border-b border-gray-100 p-1 text-center align-middle ${student.rk2_retake ? 'bg-[#FFF4CE]/30' : 'bg-[#F5F5F7]/30'}`}>
                    <div className={`py-1 px-2 rounded-lg text-xs font-semibold inline-block min-w-[32px] ${student.rk2_retake ? 'bg-[#FFF4CE] text-[#F5A623]' : 'bg-[#F2F2F7] text-[#8E8E93]'}`}>
                        {student.rk2_retake || student.rk2}
                    </div>
                </td>
            );
        }

        if (col.type === 'total') {
            if (student.status === 'expelled') {
                 return (
                    <td key={col.key} className="border-b border-gray-100 p-1 text-center align-middle">
                        <div className="text-[10px] text-gray-400 font-medium">-</div>
                    </td>
                );
            }
            return (
                <td key={col.key} className="border-b border-gray-100 p-1 text-center bg-[#FFEDED]/10 align-middle">
                    <div className="py-1 px-2 rounded-lg border border-[#FF3B30]/20 bg-white text-xs font-bold text-[#FF3B30] inline-block min-w-[36px]">{student.total_final || student.total}</div>
                </td>
            );
        }
        
        return null;
    });
  };

  const renderAssignments = () => {
    // Apple UI styles consistent with renderTests
    const appleCardStyle = "bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100/50 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-300";
    const appleInputStyle = "w-full bg-[#F5F5F7] border-none rounded-xl px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#007AFF]/20 focus:bg-white transition-all outline-none";
    const appleLabelStyle = "block text-[13px] font-medium text-gray-500 mb-2 uppercase tracking-wide ml-1";
    // Modified to be green
    const appleButtonStyle = "bg-[#34C759] hover:bg-[#28a745] text-white px-6 py-2.5 rounded-full text-[15px] font-medium shadow-sm hover:shadow-md transition-all active:scale-95";

    if (assignmentViewMode === 'list') {
        return (
            <div className="p-8 bg-[#F5F5F7] min-h-full">
                  <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                      <div className="flex items-center gap-3 w-full md:w-auto">
                          <div className="relative group w-full md:w-80">
                              <Search className="absolute left-3.5 top-3 text-gray-400 group-focus-within:text-[#007AFF] transition-colors" size={18} />
                              <input type="text" placeholder="Поиск задания..." className="w-full bg-white border-none rounded-xl py-2.5 pl-10 pr-4 text-sm shadow-sm focus:ring-2 focus:ring-[#007AFF]/20 placeholder-gray-400 outline-none transition-all" />
                          </div>
                      </div>
                      <button onClick={() => setAssignmentViewMode('create')} className={appleButtonStyle + " flex items-center gap-2"}>
                          <Plus size={18} strokeWidth={2.5} />
                          <span>Новое задание</span>
                      </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {assignments.map(assignment => (
                          <div key={assignment.id} className={`${appleCardStyle} p-6 cursor-pointer flex flex-col h-[260px] group relative overflow-hidden`} onClick={() => { setSelectedAssignmentId(assignment.id); setAssignmentViewMode('details'); }}>
                              <div className="flex justify-between items-start mb-4 relative z-10">
                                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide ${assignment.status === 'active' ? 'bg-[#E5F1FF] text-[#007AFF]' : assignment.status === 'closed' ? 'bg-[#F2F2F7] text-[#8E8E93]' : 'bg-[#FFF4CE] text-[#F5A623]'}`}>
                                      {assignment.status === 'active' ? 'Активно' : assignment.status === 'closed' ? 'Закрыто' : 'Черновик'}
                                  </span>
                                  <button className="text-gray-300 hover:text-gray-600 transition-colors bg-white/50 p-1 rounded-full hover:bg-gray-50"><MoreHorizontal size={20} /></button>
                              </div>

                              <div className="mb-auto relative z-10">
                                  <div className="text-[11px] font-bold text-[#007AFF] uppercase tracking-wide mb-1.5 truncate opacity-90">Тема: {assignment.topic}</div>
                                  <h3 className="font-bold text-[#1D1D1F] text-[19px] mb-2 leading-tight group-hover:text-[#007AFF] transition-colors line-clamp-2">{assignment.title}</h3>
                                  <div className="flex items-center gap-4 text-[13px] text-gray-500 font-medium mt-3">
                                      <div className="flex items-center gap-1.5"><FileText size={14} /> {assignment.submissionsCount}/{assignment.totalStudents} сдано</div>
                                  </div>
                              </div>

                              <div className="mt-4 pt-4 border-t border-gray-100 relative z-10 flex justify-between items-center">
                                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-[#F5F5F7] px-3 py-1.5 rounded-lg">
                                      <Calendar size={14} className="text-[#007AFF]" />
                                      <span>Дедлайн: {assignment.deadline}</span>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
            </div>
        );
    }

    if (assignmentViewMode === 'create') {
        return (
            <div className="p-8 bg-[#F5F5F7] min-h-full flex justify-center">
                  <div className="w-full max-w-2xl animate-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center gap-4 mb-8">
                          <button onClick={() => setAssignmentViewMode('list')} className="p-2 bg-white hover:bg-gray-100 rounded-full shadow-sm transition-colors text-gray-600">
                              <ArrowLeft size={20} />
                          </button>
                          <h2 className="text-2xl font-bold text-[#1D1D1F]">Создание задания</h2>
                      </div>

                      <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
                            <div className="space-y-1">
                                <label className={appleLabelStyle}>Тема занятия</label>
                                {!isCustomTopic ? (
                                    <select 
                                        className={appleInputStyle + " appearance-none"} 
                                        value={newAssignmentTopic} 
                                        onChange={e => {
                                            if (e.target.value === 'custom') {
                                                setIsCustomTopic(true);
                                                setNewAssignmentTopic('');
                                            } else {
                                                setNewAssignmentTopic(e.target.value);
                                            }
                                        }}
                                    >
                                        <option value="">Выберите тему...</option>
                                        {lessonTopics.map((t, i) => <option key={i} value={t}>{t}</option>)}
                                        <option value="custom" className="text-green-600 font-bold">+ Добавить свою тему</option>
                                    </select>
                                ) : (
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            className={appleInputStyle} 
                                            placeholder="Введите название темы..." 
                                            value={newAssignmentTopic} 
                                            onChange={e => setNewAssignmentTopic(e.target.value)} 
                                            autoFocus
                                        />
                                        <button 
                                            onClick={() => { setIsCustomTopic(false); setNewAssignmentTopic(''); }}
                                            className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className={appleLabelStyle}>Название задания</label>
                                <input type="text" className={appleInputStyle} placeholder="Например: Эссе по теме..." />
                            </div>

                            <div className="space-y-1">
                                <label className={appleLabelStyle}>Описание</label>
                                <textarea className={appleInputStyle + " min-h-[120px] resize-none"} placeholder="Инструкции для студентов..."></textarea>
                            </div>

                            <div className="space-y-1">
                                <label className={appleLabelStyle}>Прикрепленные файлы</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 bg-gray-50 hover:bg-gray-100/50 transition-colors cursor-pointer group">
                                    <Paperclip size={24} className="mb-2 group-hover:text-[#34C759] transition-colors" />
                                    <span className="text-sm font-medium group-hover:text-gray-600 transition-colors">Нажмите или перетащите файлы</span>
                                    <span className="text-xs text-gray-400 mt-1">PDF, DOCX, PNG до 10MB</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className={appleLabelStyle}>Дедлайн</label>
                                    <input type="date" className={appleInputStyle} />
                                </div>
                                <div className="space-y-1">
                                    <label className={appleLabelStyle}>Дата в журнале</label>
                                    <input type="text" className={appleInputStyle} placeholder="Например: 15.10" value={newAssignmentGradingDate} onChange={e => setNewAssignmentGradingDate(e.target.value)} />
                                </div>
                            </div>
                            
                            <div className="space-y-3 pt-2">
                              <label className={appleLabelStyle}>Кому назначить</label>
                              <div className="bg-[#F5F5F7] p-1 rounded-xl flex text-sm font-medium">
                                  <button 
                                      onClick={() => setAssignToAll(true)}
                                      className={`flex-1 py-2 rounded-lg transition-all shadow-sm duration-200 ${assignToAll ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700'}`}
                                  >
                                      Всей группе
                                  </button>
                                  <button 
                                      onClick={() => setAssignToAll(false)}
                                      className={`flex-1 py-2 rounded-lg transition-all shadow-sm duration-200 ${!assignToAll ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700'}`}
                                  >
                                      Выбрать вручную
                                  </button>
                              </div>
                              {!assignToAll && (
                                  <div className="bg-[#F5F5F7] rounded-xl overflow-hidden border border-gray-200/50">
                                      <div className="px-4 py-3 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wide flex justify-between items-center">
                                          <span>Список группы ({selectedAssigneeIds.length})</span>
                                          <button onClick={() => setSelectedAssigneeIds(selectedAssigneeIds.length === students.length ? [] : students.map(s => s.id))} className="text-[#007AFF] font-bold text-[11px]">
                                              {selectedAssigneeIds.length === students.length ? 'Снять выделение' : 'Выбрать все'}
                                          </button>
                                      </div>
                                      <div className="max-h-40 overflow-y-auto">
                                          {students.map((student, idx) => (
                                              <div 
                                                  key={student.id} 
                                                  onClick={() => toggleAssignee(student.id)}
                                                  className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${idx !== students.length - 1 ? 'border-b border-gray-200/60' : ''} hover:bg-white`}
                                              >
                                                  <div className="flex items-center gap-3">
                                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm transition-colors ${selectedAssigneeIds.includes(student.id) ? 'bg-[#007AFF] text-white' : 'bg-gray-200 text-gray-500'}`}>
                                                          {student.name.charAt(0)}
                                                      </div>
                                                      <span className={`text-[14px] ${selectedAssigneeIds.includes(student.id) ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{student.name}</span>
                                                  </div>
                                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${selectedAssigneeIds.includes(student.id) ? 'bg-[#007AFF] text-white' : 'border-2 border-gray-300'}`}>
                                                      {selectedAssigneeIds.includes(student.id) && <Check size={12} strokeWidth={3} />}
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              )}
                            </div>

                            <div className="pt-6 flex justify-end gap-3">
                                <button onClick={() => setAssignmentViewMode('list')} className="bg-[#F5F5F7] hover:bg-[#E5E5EA] text-gray-600 px-6 py-2.5 rounded-full text-[15px] font-medium transition-all">Отмена</button>
                                <button className="bg-[#34C759] hover:bg-[#28a745] text-white px-8 py-2.5 rounded-full text-[15px] font-medium shadow-lg shadow-green-500/30 transition-all active:scale-95">Создать</button>
                            </div>
                      </div>
                  </div>
            </div>
        );
    }
    
    if (assignmentViewMode === 'details') {
        const assignment = assignments.find(a => a.id === selectedAssignmentId);
        if (!assignment) return null;

        return (
             <div className="p-8 bg-[#F5F5F7] min-h-full">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => { setAssignmentViewMode('list'); setSelectedAssignmentId(null); }} className="p-2 bg-white hover:bg-gray-100 rounded-full shadow-sm transition-colors text-gray-600">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="text-xs font-bold text-[#007AFF] uppercase tracking-wide mb-0.5">Тема: {assignment.topic}</div>
                        <h2 className="text-2xl font-bold text-[#1D1D1F]">{assignment.title}</h2>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                    {/* Submission List */}
                    <div className="col-span-2 bg-white rounded-[24px] shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-[#F9F9F9]/50">
                            <h3 className="font-bold text-[#1D1D1F]">Работы студентов</h3>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500 font-medium">{assignment.submissionsCount} из {assignment.totalStudents}</span>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {students.map(student => {
                                // Mock submission status logic
                                const hasSubmission = (student.id + assignment.id) % 3 !== 0; 
                                const isGraded = (student.id + assignment.id) % 2 === 0 && hasSubmission;
                                const grade = isGraded ? Math.floor(Math.random() * 20 + 80) : null;

                                return (
                                    <div key={student.id} className="px-6 py-4 flex items-center justify-between hover:bg-[#F5F5F7] transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-sm">
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-[#1D1D1F] text-sm">{student.name}</div>
                                                <div className="text-xs text-gray-400 mt-0.5">
                                                    {hasSubmission ? (
                                                        <span className="text-green-600 flex items-center gap-1"><CheckCircle2 size={10} /> Сдано в срок</span>
                                                    ) : (
                                                        <span className="text-red-400">Не сдано</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {hasSubmission && (
                                                <>
                                                     {/* Grade Input Field */}
                                                     <div className="flex items-center gap-2 mr-2">
                                                        <input 
                                                            type="text" 
                                                            className={`w-14 bg-white border rounded-lg py-1.5 text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 transition-all ${isGraded ? 'border-green-200 text-green-700' : 'border-gray-200 text-gray-800'}`}
                                                            placeholder="-"
                                                            defaultValue={grade || ''}
                                                        />
                                                     </div>

                                                     {!isGraded && (
                                                         <button 
                                                            onClick={() => analyzeSubmission(student.id, student.name, assignment.title)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg text-xs font-bold shadow-sm hover:shadow hover:opacity-90 transition-all"
                                                         >
                                                             <Sparkles size={12} /> AI
                                                         </button>
                                                     )}
                                                     
                                                     <div className="relative">
                                                        <button 
                                                            onClick={() => setOpenActionMenuId(openActionMenuId === student.id ? null : student.id)}
                                                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                        >
                                                            <MoreVertical size={18} />
                                                        </button>
                                                        
                                                        {openActionMenuId === student.id && (
                                                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                                <button onClick={() => handleSubmissionActionClick(student.id, student.name, 'accept')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-700 flex items-center gap-2">
                                                                    <CheckCircle size={14} className="text-green-500" /> Принять
                                                                </button>
                                                                <button onClick={() => handleSubmissionActionClick(student.id, student.name, 'revise')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-700 flex items-center gap-2">
                                                                    <RotateCcw size={14} className="text-orange-500" /> На доработку
                                                                </button>
                                                                <button onClick={() => handleSubmissionActionClick(student.id, student.name, 'reject')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2 border-t border-gray-50">
                                                                    <XCircle size={14} /> Отклонить
                                                                </button>
                                                            </div>
                                                        )}
                                                     </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Stats Side */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-[24px] shadow-sm border border-gray-200 p-6">
                            <h3 className="font-bold text-[#1D1D1F] mb-4 text-sm uppercase tracking-wide">Статистика</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-500">Сдано</span>
                                        <span className="font-bold text-[#1D1D1F]">{Math.round((assignment.submissionsCount / assignment.totalStudents) * 100)}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(assignment.submissionsCount / assignment.totalStudents) * 100}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-500">Средняя оценка</span>
                                        <span className="font-bold text-[#1D1D1F]">86%</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 rounded-full" style={{ width: '86%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[24px] shadow-sm border border-gray-200 p-6">
                            <h3 className="font-bold text-[#1D1D1F] mb-4 text-sm uppercase tracking-wide">Информация</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between border-b border-gray-50 pb-2">
                                    <span className="text-gray-500">Дедлайн</span>
                                    <span className="font-medium text-[#1D1D1F]">{assignment.deadline}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-50 pb-2">
                                    <span className="text-gray-500">Создано</span>
                                    <span className="font-medium text-[#1D1D1F]">{assignment.createdAt}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-50 pb-2">
                                    <span className="text-gray-500">Дата оценки</span>
                                    <span className="font-medium text-[#1D1D1F]">{assignment.gradingDate}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
             </div>
        )
    }

    return null;
  };

  const renderTests = () => {
      // Styling constants
      const appleCardStyle = "bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100/50 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-300";
      const appleInputStyle = "w-full bg-[#F5F5F7] border-none rounded-xl px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#007AFF]/20 focus:bg-white transition-all outline-none";
      const appleLabelStyle = "block text-[13px] font-medium text-gray-500 mb-2 uppercase tracking-wide ml-1";
      const appleButtonStyle = "bg-[#34C759] hover:bg-[#28a745] text-white px-6 py-2.5 rounded-full text-[15px] font-medium shadow-sm hover:shadow-md transition-all active:scale-95";

      if (testViewMode === 'list') {
          return (
              <div className="p-8 bg-[#F5F5F7] min-h-full">
                  <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                      <div className="flex items-center gap-3 w-full md:w-auto">
                          <div className="relative group w-full md:w-80">
                              <Search className="absolute left-3.5 top-3 text-gray-400 group-focus-within:text-[#007AFF] transition-colors" size={18} />
                              <input type="text" placeholder="Поиск тестирования..." className="w-full bg-white border-none rounded-xl py-2.5 pl-10 pr-4 text-sm shadow-sm focus:ring-2 focus:ring-[#007AFF]/20 placeholder-gray-400 outline-none transition-all" />
                          </div>
                          <button onClick={() => setTestViewMode('library')} className="bg-white px-4 py-2.5 rounded-xl text-gray-600 hover:text-[#007AFF] shadow-sm hover:shadow-md transition-all font-medium flex items-center gap-2">
                              <FolderOpen size={18} /> Библиотека
                          </button>
                      </div>
                      <button onClick={() => setTestViewMode('create')} className={appleButtonStyle + " flex items-center gap-2"}>
                          <Plus size={18} strokeWidth={2.5} />
                          <span>Создать тест</span>
                      </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {tests.map(test => {
                          const percentCompleted = test.totalStudents ? Math.round(((test.submissionsCount || 0) / test.totalStudents) * 100) : 0;
                          return (
                          <div 
                            key={test.id} 
                            onClick={() => { setSelectedTestId(test.id); setTestViewMode('details'); }}
                            className={`${appleCardStyle} p-6 cursor-pointer flex flex-col h-[280px] group relative overflow-hidden hover:border-[#FF9500]/30`}
                          >
                              <div className="flex justify-between items-start mb-4 relative z-10">
                                  <div className="flex gap-2">
                                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide ${test.status === 'active' ? 'bg-[#E1F7E6] text-[#2EA043]' : test.status === 'completed' ? 'bg-[#F2F2F7] text-[#8E8E93]' : 'bg-[#E5F1FF] text-[#007AFF]'}`}>
                                        {test.status === 'active' ? 'Идет' : test.status === 'completed' ? 'Завершено' : 'Запланировано'}
                                    </span>
                                    {test.isPractice && <span className="text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide bg-purple-100 text-purple-600">Пробный</span>}
                                  </div>
                                  <button className="text-gray-300 hover:text-gray-600 transition-colors bg-white/50 p-1 rounded-full hover:bg-gray-50"><MoreHorizontal size={20} /></button>
                              </div>

                              <div className="mb-auto relative z-10">
                                  <div className="text-[11px] font-bold text-[#FF9500] uppercase tracking-wide mb-1.5 truncate opacity-90">Тема: {test.topic}</div>
                                  <h3 className="font-bold text-[#1D1D1F] text-[19px] mb-2 leading-tight group-hover:text-[#FF9500] transition-colors line-clamp-2">{test.title}</h3>
                                  <div className="flex items-center gap-4 text-[13px] text-gray-500 font-medium mt-3">
                                      <div className="flex items-center gap-1.5"><HelpCircle size={14} /> {test.questionsCount} вопросов</div>
                                      <div className="flex items-center gap-1.5"><Timer size={14} /> {test.duration} мин</div>
                                  </div>
                              </div>

                              <div className="mt-4 pt-4 border-t border-gray-100 relative z-10 space-y-3">
                                  <div className="flex justify-between items-center text-xs font-semibold">
                                      <span className="text-gray-500">Сдано: <span className="text-gray-900">{test.submissionsCount || 0}</span>/{test.totalStudents || 0}</span>
                                      <span className="text-[#FF9500]">{percentCompleted}%</span>
                                  </div>
                                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                      <div className="bg-[#FF9500] h-full rounded-full transition-all duration-1000" style={{ width: `${percentCompleted}%` }}></div>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-[#F5F5F7] self-start px-3 py-1.5 rounded-lg inline-flex">
                                      <Calendar size={14} className="text-[#FF9500]" />
                                      <span>{test.date} в {test.startTime}</span>
                                  </div>
                              </div>
                          </div>
                      )})}
                  </div>
              </div>
          );
      }

      if (testViewMode === 'details') {
          const test = tests.find(t => t.id === selectedTestId);
          if (!test) return null;

          return (
              <div className="p-8 bg-[#F5F5F7] min-h-full">
                  <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                          <button onClick={() => setTestViewMode('list')} className="p-2 bg-white hover:bg-gray-100 rounded-full shadow-sm transition-colors text-gray-600">
                              <ArrowLeft size={20} />
                          </button>
                          <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-xs font-bold text-[#FF9500] uppercase tracking-wide">Тема: {test.topic}</span>
                                  {test.isPractice && <span className="text-[10px] font-bold bg-purple-100 text-purple-600 px-2 py-0.5 rounded uppercase">Пробный</span>}
                              </div>
                              <h2 className="text-2xl font-bold text-[#1D1D1F]">{test.title}</h2>
                          </div>
                      </div>
                      <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                          <Download size={16} /> Скачать отчет
                      </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                      <div className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-100 flex items-center justify-between">
                          <div>
                              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Средний балл</p>
                              <p className="text-2xl font-bold text-[#1D1D1F]">84%</p>
                          </div>
                          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                              <BarChart3 size={20} />
                          </div>
                      </div>
                      <div className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-100 flex items-center justify-between">
                          <div>
                              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Успеваемость</p>
                              <p className="text-2xl font-bold text-[#1D1D1F]">92%</p>
                          </div>
                          <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                              <CheckCircle2 size={20} />
                          </div>
                      </div>
                      <div className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-100 flex items-center justify-between">
                          <div>
                              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Сдано работ</p>
                              <p className="text-2xl font-bold text-[#1D1D1F]">{test.submissionsCount} <span className="text-sm text-gray-400 font-normal">/ {test.totalStudents}</span></p>
                          </div>
                          <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center">
                              <Users size={20} />
                          </div>
                      </div>
                      <div className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-100 flex items-center justify-between">
                          <div>
                              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Сложность</p>
                              <p className="text-2xl font-bold text-[#1D1D1F]">Средняя</p>
                          </div>
                          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
                              <Target size={20} />
                          </div>
                      </div>
                  </div>

                  <div className="bg-white rounded-[24px] shadow-sm border border-gray-200 overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-[#F9F9F9]/50">
                          <h3 className="font-bold text-[#1D1D1F]">Результаты студентов</h3>
                      </div>
                      <table className="w-full text-left text-sm">
                          <thead className="bg-[#F5F5F7] text-gray-500 font-semibold uppercase tracking-wider text-xs">
                              <tr>
                                  <th className="px-6 py-3">Студент</th>
                                  <th className="px-6 py-3">Статус</th>
                                  <th className="px-6 py-3">Балл</th>
                                  <th className="px-6 py-3">Время</th>
                                  <th className="px-6 py-3 text-right">Действия</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {students.map((student, idx) => {
                                  // Mock result logic
                                  const isSubmitted = idx < (test.submissionsCount || 0);
                                  const score = isSubmitted ? Math.floor(Math.random() * 30 + 70) : 0;
                                  const timeSpent = isSubmitted ? `${Math.floor(Math.random() * 20 + 20)} мин` : '-';

                                  return (
                                      <tr key={student.id} className="hover:bg-[#F5F5F7] transition-colors group cursor-pointer" onClick={() => isSubmitted && setViewStudentAnswersId(student.id)}>
                                          <td className="px-6 py-4 font-medium text-[#1D1D1F]">
                                              <div className="flex items-center gap-3">
                                                  <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-xs">{student.name.charAt(0)}</div>
                                                  {student.name}
                                              </div>
                                          </td>
                                          <td className="px-6 py-4">
                                              {isSubmitted ? (
                                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                                      <CheckCircle2 size={12} /> Завершено
                                                  </span>
                                              ) : (
                                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
                                                      Не приступал
                                                  </span>
                                              )}
                                          </td>
                                          <td className="px-6 py-4 font-bold">
                                              {isSubmitted ? (
                                                  <span className={`${score > 85 ? 'text-green-600' : score > 60 ? 'text-orange-600' : 'text-red-600'}`}>{score}%</span>
                                              ) : '-'}
                                          </td>
                                          <td className="px-6 py-4 text-gray-500">{timeSpent}</td>
                                          <td className="px-6 py-4 text-right">
                                              {isSubmitted && (
                                                  <button className="text-[#007AFF] hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                                      Смотреть ответы
                                                  </button>
                                              )}
                                          </td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  </div>

                  {/* Student Answers Modal Mock */}
                  {viewStudentAnswersId && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewStudentAnswersId(null)}></div>
                          <div className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-2xl p-6 animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
                              <div className="flex justify-between items-center mb-6">
                                  <div>
                                      <h3 className="text-xl font-bold text-[#1D1D1F]">{students.find(s => s.id === viewStudentAnswersId)?.name}</h3>
                                      <p className="text-sm text-gray-500">Ответы на тест: {test.title}</p>
                                  </div>
                                  <button onClick={() => setViewStudentAnswersId(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X size={20} /></button>
                              </div>
                              <div className="overflow-y-auto pr-2 space-y-4 flex-1">
                                  {[1, 2, 3, 4, 5].map((q, i) => (
                                      <div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                                          <div className="flex justify-between mb-2">
                                              <span className="font-bold text-sm text-gray-700">Вопрос {i + 1}</span>
                                              <span className={`text-xs font-bold px-2 py-0.5 rounded ${i === 2 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                  {i === 2 ? '0/1' : '1/1'}
                                              </span>
                                          </div>
                                          <p className="text-sm text-gray-800 mb-3 font-medium">Какое событие произошло в 1991 году?</p>
                                          <div className="space-y-2">
                                              <div className={`p-3 rounded-lg text-sm border ${i !== 2 ? 'bg-green-50 border-green-200 text-green-800' : 'bg-white border-gray-200 text-gray-500'}`}>
                                                  A. Провозглашение независимости {i !== 2 && <Check size={16} className="inline ml-2"/>}
                                              </div>
                                              <div className={`p-3 rounded-lg text-sm border ${i === 2 ? 'bg-red-50 border-red-200 text-red-800' : 'bg-white border-gray-200 text-gray-500'}`}>
                                                  B. Введение тенге {i === 2 && <X size={16} className="inline ml-2"/>}
                                              </div>
                                              <div className="p-3 rounded-lg text-sm border bg-white border-gray-200 text-gray-500">
                                                  C. Принятие конституции
                                              </div>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          );
      }

      if (testViewMode === 'create') {
          return (
              <div className="p-8 bg-[#F5F5F7] min-h-full flex justify-center">
                  <div className="w-full max-w-4xl animate-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center gap-4 mb-8">
                          <button onClick={() => setTestViewMode('list')} className="p-2 bg-white hover:bg-gray-100 rounded-full shadow-sm transition-colors text-gray-600">
                              <ArrowLeft size={20} />
                          </button>
                          <h2 className="text-2xl font-bold text-[#1D1D1F]">Назначение тестирования</h2>
                      </div>

                      <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-8">
                          
                          {/* Step 1: Source */}
                          <div className="space-y-4">
                              <label className={appleLabelStyle}>Источник вопросов</label>
                              <div className="grid grid-cols-3 gap-4">
                                  {['manual', 'upload', 'library'].map(type => (
                                      <div 
                                          key={type}
                                          onClick={() => {
                                              setNewTest({...newTest, source: type as any});
                                              if (type === 'manual') setSelectedLibraryId(null);
                                          }}
                                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 text-center h-32 ${newTest.source === type ? 'border-[#FF9500] bg-[#FF9500]/5' : 'border-gray-100 hover:border-gray-300'}`}
                                      >
                                          <div className={`p-2 rounded-full ${newTest.source === type ? 'bg-[#FF9500] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                              {type === 'manual' ? <Plus size={20} /> : type === 'upload' ? <Upload size={20} /> : <Library size={20} />}
                                          </div>
                                          <span className={`text-xs font-bold uppercase ${newTest.source === type ? 'text-[#FF9500]' : 'text-gray-500'}`}>
                                              {type === 'manual' ? 'Создать' : type === 'upload' ? 'Загрузить файл' : 'Из библиотеки'}
                                          </span>
                                      </div>
                                  ))}
                              </div>

                              {/* CONDITIONAL CONTENT BASED ON SOURCE */}
                              
                              {/* 1. UPLOAD */}
                              {newTest.source === 'upload' && (
                                  <div className="mt-2 p-6 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 bg-gray-50 animate-in fade-in">
                                      <Upload size={24} className="mb-2" />
                                      <span className="text-sm">Перетащите файл с вопросами (XLSX, DOCX)</span>
                                  </div>
                              )}

                              {/* 2. LIBRARY SELECTION */}
                              {newTest.source === 'library' && (
                                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                                      {libraryTests.map(test => (
                                          <div 
                                              key={test.id} 
                                              onClick={() => handleSelectLibraryTest(test)}
                                              className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${selectedLibraryId === test.id ? 'border-[#FF9500] bg-[#FF9500]/5' : 'border-gray-100 bg-white'}`}
                                          >
                                              <div className="flex justify-between items-start mb-2">
                                                  <h4 className="font-bold text-[#1D1D1F] text-sm">{test.title}</h4>
                                                  {selectedLibraryId === test.id && <CheckCircle2 size={18} className="text-[#FF9500]" />}
                                              </div>
                                              <p className="text-xs text-gray-500 mb-3">{test.description}</p>
                                              <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                                                  <span className="flex items-center gap-1"><HelpCircle size={12}/> {test.questionsCount}</span>
                                                  <span className={`px-1.5 py-0.5 rounded ${test.difficulty === 'Easy' ? 'bg-green-100 text-green-600' : test.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                                                      {test.difficulty}
                                                  </span>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              )}

                              {/* 3. MANUAL CREATION */}
                              {newTest.source === 'manual' && (
                                  <div className="mt-4 bg-gray-50 rounded-xl p-6 border border-gray-200 animate-in fade-in">
                                      <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                          <List size={16} /> Конструктор вопросов ({addedQuestions.length})
                                      </h3>
                                      
                                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-4">
                                          <div className="mb-4">
                                              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Текст вопроса</label>
                                              <textarea 
                                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9500]/20 min-h-[80px]" 
                                                  placeholder="Введите вопрос..."
                                                  value={currentQuestion.text}
                                                  onChange={(e) => setCurrentQuestion({...currentQuestion, text: e.target.value})}
                                              ></textarea>
                                          </div>
                                          
                                          <div className="space-y-2">
                                              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Варианты ответов</label>
                                              {currentQuestion.options.map((opt, idx) => (
                                                  <div key={idx} className="flex items-center gap-2">
                                                      <input 
                                                          type="radio" 
                                                          name="correctOption" 
                                                          className="accent-[#FF9500]" 
                                                          checked={currentQuestion.correctIndex === idx}
                                                          onChange={() => setCurrentQuestion({...currentQuestion, correctIndex: idx})}
                                                      />
                                                      <input 
                                                          type="text" 
                                                          className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none transition-all ${currentQuestion.correctIndex === idx ? 'border-[#FF9500] bg-[#FF9500]/5' : 'border-gray-200 bg-gray-50'}`}
                                                          placeholder={`Вариант ${String.fromCharCode(65 + idx)}`}
                                                          value={opt}
                                                          onChange={(e) => {
                                                              const newOptions = [...currentQuestion.options];
                                                              newOptions[idx] = e.target.value;
                                                              setCurrentQuestion({...currentQuestion, options: newOptions});
                                                          }}
                                                      />
                                                  </div>
                                              ))}
                                          </div>
                                          
                                          <div className="mt-4 flex justify-end">
                                              <button 
                                                  onClick={handleAddQuestion}
                                                  disabled={!currentQuestion.text || currentQuestion.options.some(o => !o)}
                                                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                              >
                                                  <PlusCircle size={16} /> Добавить вопрос
                                              </button>
                                          </div>
                                      </div>

                                      {/* Added Questions List */}
                                      {addedQuestions.length > 0 && (
                                          <div className="space-y-2">
                                              {addedQuestions.map((q, i) => (
                                                  <div key={q.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200 text-sm">
                                                      <div className="flex items-center gap-3">
                                                          <span className="font-bold text-gray-400">{i + 1}.</span>
                                                          <span className="text-gray-800 font-medium truncate max-w-md">{q.text}</span>
                                                      </div>
                                                      <button onClick={() => handleDeleteQuestion(q.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                                  </div>
                                              ))}
                                          </div>
                                      )}
                                  </div>
                              )}
                          </div>

                          <div className="h-px bg-gray-100 w-full"></div>

                          {/* Step 2: Settings */}
                          <div className="space-y-6">
                              <div className="space-y-1">
                                  <label className={appleLabelStyle}>Название теста</label>
                                  <input type="text" className={appleInputStyle} placeholder="Например: Рубежный контроль №2" value={newTest.title} onChange={e => setNewTest({...newTest, title: e.target.value})} />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-1">
                                      <label className={appleLabelStyle}>Тема</label>
                                      <select className={appleInputStyle + " appearance-none"} value={newTest.topic} onChange={e => setNewTest({...newTest, topic: e.target.value})}>
                                          <option value="">Выберите тему...</option>
                                          {lessonTopics.map((t, i) => <option key={i} value={t}>{t}</option>)}
                                      </select>
                                  </div>
                                  <div className="space-y-1">
                                      <label className={appleLabelStyle}>Длительность (мин)</label>
                                      <div className="flex items-center gap-4">
                                          <input type="range" min="10" max="180" step="5" className="flex-1 accent-[#FF9500]" value={newTest.duration} onChange={e => setNewTest({...newTest, duration: parseInt(e.target.value)})} />
                                          <span className="w-16 text-center font-bold text-gray-700 bg-white border rounded-lg py-1">{newTest.duration}</span>
                                      </div>
                                  </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-1">
                                      <label className={appleLabelStyle}>Дата проведения</label>
                                      <input type="date" className={appleInputStyle} value={newTest.date} onChange={e => setNewTest({...newTest, date: e.target.value})} />
                                  </div>
                                  <div className="space-y-1">
                                      <label className={appleLabelStyle}>Время начала</label>
                                      <input type="time" className={appleInputStyle} value={newTest.time} onChange={e => setNewTest({...newTest, time: e.target.value})} />
                                  </div>
                              </div>
                          </div>

                          <div className="h-px bg-gray-100 w-full"></div>

                          {/* Step 3: Assignment Logic (Reused from Assignments) */}
                          <div className="space-y-3">
                              <label className={appleLabelStyle}>Кому назначить</label>
                              <div className="bg-[#F5F5F7] p-1 rounded-xl flex text-sm font-medium">
                                  <button 
                                      onClick={() => setAssignToAll(true)}
                                      className={`flex-1 py-2 rounded-lg transition-all shadow-sm duration-200 ${assignToAll ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700'}`}
                                  >
                                      Всей группе
                                  </button>
                                  <button 
                                      onClick={() => setAssignToAll(false)}
                                      className={`flex-1 py-2 rounded-lg transition-all shadow-sm duration-200 ${!assignToAll ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700'}`}
                                  >
                                      Выбрать вручную
                                  </button>
                              </div>
                              {!assignToAll && (
                                  <div className="bg-[#F5F5F7] rounded-xl overflow-hidden border border-gray-200/50">
                                      <div className="px-4 py-3 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wide flex justify-between items-center">
                                          <span>Список группы ({selectedAssigneeIds.length})</span>
                                          <button onClick={() => setSelectedAssigneeIds(selectedAssigneeIds.length === students.length ? [] : students.map(s => s.id))} className="text-[#FF9500] font-bold text-[11px]">
                                              {selectedAssigneeIds.length === students.length ? 'Снять выделение' : 'Выбрать все'}
                                          </button>
                                      </div>
                                      <div className="max-h-60 overflow-y-auto">
                                          {students.map((student, idx) => (
                                              <div 
                                                  key={student.id} 
                                                  onClick={() => toggleAssignee(student.id)}
                                                  className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${idx !== students.length - 1 ? 'border-b border-gray-200/60' : ''} hover:bg-white`}
                                              >
                                                  <div className="flex items-center gap-3">
                                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm transition-colors ${selectedAssigneeIds.includes(student.id) ? 'bg-[#FF9500] text-white' : 'bg-gray-200 text-gray-500'}`}>
                                                          {student.name.charAt(0)}
                                                      </div>
                                                      <span className={`text-[14px] ${selectedAssigneeIds.includes(student.id) ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{student.name}</span>
                                                  </div>
                                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${selectedAssigneeIds.includes(student.id) ? 'bg-[#FF9500] text-white' : 'border-2 border-gray-300'}`}>
                                                      {selectedAssigneeIds.includes(student.id) && <Check size={12} strokeWidth={3} />}
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              )}
                          </div>

                          <div className="flex flex-col gap-4">
                              <div className="flex items-center justify-between py-2 bg-gray-50 px-4 rounded-xl border border-gray-100">
                                  <div className="flex items-center gap-3">
                                      <Shuffle size={20} className="text-gray-400" />
                                      <span className="text-sm font-medium text-gray-700">Перемешать вопросы</span>
                                  </div>
                                  <div className="relative inline-flex items-center cursor-pointer" onClick={() => setNewTest({...newTest, randomize: !newTest.randomize})}>
                                      <div className={`w-11 h-6 rounded-full transition-colors ${newTest.randomize ? 'bg-[#34C759]' : 'bg-gray-200'}`}></div>
                                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${newTest.randomize ? 'translate-x-5' : ''}`}></div>
                                  </div>
                              </div>

                              <div className="flex items-center justify-between py-2 bg-gray-50 px-4 rounded-xl border border-gray-100">
                                  <div className="flex items-center gap-3">
                                      <CheckCircle2 size={20} className="text-gray-400" />
                                      <span className="text-sm font-medium text-gray-700">Пробное тестирование</span>
                                  </div>
                                  <div className="relative inline-flex items-center cursor-pointer" onClick={() => setNewTest({...newTest, isPractice: !newTest.isPractice})}>
                                      <div className={`w-11 h-6 rounded-full transition-colors ${newTest.isPractice ? 'bg-[#34C759]' : 'bg-gray-200'}`}></div>
                                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${newTest.isPractice ? 'translate-x-5' : ''}`}></div>
                                  </div>
                              </div>
                          </div>

                          <div className="pt-4 flex justify-end gap-3">
                              <button onClick={() => setTestViewMode('list')} className="bg-[#F5F5F7] hover:bg-[#E5E5EA] text-gray-600 px-6 py-2.5 rounded-full text-[15px] font-medium transition-all">Отмена</button>
                              <button 
                                  onClick={handleCreateTest} 
                                  disabled={!newTest.title || (newTest.source === 'manual' && addedQuestions.length === 0) || (newTest.source === 'library' && !selectedLibraryId)}
                                  className="bg-[#FF9500] hover:bg-[#E08300] text-white px-8 py-2.5 rounded-full text-[15px] font-medium shadow-lg shadow-orange-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                  Назначить тест
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          );
      }
      return null;
  };

    return (
    <div className="flex flex-col h-full bg-[#F5F5F7] relative">
      {/* Top Info Header (Apple Card Style) */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 z-30 sticky top-0">
          <div className="p-4">
            <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                    <button className="mt-1 text-[#FF3B30] hover:bg-[#FF3B30]/10 p-1.5 rounded-full transition-colors">
                        <ChevronLeft size={22} strokeWidth={2.5} />
                    </button>
                    <div className="space-y-0.5">
                        <div className="text-[13px] text-gray-500 font-medium">Дисциплина</div>
                        <div className="text-[17px] font-semibold text-[#1D1D1F] tracking-tight">
                            ООД 06 История Казахстана
                        </div>
                        <div className="flex items-center gap-2 text-[13px] text-gray-500">
                            <span>2 ВаВэСФ</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-[#FF9500] font-medium bg-[#FF9500]/10 px-2 py-0.5 rounded-md">Русский</span>
                        </div>
                    </div>
                </div>
                <div className="text-right text-[12px] font-medium text-gray-500 space-y-1 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    <div>2025-2026 Учебный год</div>
                    <div className="text-[#1D1D1F]">Семестр 1</div>
                </div>
            </div>
          </div>

          {/* Tabs - Apple Segmented Control Style */}
          <div className="px-4 pb-0 flex overflow-x-auto no-scrollbar">
            <div className="flex w-full justify-between gap-6 min-w-max">
                {tabs.map(tab => {
                    const isActive = activeTab === tab;
                    return (
                        <button 
                            key={tab}
                            onClick={() => handleTabClick(tab)}
                            className={`pb-3 text-[14px] font-medium transition-all relative flex-1 text-center rounded-lg px-2 -mx-2 ${
                                isActive ? 'text-[#FF3B30]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                            }`}
                        >
                            {tab}
                            {isActive && (
                                <div className="absolute bottom-0 left-2 right-2 h-[2px] rounded-t-full bg-[#FF3B30]"></div>
                            )}
                        </button>
                    );
                })}
            </div>
          </div>
      </div>

      {/* Toolbar & View Switches */}
      {activeTab === 'Журнал' && (
        <div className="px-6 py-4 flex items-center justify-between gap-4 overflow-x-auto">
            {/* View Mode Switchers - Apple Segmented Control */}
            <div className="flex items-center bg-[#E5E5EA] p-1 rounded-lg">
                <button 
                    onClick={() => setViewMode('general')}
                    className={`px-4 py-1.5 rounded-[6px] text-[13px] font-medium transition-all ${viewMode === 'general' ? 'bg-white text-black shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
                >
                    Общий
                </button>
                <button 
                    onClick={() => setViewMode('individual')}
                    className={`px-4 py-1.5 rounded-[6px] text-[13px] font-medium transition-all ${viewMode === 'individual' ? 'bg-white text-black shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
                >
                    Индивидуальный
                </button>
                <button 
                    onClick={() => setViewMode('monitoring')}
                    className={`px-4 py-1.5 rounded-[6px] text-[13px] font-medium transition-all ${viewMode === 'monitoring' ? 'bg-white text-black shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
                >
                    Мониторинг
                </button>
            </div>

            <div className="flex items-center gap-3">
                {viewMode === 'monitoring' && (
                    <>
                        <button 
                            onClick={() => alert("Экспорт мониторинга...")}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-[#007AFF] hover:bg-gray-50 rounded-lg text-[13px] font-medium transition-all shadow-sm"
                        >
                            <FileSpreadsheet size={16} />
                            <span>Экспорт</span>
                        </button>
                        <button 
                            onClick={openRetakeModal}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF9500]/10 text-[#FF9500] hover:bg-[#FF9500]/20 border border-[#FF9500]/20 rounded-lg text-[13px] font-medium transition-all"
                        >
                            <RefreshCw size={16} />
                            <span>Пересдача</span>
                        </button>
                        <div className="w-px h-6 bg-gray-300 mx-1"></div>
                    </>
                )}

                {/* Tools Menu */}
                <div className="flex bg-white rounded-lg border border-gray-200 shadow-sm p-1 gap-1">
                    {tools.map((tool, idx) => (
                        <button 
                            key={idx} 
                            onClick={tool.action}
                            className="p-1.5 text-gray-500 hover:text-[#1D1D1F] hover:bg-[#F5F5F7] rounded-md transition-colors"
                            title={tool.label}
                        >
                            {tool.icon}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative px-6 pb-6">
        {activeTab === 'Задания' ? (
            <div className="h-full overflow-y-auto rounded-[20px]">
                {renderAssignments()}
            </div>
        ) : activeTab === 'Тестирование' ? (
             <div className="h-full overflow-y-auto rounded-[20px]">
                {renderTests()}
            </div>
        ) : activeTab === 'Журнал' ? (
            <div className="h-full flex flex-col">
                <div className={`flex-1 bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-200 overflow-hidden flex flex-col ${viewMode === 'individual' ? 'bg-transparent border-none shadow-none' : ''}`}>
                    {viewMode === 'general' ? (
                        /* GENERAL TABLE */
                        <div className="overflow-auto flex-1">
                            <table className="w-full text-sm border-collapse">
                                <thead className="bg-[#F5F5F7]/90 backdrop-blur sticky top-0 z-20 shadow-sm">
                                    <tr>
                                        <th className="border-r border-b border-gray-200 p-3 w-12 text-center text-[11px] uppercase tracking-wide text-gray-500 font-bold sticky left-0 bg-[#F5F5F7] z-30">№</th>
                                        <th className="border-r border-b border-gray-200 p-3 text-left min-w-[250px] text-[11px] uppercase tracking-wide text-gray-500 font-bold sticky left-12 bg-[#F5F5F7] z-30">Обучающийся</th>
                                        
                                        {/* First Period Dates */}
                                        {dates.map((d, i) => (
                                            <th key={i} className="border-r border-b border-gray-200 p-2 min-w-[50px] text-center font-medium">
                                                <div className="text-[13px] text-[#1D1D1F]">{d.date}</div>
                                            </th>
                                        ))}

                                        {/* RK1 */}
                                        <th className="border-r border-b border-gray-200 p-2 w-16 bg-[#E5E5EA]/50 text-[#1D1D1F] font-bold text-[12px]">RK1</th>

                                        {/* Second Period Dates */}
                                        {rk2Dates.map((d, i) => (
                                            <th key={`rk2-${i}`} className="border-r border-b border-gray-200 p-2 min-w-[50px] text-center font-medium">
                                                <div className="text-[13px] text-[#1D1D1F]">{d.date}</div>
                                            </th>
                                        ))}

                                        {/* RK2 */}
                                        <th className="border-r border-b border-gray-200 p-2 w-16 bg-[#E5E5EA]/50 text-[#1D1D1F] font-bold text-[12px]">RK2</th>

                                        {/* Total */}
                                        <th className="border-b border-gray-200 p-2 w-20 bg-[#FF3B30]/5 text-[#FF3B30] font-bold text-[12px]">ИТОГ</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[#1D1D1F]">
                                    {students.map((student, idx) => (
                                        <tr key={student.id} className="hover:bg-[#F5F5F7]/50 transition-colors group">
                                            <td className="border-r border-b border-gray-100 p-2 text-center sticky left-0 bg-white group-hover:bg-[#F5F5F7] z-10 text-gray-400 font-medium text-[12px]">{idx + 1}</td>
                                            <td className="border-r border-b border-gray-100 p-2 sticky left-12 bg-white group-hover:bg-[#F5F5F7] z-10">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="truncate max-w-[180px] font-medium text-[13px]" title={student.name}>{student.name}</span>
                                                    {student.badge && (
                                                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white shadow-sm ${student.badge > 25 ? 'bg-[#34C759]' : 'bg-[#34C759]'}`}>
                                                            {student.badge}
                                                        </span>
                                                    )}
                                                    {student.badge === null && (
                                                        <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-white text-[10px]">
                                                            <Minus size={12} />
                                                        </div>
                                                    )}
                                                    {student.status === 'expelled' && (
                                                        <span className="bg-[#FF3B30]/10 text-[#FF3B30] text-[9px] font-bold px-1.5 py-0.5 rounded">ОТЧ</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Dynamic Cells rendering */}
                                            {renderStudentCells(student)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : viewMode === 'monitoring' ? (
                        /* MONITORING TABLE */
                        <div className="overflow-auto flex-1 p-6 space-y-6">
                            <div className="bg-white rounded-[20px] shadow-sm border border-gray-200 overflow-hidden">
                                <table className="w-full text-sm border-collapse">
                                    <thead className="bg-[#F5F5F7] text-gray-500 font-bold text-[11px] uppercase tracking-wide">
                                        <tr>
                                            <th className="border-r border-b border-gray-200 p-4 w-12 text-center">№</th>
                                            <th className="border-r border-b border-gray-200 p-4 text-left">Обучающийся</th>
                                            
                                            <th className="border-r border-b border-gray-200 p-3 w-28 text-center">РК1</th>
                                            <th className="border-r border-b border-gray-200 p-3 w-28 text-center bg-[#FFF4CE]/50 text-[#F5A623]">РК1 (Пересдача)</th>
                                            
                                            <th className="border-r border-b border-gray-200 p-3 w-28 text-center">РК2</th>
                                            <th className="border-r border-b border-gray-200 p-3 w-28 text-center bg-[#FFF4CE]/50 text-[#F5A623]">РК2 (Пересдача)</th>

                                            <th className="border-r border-b border-gray-200 p-3 w-28 text-center">Экзамен</th>
                                            <th className="border-r border-b border-gray-200 p-3 w-28 text-center bg-[#FFF4CE]/50 text-[#F5A623]">Экзамен (Пересдача)</th>
                                            
                                            <th className="border-r border-b border-gray-200 p-3 w-28 text-center">Итоговая</th>
                                            <th className="border-b border-gray-200 p-3 w-28 text-center bg-[#E1F7E6]/50 text-[#34C759]">Итоговая (Факт)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-[#1D1D1F]">
                                        {students.map((student, idx) => {
                                            const rk1Unlocked = isRetakeUnlocked(student.id, 'rk1');
                                            const rk2Unlocked = isRetakeUnlocked(student.id, 'rk2');
                                            const examUnlocked = isRetakeUnlocked(student.id, 'exam');

                                            return (
                                            <tr key={student.id} className="hover:bg-[#F5F5F7]/50 transition-colors border-b border-gray-100">
                                                <td className="border-r border-gray-100 p-3 text-center text-gray-400 font-medium">{idx + 1}</td>
                                                <td className="border-r border-gray-100 p-3 font-medium text-[13px]">{student.name}</td>
                                                
                                                {/* RK1 Group */}
                                                <td className="border-r border-gray-100 p-2 text-center">
                                                    <div className="py-1 px-3 bg-[#F2F2F7] rounded-lg inline-block min-w-[3rem] font-semibold text-[13px] text-[#8E8E93]">{student.rk1}</div>
                                                </td>
                                                <td className={`border-r border-gray-100 p-2 text-center ${rk1Unlocked ? 'bg-white' : 'bg-[#F9F9F9]'}`}>
                                                    <input 
                                                        type="text" 
                                                        className={`w-20 text-center border rounded-lg py-1.5 text-sm outline-none transition-all ${rk1Unlocked ? 'border-[#FF9500] focus:ring-2 focus:ring-[#FF9500]/20 bg-white' : 'border-gray-200 bg-transparent text-gray-400 cursor-not-allowed'}`}
                                                        placeholder="-"
                                                        value={student.rk1_retake}
                                                        onChange={(e) => handleMonitoringChange(student.id, 'rk1_retake', e.target.value)}
                                                        disabled={!rk1Unlocked}
                                                    />
                                                </td>

                                                {/* RK2 Group */}
                                                <td className="border-r border-gray-100 p-2 text-center">
                                                    <div className="py-1 px-3 bg-[#F2F2F7] rounded-lg inline-block min-w-[3rem] font-semibold text-[13px] text-[#8E8E93]">{student.rk2}</div>
                                                </td>
                                                <td className={`border-r border-gray-100 p-2 text-center ${rk2Unlocked ? 'bg-white' : 'bg-[#F9F9F9]'}`}>
                                                    <input 
                                                        type="text" 
                                                        className={`w-20 text-center border rounded-lg py-1.5 text-sm outline-none transition-all ${rk2Unlocked ? 'border-[#FF9500] focus:ring-2 focus:ring-[#FF9500]/20 bg-white' : 'border-gray-200 bg-transparent text-gray-400 cursor-not-allowed'}`}
                                                        placeholder="-"
                                                        value={student.rk2_retake}
                                                        onChange={(e) => handleMonitoringChange(student.id, 'rk2_retake', e.target.value)}
                                                        disabled={!rk2Unlocked}
                                                    />
                                                </td>

                                                {/* Exam Group */}
                                                <td className="border-r border-gray-100 p-2 text-center">
                                                    <input 
                                                        type="text" 
                                                        className="w-20 text-center border border-gray-200 bg-[#F2F2F7] rounded-lg py-1.5 text-sm text-gray-500 outline-none cursor-not-allowed font-medium"
                                                        value={student.exam}
                                                        disabled
                                                    />
                                                </td>
                                                <td className={`border-r border-gray-100 p-2 text-center ${examUnlocked ? 'bg-white' : 'bg-[#F9F9F9]'}`}>
                                                    <input 
                                                        type="text" 
                                                        className={`w-20 text-center border rounded-lg py-1.5 text-sm outline-none transition-all ${examUnlocked ? 'border-[#FF9500] focus:ring-2 focus:ring-[#FF9500]/20 bg-white' : 'border-gray-200 bg-transparent text-gray-400 cursor-not-allowed'}`}
                                                        placeholder="-"
                                                        value={student.exam_retake}
                                                        onChange={(e) => handleMonitoringChange(student.id, 'exam_retake', e.target.value)}
                                                        disabled={!examUnlocked}
                                                    />
                                                </td>

                                                {/* Totals */}
                                                <td className="border-r border-gray-100 p-2 text-center text-gray-500 font-medium">
                                                    {student.total}
                                                </td>
                                                <td className={`p-2 text-center font-bold ${student.status === 'expelled' ? 'text-gray-400' : 'text-[#34C759] bg-[#E1F7E6]/30'}`}>
                                                    {student.status === 'expelled' ? '-' : student.total_final}
                                                </td>
                                            </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Grade Stats */}
                            <div className="bg-white rounded-[20px] shadow-sm border border-gray-200 p-6">
                                <h3 className="text-[13px] font-bold text-gray-900 mb-4 uppercase tracking-wide">Статистика по оценкам</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {Object.entries(gradeStats.stats).map(([grade, count]) => (
                                        <div key={grade} className="flex justify-between items-center bg-[#F5F5F7] p-3 rounded-xl">
                                            <span className="text-sm font-bold text-[#1D1D1F]">{grade}</span>
                                            <span className={`text-[12px] font-bold px-2 py-0.5 rounded-md ${count > 0 ? 'bg-[#007AFF] text-white' : 'bg-gray-200 text-gray-400'}`}>
                                                {count}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* INDIVIDUAL JOURNALS VIEW */
                        <div className="space-y-6 overflow-y-auto p-4">
                            {students.map((student, idx) => (
                                <div key={student.id} className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-200 overflow-hidden">
                                    <div className="bg-[#F5F5F7]/80 backdrop-blur-sm px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-xs font-bold text-gray-500 border border-gray-200 shadow-sm">
                                                {student.name.charAt(0)}
                                            </div>
                                            <div className="font-bold text-[#1D1D1F] text-[15px]">{student.name}</div>
                                        </div>
                                        <div className="text-[11px] font-mono text-gray-400 bg-white px-2 py-1 rounded border border-gray-100">ID: {student.id}</div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm border-collapse">
                                            <thead className="bg-white text-gray-500 font-medium text-xs">
                                                <tr>
                                                    {/* First Period Dates */}
                                                    {dates.map((d, i) => (
                                                        <th key={i} className="border-r border-b border-gray-100 p-3 min-w-[60px] text-center font-normal">
                                                            <div className="text-[12px] text-gray-800">{d.date}</div>
                                                        </th>
                                                    ))}

                                                    {/* RK1 */}
                                                    <th className="border-r border-b border-gray-100 p-3 w-16 bg-[#F9F9F9] font-semibold">RK1</th>

                                                    {/* Second Period Dates */}
                                                    {rk2Dates.map((d, i) => (
                                                        <th key={`rk2-${i}`} className="border-r border-b border-gray-100 p-3 min-w-[60px] text-center font-normal">
                                                            <div className="text-[12px] text-gray-800">{d.date}</div>
                                                        </th>
                                                    ))}

                                                    {/* RK2 */}
                                                    <th className="border-r border-b border-gray-100 p-3 w-16 bg-[#F9F9F9] font-semibold">RK2</th>

                                                    {/* Total */}
                                                    <th className="border-b border-gray-100 p-3 w-20 bg-[#FF3B30]/5 text-[#FF3B30] font-bold">Итог</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-[#1D1D1F]">
                                                <tr>
                                                    {/* Dynamic cells logic */}
                                                    {dates.map((d, i) => (
                                                        <td key={i} className="border-r border-gray-100 p-2 text-center align-top">
                                                            <div className="flex flex-col gap-2">
                                                                {[0, 1].map(gradeIndex => {
                                                                     const gradeValue = student.grades[d.date]?.[gradeIndex] || '';
                                                                     const status = getGradeStatus(student.id, d.date, gradeIndex, gradeValue);
                                                                     return (
                                                                        <div key={gradeIndex} className="relative w-full">
                                                                            <input 
                                                                                type="text" 
                                                                                value={gradeValue}
                                                                                onChange={(e) => handleGradeChange(student.id, d.date, gradeIndex, e.target.value)}
                                                                                className="w-full h-7 bg-[#F5F5F7] hover:bg-[#E5E5EA] focus:bg-white border-none rounded-md text-center focus:ring-2 focus:ring-[#007AFF]/20 text-xs font-medium transition-all outline-none"
                                                                            />
                                                                            {status && (
                                                                                <div 
                                                                                    className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${status.color}`} 
                                                                                    title={status.title}
                                                                                />
                                                                            )}
                                                                        </div>
                                                                     )
                                                                })}
                                                            </div>
                                                        </td>
                                                    ))}

                                                    {/* RK1 */}
                                                    <td className="border-r border-gray-100 p-2 text-center bg-[#F9F9F9] align-middle">
                                                        <div className="text-xs font-semibold">{student.rk1_retake ? <span className="text-orange-400 line-through text-[10px] block mb-1">{student.rk1}</span> : null}</div>
                                                        <div className={`py-1 px-2 rounded-md text-xs font-bold inline-block min-w-[32px] ${student.rk1_retake ? 'bg-[#FFF4CE] text-[#F5A623]' : 'bg-white border border-gray-200 text-gray-600'}`}>{student.rk1_retake || student.rk1}</div>
                                                    </td>

                                                    {/* Second Period Grades - Double Inputs */}
                                                    {rk2Dates.map((d, i) => (
                                                        <td key={`rk2-${i}`} className="border-r border-gray-100 p-2 text-center align-top">
                                                            <div className="flex flex-col gap-2">
                                                                {[0, 1].map(gradeIndex => {
                                                                     const gradeValue = student.grades[d.date]?.[gradeIndex] || '';
                                                                     const status = getGradeStatus(student.id, d.date, gradeIndex, gradeValue);
                                                                     return (
                                                                        <div key={gradeIndex} className="relative w-full">
                                                                            <input 
                                                                                type="text" 
                                                                                value={gradeValue}
                                                                                onChange={(e) => handleGradeChange(student.id, d.date, gradeIndex, e.target.value)}
                                                                                className="w-full h-7 bg-[#F5F5F7] hover:bg-[#E5E5EA] focus:bg-white border-none rounded-md text-center focus:ring-2 focus:ring-[#007AFF]/20 text-xs font-medium transition-all outline-none"
                                                                            />
                                                                            {status && (
                                                                                <div 
                                                                                    className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${status.color}`} 
                                                                                    title={status.title}
                                                                                />
                                                                            )}
                                                                        </div>
                                                                     )
                                                                })}
                                                            </div>
                                                        </td>
                                                    ))}

                                                    {/* RK2 */}
                                                    <td className="border-r border-gray-100 p-2 text-center bg-[#F9F9F9] align-middle">
                                                        <div className="text-xs font-semibold">{student.rk2_retake ? <span className="text-orange-400 line-through text-[10px] block mb-1">{student.rk2}</span> : null}</div>
                                                        <div className={`py-1 px-2 rounded-md text-xs font-bold inline-block min-w-[32px] ${student.rk2_retake ? 'bg-[#FFF4CE] text-[#F5A623]' : 'bg-white border border-gray-200 text-gray-600'}`}>{student.rk2_retake || student.rk2}</div>
                                                    </td>

                                                    {/* Total */}
                                                    {student.status === 'expelled' ? (
                                                        <td className="border-b border-gray-100 p-3 w-20 text-center align-middle">
                                                            <div className="text-[10px] text-gray-400 font-medium">-</div>
                                                        </td>
                                                    ) : (
                                                        <td className="p-2 text-center bg-[#FFEDED]/10 align-middle">
                                                            <div className="py-1 px-2 rounded-md border border-[#FF3B30]/20 bg-white text-xs font-bold text-[#FF3B30] inline-block min-w-[36px]">{student.total_final || student.total}</div>
                                                        </td>
                                                    )}
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                    <Clock size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Раздел в разработке</p>
                </div>
            </div>
        )}
      </div>

      {/* Retake Modal */}
      {isRetakeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeRetakeModal}></div>
              
              {retakeStep === 'form' && (
                  <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                      <div className="flex items-center gap-3 mb-4 text-orange-600 border-b pb-4 flex-shrink-0">
                          <RefreshCw size={24} />
                          <h2 className="text-xl font-bold">Назначение пересдачи</h2>
                      </div>
                      
                      <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Студенты</label>
                              <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto p-2 bg-gray-50">
                                  {students.length > 0 ? (
                                      students.map(s => (
                                          <label key={s.id} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer transition-colors text-sm">
                                              <input 
                                                  type="checkbox" 
                                                  className="rounded text-orange-600 focus:ring-orange-500"
                                                  checked={retakeStudentIds.includes(s.id)}
                                                  onChange={() => toggleRetakeStudent(s.id)}
                                              />
                                              <span className="text-gray-700">{s.name}</span>
                                          </label>
                                      ))
                                  ) : (
                                      <div className="text-sm text-gray-500 p-2 text-center">Нет студентов</div>
                                  )}
                              </div>
                              <div className="text-xs text-gray-500 mt-1 text-right">
                                  Выбрано: {retakeStudentIds.length}
                              </div>
                          </div>

                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Тип контроля</label>
                              <select 
                                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                value={retakeType}
                                onChange={(e) => setRetakeType(e.target.value)}
                              >
                                  <option value="rk1">РК 1</option>
                                  <option value="rk2">РК 2</option>
                                  <option value="exam">Экзамен</option>
                              </select>
                          </div>

                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Основание (необязательно)</label>
                              <textarea 
                                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none min-h-[60px]"
                                placeholder="Например: Заявление студента, Справка..."
                                value={retakeReason}
                                onChange={(e) => setRetakeReason(e.target.value)}
                              ></textarea>
                          </div>

                          <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800 border border-yellow-200">
                              Заявка будет отправлена администратору по академическим вопросам на рассмотрение. После одобрения поле пересдачи станет активным.
                          </div>
                      </div>

                      <div className="mt-6 flex justify-end gap-3 flex-shrink-0 pt-4 border-t border-gray-100">
                          <button 
                            onClick={closeRetakeModal}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          >
                              Отмена
                          </button>
                          <button 
                            onClick={handleRetakeSubmit}
                            disabled={retakeStudentIds.length === 0}
                            className="px-4 py-2 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                              Отправить заявку
                          </button>
                      </div>
                  </div>
              )}

              {retakeStep === 'confirm' && (
                  <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
                       <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4 text-orange-600">
                           <AlertCircle size={32} />
                       </div>
                       <h3 className="text-xl font-bold text-gray-800 mb-2">Подтверждение</h3>
                       <p className="text-gray-600 mb-6 text-sm">
                           Вы действительно хотите отправить заявку на пересдачу для <span className="font-bold text-gray-800">{retakeStudentIds.length} студентов</span>?
                       </p>
                       <div className="flex gap-3 w-full">
                           <button 
                             onClick={() => setRetakeStep('form')}
                             className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                           >
                               Отмена
                           </button>
                           <button 
                             onClick={confirmSendRequest}
                             className="flex-1 px-4 py-2 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 rounded shadow-sm transition-colors"
                           >
                               Да, отправить
                           </button>
                       </div>
                  </div>
              )}

              {retakeStep === 'success' && (
                  <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
                       <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4 text-green-600">
                           <CheckCircle size={32} />
                       </div>
                       <h3 className="text-xl font-bold text-gray-800 mb-2">Заявка отправлена</h3>
                       <p className="text-gray-600 mb-6 text-sm">
                           Ваша заявка успешно отправлена и находится на рассмотрении у администратора по академическим вопросам.
                       </p>
                       <button 
                         onClick={closeRetakeModal}
                         className="w-full px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded shadow-sm transition-colors"
                       >
                           ОК, Закрыть
                       </button>
                  </div>
              )}
          </div>
      )}

      {/* Submission Action Confirmation Modal */}
      {submissionConfirmModal.isOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSubmissionConfirmModal({ ...submissionConfirmModal, isOpen: false })}></div>
              <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200 text-center">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 mx-auto ${
                        submissionConfirmModal.action === 'accept' ? 'bg-green-100 text-green-600' :
                        submissionConfirmModal.action === 'reject' ? 'bg-red-100 text-red-600' :
                        'bg-yellow-100 text-yellow-600'
                    }`}>
                        {submissionConfirmModal.action === 'accept' ? <CheckCircle size={32} /> :
                         submissionConfirmModal.action === 'reject' ? <XCircle size={32} /> :
                         <RotateCcw size={32} />
                        }
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                        {submissionConfirmModal.action === 'accept' && "Принять работу?"}
                        {submissionConfirmModal.action === 'reject' && "Отклонить работу?"}
                        {submissionConfirmModal.action === 'revise' && "Отправить на доработку?"}
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                        Вы собираетесь {
                            submissionConfirmModal.action === 'accept' ? "принять работу" :
                            submissionConfirmModal.action === 'reject' ? "отклонить работу" :
                            "вернуть работу на доработку"
                        } студента <span className="font-bold">{submissionConfirmModal.studentName}</span>.
                    </p>
                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={() => setSubmissionConfirmModal({ ...submissionConfirmModal, isOpen: false })}
                            className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                        >
                            Отмена
                        </button>
                        <button 
                            onClick={confirmSubmissionAction}
                            className={`flex-1 px-4 py-2 text-sm font-bold text-white rounded shadow-sm transition-colors ${
                                submissionConfirmModal.action === 'accept' ? 'bg-green-600 hover:bg-green-700' :
                                submissionConfirmModal.action === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                                'bg-yellow-600 hover:bg-yellow-700'
                            }`}
                        >
                            Подтвердить
                        </button>
                    </div>
              </div>
           </div>
      )}

      {/* AI Analysis Modal */}
      {isAiModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsAiModalOpen(false)}></div>
              
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-0 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-gray-200/50">
                  {/* Decorative Background Mesh */}
                  <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 opacity-10 pointer-events-none"></div>
                  
                  <div className="p-6 pb-4 relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-purple-700">
                                <Sparkles size={24} className={aiAnalysisState === 'analyzing' ? "animate-pulse" : ""} />
                                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">AI Ассистент</h3>
                            </div>
                            <button onClick={() => setIsAiModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {aiAnalysisState === 'analyzing' ? (
                            <div className="py-12 flex flex-col items-center justify-center text-center">
                                <div className="relative w-16 h-16 mb-4">
                                    <div className="absolute inset-0 border-4 border-purple-100 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                                <p className="text-gray-600 font-medium animate-pulse">Анализирую работу студента...</p>
                                <p className="text-xs text-gray-400 mt-2 max-w-xs">Ищем ошибки, проверяем структуру и оригинальность текста.</p>
                            </div>
                        ) : aiResult ? (
                            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                                    <div className="flex-1">
                                        <div className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-1">Предлагаемая оценка</div>
                                        <div className="text-4xl font-extrabold text-gray-800">{aiResult.grade}<span className="text-xl text-gray-400 font-medium">/100</span></div>
                                    </div>
                                    <div className="w-px h-12 bg-purple-200"></div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-700 leading-tight italic">"{aiResult.summary}"</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="flex items-center gap-2 text-sm font-bold text-green-700 mb-2">
                                            <CheckCircle size={16} /> Сильные стороны
                                        </h4>
                                        <ul className="space-y-1.5">
                                            {aiResult.strengths.map((point, i) => (
                                                <li key={i} className="text-xs text-gray-600 bg-green-50/50 px-2 py-1.5 rounded border-l-2 border-green-400">{point}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="flex items-center gap-2 text-sm font-bold text-red-700 mb-2">
                                            <AlertCircle size={16} /> Слабые стороны
                                        </h4>
                                        <ul className="space-y-1.5">
                                            {aiResult.weaknesses.map((point, i) => (
                                                <li key={i} className="text-xs text-gray-600 bg-red-50/50 px-2 py-1.5 rounded border-l-2 border-red-400">{point}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                  </div>

                  {aiAnalysisState === 'complete' && (
                      <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
                          <button 
                            onClick={() => setIsAiModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                              Закрыть
                          </button>
                          <button 
                            onClick={applyAiGrade}
                            className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                          >
                              Применить оценку
                          </button>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};