import { Role } from "../types/user";
import type { Router } from "framework7/types";
import NotFoundPage from "../pages/404.vue";

type RouteConfig = Router.RouteParameters & {
  options?: {
    roles?: Role[];
  };
};

const routes: RouteConfig[] = [
  {
    path: "/home",
    asyncComponent: () => import("../pages/suspense/HomePage.vue"),
    options: {
      roles: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
    },
  },
  {
    path: "/planning/:year/:month",
    asyncComponent: () => import("../pages/suspense/PlanningPage.vue"),
    options: {
      roles: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
    },
  },
  {
    path: "/rup/",
    asyncComponent: () => import("../pages/suspense/RupPage.vue"),
    options: {
      roles: [Role.ADMIN, Role.TEACHER],
    },
  },
  {
    path: "/specialty-catalog/",
    asyncComponent: () => import("../pages/suspense/SpecialtyCatalogPage.vue"),
    options: {
      roles: [Role.ADMIN, Role.TEACHER],
    },
  },
  {
    path: "/student-card/",
    asyncComponent: () => import("../pages/suspense/StudentCardPage.vue"),
    options: {
      roles: [Role.ADMIN, Role.TEACHER],
    },
  },
  {
    path: "/teacher-card/",
    asyncComponent: () => import("../pages/suspense/TeacherCardPage.vue"),
    options: {
      roles: [Role.ADMIN, Role.TEACHER],
    },
  },
  {
    path: "/discipline-catalog/",
    asyncComponent: () => import("../pages/suspense/DisciplineCatalogPage.vue"),
    options: {
      roles: [Role.ADMIN, Role.TEACHER],
    },
  },
  {
    path: "/journals/",
    asyncComponent: () => import("../pages/suspense/JournalsPage.vue"),
    options: {
      roles: [Role.ADMIN, Role.TEACHER],
    },
  },
  {
    path: "/journals/:id",
    asyncComponent: () => import("../pages/suspense/JournalDetailsPage.vue"),
    options: {
      roles: [Role.ADMIN, Role.TEACHER],
    },
  },
  {
    path: "/settings/",
    asyncComponent: () => import("../pages/suspense/SettingsPage.vue"),
    options: {
      roles: [Role.ADMIN],
    },
  },
  {
    path: "/education-schedule/",
    asyncComponent: () => import("../pages/suspense/EducationSchedulePage.vue"),
    options: {
      roles: [Role.ADMIN],
    },
  },
  {
    path: "/analytics/",
    asyncComponent: () => import("../pages/suspense/AnalyticsPage.vue"),
    options: {
      roles: [Role.ADMIN],
    },
  },
  {
    path: "/reports/",
    asyncComponent: () => import("../pages/suspense/ReportsPage.vue"),
    options: {
      roles: [Role.ADMIN],
    },
  },
  {
    path: "/login",
    asyncComponent: () => import("../pages/suspense/LoginPage.vue"),
  },
  {
    path: "/register",
    asyncComponent: () => import("../pages/suspense/RegisterPage.vue"),
  },
  {
    path: "/restore-password",
    asyncComponent: () => import("../pages/suspense/RestorePasswordPage.vue"),
  },
  {
    path: "(.*)",
    component: NotFoundPage,
  },
];

export default routes;
