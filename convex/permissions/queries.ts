import { query } from "../_generated/server";
import { v } from "convex/values";
import { isPermissionActive, hasRoleAccess } from "../lib/rbac";

export const getMyPermissions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return [];

    const now = Date.now();
    const all = await ctx.db.query("permissions").collect();

    return all
      .filter(
        (p) =>
          p.action === "navigate" &&
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
