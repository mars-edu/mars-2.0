import { Role } from "../stores/userStore";
import type { Router } from "framework7/types";
import HomePage from "../pages/home.vue";
import NotFoundPage from "../pages/404.vue";
import LoginPage from "../pages/login.vue";
import PlanningPage from "../views/PlanningPage.vue";

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
  //   async: true,
  //   asyncComponent: async () => {
  //     const { default: CreateCoursePage } = await import(
  //       "../pages/create-course.vue"
  //     );
  //     return {
  //       component: CreateCoursePage,
  //       options: {
  //         props: {
  //           roles: [Role.TEACHER],
  //         },
  //       },
  //     };
  //   },
  // },
  // {
  //   path: "/room-booking/",
  //   async: true,
  //   asyncComponent: async () => {
  //     const { default: RoomBookingPage } = await import(
  //       "../pages/room-booking.vue"
  //     );
  //     return {
  //       component: RoomBookingPage,
  //       options: {
  //         props: {
  //           roles: [Role.TEACHER],
  //         },
  //       },
  //     };
  //   },
  // },
  // {
  //   path: "/rup/",
  //   async: true,
  //   asyncComponent: async () => {
  //     const { default: RupPage } = await import("../pages/rup.vue");
  //     return {
  //       component: RupPage,
  //       options: {
  //         props: {
  //           roles: [Role.TEACHER],
  //         },
  //       },
  //     };
  //   },
  // },
  // {
  //   path: "/institution-info/",
  //   async: true,
  //   asyncComponent: async () => {
  //     const { default: InstitutionInfoPage } = await import(
  //       "../pages/institution-info.vue"
  //     );
  //     return {
  //       component: InstitutionInfoPage,
  //       options: {
  //         props: {
  //           roles: [Role.TEACHER],
  //         },
  //       },
  //     };
  //   },
  // },
  // {
  //   path: "/testing/",
  //   async: true,
  //   asyncComponent: async () => {
  //     const { default: TestingPage } = await import("../pages/testing.vue");
  //     return {
  //       component: TestingPage,
  //       options: {
  //         props: {
  //           roles: [Role.TEACHER],
  //         },
  //       },
  //     };
  //   },
  // },
  // {
  //   path: "/library/",
  //   async: true,
  //   asyncComponent: async () => {
  //     const { default: LibraryPage } = await import("../pages/library.vue");
  //     return {
  //       component: LibraryPage,
  //       options: {
  //         props: {
  //           roles: [Role.TEACHER],
  //         },
  //       },
  //     };
  //   },
  // },
  // {
  //   path: "/education-schedule/",
  //   async: true,
  //   asyncComponent: async () => {
  //     const { default: EducationSchedulePage } = await import(
  //       "../pages/education-schedule.vue"
  //     );
  //     return {
  //       component: EducationSchedulePage,
  //       options: {
  //         props: {
  //           roles: [Role.TEACHER],
  //         },
  //       },
  //     };
  //   },
  // },
  // {
  //   path: "/report-editor/",
  //   async: true,
  //   asyncComponent: async () => {
  //     const { default: ReportEditorPage } = await import(
  //       "../pages/report-editor.vue"
  //     );
  //     return {
  //       component: ReportEditorPage,
  //       options: {
  //         props: {
  //           roles: [Role.TEACHER],
  //         },
  //       },
  //     };
  //   },
  // },
  // {
  //   path: "/communication/",
  //   async: true,
  //   asyncComponent: async () => {
  //     const { default: CommunicationPage } = await import(
  //       "../pages/communication.vue"
  //     );
  //     return {
  //       component: CommunicationPage,
  //       options: {
  //         props: {
  //           roles: [Role.TEACHER],
  //         },
  //       },
  //     };
  //   },
  // },
  // {
  //   path: "/students/",
  //   async: true,
  //   asyncComponent: async () => {
  //     const { default: StudentsPage } = await import("../pages/students.vue");
  //     return {
  //       component: StudentsPage,
  //       options: {
  //         props: {
  //           roles: [Role.ADMIN],
  //         },
  //       },
  //     };
  //   },
  // },
  // {
  //   path: "/teachers/",
  //   async: true,
  //   asyncComponent: async () => {
  //     const { default: TeachersPage } = await import("../pages/teachers.vue");
  //     return {
  //       component: TeachersPage,
  //       options: {
  //         props: {
  //           roles: [Role.ADMIN],
  //         },
  //       },
  //     };
  //   },
  // },
  // {
  //   path: "/parents/",
  //   async: true,
  //   asyncComponent: async () => {
  //     const { default: ParentsPage } = await import("../pages/parents.vue");
  //     return {
  //       component: ParentsPage,
  //       options: {
  //         props: {
  //           roles: [Role.ADMIN],
  //         },
  //       },
  //     };
  //   },
  // },
  // {
  //   path: "/settings/",
  //   async: true,
  //   asyncComponent: async () => {
  //     const { default: SettingsPage } = await import("../pages/settings.vue");
  //     return {
  //       component: SettingsPage,
  //       options: {
  //         props: {
  //           roles: [Role.ADMIN],
  //         },
  //       },
  //     };
  //   },
  // },
  // {
  //   path: "/profile/",
  //   async: true,
  //   asyncComponent: async () => {
  //     const { default: ProfilePage } = await import("../pages/profile.vue");
  //     return {
  //       component: ProfilePage,
  //       options: {
  //         props: {
  //           roles: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
  //         },
  //       },
  //     };
  //   },
  // },
  {
    path: "/login",
    component: LoginPage,
  },
  {
    path: "(.*)",
    component: NotFoundPage,
  },
];

export default routes;
