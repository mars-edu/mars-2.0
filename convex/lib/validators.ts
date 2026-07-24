/**
 * Shared validators and utility types for Convex functions
 */

import { v } from "convex/values";

// Common timestamp fields used across most tables
export const timestampFields = {
  createdAt: v.string(),
  updatedAt: v.string(),
};

// Gender validator
export const genderValidator = v.union(v.literal("male"), v.literal("female"));

// Role validators
export const roleValidator = v.union(
  v.literal("ADMIN"),
  v.literal("TEACHER"),
  v.literal("STUDENT"),
  v.literal("PARENT")
);

// Control type validators
export const controlTypeValidator = v.union(
  v.literal("intermediate"),
  v.literal("final")
);

// Column type validators for marks
export const columnTypeValidator = v.union(
  v.literal("date"),
  v.literal("session")
);

// Offline queue status validator
export const offlineQueueStatusValidator = v.union(
  v.literal("pending"),
  v.literal("synced"),
  v.literal("failed")
);

// Weekly schedule validator for calendar events
export const weeklyScheduleValidator = v.object({
  weekId: v.number(),
  startTime: v.optional(v.string()),
  endTime: v.optional(v.string()),
  startId: v.optional(v.string()),
  endId: v.optional(v.string()),
});

/**
 * Helper to create timestamps for new records
 */
export function createTimestamps() {
  const now = Date.now();
  return {
    };
}

/**
 * Helper to update timestamps for existing records
 */
export function updateTimestamp() {
  return {
    };
}
