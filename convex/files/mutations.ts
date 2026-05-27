import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Delete a file from storage by its storage ID.
 * Used for cleanup of temporary export files after download.
 */
export const deleteFile = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await ctx.storage.delete(args.storageId);
  },
});

/**
 * Generate upload URL for file storage
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Store file metadata after upload
 */
export const storeFileMetadata = mutation({
  args: {
    storageId: v.id("_storage"),
    name: v.string(),
    contentType: v.string(),
    size: v.number(),
    key: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const fileId = await ctx.db.insert("files", {
      storageId: args.storageId,
      name: args.name,
      key: args.key || args.name,
      contentType: args.contentType,
      size: args.size,
      uploadedBy: undefined, // Can be set if auth is available
      createdAt: Date.now(),
    });

    return fileId;
  },
});
