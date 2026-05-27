import { useRBAC } from "./useRBAC";
import { f7 } from "framework7-vue";

export interface RouteGuard {
  resource: string;
  redirect?: string;
}

export function useRouteGuard() {
  const { canNavigate } = useRBAC();

  const guardRoute = (guard: RouteGuard): boolean => {
    if (canNavigate(guard.resource)) return true;

    const redirectPath = guard.redirect ?? "/home";
    f7.views.main.router.navigate(redirectPath);
    return false;
  };

  return { guardRoute };
}
