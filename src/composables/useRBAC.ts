import { computed } from "vue";
import { useUserStore } from "../stores/userStore";
import { Role } from "../types/user";
import {
  nav_home,
  nav_specialty_catalog,
  nav_discipline_catalog,
  nav_schedule,
  nav_protocol,
  nav_journals,
  nav_rup,
  nav_analytics,
  nav_reports,
  nav_education_schedule,
  nav_student_card,
  nav_teacher_card,
  nav_profile,
  nav_settings,
  nav_logout,
} from "@/paraglide/messages";
import { useLocaleStore } from "@/stores/localeStore";

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
  const localeStore = useLocaleStore();

  const checkAccess = (requiredRoles: Role[]): boolean => {
    if (!userStore.isAuthenticated) return false;
    if (requiredRoles.length === 0) return true;
    return userStore.hasAnyRole(requiredRoles);
  };

  const getNavigationItems = computed(() => {
    void localeStore.locale; // reactive dependency — re-runs when locale changes
    const items: NavigationItem[] = [
      {
        id: "home",
        label: nav_home(),
        icon: "house_fill",
        roles: [],
        route: "/home",
      },
      {
        id: "specialty-catalog",
        label: nav_specialty_catalog(),
        icon: "book_fill",
        roles: [Role.ADMIN],
        route: "/specialty-catalog/",
      },
      {
        id: "discipline-catalog",
        label: nav_discipline_catalog(),
        icon: "book_fill",
        roles: [Role.ADMIN],
        route: "/discipline-catalog/",
      },
      {
        id: "schedule",
        label: nav_schedule(),
        icon: "calendar_fill",
        roles: [Role.ADMIN, Role.TEACHER],
        route: "/planning",
      },
      {
        id: "protocol",
        label: nav_protocol(),
        icon: "list_bullet_fill",
        roles: [Role.ADMIN, Role.TEACHER],
        route: "/protocol",
      },
      {
        id: "journals",
        label: nav_journals(),
        icon: "doc_text_fill",
        roles: [Role.ADMIN, Role.TEACHER],
        route: "/journals/",
      },
      {
        id: "rup",
        label: nav_rup(),
        icon: "doc_fill",
        roles: [Role.ADMIN, Role.TEACHER],
        route: "/rup/",
      },
      {
        id: "analytics",
        label: nav_analytics(),
        icon: "chart_bar_fill",
        roles: [Role.ADMIN],
        route: "/analytics/",
      },
      {
        id: "reports",
        label: nav_reports(),
        icon: "doc_chart_fill",
        roles: [Role.ADMIN, Role.TEACHER],
        route: "/reports/",
      },
      {
        id: "education-schedule",
        label: nav_education_schedule(),
        icon: "calendar_fill",
        roles: [Role.ADMIN],
        route: "/education-schedule/",
      },
      {
        id: "student-card",
        label: nav_student_card(),
        icon: "book_fill",
        roles: [Role.ADMIN],
        route: "/student-card/",
      },
      {
        id: "teacher-card",
        label: nav_teacher_card(),
        icon: "book_fill",
        roles: [Role.ADMIN],
        route: "/teacher-card/",
      },
    ];
    return items.filter((item) => checkAccess(item.roles));
  });

  const getProfileMenuItems = computed(() => {
    void localeStore.locale;
    const items: NavigationItem[] = [
      {
        id: "profile",
        label: nav_profile(),
        icon: "person_fill",
        roles: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
        route: "/profile/",
      },
      {
        id: "settings",
        label: nav_settings(),
        icon: "gear_fill",
        roles: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
        route: "/settings/",
      },
      {
        id: "logout",
        label: nav_logout(),
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
