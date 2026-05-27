import { Role } from "../types/user";
import { useUserStore } from "../stores/userStore";
import { f7 } from "framework7-vue";

export interface RouteGuard {
  roles: Role[];
  redirect?: string;
}

export function useRouteGuard() {
  const userStore = useUserStore();

  const guardRoute = (guard: RouteGuard): boolean => {
    if (guard.roles.length === 0) {
      return true;
    }

    const hasAccess =
      userStore.isAuthenticated && userStore.hasAnyRole(guard.roles);

    if (!hasAccess) {
      const redirectPath = guard.redirect || "/";
      f7.views.main.router.navigate(redirectPath);
      return false;
    }

    return true;
  };

  return {
    guardRoute,
  };
}
