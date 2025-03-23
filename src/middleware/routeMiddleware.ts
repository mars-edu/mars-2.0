import { useUserStore, Role } from "../stores/userStore";
import { useRouteGuard } from "../composables/useRouteGuard";

interface RouteParams {
  router: {
    app: any;
    views: {
      main: {
        router: {
          navigate: (url: string) => void;
        };
      };
    };
  };
  to: {
    route: {
      options?: {
        roles?: Role[];
      };
    };
    url: string;
  };
  resolve: (redirect?: { url: string; options?: any }) => void;
  reject: () => void;
}

export function routeMiddleware({ router, to, resolve, reject }: RouteParams) {
  const userStore = useUserStore();
  const { guardRoute } = useRouteGuard();

  // Check if route requires authentication
  const roles = to.route.options?.roles || [];

  // If no roles are required, allow access
  if (roles.length === 0) {
    resolve();
    return;
  }

  // If user is not authenticated, redirect to login
  if (!userStore.isAuthenticated) {
    resolve({
      url: "/login/",
      options: {
        props: {
          redirectTo: to.url,
        },
      },
    });
    return;
  }

  // Check role-based access
  const hasAccess = guardRoute({ roles });
  if (!hasAccess) {
    // Access denied - redirect to home or show error
    resolve({
      url: "/",
    });
    return;
  }

  // Allow access
  resolve();
}
