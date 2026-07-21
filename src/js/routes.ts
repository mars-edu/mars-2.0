import type { Router } from "framework7/types";
import NotFoundPage from "../pages/404.vue";
import { useUserStore } from "../stores/userStore";
import { convex } from "../lib/convexClient";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

type RouteConfig = Router.RouteParameters & {
  options?: {
    resource?: string;
  };
};

/**
 * Route guard for public routes (login, register, etc).
 * Redirects authenticated users to home page.
 */
function createGuestGuard() {
  return (ctx: Router.RouteCallbackCtx) => {
    const userStore = useUserStore();
    const hasToken = localStorage.getItem("auth_token");

    // If already authenticated, redirect to home
    if (userStore.isAuthenticated) {
      ctx.router.navigate("/home", { reloadCurrent: true, clearPreviousHistory: true });
      ctx.reject();
      return;
    }

    // If we have a token but user store isn't authenticated yet, initialize it
    if (hasToken && !userStore.isAuthenticated) {
      userStore.initialize().then(() => {
        if (userStore.isAuthenticated) {
          // User is authenticated, redirect to home
          ctx.router.navigate("/home", { reloadCurrent: true, clearPreviousHistory: true });
          ctx.reject();
          return;
        }

        // Token was invalid or user not authenticated, allow access to login
        ctx.resolve();
      });
      return;
    }

    // No token and not authenticated, allow access
    ctx.resolve();
  };
}

/**
 * Route guard for protected routes.
 * Checks authentication and resource-based access permissions.
 * Preserves the intended destination URL on redirect to login.
 */
function createAuthGuard(resource?: string) {
  return (ctx: Router.RouteCallbackCtx) => {
    const userStore = useUserStore();
    const hasToken = localStorage.getItem("auth_token");

    const checkResource = async () => {
      if (!resource) return true;
      const userId = userStore.currentUser?.id;
      if (!userId) return false;
      const permissions = await convex.query(
        api.permissions.queries.getMyPermissions,
        { userId: userId as Id<"users"> }
      );
      return permissions.includes(resource);
    };

    if (!userStore.isAuthenticated && hasToken) {
      userStore.initialize().then(async () => {
        if (!userStore.isAuthenticated) {
          const redirectUrl = `/login?redirect=${encodeURIComponent(ctx.to.url)}`;
          ctx.router.navigate(redirectUrl, { reloadCurrent: true, clearPreviousHistory: true });
          ctx.reject();
          return;
        }

        const hasAccess = await checkResource();
        if (!hasAccess) {
          ctx.router.navigate("/home", { reloadCurrent: true });
          ctx.reject();
          return;
        }

        ctx.resolve();
      });
      return;
    }

    if (!userStore.isAuthenticated) {
      const redirectUrl = `/login?redirect=${encodeURIComponent(ctx.to.url)}`;
      ctx.router.navigate(redirectUrl, { reloadCurrent: true, clearPreviousHistory: true });
      ctx.reject();
      return;
    }

    checkResource().then((hasAccess) => {
      if (!hasAccess) {
        ctx.router.navigate("/home", { reloadCurrent: true });
        ctx.reject();
        return;
      }
      ctx.resolve();
    });
  };
}

const routes: RouteConfig[] = [
  // Root route - redirect to login
  {
    path: "/",
    redirect: "/login",
  },
  {
    path: "/home",
    asyncComponent: () => import("../pages/suspense/HomePage.vue"),
    beforeEnter: [createAuthGuard()],
  },
  {
    path: "/notifications",
    asyncComponent: () => import("../pages/suspense/NotificationsPage.vue"),
    beforeEnter: [createAuthGuard()],
  },
  {
    path: "/planning",
    asyncComponent: () => import("../pages/suspense/PlanningPage.vue"),
    beforeEnter: [createAuthGuard("planning")],
  },
  {
    path: "/protocol",
    asyncComponent: () => import("../pages/suspense/ProtocolPage.vue"),
    beforeEnter: [createAuthGuard("protocol")],
  },
  {
    path: "/rup",
    asyncComponent: () => import("../pages/suspense/RupPage.vue"),
    beforeEnter: [createAuthGuard("rup")],
  },
  {
    path: "/specialty-catalog",
    asyncComponent: () => import("../pages/suspense/SpecialtyCatalogPage.vue"),
    beforeEnter: [createAuthGuard("specialty-catalog")],
  },
  {
    path: "/student-card",
    asyncComponent: () => import("../pages/suspense/StudentCardPage.vue"),
    beforeEnter: [createAuthGuard("student-card")],
  },
  {
    path: "/teacher-card",
    asyncComponent: () => import("../pages/suspense/TeacherCardPage.vue"),
    beforeEnter: [createAuthGuard("teacher-card")],
  },
  {
    path: "/discipline-catalog",
    asyncComponent: () => import("../pages/suspense/DisciplineCatalogPage.vue"),
    beforeEnter: [createAuthGuard("discipline-catalog")],
  },
  {
    path: "/journals",
    asyncComponent: () => import("../pages/suspense/JournalsPage.vue"),
    beforeEnter: [createAuthGuard("journals")],
  },
  {
    path: "/journals/:id",
    asyncComponent: () => import("../pages/suspense/JournalDetailsPage.vue"),
    beforeEnter: [createAuthGuard("journals")],
  },
  {
    path: "/testing",
    asyncComponent: () => import("../pages/suspense/TestingPage.vue"),
    beforeEnter: [createAuthGuard("testing")],
  },
  {
    path: "/settings",
    asyncComponent: () => import("../pages/suspense/SettingsPage.vue"),
    beforeEnter: [createAuthGuard("settings")],
  },
  {
    path: "/education-schedule",
    asyncComponent: () => import("../pages/suspense/EducationSchedulePage.vue"),
    beforeEnter: [createAuthGuard("schedule")],
  },
  {
    path: "/analytics",
    asyncComponent: () => import("../pages/suspense/AnalyticsPage.vue"),
    beforeEnter: [createAuthGuard("analytics")],
  },
  {
    path: "/reports",
    asyncComponent: () => import("../pages/suspense/ReportsPage.vue"),
    beforeEnter: [createAuthGuard("reports")],
  },
  {
    path: "/workload-management",
    asyncComponent: () => import("../pages/suspense/WorkloadManagementPage.vue"),
    beforeEnter: [createAuthGuard("workload")],
  },
  {
    path: "/cabinet-management",
    asyncComponent: () => import("../pages/suspense/CabinetManagementPage.vue"),
    beforeEnter: [createAuthGuard("cabinet-management")],
  },
  {
    path: "/ktp",
    asyncComponent: () => import("../pages/suspense/KtpPage.vue"),
    beforeEnter: [createAuthGuard("rup")],
  },
  {
    path: "/profile",
    asyncComponent: () => import("../pages/suspense/ProfilePage.vue"),
    beforeEnter: [createAuthGuard()],
  },
  // Dev/demo routes
  {
    path: "/datepicker-demo",
    asyncComponent: () => import("../pages/suspense/DatepickerDemoPage.vue"),
  },
  // Public routes - no auth required, but redirect if already authenticated
  {
    path: "/login",
    asyncComponent: () => import("../pages/suspense/LoginPage.vue"),
    beforeEnter: [createGuestGuard()],
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
