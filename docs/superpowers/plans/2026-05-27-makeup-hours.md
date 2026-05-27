# Makeup Hours (Отработка часов) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the "Добавить отработку часов" feature from concept-v2 to mars-2.0 — a teacher-facing popover that submits a makeup-hours request (one or more missed-date → new-date pairs) to admins for approval via the Protocol page.

**Architecture:** New `makeupRequests` Convex table + queries/mutations; a `MakeupHoursPopover.vue` (GuardedPopover pattern) triggered from the JournalTab tools menu; `protocolStore` extended to a discriminated union fetching both substitutions and makeup requests; protocol.vue renders a new card variant with the same accept/reject flow.

**Tech Stack:** Vue 3 Composition API, Pinia, Convex (serverless DB + functions), Framework7 (f7Input datepicker), dayjs, Tailwind CSS, paraglide (i18n)

---

## File Map

**Create:**
- `convex/makeupRequests/mutations.ts` — createMakeupRequest, acceptMakeupRequest, rejectMakeupRequest
- `convex/makeupRequests/queries.ts` — listMakeupRequestsInternal (internalQuery), listMakeupRequestsWithRoleAccess (action)
- `src/stores/makeupRequestStore.ts` — Pinia store: createMakeupRequest action, loading/error state
- `src/components/MakeupHoursPopover.vue` — GuardedPopover form component
- `src/paraglide/messages/makeup_hours_title.js`
- `src/paraglide/messages/makeup_hours_reason_label.js`
- `src/paraglide/messages/makeup_hours_reason_placeholder.js`
- `src/paraglide/messages/makeup_hours_scheduled_date.js`
- `src/paraglide/messages/makeup_hours_new_date.js`
- `src/paraglide/messages/makeup_hours_time_from.js`
- `src/paraglide/messages/makeup_hours_time_to.js`
- `src/paraglide/messages/makeup_hours_add_date.js`
- `src/paraglide/messages/makeup_hours_submit.js`
- `src/paraglide/messages/makeup_hours_select_date.js`
- `src/paraglide/messages/protocol_makeup_request_label.js`
- `src/paraglide/messages/protocol_makeup_request_title.js`
- `src/paraglide/messages/protocol_makeup_dates_label.js`

**Modify:**
- `convex/schema.ts` — add `makeupRequests` table after substitutions block (after line 806)
- `messages/ru.json` — add 13 new keys
- `messages/en.json` — add 13 new keys
- `messages/kk.json` — add 13 new keys
- `src/paraglide/messages/_index.js` — export 13 new message modules
- `src/stores/protocolStore.ts` — discriminated union type, parallel fetch, acceptMakeupRequest/rejectMakeupRequest
- `src/components/JournalTab.vue` — import MakeupHoursPopover, journalDatesForMakeup computed, trigger button, save handler
- `src/pages/protocol.vue` — makeup card template, generalize pendingAction type, extend confirmAction

---

## Task 1: Add makeupRequests table to schema

**Files:**
- Modify: `convex/schema.ts` (after line 806, after the closing `.index("by_createdAt", ["createdAt"]),` of substitutions)

- [ ] **Step 1: Add the table definition**

Open `convex/schema.ts`. Find the line `    .index("by_createdAt", ["createdAt"]),` inside the substitutions block (around line 806) and the closing `,` after it. Insert the new table definition right after the substitutions block ends, before `/**\n   * Journal closure reminders`:

```ts
  /**
   * Makeup hour requests - teacher requests to reschedule missed sessions
   */
  makeupRequests: defineTable({
    journalId: v.id("journals"),
    teacherId: v.string(), // references teachers table _id
    createdBy: v.id("users"),
    reason: v.optional(v.string()),
    dates: v.array(
      v.object({
        existingDate: v.string(), // ISO YYYY-MM-DD from journal schedule
        newDate: v.string(), // ISO YYYY-MM-DD for makeup session
        startScheduleId: v.string(), // educationSchedules._id
        endScheduleId: v.string(),
      })
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected")
    ),
    rejectionReason: v.optional(v.string()),
    journalSnapshot: v.optional(
      v.object({
        disciplineName: v.string(),
        groupName: v.optional(v.string()),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_journal", ["journalId"])
    .index("by_teacher", ["teacherId"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),
```

- [ ] **Step 2: Commit**

```bash
git add convex/schema.ts
git commit -m "feat: add makeupRequests table to Convex schema"
```

---

## Task 2: Create Convex mutations for makeup requests

**Files:**
- Create: `convex/makeupRequests/mutations.ts`

- [ ] **Step 1: Create the file**

```ts
import { mutation, MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

async function getAdminUsers(ctx: MutationCtx) {
  const allUsers = await ctx.db.query("users").collect();
  return allUsers.filter((u) => u.roles.includes("ADMIN"));
}

async function requireAdmin(ctx: MutationCtx, userId: Id<"users">) {
  const user = await ctx.db.get(userId);
  if (!user || !user.roles.includes("ADMIN")) {
    throw new Error("Только администратор может выполнить это действие");
  }
}

export const createMakeupRequest = mutation({
  args: {
    journalId: v.id("journals"),
    teacherId: v.string(),
    createdBy: v.id("users"),
    reason: v.optional(v.string()),
    dates: v.array(
      v.object({
        existingDate: v.string(),
        newDate: v.string(),
        startScheduleId: v.string(),
        endScheduleId: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const journal = await ctx.db.get(args.journalId);
    if (!journal) throw new Error("Журнал не найден");

    const class9Item =
      journal.disciplineId
        ? await ctx.db.get(journal.disciplineId as Id<"class9Items">)
        : null;
    const journalSnapshot = {
      disciplineName: class9Item?.learningOutcome ?? "Неизвестная дисциплина",
      groupName: journal.groupName,
    };

    const id = await ctx.db.insert("makeupRequests", {
      journalId: args.journalId,
      teacherId: args.teacherId,
      createdBy: args.createdBy,
      reason: args.reason,
      dates: args.dates,
      status: "pending",
      journalSnapshot,
      createdAt: now,
      updatedAt: now,
    });

    // Notify all admins
    const adminUsers = await getAdminUsers(ctx);
    const teacherRecord = await ctx.db.get(
      args.teacherId as Id<"teachers">
    );
    const teacherName = teacherRecord
      ? `${teacherRecord.surname} ${teacherRecord.firstName} ${teacherRecord.patronymic}`.trim()
      : "Преподаватель";

    for (const admin of adminUsers) {
      await ctx.db.insert("notifications", {
        userId: admin._id,
        type: "substitution",
        status: "unread",
        title: "Запрос на отработку часов",
        message: `${teacherName} запрашивает отработку часов по дисциплине "${journalSnapshot.disciplineName}".`,
        metadata: { journalId: args.journalId },
        createdAt: now,
      });
    }

    return id;
  },
});

export const acceptMakeupRequest = mutation({
  args: {
    makeupRequestId: v.id("makeupRequests"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const request = await ctx.db.get(args.makeupRequestId);
    if (!request) throw new Error("Запрос на отработку не найден");

    await requireAdmin(ctx, args.userId);

    if (request.status !== "pending") {
      throw new Error("Этот запрос уже обработан");
    }

    await ctx.db.patch(args.makeupRequestId, {
      status: "accepted",
      updatedAt: now,
    });

    return { success: true };
  },
});

export const rejectMakeupRequest = mutation({
  args: {
    makeupRequestId: v.id("makeupRequests"),
    userId: v.id("users"),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const request = await ctx.db.get(args.makeupRequestId);
    if (!request) throw new Error("Запрос на отработку не найден");

    await requireAdmin(ctx, args.userId);

    if (request.status !== "pending") {
      throw new Error("Этот запрос уже обработан");
    }

    await ctx.db.patch(args.makeupRequestId, {
      status: "rejected",
      rejectionReason: args.rejectionReason,
      updatedAt: now,
    });

    return { success: true };
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add convex/makeupRequests/mutations.ts
git commit -m "feat: add Convex mutations for makeup hour requests"
```

---

## Task 3: Create Convex queries for makeup requests

**Files:**
- Create: `convex/makeupRequests/queries.ts`

- [ ] **Step 1: Create the file**

```ts
import { internalQuery, action } from "../_generated/server";
import { v } from "convex/values";
import { validateToken } from "../auth/helpers";
import { internal } from "../_generated/api";

export const listMakeupRequestsInternal = internalQuery({
  args: {
    userId: v.string(),
    userRoles: v.array(v.string()),
    selectedTeacherId: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const { userId, userRoles, selectedTeacherId } = args;
    const isAdmin = userRoles.includes("ADMIN");
    const isTeacher = userRoles.includes("TEACHER");

    if (!isAdmin && !isTeacher) return [];

    let requests;

    if (isTeacher && !isAdmin) {
      const teacherRecord = await ctx.db
        .query("teachers")
        .withIndex("by_userId", (q) => q.eq("userId", userId as any))
        .unique();
      if (!teacherRecord) return [];

      requests = await ctx.db
        .query("makeupRequests")
        .withIndex("by_teacher", (q) =>
          q.eq("teacherId", teacherRecord._id)
        )
        .collect();
    } else if (selectedTeacherId && selectedTeacherId !== "all") {
      requests = await ctx.db
        .query("makeupRequests")
        .withIndex("by_teacher", (q) =>
          q.eq("teacherId", selectedTeacherId)
        )
        .collect();
    } else {
      requests = await ctx.db.query("makeupRequests").collect();
    }

    const allTeachers = await ctx.db.query("teachers").collect();
    const teacherMap = new Map(
      allTeachers.map((t) => [t._id as string, t])
    );

    const enriched = requests.map((req) => ({
      ...req,
      teacher: teacherMap.get(req.teacherId),
    }));

    enriched.sort((a, b) => b.createdAt - a.createdAt);
    return enriched;
  },
});

export const listMakeupRequestsWithRoleAccess: any = action({
  args: {
    token: v.string(),
    selectedTeacherId: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return [];

    let payload;
    try {
      payload = await validateToken(args.token, jwtSecret);
    } catch {
      return [];
    }

    return ctx.runQuery(
      internal.makeupRequests.queries.listMakeupRequestsInternal,
      {
        userId: payload.userId,
        userRoles: payload.roles,
        selectedTeacherId: args.selectedTeacherId,
      }
    );
  },
});
```

- [ ] **Step 2: Deploy to Convex and regenerate API types**

Start the Convex dev server (or ensure it is already running). It watches for file changes and auto-deploys:

```bash
npm run dev:convex
```

Wait for output like:
```
✔  Convex functions ready! (Ctrl+C to exit)
```

The `convex/_generated/api.d.ts` is now updated and `api.makeupRequests.mutations` / `api.makeupRequests.queries` are available. If running in a non-interactive context (e.g., a subagent), run `npx convex codegen` instead.

- [ ] **Step 3: Commit**

```bash
git add convex/makeupRequests/queries.ts
git commit -m "feat: add Convex queries for makeup hour requests (JWT role-based access)"
```

---

## Task 4: Add i18n message keys

**Files:**
- Modify: `messages/ru.json`, `messages/en.json`, `messages/kk.json`
- Create: 13 files in `src/paraglide/messages/`
- Modify: `src/paraglide/messages/_index.js`

- [ ] **Step 1: Add keys to messages/ru.json**

Insert these 13 entries anywhere in the JSON object (e.g., near other `journal_` or `protocol_` keys):

```json
"makeup_hours_title": "Добавить отработку часов",
"makeup_hours_reason_label": "Основание назначения отработки",
"makeup_hours_reason_placeholder": "Укажите причину для всех выбранных дат...",
"makeup_hours_scheduled_date": "Дата по расписанию",
"makeup_hours_new_date": "Новая дата отработки",
"makeup_hours_time_from": "Время от",
"makeup_hours_time_to": "Время до",
"makeup_hours_add_date": "Добавить ещё дату",
"makeup_hours_submit": "Отправить на модерацию",
"makeup_hours_select_date": "Выберите дату...",
"protocol_makeup_request_label": "ОТРАБОТКА",
"protocol_makeup_request_title": "Запрос на отработку часов",
"protocol_makeup_dates_label": "Даты отработки"
```

- [ ] **Step 2: Add keys to messages/en.json**

```json
"makeup_hours_title": "Add Makeup Hours",
"makeup_hours_reason_label": "Reason for Makeup",
"makeup_hours_reason_placeholder": "Specify the reason for all selected dates...",
"makeup_hours_scheduled_date": "Scheduled Date",
"makeup_hours_new_date": "New Makeup Date",
"makeup_hours_time_from": "Time From",
"makeup_hours_time_to": "Time To",
"makeup_hours_add_date": "Add Another Date",
"makeup_hours_submit": "Submit for Review",
"makeup_hours_select_date": "Select date...",
"protocol_makeup_request_label": "MAKEUP",
"protocol_makeup_request_title": "Makeup Hours Request",
"protocol_makeup_dates_label": "Makeup Dates"
```

- [ ] **Step 3: Add keys to messages/kk.json**

```json
"makeup_hours_title": "Сағаттарды өтеу қосу",
"makeup_hours_reason_label": "Өтеудің тағайындалу негізі",
"makeup_hours_reason_placeholder": "Барлық таңдалған күндер үшін себепті көрсетіңіз...",
"makeup_hours_scheduled_date": "Кесте бойынша күн",
"makeup_hours_new_date": "Өтеудің жаңа күні",
"makeup_hours_time_from": "Уақыттан",
"makeup_hours_time_to": "Уақытқа дейін",
"makeup_hours_add_date": "Тағы бір күн қосу",
"makeup_hours_submit": "Модерацияға жіберу",
"makeup_hours_select_date": "Күнді таңдаңыз...",
"protocol_makeup_request_label": "ӨТЕУ",
"protocol_makeup_request_title": "Сағаттарды өтеу сұранысы",
"protocol_makeup_dates_label": "Өтеу күндері"
```

- [ ] **Step 4: Create the 13 paraglide JS message files**

Create each of the following files. The pattern is identical for all simple (no-parameter) messages. Use `journal_merge.js` as the reference — it lives at `src/paraglide/messages/journal_merge.js`.

**`src/paraglide/messages/makeup_hours_title.js`:**
```js
/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {{}} Makeup_Hours_TitleInputs */

const ru_makeup_hours_title = () => `Добавить отработку часов`;
const en_makeup_hours_title = () => `Add Makeup Hours`;
const kk_makeup_hours_title = () => `Сағаттарды өтеу қосу`;

export const makeup_hours_title = ((inputs = {}, options = {}) => {
  const locale = experimentalStaticLocale ?? options.locale ?? getLocale();
  if (locale === 'ru') return ru_makeup_hours_title(inputs);
  if (locale === 'kk') return kk_makeup_hours_title(inputs);
  return en_makeup_hours_title(inputs);
});
```

**`src/paraglide/messages/makeup_hours_reason_label.js`:**
```js
/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

const ru = () => `Основание назначения отработки`;
const en = () => `Reason for Makeup`;
const kk = () => `Өтеудің тағайындалу негізі`;

export const makeup_hours_reason_label = ((inputs = {}, options = {}) => {
  const locale = experimentalStaticLocale ?? options.locale ?? getLocale();
  if (locale === 'ru') return ru(inputs);
  if (locale === 'kk') return kk(inputs);
  return en(inputs);
});
```

**`src/paraglide/messages/makeup_hours_reason_placeholder.js`:**
```js
/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

const ru = () => `Укажите причину для всех выбранных дат...`;
const en = () => `Specify the reason for all selected dates...`;
const kk = () => `Барлық таңдалған күндер үшін себепті көрсетіңіз...`;

export const makeup_hours_reason_placeholder = ((inputs = {}, options = {}) => {
  const locale = experimentalStaticLocale ?? options.locale ?? getLocale();
  if (locale === 'ru') return ru(inputs);
  if (locale === 'kk') return kk(inputs);
  return en(inputs);
});
```

**`src/paraglide/messages/makeup_hours_scheduled_date.js`:**
```js
/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

const ru = () => `Дата по расписанию`;
const en = () => `Scheduled Date`;
const kk = () => `Кесте бойынша күн`;

export const makeup_hours_scheduled_date = ((inputs = {}, options = {}) => {
  const locale = experimentalStaticLocale ?? options.locale ?? getLocale();
  if (locale === 'ru') return ru(inputs);
  if (locale === 'kk') return kk(inputs);
  return en(inputs);
});
```

**`src/paraglide/messages/makeup_hours_new_date.js`:**
```js
/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

const ru = () => `Новая дата отработки`;
const en = () => `New Makeup Date`;
const kk = () => `Өтеудің жаңа күні`;

export const makeup_hours_new_date = ((inputs = {}, options = {}) => {
  const locale = experimentalStaticLocale ?? options.locale ?? getLocale();
  if (locale === 'ru') return ru(inputs);
  if (locale === 'kk') return kk(inputs);
  return en(inputs);
});
```

**`src/paraglide/messages/makeup_hours_time_from.js`:**
```js
/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

const ru = () => `Время от`;
const en = () => `Time From`;
const kk = () => `Уақыттан`;

export const makeup_hours_time_from = ((inputs = {}, options = {}) => {
  const locale = experimentalStaticLocale ?? options.locale ?? getLocale();
  if (locale === 'ru') return ru(inputs);
  if (locale === 'kk') return kk(inputs);
  return en(inputs);
});
```

**`src/paraglide/messages/makeup_hours_time_to.js`:**
```js
/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

const ru = () => `Время до`;
const en = () => `Time To`;
const kk = () => `Уақытқа дейін`;

export const makeup_hours_time_to = ((inputs = {}, options = {}) => {
  const locale = experimentalStaticLocale ?? options.locale ?? getLocale();
  if (locale === 'ru') return ru(inputs);
  if (locale === 'kk') return kk(inputs);
  return en(inputs);
});
```

**`src/paraglide/messages/makeup_hours_add_date.js`:**
```js
/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

const ru = () => `Добавить ещё дату`;
const en = () => `Add Another Date`;
const kk = () => `Тағы бір күн қосу`;

export const makeup_hours_add_date = ((inputs = {}, options = {}) => {
  const locale = experimentalStaticLocale ?? options.locale ?? getLocale();
  if (locale === 'ru') return ru(inputs);
  if (locale === 'kk') return kk(inputs);
  return en(inputs);
});
```

**`src/paraglide/messages/makeup_hours_submit.js`:**
```js
/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

const ru = () => `Отправить на модерацию`;
const en = () => `Submit for Review`;
const kk = () => `Модерацияға жіберу`;

export const makeup_hours_submit = ((inputs = {}, options = {}) => {
  const locale = experimentalStaticLocale ?? options.locale ?? getLocale();
  if (locale === 'ru') return ru(inputs);
  if (locale === 'kk') return kk(inputs);
  return en(inputs);
});
```

**`src/paraglide/messages/makeup_hours_select_date.js`:**
```js
/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

const ru = () => `Выберите дату...`;
const en = () => `Select date...`;
const kk = () => `Күнді таңдаңыз...`;

export const makeup_hours_select_date = ((inputs = {}, options = {}) => {
  const locale = experimentalStaticLocale ?? options.locale ?? getLocale();
  if (locale === 'ru') return ru(inputs);
  if (locale === 'kk') return kk(inputs);
  return en(inputs);
});
```

**`src/paraglide/messages/protocol_makeup_request_label.js`:**
```js
/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

const ru = () => `ОТРАБОТКА`;
const en = () => `MAKEUP`;
const kk = () => `ӨТЕУ`;

export const protocol_makeup_request_label = ((inputs = {}, options = {}) => {
  const locale = experimentalStaticLocale ?? options.locale ?? getLocale();
  if (locale === 'ru') return ru(inputs);
  if (locale === 'kk') return kk(inputs);
  return en(inputs);
});
```

**`src/paraglide/messages/protocol_makeup_request_title.js`:**
```js
/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

const ru = () => `Запрос на отработку часов`;
const en = () => `Makeup Hours Request`;
const kk = () => `Сағаттарды өтеу сұранысы`;

export const protocol_makeup_request_title = ((inputs = {}, options = {}) => {
  const locale = experimentalStaticLocale ?? options.locale ?? getLocale();
  if (locale === 'ru') return ru(inputs);
  if (locale === 'kk') return kk(inputs);
  return en(inputs);
});
```

**`src/paraglide/messages/protocol_makeup_dates_label.js`:**
```js
/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

const ru = () => `Даты отработки`;
const en = () => `Makeup Dates`;
const kk = () => `Өтеу күндері`;

export const protocol_makeup_dates_label = ((inputs = {}, options = {}) => {
  const locale = experimentalStaticLocale ?? options.locale ?? getLocale();
  if (locale === 'ru') return ru(inputs);
  if (locale === 'kk') return kk(inputs);
  return en(inputs);
});
```

- [ ] **Step 5: Add exports to `src/paraglide/messages/_index.js`**

Append these 13 lines at the end of the file:

```js
export * from './makeup_hours_title.js'
export * from './makeup_hours_reason_label.js'
export * from './makeup_hours_reason_placeholder.js'
export * from './makeup_hours_scheduled_date.js'
export * from './makeup_hours_new_date.js'
export * from './makeup_hours_time_from.js'
export * from './makeup_hours_time_to.js'
export * from './makeup_hours_add_date.js'
export * from './makeup_hours_submit.js'
export * from './makeup_hours_select_date.js'
export * from './protocol_makeup_request_label.js'
export * from './protocol_makeup_request_title.js'
export * from './protocol_makeup_dates_label.js'
```

- [ ] **Step 6: Commit**

```bash
git add messages/ru.json messages/en.json messages/kk.json
git add src/paraglide/messages/makeup_hours_*.js src/paraglide/messages/protocol_makeup_*.js
git add src/paraglide/messages/_index.js
git commit -m "feat: add i18n keys for makeup hours feature (ru/en/kk)"
```

---

## Task 5: Create makeupRequestStore

**Files:**
- Create: `src/stores/makeupRequestStore.ts`

- [ ] **Step 1: Create the store**

```ts
import { defineStore } from "pinia";
import { ref } from "vue";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

export interface MakeupDateEntry {
  existingDate: string; // ISO YYYY-MM-DD
  newDate: string;      // ISO YYYY-MM-DD
  startScheduleId: string;
  endScheduleId: string;
}

export const useMakeupRequestStore = defineStore("makeupRequests", () => {
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function createMakeupRequest(params: {
    journalId: string;
    teacherId: string;
    createdBy: string;
    reason?: string;
    dates: MakeupDateEntry[];
  }) {
    loading.value = true;
    error.value = null;
    try {
      const id = await convex.mutation(
        api.makeupRequests.mutations.createMakeupRequest,
        {
          journalId: params.journalId as Id<"journals">,
          teacherId: params.teacherId,
          createdBy: params.createdBy as Id<"users">,
          reason: params.reason,
          dates: params.dates,
        }
      );
      return id;
    } catch (err: any) {
      error.value = err?.message ?? "Не удалось отправить запрос на отработку";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return { loading, error, createMakeupRequest };
});
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/makeupRequestStore.ts
git commit -m "feat: add makeupRequestStore for Convex mutation calls"
```

---

## Task 6: Extend protocolStore with makeup request support

**Files:**
- Modify: `src/stores/protocolStore.ts`

The current `ProtocolEntry` interface covers substitutions only. We change it to a discriminated union and fetch both entry types in parallel.

- [ ] **Step 1: Replace the ProtocolEntry type and add MakeupRequestEntry**

At the top of `src/stores/protocolStore.ts`, **replace** the existing `ProtocolEntry` interface:

```ts
// BEFORE (existing):
export interface ProtocolEntry {
  _id: Id<"substitutions">;
  type: "substitution";
  ...
}

// AFTER:
export interface SubstitutionEntry {
  type: "substitution";
  _id: Id<"substitutions">;
  journalId: Id<"journals">;
  fromTeacherId: string;
  toTeacherId: string;
  toUserId: Id<"users">;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  isPrimary?: boolean;
  status: "pending" | "accepted" | "rejected" | "completed";
  reason?: string;
  serviceLetterNumber?: string;
  journalSnapshot?: {
    disciplineName: string;
    groupName?: string;
    course?: string;
    semester?: string;
  };
  createdBy: Id<"users">;
  acceptedAt?: number;
  rejectedAt?: number;
  createdAt: number;
  updatedAt: number;
  journal?: any;
  fromTeacher?: { _id: string; firstName: string; surname: string; patronymic: string };
  toTeacher?: { _id: string; firstName: string; surname: string; patronymic: string };
  disciplineName?: string;
}

export interface MakeupRequestEntry {
  type: "makeup_request";
  _id: Id<"makeupRequests">;
  journalId: Id<"journals">;
  teacherId: string;
  createdBy: Id<"users">;
  reason?: string;
  dates: Array<{
    existingDate: string;
    newDate: string;
    startScheduleId: string;
    endScheduleId: string;
  }>;
  status: "pending" | "accepted" | "rejected";
  rejectionReason?: string;
  journalSnapshot?: { disciplineName: string; groupName?: string };
  teacher?: { _id: string; firstName: string; surname: string; patronymic: string };
  createdAt: number;
  updatedAt: number;
}

export type ProtocolEntry = SubstitutionEntry | MakeupRequestEntry;
```

- [ ] **Step 2: Update fetchProtocolWithRoleAccess to fetch both types in parallel**

Replace the existing `fetchProtocolWithRoleAccess` function body:

```ts
async function fetchProtocolWithRoleAccess() {
  const token = userStore.token;
  if (!token) {
    entries.value = [];
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const [substitutionsData, makeupData] = await Promise.all([
      convex.action(api.substitutions.queries.listProtocolWithRoleAccess, {
        token,
        selectedTeacherId: selectedTeacherId.value,
      }),
      convex.action(api.makeupRequests.queries.listMakeupRequestsWithRoleAccess, {
        token,
        selectedTeacherId: selectedTeacherId.value,
      }),
    ]);

    const substitutions: SubstitutionEntry[] = substitutionsData.map(
      (entry: any) => ({ ...entry, type: "substitution" as const })
    );
    const makeupRequests: MakeupRequestEntry[] = makeupData.map(
      (entry: any) => ({ ...entry, type: "makeup_request" as const })
    );

    const merged: ProtocolEntry[] = [...substitutions, ...makeupRequests];
    merged.sort((a, b) => b.createdAt - a.createdAt);
    entries.value = merged;
  } catch (err) {
    console.error("[protocolStore] Failed to fetch protocol entries:", err);
    error.value = "Не удалось загрузить протоколы";
    entries.value = [];
  } finally {
    loading.value = false;
  }
}
```

- [ ] **Step 3: Add acceptMakeupRequest and rejectMakeupRequest actions**

After `rejectEntry`, add:

```ts
async function acceptMakeupRequest(makeupRequestId: Id<"makeupRequests">) {
  const userId = userStore.currentUser?.id as Id<"users">;
  if (!userId) return;

  actionLoading.value = true;
  actionError.value = null;

  try {
    await convex.mutation(api.makeupRequests.mutations.acceptMakeupRequest, {
      makeupRequestId,
      userId,
    });
    await fetchProtocolWithRoleAccess();
  } catch (err: any) {
    actionError.value = err?.message ?? "Не удалось принять запрос на отработку";
  } finally {
    actionLoading.value = false;
  }
}

async function rejectMakeupRequest(
  makeupRequestId: Id<"makeupRequests">,
  reason?: string
) {
  const userId = userStore.currentUser?.id as Id<"users">;
  if (!userId) return;

  actionLoading.value = true;
  actionError.value = null;

  try {
    await convex.mutation(api.makeupRequests.mutations.rejectMakeupRequest, {
      makeupRequestId,
      userId,
      rejectionReason: reason,
    });
    await fetchProtocolWithRoleAccess();
  } catch (err: any) {
    actionError.value = err?.message ?? "Не удалось отклонить запрос на отработку";
  } finally {
    actionLoading.value = false;
  }
}
```

- [ ] **Step 4: Add new actions to the return object**

In the `return { ... }` at the bottom, add `acceptMakeupRequest` and `rejectMakeupRequest` to the returned object.

- [ ] **Step 5: Commit**

```bash
git add src/stores/protocolStore.ts
git commit -m "feat: extend protocolStore with makeup request union type and actions"
```

---

## Task 7: Create MakeupHoursPopover.vue

**Files:**
- Create: `src/components/MakeupHoursPopover.vue`

This follows the same structure as `ReplaceJournalPopover.vue` — `GuardedPopover` + `PopoverHeader` + `PopoverFooter` + `Select` + `f7Input` datepicker.

- [ ] **Step 1: Create the component**

```vue
<template>
  <GuardedPopover
    v-slot="{ requestClose }"
    id="makeup-hours-popover"
    positioning="center"
    style="width: 520px !important"
    :is-dirty="isDirty"
    :on-closed="resetForm"
    :close-by-outside-click="false"
  >
    <div class="bg-card text-card-foreground">
      <PopoverHeader
        :title="makeup_hours_title()"
        :on-cancel="requestClose"
      />

      <div class="px-8 pb-2 pt-4 space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">
        <!-- Reason -->
        <div>
          <label class="text-sm font-normal mb-1 block text-muted-foreground">
            {{ makeup_hours_reason_label() }}
          </label>
          <textarea
            v-model="reason"
            :placeholder="makeup_hours_reason_placeholder()"
            rows="3"
            class="w-full px-4 py-2.5 text-sm bg-muted/50 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground resize-none transition-all"
          ></textarea>
        </div>

        <!-- Date entries -->
        <div
          v-for="(entry, index) in dateEntries"
          :key="entry.id"
          class="p-4 bg-muted/30 rounded-2xl border border-input space-y-3 relative"
        >
          <button
            v-if="dateEntries.length > 1"
            type="button"
            @click="removeEntry(entry.id)"
            class="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors"
          >
            <IconTrash2 class="w-4 h-4" />
          </button>

          <div class="grid grid-cols-2 gap-3">
            <!-- Existing scheduled date (select) -->
            <div>
              <label class="text-sm font-normal mb-1 block text-muted-foreground">
                {{ makeup_hours_scheduled_date() }}
              </label>
              <Select
                v-model="entry.existingDate"
                :options="journalDateOptions"
                :placeholder="makeup_hours_select_date()"
              />
            </div>

            <!-- New makeup date (datepicker) -->
            <div>
              <label class="text-sm font-normal mb-1 block text-muted-foreground">
                {{ makeup_hours_new_date() }}
              </label>
              <f7-input
                type="datepicker"
                placeholder="дд.мм.гггг"
                v-model:value="entry.newDate"
                readonly
                :calendar-params="DATE_PICKER_PARAMS"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <!-- Start time -->
            <div>
              <label class="text-sm font-normal mb-1 block text-muted-foreground">
                {{ makeup_hours_time_from() }}
              </label>
              <Select
                v-model="entry.startScheduleId"
                :options="startTimeOptions"
                placeholder="—"
                @update:modelValue="(v) => onStartChange(entry, v)"
              />
            </div>

            <!-- End time -->
            <div>
              <label class="text-sm font-normal mb-1 block text-muted-foreground">
                {{ makeup_hours_time_to() }}
              </label>
              <Select
                v-model="entry.endScheduleId"
                :options="endTimeOptions(entry.startScheduleId)"
                placeholder="—"
              />
            </div>
          </div>
        </div>

        <!-- Add date button -->
        <button
          type="button"
          @click="addEntry"
          class="w-full py-3 border-2 border-dashed border-input rounded-2xl text-muted-foreground font-semibold hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-sm"
        >
          <IconPlus class="w-4 h-4" />
          {{ makeup_hours_add_date() }}
        </button>
      </div>

      <PopoverFooter
        :on-cancel="requestClose"
        :on-save="() => onSave(requestClose)"
        :disabled="!isFormValid"
        :is-loading="isLoading"
        cancel-text="Отмена"
        :save-text="makeup_hours_submit()"
      />
    </div>
  </GuardedPopover>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7Input } from "framework7-vue";
import dayjs from "dayjs";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import Select from "@/components/ui/Select.vue";
import IconTrash2 from "~icons/lucide/trash-2";
import IconPlus from "~icons/lucide/plus";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { storeToRefs } from "pinia";
import { getDatePickerParams, DATE_STORAGE_FORMAT } from "@/constants/calendar";
import {
  makeup_hours_title,
  makeup_hours_reason_label,
  makeup_hours_reason_placeholder,
  makeup_hours_scheduled_date,
  makeup_hours_new_date,
  makeup_hours_time_from,
  makeup_hours_time_to,
  makeup_hours_add_date,
  makeup_hours_submit,
  makeup_hours_select_date,
} from "@/paraglide/messages";

const DATE_PICKER_PARAMS = getDatePickerParams();

export interface MakeupHoursData {
  reason: string;
  dates: Array<{
    existingDate: string;
    newDate: string;        // ISO YYYY-MM-DD
    startScheduleId: string;
    endScheduleId: string;
  }>;
}

const props = defineProps<{
  journalDates: Array<{ isoDate: string; label: string }>;
  isLoading?: boolean;
}>();

const emit = defineEmits<{
  save: [data: MakeupHoursData];
}>();

const educationScheduleStore = useEducationScheduleStore();
const { getActiveYearSchedules } = storeToRefs(educationScheduleStore);

interface DateEntry {
  id: number;
  existingDate: string;
  newDate: Date[];
  startScheduleId: string;
  endScheduleId: string;
}

function makeEntry(): DateEntry {
  const schedules = getActiveYearSchedules.value;
  return {
    id: Date.now() + Math.random(),
    existingDate: "",
    newDate: [],
    startScheduleId: schedules[0]?.id ?? "",
    endScheduleId: schedules[schedules.length - 1]?.id ?? "",
  };
}

const reason = ref("");
const dateEntries = ref<DateEntry[]>([makeEntry()]);

const journalDateOptions = computed(() =>
  props.journalDates.map((d) => ({ value: d.isoDate, text: d.label }))
);

const startTimeOptions = computed(() =>
  getActiveYearSchedules.value.map((s) => ({ value: s.id, text: s.startTime }))
);

function endTimeOptions(startScheduleId: string) {
  const schedules = getActiveYearSchedules.value;
  const startIdx = schedules.findIndex((s) => s.id === startScheduleId);
  const from = startIdx === -1 ? 0 : startIdx;
  return schedules.slice(from).map((s) => ({ value: s.id, text: s.endTime }));
}

function onStartChange(entry: DateEntry, newStartId: string) {
  const schedules = getActiveYearSchedules.value;
  const startIdx = schedules.findIndex((s) => s.id === newStartId);
  const endIdx = schedules.findIndex((s) => s.id === entry.endScheduleId);
  if (endIdx !== -1 && endIdx < startIdx) {
    entry.endScheduleId = newStartId;
  }
}

function addEntry() {
  dateEntries.value.push(makeEntry());
}

function removeEntry(id: number) {
  dateEntries.value = dateEntries.value.filter((e) => e.id !== id);
}

const isFormValid = computed(() =>
  dateEntries.value.some(
    (e) => e.existingDate && e.newDate.length > 0
  )
);

const isDirty = computed(
  () =>
    reason.value.trim() !== "" ||
    dateEntries.value.some(
      (e) => e.existingDate || e.newDate.length > 0
    )
);

function resetForm() {
  reason.value = "";
  dateEntries.value = [makeEntry()];
}

async function onSave(requestClose: () => void) {
  const validDates = dateEntries.value
    .filter((e) => e.existingDate && e.newDate.length > 0)
    .map((e) => ({
      existingDate: e.existingDate,
      newDate: dayjs(e.newDate[0]).format(DATE_STORAGE_FORMAT),
      startScheduleId: e.startScheduleId,
      endScheduleId: e.endScheduleId,
    }));

  if (validDates.length === 0) return;

  emit("save", { reason: reason.value, dates: validDates });
  requestClose();
}
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/MakeupHoursPopover.vue
git commit -m "feat: add MakeupHoursPopover component"
```

---

## Task 8: Update JournalTab.vue to trigger makeup hours

**Files:**
- Modify: `src/components/JournalTab.vue`

Three changes: (1) add trigger button in the tools dropdown, (2) add `journalDatesForMakeup` computed, (3) include the popover component with handler.

- [ ] **Step 1: Add trigger button in tools dropdown**

In the template, find the `<div class="h-px bg-border my-1" />` divider line (around line 107) that precedes the "Закрыть журнал" button. Insert the makeup hours button **before** that divider:

```html
          <button
            type="button"
            class="w-full text-left px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-3"
            @click="close(); onMakeupHoursClick()"
          >
            <IconClockPlus class="w-4 h-4" />
            {{ makeup_hours_title() }}
          </button>
```

- [ ] **Step 2: Include MakeupHoursPopover in the template**

After the existing `<JournalHistoryDialog .../>` component in the template (search for `JournalHistoryDialog`), add:

```html
      <MakeupHoursPopover
        :journal-dates="journalDatesForMakeup"
        :is-loading="isMakeupRequestLoading"
        @save="onMakeupHoursSave"
      />
```

- [ ] **Step 3: Add imports in the script section**

In the imports block (around line 637–679), add:

```ts
import MakeupHoursPopover from "@/components/MakeupHoursPopover.vue";
import type { MakeupHoursData } from "@/components/MakeupHoursPopover.vue";
import IconClockPlus from "~icons/lucide/clock-plus";
import { useMakeupRequestStore } from "@/stores/makeupRequestStore";
import { useUserStore } from "@/stores/userStore";
import { useTeacherStore } from "@/stores/teacherStore";
import {
  makeup_hours_title,
} from "@/paraglide/messages";
```

> Note: `useTeacherStore` and `useUserStore` may already be imported — check first and only add if missing.

- [ ] **Step 4: Add computed and handler in the script section**

After the `onRecalcPopupClosed` function (around line 2361), add:

```ts
// Makeup Hours
const makeupRequestStore = useMakeupRequestStore();
const userStore = useUserStore();
const teacherStore = useTeacherStore();
const isMakeupRequestLoading = computed(() => makeupRequestStore.loading);

const journalDatesForMakeup = computed(() =>
  (canonicalTemplate.value ?? [])
    .filter((m: any) => m.type === "date" && m.isoDate)
    .map((m: any) => ({
      isoDate: m.isoDate as string,
      label: String(m.label).replace("\n", " "),
    }))
);

const onMakeupHoursClick = () => {
  f7.popover.open("#makeup-hours-popover", "#journal-tools-button");
};

const onMakeupHoursSave = async (data: MakeupHoursData) => {
  const userId = userStore.currentUser?.id;
  if (!userId) {
    f7.dialog.alert("Пользователь не авторизован");
    return;
  }
  const teacher = teacherStore.getTeacherByUserId(userId);
  if (!teacher) {
    f7.dialog.alert("Преподаватель не найден");
    return;
  }

  try {
    await makeupRequestStore.createMakeupRequest({
      journalId: props.journalId,
      teacherId: teacher.id,
      createdBy: userId,
      reason: data.reason || undefined,
      dates: data.dates,
    });
    f7.toast
      .create({
        text: "Запрос на отработку часов отправлен на модерацию",
        position: "center",
        closeTimeout: 2500,
      })
      .open();
  } catch {
    f7.dialog.alert(
      makeupRequestStore.error ?? "Не удалось отправить запрос"
    );
  }
};
```

- [ ] **Step 5: Commit**

```bash
git add src/components/JournalTab.vue
git commit -m "feat: add makeup hours trigger and handler to JournalTab"
```

---

## Task 9: Update protocol.vue to render makeup request cards

**Files:**
- Modify: `src/pages/protocol.vue`

Three changes: (1) add makeup request card inside the entries loop, (2) generalize `pendingAction` type to support both entry types, (3) extend `confirmAction`.

- [ ] **Step 1: Update import of ProtocolEntry and add new i18n imports**

Near the top of the `<script setup>` block, find the import of `ProtocolEntry` from `protocolStore`:

```ts
import type { ProtocolEntry } from "@/stores/protocolStore";
```

Change it to also import `Id` for `makeupRequests`:

```ts
import type { ProtocolEntry, MakeupRequestEntry } from "@/stores/protocolStore";
```

Also add the new i18n message imports where the others are (in the existing import block):

```ts
  protocol_makeup_request_label,
  protocol_makeup_request_title,
  protocol_makeup_dates_label,
```

- [ ] **Step 2: Generalize pendingAction type**

Find:
```ts
const pendingAction = ref<{
  id: Id<"substitutions">;
  type: "accept" | "reject";
} | null>(null);
```

Replace with:
```ts
const pendingAction = ref<{
  id: string;
  entryType: "substitution" | "makeup_request";
  type: "accept" | "reject";
} | null>(null);
```

- [ ] **Step 3: Update openModal to accept entryType**

Find:
```ts
function openModal(id: Id<"substitutions">, type: "accept" | "reject") {
  pendingAction.value = { id, type };
```

Replace with:
```ts
function openModal(
  id: string,
  entryType: "substitution" | "makeup_request",
  type: "accept" | "reject"
) {
  pendingAction.value = { id, entryType, type };
```

- [ ] **Step 4: Update confirmAction to dispatch by entryType**

Find and replace:
```ts
async function confirmAction() {
  if (!pendingAction.value) return;
  const { id, type } = pendingAction.value;
  closeModal();
  if (type === "accept") {
    await protocolStore.acceptEntry(id);
  } else {
    await protocolStore.rejectEntry(id, rejectReason.value || undefined);
  }
}
```

Replace with:
```ts
async function confirmAction() {
  if (!pendingAction.value) return;
  const { id, entryType, type } = pendingAction.value;
  closeModal();
  if (entryType === "substitution") {
    if (type === "accept") {
      await protocolStore.acceptEntry(id as Id<"substitutions">);
    } else {
      await protocolStore.rejectEntry(id as Id<"substitutions">, rejectReason.value || undefined);
    }
  } else {
    if (type === "accept") {
      await protocolStore.acceptMakeupRequest(id as Id<"makeupRequests">);
    } else {
      await protocolStore.rejectMakeupRequest(id as Id<"makeupRequests">, rejectReason.value || undefined);
    }
  }
}
```

- [ ] **Step 5: Update existing openModal calls in template**

In the template, find the two existing calls to `openModal` (the reject and accept buttons inside substitution cards). They currently look like:

```html
@click="openModal(entry._id, 'reject')"
@click="openModal(entry._id, 'accept')"
```

Update them to pass `entry.type`:

```html
@click="openModal(entry._id, entry.type, 'reject')"
@click="openModal(entry._id, entry.type, 'accept')"
```

- [ ] **Step 6: Add the makeup request card in the template**

Inside the entries loop, the current code renders a single card for all entries. Wrap the existing card in a `v-if="entry.type === 'substitution'"` and add a `v-else` card for makeup requests.

Find the `<div class="protocol-entry relative overflow-hidden rounded-lg bg-card border border-border shadow-sm">` opening (around line 80). The entire entry div (from that opening to its closing `</div>`) needs to become conditional.

**Before** the existing entry div, add:

```html
              <template v-if="entry.type === 'substitution'">
```

**After** the closing `</div>` of the existing entry card (after `</div>` that closes the `pl-5 pr-4 py-4` div), add:

```html
              </template>

              <!-- Makeup request card -->
              <template v-else-if="entry.type === 'makeup_request'">
                <div class="protocol-entry relative overflow-hidden rounded-lg bg-card border border-border shadow-sm">
                  <div
                    class="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                    :class="{
                      'bg-blue-400':  entry.status === 'pending',
                      'bg-green-400': entry.status === 'accepted',
                      'bg-red-400':   entry.status === 'rejected',
                    }"
                  ></div>

                  <div class="pl-5 pr-4 py-4 flex flex-col md:flex-row gap-4">
                    <!-- Left: dot + time -->
                    <div class="flex-shrink-0 flex flex-col items-center gap-1.5 min-w-[52px]">
                      <div
                        class="w-3 h-3 rounded-full mt-0.5"
                        :class="{
                          'bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-900/30':    entry.status === 'pending',
                          'bg-green-500 ring-4 ring-green-100 dark:ring-green-900/30': entry.status === 'accepted',
                          'bg-red-500 ring-4 ring-red-100 dark:ring-red-900/30':       entry.status === 'rejected',
                        }"
                      ></div>
                      <span class="text-xs text-muted-foreground font-mono">
                        {{ formatTime(entry.createdAt) }}
                      </span>
                    </div>

                    <!-- Center: content -->
                    <div class="flex-grow min-w-0">
                      <div class="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 class="text-sm font-semibold text-foreground">
                          {{ protocol_makeup_request_title() }}
                        </h3>
                        <span class="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase font-bold tracking-wide">
                          {{ protocol_makeup_request_label() }}
                        </span>
                      </div>

                      <p class="text-sm text-muted-foreground leading-relaxed mb-2">
                        {{ protocol_journal() }}
                        <span class="font-medium text-foreground">
                          {{ entry.journalSnapshot?.disciplineName ?? protocol_discipline_fallback() }}
                        </span>
                        <span v-if="entry.journalSnapshot?.groupName"> {{ entry.journalSnapshot.groupName }}</span>
                        <template v-if="entry.teacher">
                          {{ protocol_teacher_from() }}
                          <span class="font-medium text-foreground">
                            {{ protocolStore.getTeacherName(entry.teacher) }}
                          </span>
                        </template>
                      </p>

                      <div class="mb-2">
                        <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {{ protocol_makeup_dates_label() }}:
                        </span>
                        <ul class="mt-1 space-y-0.5">
                          <li
                            v-for="(d, i) in entry.dates"
                            :key="i"
                            class="text-xs text-foreground font-medium"
                          >
                            {{ d.existingDate }} → {{ d.newDate }}
                          </li>
                        </ul>
                      </div>

                      <p v-if="entry.reason" class="text-xs text-muted-foreground italic">
                        {{ protocol_reason() }} {{ entry.reason }}
                      </p>
                    </div>

                    <!-- Right: actions / status -->
                    <div class="flex-shrink-0 md:w-44 flex flex-col justify-center items-end gap-2">
                      <template v-if="isAdmin && entry.status === 'pending'">
                        <span class="text-xs font-semibold text-muted-foreground self-end">{{ protocol_action_label() }}</span>
                        <div class="flex gap-2">
                          <button
                            @click="openModal(entry._id, 'makeup_request', 'reject')"
                            :disabled="protocolStore.actionLoading"
                            class="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs font-bold shadow-sm disabled:opacity-50"
                          >
                            ✕ {{ protocol_reject() }}
                          </button>
                          <button
                            @click="openModal(entry._id, 'makeup_request', 'accept')"
                            :disabled="protocolStore.actionLoading"
                            class="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs font-bold shadow-sm disabled:opacity-50"
                          >
                            ✓ {{ protocol_accept() }}
                          </button>
                        </div>
                      </template>

                      <template v-else-if="entry.status === 'pending'">
                        <div class="flex items-center gap-1.5 text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full">
                          <span class="text-xs font-bold">{{ protocol_waiting() }}</span>
                        </div>
                      </template>

                      <template v-else-if="entry.status === 'accepted'">
                        <div class="flex items-center gap-1.5 text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full">
                          <span class="text-xs font-bold">{{ protocol_accepted() }}</span>
                        </div>
                      </template>

                      <template v-else-if="entry.status === 'rejected'">
                        <div class="flex items-center gap-1.5 text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full">
                          <span class="text-xs font-bold">{{ protocol_rejected() }}</span>
                        </div>
                        <p v-if="entry.rejectionReason" class="text-[10px] text-muted-foreground text-right mt-1">
                          {{ entry.rejectionReason }}
                        </p>
                      </template>
                    </div>
                  </div>
                </div>
              </template>
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/protocol.vue
git commit -m "feat: render makeup request cards in protocol page with accept/reject flow"
```

---

## Task 10: Smoke test and final cleanup

- [ ] **Step 1: Start the dev server**

```bash
npm run dev:all
```

Wait for both Convex and Vite to report ready.

- [ ] **Step 2: Test the teacher flow**

1. Log in as a teacher.
2. Open a journal → click the `⋮` tools button.
3. Confirm "Добавить отработку часов" appears in the dropdown.
4. Click it → popover opens.
5. Select an existing date from the dropdown (should show journal session dates).
6. Pick a new makeup date with the datepicker.
7. Verify start/end time selects are populated from the bell schedule.
8. Add a second date pair with "+ Добавить ещё дату".
9. Click "Отправить на модерацию" → toast appears "Запрос на отработку часов отправлен на модерацию".

- [ ] **Step 3: Test the admin flow**

1. Log in as an admin.
2. Navigate to the Protocol page.
3. Confirm the makeup request card appears with "ОТРАБОТКА" badge.
4. Click "Принять" → card status changes to green "Принята".
5. Create another makeup request and click "Отклонить" with a reason → card turns red.

- [ ] **Step 4: Check browser console for errors**

No TypeScript errors, no Vue warnings, no unhandled promise rejections.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: port 'Добавить отработку часов' from concept-v2 to mars-2.0

- New makeupRequests Convex table with pending/accepted/rejected lifecycle
- MakeupHoursPopover with journal date select, new date picker, bell schedule time slots
- Protocol page renders makeup request cards alongside substitutions
- Admin accept/reject flow mirrors journal substitution workflow"
```
