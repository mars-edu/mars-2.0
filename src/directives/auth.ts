import type { Directive, DirectiveBinding } from "vue";
import { useUserStore, Role } from "../stores/userStore";

/**
 * Custom directive for role-based authorization in templates
 *
 * Usage:
 * v-auth="'ADMIN'" - Requires ADMIN role
 * v-auth="['ADMIN', 'TEACHER']" - Requires either ADMIN or TEACHER role
 * v-auth.not="'STUDENT'" - Requires NOT having STUDENT role
 */

export const vAuth: Directive = {
  beforeMount(el: HTMLElement, binding: DirectiveBinding) {
    const userStore = useUserStore();
    const { value, modifiers } = binding;
    let requiredRoles: Role[] = [];

    // Convert string role to array for consistent handling
    if (typeof value === "string") {
      requiredRoles = [value as Role];
    } else if (Array.isArray(value)) {
      requiredRoles = value as Role[];
    }

    // Handle negation modifier
    if (modifiers.not) {
      // Show element if user doesn't have ANY of the specified roles
      const shouldHide = requiredRoles.some((role) => userStore.hasRole(role));

      if (shouldHide) {
        el.style.display = "none";
      }
    } else {
      // Show element if user has ANY of the specified roles
      const shouldShow =
        requiredRoles.length === 0 ||
        requiredRoles.some((role) => userStore.hasRole(role));

      if (!shouldShow) {
        el.style.display = "none";
      }
    }
  },
};

export default vAuth;
