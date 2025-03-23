import { computed } from "vue";
import { useUserStore, Role } from "../stores/userStore";

export interface AccessControl {
  roles: Role[];
  redirect?: string;
}

export function useRBAC() {
  const userStore = useUserStore();

  const checkAccess = (requiredRoles: Role[]): boolean => {
    if (!userStore.isAuthenticated) return false;
    if (requiredRoles.length === 0) return true;
    return userStore.hasAnyRole(requiredRoles);
  };

  const getNavigationItems = computed(() => {
    const items = [
      // Admin items
      {
        id: "home",
        label: "Главная",
        icon: "house",
        roles: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
      },
      {
        id: "students",
        label: "Студенты",
        icon: "person_2_fill",
        roles: [Role.ADMIN],
      },
      {
        id: "teachers",
        label: "Преподаватели",
        icon: "person_3_fill",
        roles: [Role.ADMIN],
      },
      {
        id: "parents",
        label: "Родители",
        icon: "person_2",
        roles: [Role.ADMIN],
      },
      {
        id: "settings",
        label: "Настройки",
        icon: "gear",
        roles: [Role.ADMIN],
      },

      // Teacher items
      {
        id: "create-course",
        label: "Создать курс",
        icon: "plus_square_fill",
        roles: [Role.TEACHER],
      },
      {
        id: "room-booking",
        label: "Бронирование кабинета",
        icon: "building_2_fill",
        roles: [Role.TEACHER],
      },
      {
        id: "rup",
        label: "РУП",
        icon: "doc_plaintext",
        roles: [Role.TEACHER],
      },
      {
        id: "institution-info",
        label: "Информация об учебном заведении",
        icon: "building",
        roles: [Role.TEACHER],
      },
      {
        id: "testing",
        label: "Тестирование",
        icon: "checkmark_square_fill",
        roles: [Role.TEACHER],
      },
      {
        id: "library",
        label: "Библиотека",
        icon: "book_fill",
        roles: [Role.TEACHER],
      },
      {
        id: "education-schedule",
        label: "График образовательного процесса",
        icon: "calendar",
        roles: [Role.TEACHER],
      },
      {
        id: "report-editor",
        label: "Редактор отчетов",
        icon: "doc_text_fill",
        roles: [Role.TEACHER],
      },
      {
        id: "communication",
        label: "Общение",
        icon: "chat_bubble_fill",
        roles: [Role.TEACHER],
      },
    ];

    return items.filter((item) => checkAccess(item.roles));
  });

  const getProfileMenuItems = computed(() => {
    const items = [
      {
        id: "profile",
        label: "Профиль",
        icon: "person",
        roles: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
      },
      {
        id: "settings",
        label: "Настройки",
        icon: "gear",
        roles: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
      },
      {
        id: "logout",
        label: "Выйти",
        icon: "arrow_right_square",
        roles: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
      },
    ];

    return items.filter((item) => checkAccess(item.roles));
  });

  return {
    checkAccess,
    getNavigationItems,
    getProfileMenuItems,
  };
}
