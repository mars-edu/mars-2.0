import { useUserStore } from "../stores/userStore";
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
        resource?: string;
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

  // Check if route requires a resource permission
  const resource = to.route.options?.resource;

  // If no resource is required, allow access (auth-only routes handled by createAuthGuard)
  if (!resource) {
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

  // Check resource-based access
  const hasAccess = guardRoute({ resource });
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
