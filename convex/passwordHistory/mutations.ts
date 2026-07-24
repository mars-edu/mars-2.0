import { internalMutation } from "../functions";
import { v } from "convex/values";

/**
 * Internal mutation to log a password change
 */
export const logPasswordChange = internalMutation({
  args: {
    userId: v.id("users"),
    changedBy: v.optional(v.id("users")),
    changeType: v.union(
      v.literal("regenerated"),
      v.literal("reset"),
      v.literal("initial")
    ),
    teacherId: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const historyId = await ctx.db.insert("passwordChangeHistory", {
      userId: args.userId,
      changedBy: args.changedBy,
      changeType: args.changeType,
      teacherId: args.teacherId,
      notes: args.notes,
      });
    return historyId;
  },
});
