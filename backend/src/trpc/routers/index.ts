import { router } from "../trpc.js";
import { marksRouter } from "./marks.js";
import { authRouter } from "./auth.js";

/**
 * Main application router
 * Combines all sub-routers
 */
export const appRouter = router({
  auth: authRouter,
  marks: marksRouter,
  // Add more routers here as needed
  // journals: journalsRouter,
  // students: studentsRouter,
});

/**
 * Export router type for client-side type safety
 */
export type AppRouter = typeof appRouter;
