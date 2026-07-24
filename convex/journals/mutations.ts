import { mutation } from "../functions";
import { v } from "convex/values";
import { createTimestamps, updateTimestamp } from "../lib/validators";

/**
 * Create a journal
 */
export const create = mutation({
  args: {
    calendarEventId: v.optional(v.string()),
    disciplineId: v.string(),
    groupName: v.optional(v.string()),
    academicYearId: v.string(),
    semesterId: v.string(),
    isMixedGroup: v.optional(v.boolean()),
    isIndividualJournal: v.optional(v.boolean()),
    mergedJournalIds: v.optional(v.array(v.string())),
    parentIndividualJournalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const timestamps = createTimestamps();
    return await ctx.db.insert("journals", {
      ...args,
      semesterId: args.semesterId as any,
      ...timestamps,
    });
  },
});

/**
 * Update a journal
 */
export const update = mutation({
  args: {
    id: v.id("journals"),
    calendarEventId: v.optional(v.string()),
    disciplineId: v.optional(v.string()),
    groupName: v.optional(v.string()),
    isMixedGroup: v.optional(v.boolean()),
    isIndividualJournal: v.optional(v.boolean()),
    mergedJournalIds: v.optional(v.array(v.string())),
    parentIndividualJournalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(id, {
      ...cleanUpdates,
      });

    return await ctx.db.get(id);
  },
});

/**
 * Delete a journal
 */
export const remove = mutation({
  args: { id: v.id("journals") },
  handler: async (ctx, args) => {
    // Delete associated journal students
    const students = await ctx.db
      .query("journalStudents")
      .withIndex("by_journal", (q) => q.eq("journalId", args.id))
      .collect();

    for (const student of students) {
      await ctx.db.delete(student._id);
    }

    // Delete associated marks
    const marks = await ctx.db
      .query("marks")
      .withIndex("by_journal", (q) => q.eq("journalId", args.id))
      .collect();

    for (const mark of marks) {
      await ctx.db.delete(mark._id);
    }

    // Delete the journal
    await ctx.db.delete(args.id);

    return { success: true };
  },
});

/**
 * Add a student to a journal
 */
export const addStudent = mutation({
  args: {
    journalId: v.id("journals"),
    studentId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if student already exists
    const existing = await ctx.db
      .query("journalStudents")
      .withIndex("by_journal_student", (q) =>
        q.eq("journalId", args.journalId).eq("studentId", args.studentId)
      )
      .unique();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("journalStudents", {
      journalId: args.journalId,
      studentId: args.studentId,
      });
  },
});

/**
 * Remove a student from a journal
 */
export const removeStudent = mutation({
  args: {
    journalId: v.id("journals"),
    studentId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("journalStudents")
      .withIndex("by_journal_student", (q) =>
        q.eq("journalId", args.journalId).eq("studentId", args.studentId)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return { success: true };
  },
});

/**
 * Batch add students to a journal
 */
export const batchAddStudents = mutation({
  args: {
    journalId: v.id("journals"),
    studentIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const added: string[] = [];

    for (const studentId of args.studentIds) {
      const existing = await ctx.db
        .query("journalStudents")
        .withIndex("by_journal_student", (q) =>
          q.eq("journalId", args.journalId).eq("studentId", studentId)
        )
        .unique();

      if (!existing) {
        const id = await ctx.db.insert("journalStudents", {
          journalId: args.journalId,
          studentId,
          });
        added.push(id);
      }
    }

    return { added: added.length };
  },
});
