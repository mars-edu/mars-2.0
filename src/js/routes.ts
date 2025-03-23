import { Role } from "../stores/userStore";
import type { Router } from "framework7/types";
import NotFoundPage from "../pages/404.vue";

type RouteConfig = Router.RouteParameters & {
  options?: {
    roles?: Role[];
  };
};

const routes: RouteConfig[] = [
  {
    path: "/",
    async({ resolve }) {
      const vueComponent = () => import("../pages/home.vue");
      vueComponent().then((vc) => {
        resolve({
          component: vc.default,
          options: {
            roles: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
          },
        });
      });
    },
  },
  {
    path: "/planning/:year/:month",
    async({ resolve }) {
      const vueComponent = () => import("../views/PlanningPage.vue");
      vueComponent().then((vc) => {
        resolve({
          component: vc.default,
          options: {
            roles: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
          },
        });
      });
    },
  },
  // {
  //   path: "/create-course/",
  //   async({ resolve }) {
  //     const vueComponent = () => import("../pages/create-course.vue");
  //     vueComponent().then((vc) => {
  //       resolve({
  //         component: vc.default,
  //         options: {
  //           roles: [Role.TEACHER],
  //         }
  //       });
  //     });
  //   },
  // },
  // {
  //   path: "/room-booking/",
  //   async({ resolve }) {
  //     const vueComponent = () => import("../pages/room-booking.vue");
  //     vueComponent().then((vc) => {
  //       resolve({
  //         component: vc.default,
  //         options: {
  //           roles: [Role.TEACHER],
  //         }
  //       });
  //     });
  //   },
  // },
  // {
  //   path: "/rup/",
  //   async({ resolve }) {
  //     const vueComponent = () => import("../pages/rup.vue");
  //     vueComponent().then((vc) => {
  //       resolve({
  //         component: vc.default,
  //         options: {
  //           roles: [Role.TEACHER],
  //         }
  //       });
  //     });
  //   },
  // },
  // {
  //   path: "/institution-info/",
  //   async({ resolve }) {
  //     const vueComponent = () => import("../pages/institution-info.vue");
  //     vueComponent().then((vc) => {
  //       resolve({
  //         component: vc.default,
  //         options: {
  //           roles: [Role.TEACHER],
  //         }
  //       });
  //     });
  //   },
  // },
  // {
  //   path: "/testing/",
  //   async({ resolve }) {
  //     const vueComponent = () => import("../pages/testing.vue");
  //     vueComponent().then((vc) => {
  //       resolve({
  //         component: vc.default,
  //         options: {
  //           roles: [Role.TEACHER],
  //         }
  //       });
  //     });
  //   },
  // },
  // {
  //   path: "/library/",
  //   async({ resolve }) {
  //     const vueComponent = () => import("../pages/library.vue");
  //     vueComponent().then((vc) => {
  //       resolve({
  //         component: vc.default,
  //         options: {
  //           roles: [Role.TEACHER],
  //         }
  //       });
  //     });
  //   },
  // },
  // {
  //   path: "/education-schedule/",
  //   async({ resolve }) {
  //     const vueComponent = () => import("../pages/education-schedule.vue");
  //     vueComponent().then((vc) => {
  //       resolve({
  //         component: vc.default,
  //         options: {
  //           roles: [Role.TEACHER],
  //         }
  //       });
  //     });
  //   },
  // },
  // {
  //   path: "/report-editor/",
  //   async({ resolve }) {
  //     const vueComponent = () => import("../pages/report-editor.vue");
  //     vueComponent().then((vc) => {
  //       resolve({
  //         component: vc.default,
  //         options: {
  //           roles: [Role.TEACHER],
  //         }
  //       });
  //     });
  //   },
  // },
  // {
  //   path: "/communication/",
  //   async({ resolve }) {
  //     const vueComponent = () => import("../pages/communication.vue");
  //     vueComponent().then((vc) => {
  //       resolve({
  //         component: vc.default,
  //         options: {
  //           roles: [Role.TEACHER],
  //         }
  //       });
  //     });
  //   },
  // },
  // {
  //   path: "/students/",
  //   async({ resolve }) {
  //     const vueComponent = () => import("../pages/students.vue");
  //     vueComponent().then((vc) => {
  //       resolve({
  //         component: vc.default,
  //         options: {
  //           roles: [Role.ADMIN],
  //         }
  //       });
  //     });
  //   },
  // },
  // {
  //   path: "/teachers/",
  //   async({ resolve }) {
  //     const vueComponent = () => import("../pages/teachers.vue");
  //     vueComponent().then((vc) => {
  //       resolve({
  //         component: vc.default,
  //         options: {
  //           roles: [Role.ADMIN],
  //         }
  //       });
  //     });
  //   },
  // },
  // {
  //   path: "/parents/",
  //   async({ resolve }) {
  //     const vueComponent = () => import("../pages/parents.vue");
  //     vueComponent().then((vc) => {
  //       resolve({
  //         component: vc.default,
  //         options: {
  //           roles: [Role.ADMIN],
  //         }
  //       });
  //     });
  //   },
  // },
  // {
  //   path: "/settings/",
  //   async({ resolve }) {
  //     const vueComponent = () => import("../pages/settings.vue");
  //     vueComponent().then((vc) => {
  //       resolve({
  //         component: vc.default,
  //         options: {
  //           roles: [Role.ADMIN],
  //         }
  //       });
  //     });
  //   },
  // },
  // {
  //   path: "/profile/",
  //   async({ resolve }) {
  //     const vueComponent = () => import("../pages/profile.vue");
  //     vueComponent().then((vc) => {
  //       resolve({
  //         component: vc.default,
  //         options: {
  //           roles: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
  //         }
  //       });
  //     });
  //   },
  // },
  {
    path: "/login",
    async({ resolve }) {
      const vueComponent = () => import("../pages/login.vue");
      vueComponent().then((vc) => {
        resolve({ component: vc.default });
      });
    },
  },
  {
    path: "/register",
    async({ resolve }) {
      const vueComponent = () => import("../pages/register.vue");
      vueComponent().then((vc) => {
        resolve({ component: vc.default });
      });
    },
  },
  {
    path: "/restore-password",
    async({ resolve }) {
      const vueComponent = () => import("../pages/restore-password.vue");
      vueComponent().then((vc) => {
        resolve({ component: vc.default });
      });
    },
  },
  {
    path: "(.*)",
    component: NotFoundPage,
  },
];

export default routes;
