import { defineSchema } from "convex/server";

// ============================================================================
// MARS 2.0 Education Management System - Convex Schema
// Migrated from Pinia stores + D1/Prisma backend
// ============================================================================

import { authTables } from "./schema/auth";
import { academicTables } from "./schema/academic";
import { peopleTables } from "./schema/people";
import { rupTables } from "./schema/rup";
import { calendarTables } from "./schema/calendar";
import { journalsTables } from "./schema/journals";
import { scheduleTables } from "./schema/schedule";
import { workloadsTables } from "./schema/workloads";
import { miscTables } from "./schema/misc";
import { testsTables } from "./schema/tests";

export default defineSchema({
  ...authTables,
  ...academicTables,
  ...peopleTables,
  ...rupTables,
  ...calendarTables,
  ...journalsTables,
  ...scheduleTables,
  ...workloadsTables,
  ...miscTables,
  ...testsTables,
});
