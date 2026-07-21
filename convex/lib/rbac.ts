import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";

export function isPermissionActive(
  activeFrom: number | undefined,
  activeTo: number | undefined,
  now: number
): boolean {
  if (activeFrom !== undefined && now < activeFrom) return false;
  if (activeTo !== undefined && now > activeTo) return false;
  return true;
}

export function hasRoleAccess(userRoles: string[], allowedRoles: string[]): boolean {
  return userRoles.some((r) => allowedRoles.includes(r));
}

export async function getAdminUsers(ctx: QueryCtx | MutationCtx) {
  const allUsers = await ctx.db.query("users").collect();
  return allUsers.filter((u) => u.roles.includes("ADMIN"));
}

export async function requirePermission(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  resource: string,
  action: "navigate" | "read" | "write"
): Promise<void> {
  const user = await ctx.db.get(userId);
  if (!user) throw new ConvexError({ code: "UNAUTHORIZED" });

  const rule = await ctx.db
    .query("permissions")
    .withIndex("by_resource_action", (q) =>
      q.eq("resource", resource).eq("action", action)
    )
    .unique();

  if (!rule) throw new ConvexError({ code: "PERMISSION_NOT_DEFINED" });

  if (!hasRoleAccess(user.roles, rule.roles as string[]))
    throw new ConvexError({ code: "FORBIDDEN" });

  if (!isPermissionActive(rule.activeFrom, rule.activeTo, Date.now()))
    throw new ConvexError({ code: "PERMISSION_EXPIRED_OR_NOT_YET_ACTIVE" });
}
