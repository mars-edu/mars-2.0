import { ref, computed, watch } from "vue";
import { useUserStore } from "../stores/userStore";
import type { Id } from "@convex/_generated/dataModel";
import { convex } from "../lib/convexClient";
import { api } from "@convex/_generated/api";
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
  nav_settings,
  nav_ktp,
  nav_testing,
  nav_courses,
  nav_timetable,
  nav_workload,
  nav_cabinet_management,
} from "@/paraglide/messages";
import { useLocaleStore } from "@/stores/localeStore";

export interface NavigationItem {
  id: string;
  resource: string;
  label: string;
  icon: string;
  route: string;
}

const ALL_NAV_ITEMS: Omit<NavigationItem, "label">[] = [
  { id: "home", resource: "home", icon: "home", route: "/home" },
  { id: "planning", resource: "planning", icon: "calendar-days", route: "/planning" },
  { id: "journals", resource: "journals", icon: "book", route: "/journals/" },
  { id: "ktp", resource: "journals", icon: "layout-grid", route: "/journals/" },
  { id: "reports", resource: "reports", icon: "file-text", route: "/reports/" },
  { id: "testing", resource: "testing", icon: "layout", route: "/testing" },
  { id: "courses", resource: "journals", icon: "graduation-cap", route: "/home" },
  { id: "protocol", resource: "protocol", icon: "layout", route: "/protocol" },
  { id: "analytics", resource: "analytics", icon: "pie-chart", route: "/analytics/" },
  { id: "rup", resource: "rup", icon: "file-text", route: "/rup/" },
  { id: "schedule", resource: "schedule", icon: "calendar", route: "/education-schedule/" },
  { id: "timetable", resource: "timetable", icon: "clock", route: "/home" },
  { id: "workload", resource: "workload", icon: "layout-grid", route: "/workload-management" },
  { id: "cabinet-management", resource: "cabinet-management", icon: "door-open", route: "/cabinet-management/" },
  { id: "specialty-catalog", resource: "specialty-catalog", icon: "book-open", route: "/specialty-catalog/" },
  { id: "student-card", resource: "student-card", icon: "users", route: "/student-card/" },
  { id: "discipline-catalog", resource: "discipline-catalog", icon: "book", route: "/discipline-catalog/" },
  { id: "teacher-card", resource: "teacher-card", icon: "user-check", route: "/teacher-card/" },
  { id: "settings", resource: "settings", icon: "settings", route: "/settings/" },
];

export function useRBAC() {
  const userStore = useUserStore();
  const localeStore = useLocaleStore();

  const myPermissions = ref<string[]>([]);

  watch(
    () => userStore.currentUser?.id,
    (userId, _prev, onCleanup) => {
      if (!userId) {
        myPermissions.value = [];
        return;
      }

      const unsubscribe = convex.onUpdate(
        api.permissions.queries.getMyPermissions,
        { userId: userId as Id<"users"> },
        (data) => {
          myPermissions.value = data ?? [];
        }
      );

      onCleanup(unsubscribe);
    },
    { immediate: true }
  );

  const canNavigate = (resource: string): boolean =>
    myPermissions.value.includes(resource);

  const getNavigationItems = computed<NavigationItem[]>(() => {
    void localeStore.locale;

    const labels: Record<string, () => string> = {
      home: nav_home,
      planning: nav_schedule,
      journals: nav_journals,
      ktp: nav_ktp,
      reports: nav_reports,
      testing: nav_testing,
      courses: nav_courses,
      protocol: nav_protocol,
      analytics: nav_analytics,
      rup: nav_rup,
      schedule: nav_education_schedule,
      timetable: nav_timetable,
      workload: nav_workload,
      "cabinet-management": nav_cabinet_management,
      "specialty-catalog": nav_specialty_catalog,
      "student-card": nav_student_card,
      "discipline-catalog": nav_discipline_catalog,
      "teacher-card": nav_teacher_card,
      settings: nav_settings,
    };

    return ALL_NAV_ITEMS
      .filter((item) => canNavigate(item.resource))
      .map((item) => ({ ...item, label: labels[item.id]?.() ?? item.id }));
  });

  const getProfileMenuItems = computed(() => [] as NavigationItem[]);

  return {
    canNavigate,
    getNavigationItems,
    getProfileMenuItems,
  };
}
