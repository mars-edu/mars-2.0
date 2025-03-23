import { Role } from "../stores/userStore";
import type { Router } from "framework7/types";
import NotFoundPage from "../pages/404.vue";

import HomePage from "../pages/suspense/HomePage.vue";
import PlanningPage from "../pages/suspense/PlanningPage.vue";
import LoginPage from "../pages/suspense/LoginPage.vue";
import RegisterPage from "../pages/suspense/RegisterPage.vue";
import RestorePasswordPage from "../pages/suspense/RestorePasswordPage.vue";

type RouteConfig = Router.RouteParameters & {
  options?: {
    roles?: Role[];
  };
};

const routes: RouteConfig[] = [
  {
    path: "/",
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
  // {
  //   path: "/create-course/",
  //   component: () => import("../pages/suspense/CreateCoursePage.vue"),
  //   options: {
  //     roles: [Role.TEACHER],
  //   },
  // },
  // {
  //   path: "/room-booking/",
  //   component: () => import("../pages/suspense/RoomBookingPage.vue"),
  //   options: {
  //     roles: [Role.TEACHER],
  //   },
  // },
  // {
  //   path: "/rup/",
  //   component: () => import("../pages/suspense/RupPage.vue"),
  //   options: {
  //     roles: [Role.TEACHER],
  //   },
  // },
  // {
  //   path: "/institution-info/",
  //   component: () => import("../pages/suspense/InstitutionInfoPage.vue"),
  //   options: {
  //     roles: [Role.TEACHER],
  //   },
  // },
  // {
  //   path: "/testing/",
  //   component: () => import("../pages/suspense/TestingPage.vue"),
  //   options: {
  //     roles: [Role.TEACHER],
  //   },
  // },
  // {
  //   path: "/library/",
  //   component: () => import("../pages/suspense/LibraryPage.vue"),
  //   options: {
  //     roles: [Role.TEACHER],
  //   },
  // },
  // {
  //   path: "/education-schedule/",
  //   component: () => import("../pages/suspense/EducationSchedulePage.vue"),
  //   options: {
  //     roles: [Role.TEACHER],
  //   },
  // },
  // {
  //   path: "/report-editor/",
  //   component: () => import("../pages/suspense/ReportEditorPage.vue"),
  //   options: {
  //     roles: [Role.TEACHER],
  //   },
  // },
  // {
  //   path: "/communication/",
  //   component: () => import("../pages/suspense/CommunicationPage.vue"),
  //   options: {
  //     roles: [Role.TEACHER],
  //   },
  // },
  // {
  //   path: "/students/",
  //   component: () => import("../pages/suspense/StudentsPage.vue"),
  //   options: {
  //     roles: [Role.ADMIN],
  //   },
  // },
  // {
  //   path: "/teachers/",
  //   component: () => import("../pages/suspense/TeachersPage.vue"),
  //   options: {
  //     roles: [Role.ADMIN],
  //   },
  // },
  // {
  //   path: "/parents/",
  //   component: () => import("../pages/suspense/ParentsPage.vue"),
  //   options: {
  //     roles: [Role.ADMIN],
  //   },
  // },
  // {
  //   path: "/settings/",
  //   component: () => import("../pages/suspense/SettingsPage.vue"),
  //   options: {
  //     roles: [Role.ADMIN],
  //   },
  // },
  // {
  //   path: "/profile/",
  //   component: () => import("../pages/suspense/ProfilePage.vue"),
  //   options: {
  //     roles: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
  //   },
  // },
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
