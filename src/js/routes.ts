import { Role } from "../types/user";
import type { Router } from "framework7/types";
import NotFoundPage from "../pages/404.vue";

import HomePage from "../pages/suspense/HomePage.vue";
import PlanningPage from "../pages/suspense/PlanningPage.vue";
import LoginPage from "../pages/suspense/LoginPage.vue";
import RegisterPage from "../pages/suspense/RegisterPage.vue";
import RestorePasswordPage from "../pages/suspense/RestorePasswordPage.vue";
import RupPage from "../pages/suspense/RupPage.vue";
import SettingsPage from "../pages/suspense/SettingsPage.vue";
import SpecialtyCatalogPage from "../pages/suspense/SpecialtyCatalogPage.vue";
import StudentCardPage from "../pages/suspense/StudentCardPage.vue";
import TeacherCardPage from "../pages/suspense/TeacherCardPage.vue";
import DisciplineCatalogPage from "../pages/suspense/DisciplineCatalogPage.vue";
import JournalsPage from "../pages/suspense/JournalsPage.vue";
import JournalDetailsPage from "../pages/suspense/JournalDetailsPage.vue";
import EducationSchedulePage from "../pages/suspense/EducationSchedulePage.vue";
import AnalyticsPage from "../pages/suspense/AnalyticsPage.vue";
import ReportsPage from "../pages/suspense/ReportsPage.vue";

type RouteConfig = Router.RouteParameters & {
  options?: {
    roles?: Role[];
  };
};

const routes: RouteConfig[] = [
  {
    path: "/home",
    component: HomePage,
    options: {
      roles: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
    },
  },
  {
    path: "/planning/:year/:month",
    component: PlanningPage,
    options: {
      roles: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
    },
  },
  {
    path: "/rup/",
    component: RupPage,
    options: {
      roles: [Role.ADMIN, Role.TEACHER],
    },
  },
  {
    path: "/specialty-catalog/",
    component: SpecialtyCatalogPage,
    options: {
      roles: [Role.ADMIN, Role.TEACHER],
    },
  },
  {
    path: "/student-card/",
    component: StudentCardPage,
    options: {
      roles: [Role.ADMIN, Role.TEACHER],
    },
  },
  {
    path: "/teacher-card/",
    component: TeacherCardPage,
    options: {
      roles: [Role.ADMIN, Role.TEACHER],
    },
  },
  {
    path: "/discipline-catalog/",
    component: DisciplineCatalogPage,
    options: {
      roles: [Role.ADMIN, Role.TEACHER],
    },
  },
  {
    path: "/journals/",
    component: JournalsPage,
    options: {
      roles: [Role.ADMIN, Role.TEACHER],
    },
  },
  {
    path: "/journals/:id",
    component: JournalDetailsPage,
    options: {
      roles: [Role.ADMIN, Role.TEACHER],
    },
  },
  {
    path: "/settings/",
    component: SettingsPage,
    options: {
      roles: [Role.ADMIN],
    },
  },
  {
    path: "/education-schedule/",
    component: EducationSchedulePage,
    options: {
      roles: [Role.ADMIN],
    },
  },
  {
    path: "/analytics/",
    component: AnalyticsPage,
    options: {
      roles: [Role.ADMIN],
    },
  },
  {
    path: "/reports/",
    component: ReportsPage,
    options: {
      roles: [Role.ADMIN],
    },
  },
  {
    path: "/login",
    component: LoginPage,
  },
  {
    path: "/register",
    component: RegisterPage,
  },
  {
    path: "/restore-password",
    component: RestorePasswordPage,
  },
  {
    path: "(.*)",
    component: NotFoundPage,
  },
];

export default routes;
