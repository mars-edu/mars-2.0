import { mutation, internalMutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { requirePermission } from "../lib/rbac";
import { roleValidator } from "../lib/validators";

const SEED_DATA = [
  { resource: "home", action: "navigate", roles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"] },
  { resource: "journals", action: "navigate", roles: ["ADMIN", "TEACHER"] },
  { resource: "journals", action: "read", roles: ["ADMIN", "TEACHER"] },
  { resource: "journals", action: "write", roles: ["ADMIN", "TEACHER"] },
  { resource: "planning", action: "navigate", roles: ["ADMIN", "TEACHER"] },
  { resource: "protocol", action: "navigate", roles: ["ADMIN", "TEACHER"] },
  { resource: "reports", action: "navigate", roles: ["ADMIN", "TEACHER"] },
  { resource: "rup", action: "navigate", roles: ["ADMIN", "TEACHER"] },
  { resource: "schedule", action: "navigate", roles: ["ADMIN", "TEACHER"] },
  { resource: "analytics", action: "navigate", roles: ["ADMIN"] },
  { resource: "analytics", action: "read", roles: ["ADMIN"] },
  { resource: "workload", action: "navigate", roles: ["ADMIN"] },
  { resource: "timetable", action: "navigate", roles: ["ADMIN"] },
  { resource: "cabinet-management", action: "navigate", roles: ["ADMIN"] },
  { resource: "specialty-catalog", action: "navigate", roles: ["ADMIN"] },
  { resource: "discipline-catalog", action: "navigate", roles: ["ADMIN"] },
  { resource: "student-card", action: "navigate", roles: ["ADMIN"] },
  { resource: "teacher-card", action: "navigate", roles: ["ADMIN"] },
  { resource: "marks", action: "read", roles: ["ADMIN", "TEACHER"] },
  { resource: "marks", action: "write", roles: ["ADMIN", "TEACHER"] },
  { resource: "users", action: "write", roles: ["ADMIN"] },
  { resource: "substitutions", action: "write", roles: ["ADMIN"] },
  { resource: "settings", action: "navigate", roles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"] },
] as const;

export const seedPermissions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("permissions").first();
    if (existing) return { skipped: true };

    for (const entry of SEED_DATA) {
      await ctx.db.insert("permissions", {
        resource: entry.resource,
        action: entry.action,
        roles: [...entry.roles],
      });
    }

    return { seeded: SEED_DATA.length };
  },
});

export const createPermission = mutation({
  args: {
    changedBy: v.id("users"),
    resource: v.string(),
    action: v.union(v.literal("navigate"), v.literal("read"), v.literal("write")),
    roles: v.array(roleValidator),
    description: v.optional(v.string()),
    activeFrom: v.optional(v.number()),
    activeTo: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, args.changedBy, "users", "write");

    const { changedBy, ...data } = args;
    const permissionId = await ctx.db.insert("permissions", data);

    await ctx.db.insert("permissionHistory", {
      permissionId,
      resource: args.resource,
      action: args.action,
      changedBy,
      changedAt: Date.now(),
      previousRoles: [],
      newRoles: args.roles,
      newActiveFrom: args.activeFrom,
      newActiveTo: args.activeTo,
      changeType: "created",
    });

    return permissionId;
  },
});

export const updatePermission = mutation({
  args: {
    changedBy: v.id("users"),
    permissionId: v.id("permissions"),
    roles: v.optional(v.array(roleValidator)),
    description: v.optional(v.string()),
    activeFrom: v.optional(v.number()),
    activeTo: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, args.changedBy, "users", "write");

    const existing = await ctx.db.get(args.permissionId);
    if (!existing) throw new ConvexError({ code: "NOT_FOUND" });

    const patch: Record<string, unknown> = {};
    if (args.roles !== undefined) patch.roles = args.roles;
    if (args.description !== undefined) patch.description = args.description;
    if (args.activeFrom !== undefined) patch.activeFrom = args.activeFrom;
    if (args.activeTo !== undefined) patch.activeTo = args.activeTo;

    await ctx.db.patch(args.permissionId, patch);

    await ctx.db.insert("permissionHistory", {
      permissionId: args.permissionId,
      resource: existing.resource,
      action: existing.action,
      changedBy: args.changedBy,
      changedAt: Date.now(),
      previousRoles: existing.roles,
      newRoles: args.roles ?? existing.roles,
      previousActiveFrom: existing.activeFrom,
      previousActiveTo: existing.activeTo,
      newActiveFrom: args.activeFrom ?? existing.activeFrom,
      newActiveTo: args.activeTo ?? existing.activeTo,
      changeType: "updated",
    });
  },
});

export const deletePermission = mutation({
  args: {
    changedBy: v.id("users"),
    permissionId: v.id("permissions"),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, args.changedBy, "users", "write");

    const existing = await ctx.db.get(args.permissionId);
    if (!existing) throw new ConvexError({ code: "NOT_FOUND" });

    await ctx.db.delete(args.permissionId);

    await ctx.db.insert("permissionHistory", {
      permissionId: args.permissionId,
      resource: existing.resource,
      action: existing.action,
      changedBy: args.changedBy,
      changedAt: Date.now(),
      previousRoles: existing.roles,
      newRoles: [],
      previousActiveFrom: existing.activeFrom,
      previousActiveTo: existing.activeTo,
      changeType: "deleted",
    });
  },
});
