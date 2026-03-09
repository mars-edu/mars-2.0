import React from 'react';
import { Student } from '../types';
import { SPECIALTIES } from '../constants';

interface StudentTableProps {
  students: Student[];
  onStudentClick: (student: Student) => void;
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onToggleAll: (ids: number[]) => void;
  selectionMode: boolean;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active': return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">Учится</span>;
    case 'expelled': return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-medium">Отчислен</span>;
    case 'academic_leave': return <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-medium">Академ</span>;
    case 'debt': return <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-medium">Долг</span>;
    case 'graduated': return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">Выпуск</span>;
    default: return <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-medium">{status}</span>;
  }
};

const getSpecialtyName = (code: string) => {
    const spec = SPECIALTIES.find(s => s.code === code);
    return spec ? `${spec.code} ${spec.name}` : code;
};

export const StudentTable: React.FC<StudentTableProps> = ({ 
  students, 
  onStudentClick, 
  selectedIds, 
  onToggleSelect,
  onToggleAll,
  selectionMode
}) => {
  const allSelected = students.length > 0 && students.every(s => selectedIds.includes(s.id));

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 bg-slate-600 text-white font-medium text-sm py-3 px-4">
        <div className="col-span-1 flex items-center gap-2">
            {selectionMode && (
                <input 
                    type="checkbox" 
                    className="rounded cursor-pointer"
                    checked={allSelected}
                    onChange={() => onToggleAll(students.map(s => s.id))}
                />
            )}
            <span>№</span>
        </div>
        <div className="col-span-3">ФИО</div>
        <div className="col-span-2 text-center">Статус</div>
        <div className="col-span-4 text-left">Специальность</div>
        <div className="col-span-1 text-center">Язык</div>
        <div className="col-span-1 text-center">Курс</div>
      </div>

      {/* Table Body */}
      <div className="text-sm">
        {students.map((student, index) => {
          const bgColor = student.gender === 'male' ? 'bg-[#dbeafe]' : 'bg-[#fce7f3]';
          const isSelected = selectedIds.includes(student.id);
          
          return (
            <div 
              key={student.id} 
              onClick={() => onStudentClick(student)}
              className={`grid grid-cols-12 gap-4 py-3 px-4 ${bgColor} border-b border-white/50 items-center text-gray-800 hover:brightness-95 cursor-pointer transition-all relative`}
            >
              <div className="col-span-1 font-medium text-gray-600 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                 {selectionMode && (
                     <input 
                        type="checkbox" 
                        className="rounded cursor-pointer"
                        checked={isSelected}
                        onChange={() => onToggleSelect(student.id)}
                     />
                 )}
                 {student.id}
              </div>
              <div className="col-span-3 font-medium truncate" title={student.fullName}>{student.fullName}</div>
              <div className="col-span-2 text-center">{getStatusBadge(student.status)}</div>
              <div className="col-span-4 text-left text-xs text-gray-700 leading-tight">
                  {getSpecialtyName(student.specialty)}
              </div>
              <div className="col-span-1 text-center uppercase">{student.language}</div>
              <div className="col-span-1 text-center">{student.course}</div>
            </div>
          );
        })}
        {students.length === 0 && (
            <div className="p-8 text-center text-gray-500">Нет данных для отображения</div>
        )}
      </div>
    </div>
  );
};