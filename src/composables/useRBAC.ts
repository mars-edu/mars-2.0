import { computed } from "vue";
import { useUserStore, Role } from "../stores/userStore";

export interface AccessControl {
  roles: Role[];
  redirect?: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  roles: Role[];
  route?: string;
}

export function useRBAC() {
  const userStore = useUserStore();

  const checkAccess = (requiredRoles: Role[]): boolean => {
    if (!userStore.isAuthenticated) return false;
    if (requiredRoles.length === 0) return true;
    return userStore.hasAnyRole(requiredRoles);
  };

  const getRouteForItem = (itemId: string): string => {
    switch (itemId) {
      case "home":
        return "/";
      case "journals":
        return "/journals/";
      case "rup":
        return "/rup/";
      case "testing":
        return "/testing/";
      case "create-course":
        return "/create-course/";
      case "report-editor":
        return "/report-editor/";
      case "room-booking":
        return "/room-booking/";
      case "communication":
        return "/communication/";
      case "education-schedule":
        return "/education-schedule/";
      case "library":
        return "/library/";
      case "institution-info":
        return "/institution-info/";
      case "profile":
        return "/profile/";
      case "settings":
        return "/settings/";
      case "schedule": {
        const now = new Date();
        return `/planning/${now.getFullYear()}/${now.getMonth() + 1}/`;
      }
      case "logout":
        return "/login/";
      default:
        return "/";
    }
  };

  const getNavigationItems = computed(() => {
    const items: NavigationItem[] = [
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
        roles: [Role.ADMIN, Role.TEACHER],
      },
      {
        id: "journals",
        label: "Журналы",
        icon: "doc_text_fill",
        roles: [Role.ADMIN, Role.TEACHER],
      },
      {
        id: "rup",
        label: "РУП",
        icon: "doc_fill",
        roles: [Role.ADMIN, Role.TEACHER],
      },
      {
        id: "testing",
        label: "Тестирование",
        icon: "checkmark_circle_fill",
        roles: [Role.ADMIN, Role.TEACHER],
      },
      {
        id: "create-course",
        label: "Создать курс",
        icon: "plus_circle_fill",
        roles: [Role.ADMIN, Role.TEACHER],
      },
      {
        id: "report-editor",
        label: "Редактор отчетов",
        icon: "doc_text_fill",
        roles: [Role.ADMIN, Role.TEACHER],
      },
      {
        id: "room-booking",
        label: "Бронирование кабинета",
        icon: "building_2_fill",
        roles: [Role.ADMIN, Role.TEACHER],
      },
      {
        id: "communication",
        label: "Общение",
        icon: "chat_bubble_fill",
        roles: [Role.ADMIN, Role.TEACHER],
      },
      {
        id: "education-schedule",
        label: "График образовательного процесса",
        icon: "calendar_fill",
        roles: [Role.ADMIN, Role.TEACHER],
      },
      {
        id: "library",
        label: "Библиотека",
        icon: "book_fill",
        roles: [Role.ADMIN, Role.TEACHER],
      },
      {
        id: "institution-info",
        label: "Информация об учебном заведении",
        icon: "building_2_fill",
        roles: [Role.ADMIN, Role.TEACHER],
      },
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
    getRouteForItem,
  };
}
