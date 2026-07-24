import { defineTable } from "convex/server";
import { v } from "convex/values";

export const testsTables = {
  /**
   * Tests - Library of tests
   * Migrated from: concept-v2 tests collection
   */
  tests: defineTable({
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
    createdBy: v.optional(v.id("users")),
    createdAt: v.string(),
    updatedAt: v.string(),
  }),

  /**
   * Test Assignments - links a test to a group (journal)
   */
  testAssignments: defineTable({
    testId: v.id("tests"),
    journalId: v.id("journals"),
    status: v.union(v.literal("active"), v.literal("completed")),
    date: v.string(), // ISO date
    createdBy: v.optional(v.id("users")),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_test", ["testId"])
    .index("by_journal", ["journalId"]),

  /**
   * Test Results - stores the score and answers of a student
   */
  testResults: defineTable({
    assignmentId: v.id("testAssignments"),
    testId: v.id("tests"),
    studentId: v.string(),
    score: v.number(),
    completedAt: v.number(),
  })
    .index("by_assignment", ["assignmentId"])
    .index("by_student", ["studentId"])
    .index("by_test", ["testId"]),
};
