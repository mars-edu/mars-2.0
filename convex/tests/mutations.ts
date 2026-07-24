import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createTest = mutation({
  args: {
    title: v.string(),
    subject: v.string(),
    questionsCount: v.number(),
    duration: v.number(),
    questions: v.optional(v.array(v.object({
      id: v.string(),
      text: v.string(),
      options: v.array(v.string()),
      correctIndex: v.number(),
    }))),
    isPractice: v.optional(v.boolean()),
    shuffleQuestions: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const testId = await ctx.db.insert("tests", {
      ...args,
      createdBy: user._id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return testId;
  },
});

export const updateTest = mutation({
  args: {
    id: v.id("tests"),
    title: v.optional(v.string()),
    subject: v.optional(v.string()),
    questionsCount: v.optional(v.number()),
    duration: v.optional(v.number()),
    questions: v.optional(v.array(v.object({
      id: v.string(),
      text: v.string(),
      options: v.array(v.string()),
      correctIndex: v.number(),
    }))),
    isPractice: v.optional(v.boolean()),
    shuffleQuestions: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const deleteTest = mutation({
  args: { id: v.id("tests") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const assignTest = mutation({
  args: {
    testId: v.id("tests"),
    journalId: v.id("journals"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    const assignmentId = await ctx.db.insert("testAssignments", {
      testId: args.testId,
      journalId: args.journalId,
      status: "active",
      date: args.date,
      createdBy: user?._id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return assignmentId;
  },
});
