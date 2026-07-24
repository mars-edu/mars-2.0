import { action, internalMutation } from "../functions";
import { v, ConvexError } from "convex/values";
import { api, internal } from "../_generated/api";
import { validateToken } from "../auth/helpers";
import {
  assertHasLocalizedContent,
  normalizeAnnouncementCategories,
  normalizeCategoryId,
} from "./lib";
import type { Id } from "../_generated/dataModel";
import type { ActionCtx } from "../functions";

const localizedContentValidator = v.object({
  ru: v.optional(v.string()),
  kk: v.optional(v.string()),
  en: v.optional(v.string()),
});

const announcementKindValidator = v.union(
  v.literal("announcement"),
  v.literal("news")
);

const announcementTypeValidator = v.union(
  v.literal("info"),
  v.literal("alert"),
  v.literal("system")
);

const announcementInputFields = {
  kind: announcementKindValidator,
  category: v.string(),
  type: announcementTypeValidator,
  titles: localizedContentValidator,
  descriptions: localizedContentValidator,
  displayDate: v.string(),
  publishAt: v.optional(v.string()),
  expiresAt: v.optional(v.string()),
  isPublished: v.boolean(),
};

const announcementCategoryInputValidator = v.object({
  id: v.string(),
  labels: localizedContentValidator,
});

async function requireAdmin(ctx: ActionCtx, token: string) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new ConvexError({ code: "server_error" });
  }

  const payload = await validateToken(token, jwtSecret);
  const user = await ctx.runQuery(api.auth.queries.getUser, {
    userId: payload.userId as Id<"users">,
  });

  if (!user || !user.roles.includes("ADMIN")) {
    throw new ConvexError({ code: "forbidden" });
  }

  return payload.userId as Id<"users">;
}

export const createInternal = internalMutation({
  args: {
    ...announcementInputFields,
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("announcements", {
      kind: args.kind,
      category: normalizeCategoryId(args.category),
      type: args.type,
      titles: args.titles,
      descriptions: args.descriptions,
      displayDate: args.displayDate,
      publishAt: args.publishAt,
      expiresAt: args.expiresAt,
      isPublished: args.isPublished,
      createdBy: args.createdBy,
      });
  },
});

export const updateInternal = internalMutation({
  args: {
    announcementId: v.id("announcements"),
    ...announcementInputFields,
    updatedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.announcementId);
    if (!existing) {
      throw new ConvexError({ code: "announcement_not_found" });
    }

    await ctx.db.patch(args.announcementId, {
      kind: args.kind,
      category: normalizeCategoryId(args.category),
      type: args.type,
      titles: args.titles,
      descriptions: args.descriptions,
      displayDate: args.displayDate,
      publishAt: args.publishAt,
      expiresAt: args.expiresAt,
      isPublished: args.isPublished,
      updatedBy: args.updatedBy,
      });

    return { success: true };
  },
});

export const saveCategoriesInternal = internalMutation({
  args: {
    categories: v.array(
      v.object({
        id: v.string(),
        labels: localizedContentValidator,
        position: v.number(),
      })
    ),
    updatedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db.query("announcementCategories").collect();
    const incomingSlugs = new Set(args.categories.map((category) => category.id));

    for (const category of args.categories) {
      const current = existing.find((item) => item.slug === category.id);

      if (current) {
        await ctx.db.patch(current._id, {
          labels: category.labels,
          position: category.position,
          updatedBy: args.updatedBy,
          });
      } else {
        await ctx.db.insert("announcementCategories", {
          slug: category.id,
          labels: category.labels,
          position: category.position,
          createdBy: args.updatedBy,
          updatedBy: args.updatedBy,
          });
      }
    }

    await Promise.all(
      existing
        .filter((category) => !incomingSlugs.has(category.slug))
        .map((category) => ctx.db.delete(category._id))
    );

    return { success: true, count: args.categories.length };
  },
});

export const setPublishedInternal = internalMutation({
  args: {
    announcementId: v.id("announcements"),
    isPublished: v.boolean(),
    updatedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.announcementId);
    if (!existing) {
      throw new ConvexError({ code: "announcement_not_found" });
    }

    await ctx.db.patch(args.announcementId, {
      isPublished: args.isPublished,
      updatedBy: args.updatedBy,
      });

    return { success: true };
  },
});

export const deleteInternal = internalMutation({
  args: {
    announcementId: v.id("announcements"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.announcementId);
    if (!existing) {
      throw new ConvexError({ code: "announcement_not_found" });
    }

    await ctx.db.delete(args.announcementId);
    return { success: true };
  },
});

export const create = action({
  args: {
    token: v.string(),
    ...announcementInputFields,
  },
  handler: async (ctx, args): Promise<Id<"announcements">> => {
    assertHasLocalizedContent(args.titles, args.descriptions);
    const userId = await requireAdmin(ctx, args.token);
    const category = normalizeCategoryId(args.category);
    if (!category) {
      throw new ConvexError({ code: "announcement_category_required" });
    }

    return await ctx.runMutation(internal.announcements.mutations.createInternal, {
      kind: args.kind,
      category,
      type: args.type,
      titles: args.titles,
      descriptions: args.descriptions,
      displayDate: args.displayDate,
      publishAt: args.publishAt,
      expiresAt: args.expiresAt,
      isPublished: args.isPublished,
      createdBy: userId,
    });
  },
});

export const update = action({
  args: {
    token: v.string(),
    announcementId: v.id("announcements"),
    ...announcementInputFields,
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    assertHasLocalizedContent(args.titles, args.descriptions);
    const userId = await requireAdmin(ctx, args.token);
    const category = normalizeCategoryId(args.category);
    if (!category) {
      throw new ConvexError({ code: "announcement_category_required" });
    }

    return await ctx.runMutation(internal.announcements.mutations.updateInternal, {
      announcementId: args.announcementId,
      kind: args.kind,
      category,
      type: args.type,
      titles: args.titles,
      descriptions: args.descriptions,
      displayDate: args.displayDate,
      publishAt: args.publishAt,
      expiresAt: args.expiresAt,
      isPublished: args.isPublished,
      updatedBy: userId,
    });
  },
});

export const setPublished = action({
  args: {
    token: v.string(),
    announcementId: v.id("announcements"),
    isPublished: v.boolean(),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    const userId = await requireAdmin(ctx, args.token);

    return await ctx.runMutation(
      internal.announcements.mutations.setPublishedInternal,
      {
        announcementId: args.announcementId,
        isPublished: args.isPublished,
        updatedBy: userId,
      }
    );
  },
});

export const remove = action({
  args: {
    token: v.string(),
    announcementId: v.id("announcements"),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    await requireAdmin(ctx, args.token);

    return await ctx.runMutation(internal.announcements.mutations.deleteInternal, {
      announcementId: args.announcementId,
    });
  },
});

export const saveCategories = action({
  args: {
    token: v.string(),
    categories: v.array(announcementCategoryInputValidator),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; count: number }> => {
    const userId = await requireAdmin(ctx, args.token);
    const categories = normalizeAnnouncementCategories(args.categories);

    if (categories.length === 0) {
      throw new ConvexError({ code: "announcement_categories_required" });
    }

    return await ctx.runMutation(
      internal.announcements.mutations.saveCategoriesInternal,
      {
        categories,
        updatedBy: userId,
      }
    );
  },
});
