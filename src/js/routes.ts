import { Role } from "../stores/userStore";
import type { Router } from "framework7/types";
import NotFoundPage from "../pages/404.vue";

import HomePage from "../pages/suspense/HomePage.vue";
import PlanningPage from "../pages/suspense/PlanningPage.vue";
import LoginPage from "../pages/suspense/LoginPage.vue";
import RegisterPage from "../pages/suspense/RegisterPage.vue";
import RestorePasswordPage from "../pages/suspense/RestorePasswordPage.vue";
import RupPage from "../pages/suspense/RupPage.vue";
import SettingsPage from "../pages/suspense/SettingsPage.vue";

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
  {
    path: "/rup/",
    component: RupPage,
    options: {
      roles: [Role.ADMIN, Role.TEACHER],
    },
  },
  {
    path: "/settings/",
    component: SettingsPage,
    options: {
      roles: [Role.ADMIN, Role.TEACHER],
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
