import { query } from "../functions";
import { v } from "convex/values";
import { isPermissionActive, hasRoleAccess } from "../lib/rbac";

export const getMyPermissions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return [];

    const now = Date.now();
    const navigatePerms = await ctx.db
      .query("permissions")
      .withIndex("by_action", (q) => q.eq("action", "navigate"))
      .collect();

    return navigatePerms
      .filter(
        (p) =>
          hasRoleAccess(user.roles, p.roles as string[]) &&
          isPermissionActive(p.activeFrom, p.activeTo, now)
      )
      .map((p) => p.resource);
  },
});

export const getPermissionHistory = query({
  args: { permissionId: v.id("permissions") },
  handler: async (ctx, { permissionId }) => {
    return await ctx.db
      .query("permissionHistory")
      .withIndex("by_permission", (q) => q.eq("permissionId", permissionId))
      .order("desc")
      .collect();
  },
});

export const getAllPermissions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("permissions").collect();
  },
});
