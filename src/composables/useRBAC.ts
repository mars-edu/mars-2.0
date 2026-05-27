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
  nav_ktp,
  nav_testing,
  nav_courses,
  nav_timetable,
  nav_workload,
  nav_cabinet_management,
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
        icon: "home",
        roles: [],
        route: "/home",
      },
      {
        id: "planning",
        label: nav_schedule(),
        icon: "calendar-days",
        roles: [Role.ADMIN, Role.TEACHER],
        route: "/planning",
      },
      {
        id: "journals",
        label: nav_journals(),
        icon: "book",
        roles: [Role.ADMIN, Role.TEACHER],
        route: "/journals/",
      },
      {
        id: "ktp",
        label: nav_ktp(),
        icon: "layout-grid",
        roles: [Role.ADMIN, Role.TEACHER],
        route: "/journals/", // Redirect to journals for now as KTP is often linked
      },
      {
        id: "reports",
        label: nav_reports(),
        icon: "file-text",
        roles: [Role.ADMIN, Role.TEACHER],
        route: "/reports/",
      },
      {
        id: "testing",
        label: nav_testing(),
        icon: "layout",
        roles: [Role.ADMIN, Role.TEACHER],
        route: "/testing",
      },
      {
        id: "courses",
        label: nav_courses(),
        icon: "graduation-cap",
        roles: [Role.ADMIN, Role.TEACHER],
        route: "/home",
      },
      {
        id: "protocol",
        label: nav_protocol(),
        icon: "layout",
        roles: [Role.ADMIN, Role.TEACHER],
        route: "/protocol",
      },
      {
        id: "analytics",
        label: nav_analytics(),
        icon: "pie-chart",
        roles: [Role.ADMIN],
        route: "/analytics/",
      },
      {
        id: "rup",
        label: nav_rup(),
        icon: "file-text",
        roles: [Role.ADMIN, Role.TEACHER],
        route: "/rup/",
      },
      {
        id: "schedule",
        label: nav_education_schedule(),
        icon: "calendar",
        roles: [Role.ADMIN, Role.TEACHER],
        route: "/education-schedule/",
      },
      {
        id: "timetable",
        label: nav_timetable(),
        icon: "clock",
        roles: [Role.ADMIN],
        route: "/home",
      },
      {
        id: "workload",
        label: nav_workload(),
        icon: "layout-grid",
        roles: [Role.ADMIN],
        route: "/workload-management",
      },
      {
        id: "cabinet-management",
        label: nav_cabinet_management(),
        icon: "door-open",
        roles: [Role.ADMIN],
        route: "/cabinet-management/",
      },
      {
        id: "specialty-catalog",
        label: nav_specialty_catalog(),
        icon: "book-open",
        roles: [Role.ADMIN],
        route: "/specialty-catalog/",
      },
      {
        id: "student-card",
        label: nav_student_card(),
        icon: "users",
        roles: [Role.ADMIN],
        route: "/student-card/",
      },
      {
        id: "discipline-catalog",
        label: nav_discipline_catalog(),
        icon: "book",
        roles: [Role.ADMIN],
        route: "/discipline-catalog/",
      },
      {
        id: "teacher-card",
        label: nav_teacher_card(),
        icon: "user-check",
        roles: [Role.ADMIN],
        route: "/teacher-card/",
      },
      {
        id: "settings",
        label: nav_settings(),
        icon: "settings",
        roles: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
        route: "/settings/",
      },
    ];
    return items.filter((item) => checkAccess(item.roles));
  });

  const getProfileMenuItems = computed(() => {
    return [] as NavigationItem[];
  });

  return {
    checkAccess,
    getNavigationItems,
    getProfileMenuItems,
  };
}
