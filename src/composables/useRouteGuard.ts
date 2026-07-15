import { canNavigateGlobal } from "./useRBAC";
import { f7 } from "framework7-vue";

export interface RouteGuard {
  resource: string;
  redirect?: string;
}

/**
 * Route guard helper.
 *
 * Uses the singleton `canNavigateGlobal` from useRBAC — no Vue composable
 * lifecycle is invoked, making this safe to call from route middleware or any
 * non-component context without creating subscriptions or watcher leaks.
 */
export function useRouteGuard() {
  const guardRoute = (guard: RouteGuard): boolean => {
    if (canNavigateGlobal(guard.resource)) return true;

    const redirectPath = guard.redirect ?? "/home";
    f7.views.main.router.navigate(redirectPath);
    return false;
  };

  return { guardRoute };
}
