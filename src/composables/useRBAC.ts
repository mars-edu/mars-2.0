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
      {
        id: "home",
        label: "Главная",
        icon: "house_fill",
        roles: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
      },
      {
        id: "schedule",
        label: "Расписание",
        icon: "calendar_fill",
        roles: [Role.TEACHER],
      },
      {
        id: "journals",
        label: "Журналы",
        icon: "document_text_fill",
        roles: [Role.TEACHER],
      },
      {
        id: "rup",
        label: "РУП",
        icon: "document_fill",
        roles: [Role.TEACHER],
      },
      {
        id: "testing",
        label: "Тестирование",
        icon: "checkmark_circle_fill",
        roles: [Role.TEACHER],
      },
      {
        id: "create-course",
        label: "Создать курс",
        icon: "plus_circle_fill",
        roles: [Role.TEACHER],
      },
      {
        id: "report-editor",
        label: "Редактор отчетов",
        icon: "document_text_fill",
        roles: [Role.TEACHER],
      },
      {
        id: "room-booking",
        label: "Бронирование кабинета",
        icon: "building_fill",
        roles: [Role.TEACHER],
      },
      {
        id: "communication",
        label: "Общение",
        icon: "chat_bubble_fill",
        roles: [Role.TEACHER],
      },
      {
        id: "education-schedule",
        label: "График образовательного процесса",
        icon: "calendar_fill",
        roles: [Role.TEACHER],
      },
      {
        id: "library",
        label: "Библиотека",
        icon: "book_fill",
        roles: [Role.TEACHER],
      },
      {
        id: "institution-info",
        label: "Информация об учебном заведении",
        icon: "building_fill",
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
        icon: "person_fill",
        roles: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
      },
      {
        id: "settings",
        label: "Настройки",
        icon: "gear_fill",
        roles: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
      },
      {
        id: "logout",
        label: "Выйти",
        icon: "arrow_right_circle_fill",
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
