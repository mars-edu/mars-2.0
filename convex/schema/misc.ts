import { defineTable } from "convex/server";
import { v } from "convex/values";

export const miscTables = {
  /**
   * File metadata for uploaded files
   * Migrated from: Prisma File
   */
  files: defineTable({
    storageId: v.id("_storage"), // Convex storage reference
    name: v.string(),
    key: v.string(),
    url: v.optional(v.string()),
    contentType: v.string(),
    size: v.number(),
    uploadedBy: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_uploadedBy", ["uploadedBy"]),

  /**
   * Offline mutation queue - stores pending changes made while offline
   * NEW: For offline-first architecture
   */
  offlineQueue: defineTable({
    clientId: v.string(), // Device/browser identifier
    userId: v.id("users"),
    operation: v.string(), // Mutation name (e.g., "marks.updateMark")
    args: v.string(), // JSON serialized arguments
    status: v.union(
      v.literal("pending"),
      v.literal("synced"),
      v.literal("failed")
    ),
    error: v.optional(v.string()),
    createdAt: v.number(),
    syncedAt: v.optional(v.number()),
  })
    .index("by_userId_status", ["userId", "status"])
    .index("by_createdAt", ["createdAt"])
    .index("by_clientId", ["clientId"]),

  /**
   * Notifications - system notifications for users
   * NEW: Notification center functionality
   */
  notifications: defineTable({
    userId: v.id("users"), // User receiving the notification
    type: v.union(
      v.literal("substitution"), // Journal substitution assignment
      v.literal("journal_closure"), // Journal closure reminder
      v.literal("system") // General system announcement
    ),
    status: v.union(
      v.literal("unread"),
      v.literal("read"),
      v.literal("archived")
    ),
    title: v.string(),
    message: v.string(),
    // Metadata for different notification types
    metadata: v.optional(
      v.object({
        substitutionId: v.optional(v.id("substitutions")),
        journalId: v.optional(v.id("journals")),
        deadline: v.optional(v.string()), // ISO date
      })
    ),
    createdAt: v.number(),
    readAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_status", ["userId", "status"])
    .index("by_userId_createdAt", ["userId", "createdAt"])
    .index("by_type", ["type"]),

  /**
   * Announcements and news - public feed content managed by admins
   */
  announcements: defineTable({
    kind: v.union(v.literal("announcement"), v.literal("news")),
    category: v.string(),
    type: v.union(v.literal("info"), v.literal("alert"), v.literal("system")),
    titles: v.object({
      ru: v.optional(v.string()),
      kk: v.optional(v.string()),
      en: v.optional(v.string()),
    }),
    descriptions: v.object({
      ru: v.optional(v.string()),
      kk: v.optional(v.string()),
      en: v.optional(v.string()),
    }),
    displayDate: v.string(),
    publishAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    isPublished: v.boolean(),
    createdBy: v.id("users"),
    updatedBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_isPublished", ["isPublished"])
    .index("by_category", ["category"])
    .index("by_kind", ["kind"])
    .index("by_createdAt", ["createdAt"]),

  announcementCategories: defineTable({
    slug: v.string(),
    label: v.optional(v.string()),
    labels: v.optional(
      v.object({
        ru: v.optional(v.string()),
        kk: v.optional(v.string()),
        en: v.optional(v.string()),
      })
    ),
    position: v.number(),
    createdBy: v.id("users"),
    updatedBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_position", ["position"]),
};
