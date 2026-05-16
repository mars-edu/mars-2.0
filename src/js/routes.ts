import { Role } from "../types/user";
import type { Router } from "framework7/types";
import NotFoundPage from "../pages/404.vue";
import { useUserStore } from "../stores/userStore";

type RouteConfig = Router.RouteParameters & {
  options?: {
    roles?: Role[];
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

    console.log("[Routes] Guest guard check:", {
      path: ctx.to.url,
      isAuthenticated: userStore.isAuthenticated,
      hasToken: !!hasToken,
    });

    // If already authenticated, redirect to home
    if (userStore.isAuthenticated) {
      console.log("[Routes] User already authenticated, redirecting to home");
      ctx.router.navigate("/home", { reloadCurrent: true, clearPreviousHistory: true });
      ctx.reject();
      return;
    }

    // If we have a token but user store isn't authenticated yet, initialize it
    if (hasToken && !userStore.isAuthenticated) {
      console.log("[Routes] Token found, initializing user store...");
      userStore.initialize().then(() => {
        console.log("[Routes] User store initialized, authenticated:", userStore.isAuthenticated);

        if (userStore.isAuthenticated) {
          // User is authenticated, redirect to home
          console.log("[Routes] Redirecting authenticated user to home");
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
 * Checks authentication and role-based access.
 * Preserves the intended destination URL on redirect to login.
 */
function createAuthGuard(roles?: Role[]) {
  return (ctx: Router.RouteCallbackCtx) => {
    const userStore = useUserStore();
    const hasToken = localStorage.getItem("auth_token");

    console.log("[Routes] Auth guard check:", {
      path: ctx.to.url,
      isAuthenticated: userStore.isAuthenticated,
      hasToken: !!hasToken,
      requiredRoles: roles,
      userRoles: userStore.currentUser?.roles,
    });

    // If we have a token but user store isn't authenticated yet, initialize it
    if (!userStore.isAuthenticated && hasToken) {
      console.log("[Routes] Waiting for user store initialization...");
      userStore.initialize().then(() => {
        console.log("[Routes] User store initialized, rechecking auth:", userStore.isAuthenticated);

        if (!userStore.isAuthenticated) {
          // Token was invalid, redirect to login
          const redirectUrl = `/login?redirect=${encodeURIComponent(ctx.to.url)}`;
          console.log("[Routes] Token invalid, redirecting to:", redirectUrl);
          ctx.router.navigate(redirectUrl, { reloadCurrent: true, clearPreviousHistory: true });
          ctx.reject();
          return;
        }

        // Check role-based access
        if (roles && roles.length > 0) {
          const hasAccess = userStore.hasAnyRole(roles);
          if (!hasAccess) {
            console.log("[Routes] Insufficient permissions, redirecting to home");
            ctx.router.navigate("/home", { reloadCurrent: true });
            ctx.reject();
            return;
          }
        }

        // User is authenticated and has access
        ctx.resolve();
      });
      return;
    }

    if (!userStore.isAuthenticated) {
      // No token, redirect to login with the intended destination
      const redirectUrl = `/login?redirect=${encodeURIComponent(ctx.to.url)}`;
      console.log("[Routes] Not authenticated, redirecting to:", redirectUrl);
      ctx.router.navigate(redirectUrl, { reloadCurrent: true, clearPreviousHistory: true });
      ctx.reject();
      return;
    }

    // Check role-based access if roles are specified
    if (roles && roles.length > 0) {
      const hasAccess = userStore.hasAnyRole(roles);
      if (!hasAccess) {
        console.log("[Routes] Insufficient permissions, redirecting to home");
        ctx.router.navigate("/home", { reloadCurrent: true });
        ctx.reject();
        return;
      }
    }

    // User is authenticated and has access
    ctx.resolve();
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
    beforeEnter: [createAuthGuard([Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT])],
    options: {
      roles: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
    },
  },
  {
    path: "/notifications",
    asyncComponent: () => import("../pages/suspense/NotificationsPage.vue"),
    beforeEnter: [createAuthGuard([Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT])],
    options: {
      roles: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
    },
  },
  {
    path: "/planning",
    asyncComponent: () => import("../pages/suspense/PlanningPage.vue"),
    beforeEnter: [createAuthGuard([Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT])],
    options: {
      roles: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
    },
  },
  {
    path: "/protocol",
    asyncComponent: () => import("../pages/suspense/ProtocolPage.vue"),
    beforeEnter: [createAuthGuard([Role.ADMIN, Role.TEACHER])],
    options: {
      roles: [Role.ADMIN, Role.TEACHER],
    },
  },
  {
    path: "/rup",
    asyncComponent: () => import("../pages/suspense/RupPage.vue"),
    beforeEnter: [createAuthGuard([Role.ADMIN, Role.TEACHER])],
    options: {
      roles: [Role.ADMIN, Role.TEACHER],
    },
  },
  {
    path: "/specialty-catalog",
    asyncComponent: () => import("../pages/suspense/SpecialtyCatalogPage.vue"),
    beforeEnter: [createAuthGuard([Role.ADMIN, Role.TEACHER])],
    options: {
      roles: [Role.ADMIN, Role.TEACHER],
    },
  },
  {
    path: "/student-card",
    asyncComponent: () => import("../pages/suspense/StudentCardPage.vue"),
    beforeEnter: [createAuthGuard([Role.ADMIN, Role.TEACHER])],
    options: {
      roles: [Role.ADMIN, Role.TEACHER],
    },
  },
  {
    path: "/teacher-card",
    asyncComponent: () => import("../pages/suspense/TeacherCardPage.vue"),
    beforeEnter: [createAuthGuard([Role.ADMIN, Role.TEACHER])],
    options: {
      roles: [Role.ADMIN, Role.TEACHER],
    },
  },
  {
    path: "/discipline-catalog",
    asyncComponent: () => import("../pages/suspense/DisciplineCatalogPage.vue"),
    beforeEnter: [createAuthGuard([Role.ADMIN, Role.TEACHER])],
    options: {
      roles: [Role.ADMIN, Role.TEACHER],
    },
  },
  {
    path: "/journals",
    asyncComponent: () => import("../pages/suspense/JournalsPage.vue"),
    beforeEnter: [createAuthGuard([Role.ADMIN, Role.TEACHER])],
    options: {
      roles: [Role.ADMIN, Role.TEACHER],
    },
  },
  {
    path: "/journals/:id",
    asyncComponent: () => import("../pages/suspense/JournalDetailsPage.vue"),
    beforeEnter: [createAuthGuard([Role.ADMIN, Role.TEACHER])],
    options: {
      roles: [Role.ADMIN, Role.TEACHER],
    },
  },
  {
    path: "/settings",
    asyncComponent: () => import("../pages/suspense/SettingsPage.vue"),
    beforeEnter: [createAuthGuard([Role.ADMIN])],
    options: {
      roles: [Role.ADMIN],
    },
  },
  {
    path: "/education-schedule",
    asyncComponent: () => import("../pages/suspense/EducationSchedulePage.vue"),
    beforeEnter: [createAuthGuard([Role.ADMIN])],
    options: {
      roles: [Role.ADMIN],
    },
  },
  {
    path: "/analytics",
    asyncComponent: () => import("../pages/suspense/AnalyticsPage.vue"),
    beforeEnter: [createAuthGuard([Role.ADMIN])],
    options: {
      roles: [Role.ADMIN],
    },
  },
  {
    path: "/reports",
    asyncComponent: () => import("../pages/suspense/ReportsPage.vue"),
    beforeEnter: [createAuthGuard([Role.ADMIN])],
    options: {
      roles: [Role.ADMIN],
    },
  },
  {
    path: "/workload-management",
    asyncComponent: () => import("../pages/suspense/WorkloadManagementPage.vue"),
    beforeEnter: [createAuthGuard([Role.ADMIN])],
    options: {
      roles: [Role.ADMIN],
    },
  },
  {
    path: "/profile",
    asyncComponent: () => import("../pages/suspense/ProfilePage.vue"),
    beforeEnter: [createAuthGuard([Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT])],
    options: {
      roles: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
    },
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
