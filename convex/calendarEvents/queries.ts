import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get all calendar events
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("calendarEvents").collect();
  },
});

/**
 * Get calendar event by ID
 */
export const getById = query({
  args: { id: v.id("calendarEvents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get calendar events by semester
 */
export const getBySemester = query({
  args: { semester: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("calendarEvents")
      .withIndex("by_semester", (q) => q.eq("semester", args.semester))
      .collect();
  },
});

/**
 * Get calendar events by teacher
 */
export const getByTeacher = query({
  args: { teacherId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("calendarEvents")
      .withIndex("by_teacherId", (q) => q.eq("teacherId", args.teacherId))
      .collect();
  },
});

/**
 * Get calendar events by class9 ID
 */
export const getByClass9Id = query({
  args: { class9Id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("calendarEvents")
      .withIndex("by_class9Id", (q) => q.eq("class9Id", args.class9Id))
      .collect();
  },
});

/**
 * Get calendar events by date range
 */
export const getByDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const allEvents = await ctx.db.query("calendarEvents").collect();

    return allEvents.filter((event) => {
      return event.startDate >= args.startDate && event.startDate <= args.endDate;
    });
  },
});
