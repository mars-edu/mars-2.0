import { STORAGE_KEYS } from "@/constants/storage";
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
  { id: "ktp", resource: "rup", icon: "layout-grid", route: "/ktp" },
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

// ── Default Role Fallback Matrix ──────────────────────────────────────────────
const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: [
    "home", "planning", "journals", "rup", "reports", "testing",
    "courses", "protocol", "analytics", "schedule", "timetable",
    "workload", "cabinet-management", "specialty-catalog", "student-card",
    "discipline-catalog", "teacher-card", "settings"
  ],
  TEACHER: [
    "home", "planning", "journals", "rup", "reports", "testing",
    "courses", "protocol", "schedule", "settings"
  ],
  STUDENT: ["home", "journals", "schedule", "testing", "settings"],
  PARENT: ["home", "journals", "schedule", "settings"],
};

function getInitialPermissions(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CACHED_PERMISSIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ── Singleton permissions state ────────────────────────────────────────────────
// One shared reactive ref for the entire app. All consumers (components, route
// guards, middleware) read from this same ref — no per-call subscriptions.
const myPermissions = ref<string[]>(getInitialPermissions());
let _convexUnsub: (() => void) | null = null;
let _initialized = false;

/**
 * Initialize the RBAC permission subscription.
 *
 * Call exactly ONCE at app startup (app.vue onBeforeMount, after
 * userStore.initialize()). The watch runs for the app's entire lifetime —
 * this is intentional. When the user logs out the subscription is torn down
 * and permissions are cleared; when a new user logs in a fresh subscription
 * is started automatically.
 */
export function initRBAC(): void {
  if (_initialized) return;
  _initialized = true;

  const userStore = useUserStore();

  watch(
    () => userStore.currentUser?.id,
    (userId) => {
      // Tear down previous subscription whenever user changes.
      if (_convexUnsub) {
        _convexUnsub();
        _convexUnsub = null;
      }

      if (!userId) {
        myPermissions.value = [];
        try {
          localStorage.removeItem(STORAGE_KEYS.CACHED_PERMISSIONS);
        } catch {
          // ignore
        }
        return;
      }

      _convexUnsub = convex.onUpdate(
        api.permissions.queries.getMyPermissions,
        { userId: userId as Id<"users"> },
        (data) => {
          myPermissions.value = data ?? [];
          try {
            localStorage.setItem(STORAGE_KEYS.CACHED_PERMISSIONS, JSON.stringify(data ?? []));
          } catch {
            // ignore
          }
        }
      );
    },
    { immediate: true }
  );
}

/**
 * Standalone, side-effect-free permission check.
 *
 * Safe to call anywhere — stores, route middleware, plain functions — without
 * creating any Vue reactive side-effects (no watch, no computed).
 */
export function canNavigateGlobal(resource: string): boolean {
  if (myPermissions.value.length > 0) {
    return myPermissions.value.includes(resource);
  }
  const userStore = useUserStore();
  const roles = userStore.currentUser?.roles || [];
  return roles.some((role) => DEFAULT_ROLE_PERMISSIONS[role]?.includes(resource));
}

/**
 * Composable for use inside Vue component <script setup> / setup().
 *
 * Returns reactive `getNavigationItems` (derived from singleton permissions)
 * and a `canNavigate` helper. Does NOT create any new subscriptions or
 * watchers — it only reads from the already-initialized singleton.
 */
export function useRBAC() {
  const localeStore = useLocaleStore();
  const userStore = useUserStore();

  const canNavigate = (resource: string): boolean => {
    if (myPermissions.value.length > 0) {
      return myPermissions.value.includes(resource);
    }
    const roles = userStore.currentUser?.roles || [];
    return roles.some((role) => DEFAULT_ROLE_PERMISSIONS[role]?.includes(resource));
  };

  const getNavigationItems = computed<NavigationItem[]>(() => {
    void localeStore.locale; // reactive dependency for i18n re-render

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
