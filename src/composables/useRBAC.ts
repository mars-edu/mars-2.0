import { computed } from "vue";
import { useUserStore } from "../stores/userStore";
import { Role } from "../types/user";

export interface AccessControl {
  roles: Role[];
  redirect?: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  roles: Role[];
  route: string;
}

export function useRBAC() {
  const userStore = useUserStore();

  const checkAccess = (requiredRoles: Role[]): boolean => {
    if (!userStore.isAuthenticated) return false;
    if (requiredRoles.length === 0) return true;
    return userStore.hasAnyRole(requiredRoles);
  };

  const getNavigationItems = computed(() => {
    const items: NavigationItem[] = [
      {
        id: "home",
        label: "Главная",
        icon: "house_fill",
        roles: [],
        route: "/home",
      },
      {
        id: "specialty-catalog",
        label: "Каталог специальностей",
        icon: "book_fill",
        roles: [Role.ADMIN],
        route: "/specialty-catalog/",
      },
      {
        id: "discipline-catalog",
        label: "Каталог дисциплин",
        icon: "book_fill",
        roles: [Role.ADMIN],
        route: "/discipline-catalog/",
      },
      {
        id: "schedule",
        label: "Планирование",
        icon: "calendar_fill",
        roles: [Role.ADMIN, Role.TEACHER],
        route: "/planning",
      },
      {
        id: "protocol",
        label: "Протокол",
        icon: "list_bullet_fill",
        roles: [Role.ADMIN, Role.TEACHER],
        route: "/protocol",
      },
      {
        id: "journals",
        label: "Журналы",
        icon: "doc_text_fill",
        roles: [Role.ADMIN, Role.TEACHER],
        route: "/journals/",
      },
      {
        id: "rup",
        label: "РУП",
        icon: "doc_fill",
        roles: [Role.ADMIN, Role.TEACHER],
        route: "/rup/",
      },
      // {
      //   id: "testing",
      //   label: "Тестирование",
      //   icon: "checkmark_circle_fill",
      //   roles: [Role.ADMIN, Role.TEACHER],
      //   route: "/testing/",
      // },
      {
        id: "analytics",
        label: "Аналитика",
        icon: "chart_bar_fill",
        roles: [Role.ADMIN],
        route: "/analytics/",
      },
      {
        id: "reports",
        label: "Отчеты",
        icon: "doc_chart_fill",
        roles: [Role.ADMIN, Role.TEACHER],
        route: "/reports/",
      },
      // {
      //   id: "room-booking",
      //   label: "Бронирование кабинета",
      //   icon: "building_2_fill",
      //   roles: [Role.ADMIN],
      //   route: "/room-booking/",
      // },
      // {
      //   id: "communication",
      //   label: "Общение",
      //   icon: "chat_bubble_fill",
      //   roles: [Role.ADMIN],
      //   route: "/communication/",
      // },
      {
        id: "education-schedule",
        label: "График образовательного процесса",
        icon: "calendar_fill",
        roles: [Role.ADMIN],
        route: "/education-schedule/",
      },
      {
        id: "student-card",
        label: "Картотека обучающихся",
        icon: "book_fill",
        roles: [Role.ADMIN],
        route: "/student-card/",
      },
      {
        id: "teacher-card",
        label: "Картотека преподавателей",
        icon: "book_fill",
        roles: [Role.ADMIN],
        route: "/teacher-card/",
      },
      // {
      //   id: "library",
      //   label: "Библиотека",
      //   icon: "book_fill",
      //   roles: [Role.ADMIN],
      //   route: "/library/",
      // },
      // {
      //   id: "institution-info",
      //   label: "Информация об учебном заведении",
      //   icon: "building_2_fill",
      //   roles: [Role.ADMIN],
      //   route: "/institution-info/",
      // },
    ];

    return items.filter((item) => checkAccess(item.roles));
  });

  const getProfileMenuItems = computed(() => {
    const items: NavigationItem[] = [
      {
        id: "profile",
        label: "Профиль",
        icon: "person_fill",
        roles: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
        route: "/profile/",
      },
      {
        id: "settings",
        label: "Настройки",
        icon: "gear_fill",
        roles: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
        route: "/settings/",
      },
      {
        id: "logout",
        label: "Выйти",
        icon: "arrow_right_circle_fill",
        roles: [],
        route: "/login/",
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
