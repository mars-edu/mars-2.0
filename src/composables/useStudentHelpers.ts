import { computed } from 'vue';
import * as m from '@/paraglide/messages';
import type { StudentStatus } from '@/types/student';

export function useStudentHelpers() {
  const getStatusText = (status?: StudentStatus) => {
    const map: Record<string, string> = {
      active: m.student_status_active(),
      expelled: m.student_status_expelled(),
      academic_leave: m.student_status_academic_leave(),
      debt: m.student_status_debt(),
      graduated: m.student_status_graduated(),
    };
    return map[status || 'active'] || status || '—';
  };

  const getStatusFullText = (status?: StudentStatus) => {
    const map: Record<string, string> = {
      active: m.student_status_active_full(),
      expelled: m.student_status_expelled_full(),
      academic_leave: m.student_status_academic_leave_full(),
      debt: m.student_status_debt_full(),
      graduated: m.student_status_graduated_full(),
    };
    return map[status || 'active'] || status || '—';
  };

  const getStatusBadgeClass = (status?: StudentStatus) => {
    const map: Record<string, string> = {
      active: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
      expelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
      academic_leave: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
      debt: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
      graduated: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
    };
    return map[status || 'active'] || 'bg-muted text-muted-foreground';
  };

  const getGenderText = (gender: 'male' | 'female') => {
    return gender === 'male' ? m.student_details_gender_male() : m.student_details_gender_female();
  };

  return {
    getStatusText,
    getStatusFullText,
    getStatusBadgeClass,
    getGenderText,
  };
}
