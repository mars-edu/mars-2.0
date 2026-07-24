import { query } from "../functions";
import { v } from "convex/values";
import {
  filterActiveAnnouncements,
  isActiveAnnouncement,
  normalizeCategoryId,
} from "./lib";

const announcementKindValidator = v.union(
  v.literal("announcement"),
  v.literal("news")
);

export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db
      .query("announcementCategories")
      .withIndex("by_position")
      .collect();

    return categories.map((category) => ({
      id: category.slug,
      label:
        category.labels?.ru ||
        category.labels?.kk ||
        category.labels?.en ||
        category.label ||
        category.slug,
      labels: category.labels ?? { ru: category.label },
      position: category.position,
    }));
  },
});

export const listActive = query({
  args: {
    category: v.optional(v.string()),
    kind: v.optional(announcementKindValidator),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("announcements")
      .withIndex("by_isPublished", (q) => q.eq("isPublished", true))
      .collect();

    return filterActiveAnnouncements(items, {
      category: args.category ? normalizeCategoryId(args.category) : undefined,
      kind: args.kind,
      limit: args.limit,
    });
  },
});

export const getById = query({
  args: {
    announcementId: v.id("announcements"),
  },
  handler: async (ctx, args) => {
    const announcement = await ctx.db.get(args.announcementId);

    if (!announcement || !isActiveAnnouncement(announcement)) {
      return null;
    }

    return announcement;
  },
});
