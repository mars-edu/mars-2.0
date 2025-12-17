import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { createTimestamps, updateTimestamp } from "../lib/validators";

/**
 * Update or create a mark
 */
export const updateMark = mutation({
  args: {
    journalId: v.id("journals"),
    studentId: v.string(),
    columnIndex: v.number(),
    rowIndex: v.number(),
    value: v.optional(v.string()),
    columnType: v.union(v.literal("date"), v.literal("session")),
    columnDate: v.optional(v.string()),
    columnLabel: v.optional(v.string()),
    controlType: v.optional(
      v.union(v.literal("intermediate"), v.literal("final"))
    ),
    controlId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    scheduledControlId: v.optional(v.string()),
    userId: v.optional(v.id("users")), // For tracking who made the change
  },
  handler: async (ctx, args) => {
    const { userId, ...markData } = args;

    // Find existing mark
    const existingMark = await ctx.db
      .query("marks")
      .withIndex("by_journal_student_column_row", (q) =>
        q
          .eq("journalId", args.journalId)
          .eq("studentId", args.studentId)
          .eq("columnIndex", args.columnIndex)
          .eq("rowIndex", args.rowIndex)
      )
      .unique();

    const now = Date.now();

    // Create history record if value changed
    if (existingMark && existingMark.value !== args.value && userId) {
      await ctx.db.insert("markHistory", {
        journalId: args.journalId,
        studentId: args.studentId,
        columnIndex: args.columnIndex,
        rowIndex: args.rowIndex,
        oldValue: existingMark.value,
        newValue: args.value,
        columnLabel: args.columnLabel,
        columnDate: args.columnDate,
        changedBy: userId,
        createdAt: now,
      });
    }

    if (existingMark) {
      // Update existing mark
      await ctx.db.patch(existingMark._id, {
        value: args.value,
        columnType: args.columnType,
        columnDate: args.columnDate,
        columnLabel: args.columnLabel,
        controlType: args.controlType,
        controlId: args.controlId,
        sessionId: args.sessionId,
        scheduledControlId: args.scheduledControlId,
        updatedBy: userId,
        updatedAt: now,
      });
      return existingMark._id;
    } else {
      // Create new mark
      const markId = await ctx.db.insert("marks", {
        ...markData,
        createdBy: userId,
        updatedBy: userId,
        createdAt: now,
        updatedAt: now,
      });

      // Create history for new mark with value
      if (args.value && userId) {
        await ctx.db.insert("markHistory", {
          journalId: args.journalId,
          studentId: args.studentId,
          columnIndex: args.columnIndex,
          rowIndex: args.rowIndex,
          oldValue: undefined,
          newValue: args.value,
          columnLabel: args.columnLabel,
          columnDate: args.columnDate,
          changedBy: userId,
          createdAt: now,
        });
      }

      return markId;
    }
  },
});

/**
 * Batch update marks (for efficiency)
 */
export const batchUpdateMarks = mutation({
  args: {
    journalId: v.id("journals"),
    marks: v.array(
      v.object({
        studentId: v.string(),
        columnIndex: v.number(),
        rowIndex: v.number(),
        value: v.optional(v.string()),
        columnType: v.union(v.literal("date"), v.literal("session")),
        columnDate: v.optional(v.string()),
        columnLabel: v.optional(v.string()),
        controlType: v.optional(
          v.union(v.literal("intermediate"), v.literal("final"))
        ),
        controlId: v.optional(v.string()),
        sessionId: v.optional(v.string()),
        scheduledControlId: v.optional(v.string()),
      })
    ),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const results: string[] = [];

    for (const mark of args.marks) {
      // Find existing mark
      const existingMark = await ctx.db
        .query("marks")
        .withIndex("by_journal_student_column_row", (q) =>
          q
            .eq("journalId", args.journalId)
            .eq("studentId", mark.studentId)
            .eq("columnIndex", mark.columnIndex)
            .eq("rowIndex", mark.rowIndex)
        )
        .unique();

      // Create history if value changed
      if (existingMark && existingMark.value !== mark.value && args.userId) {
        await ctx.db.insert("markHistory", {
          journalId: args.journalId,
          studentId: mark.studentId,
          columnIndex: mark.columnIndex,
          rowIndex: mark.rowIndex,
          oldValue: existingMark.value,
          newValue: mark.value,
          columnLabel: mark.columnLabel,
          columnDate: mark.columnDate,
          changedBy: args.userId,
          createdAt: now,
        });
      }

      if (existingMark) {
        await ctx.db.patch(existingMark._id, {
          ...mark,
          updatedBy: args.userId,
          updatedAt: now,
        });
        results.push(existingMark._id);
      } else {
        const markId = await ctx.db.insert("marks", {
          journalId: args.journalId,
          ...mark,
          createdBy: args.userId,
          updatedBy: args.userId,
          createdAt: now,
          updatedAt: now,
        });
        results.push(markId);
      }
    }

    return results;
  },
});

/**
 * Delete a mark
 */
export const deleteMark = mutation({
  args: {
    journalId: v.id("journals"),
    studentId: v.string(),
    columnIndex: v.number(),
    rowIndex: v.number(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const existingMark = await ctx.db
      .query("marks")
      .withIndex("by_journal_student_column_row", (q) =>
        q
          .eq("journalId", args.journalId)
          .eq("studentId", args.studentId)
          .eq("columnIndex", args.columnIndex)
          .eq("rowIndex", args.rowIndex)
      )
      .unique();

    if (!existingMark) {
      return { success: false, error: "Mark not found" };
    }

    // Create history record for deletion
    if (existingMark.value && args.userId) {
      await ctx.db.insert("markHistory", {
        journalId: args.journalId,
        studentId: args.studentId,
        columnIndex: args.columnIndex,
        rowIndex: args.rowIndex,
        oldValue: existingMark.value,
        newValue: undefined,
        columnLabel: existingMark.columnLabel,
        columnDate: existingMark.columnDate,
        changedBy: args.userId,
        createdAt: Date.now(),
      });
    }

    await ctx.db.delete(existingMark._id);

    return { success: true };
  },
});

/**
 * Initialize a journal with students
 */
export const initializeJournal = mutation({
  args: {
    calendarEventId: v.optional(v.string()),
    disciplineId: v.string(),
    groupName: v.optional(v.string()),
    academicYearId: v.string(),
    semesterId: v.string(),
    studentIds: v.array(v.string()),
    isMixedGroup: v.optional(v.boolean()),
    isIndividualJournal: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { studentIds, ...journalData } = args;
    const timestamps = createTimestamps();

    // Check if journal already exists
    let journal = args.calendarEventId
      ? await ctx.db
          .query("journals")
          .withIndex("by_calendarEvent", (q) =>
            q.eq("calendarEventId", args.calendarEventId)
          )
          .unique()
      : null;

    if (!journal) {
      // Create new journal
      const journalId = await ctx.db.insert("journals", {
        ...journalData,
        ...timestamps,
      });
      journal = await ctx.db.get(journalId);
    }

    if (!journal) {
      throw new Error("Failed to create journal");
    }

    // Add students to journal
    for (const studentId of studentIds) {
      // Check if student already exists in journal
      const existing = await ctx.db
        .query("journalStudents")
        .withIndex("by_journal_student", (q) =>
          q.eq("journalId", journal!._id).eq("studentId", studentId)
        )
        .unique();

      if (!existing) {
        await ctx.db.insert("journalStudents", {
          journalId: journal._id,
          studentId,
          createdAt: timestamps.createdAt,
        });
      }
    }

    return journal;
  },
});
