# Protocol Admin-Centric Approval Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shift substitution (замена) approval from replacement teacher to admin — teacher submits request, admin approves/rejects in Protocol, replacement teacher is notified only after admin approval.

**Architecture:** Backend changes to Convex mutations (create/accept/reject) and queries (protocol listing), plus frontend gating of approve/reject buttons to admin-only in NotificationCenterPopover, notifications.vue, and protocol.vue.

**Tech Stack:** Convex (mutations, queries, actions), Vue 3, Pinia, Framework7, Playwright (E2E verification)

---

## File Map

| File | Change |
|---|---|
| `convex/schema.ts` | Add `rejectionReason` field to `substitutions` table |
| `convex/substitutions/mutations.ts` | Update `createSubstitution`, `createBulkSubstitutions`, `acceptSubstitution`, `rejectSubstitution` |
| `convex/substitutions/queries.ts` | Update `listProtocolWithRoleAccessInternal` teacher view |
| `src/components/NotificationCenterPopover.vue` | Gate accept/reject substitution buttons to admin only |
| `src/pages/notifications.vue` | Gate accept/reject substitution buttons to admin only |
| `src/pages/protocol.vue` | Remove action buttons for TEACHER role |

---

### Task 1: Add `rejectionReason` to schema

**Files:**
- Modify: `convex/schema.ts`

- [ ] **Step 1: Add field to substitutions table**

In `convex/schema.ts`, find the `substitutions: defineTable({` block. After the `reason: v.optional(v.string()),` line, add:

```ts
rejectionReason: v.optional(v.string()), // Admin rejection reason
```

- [ ] **Step 2: Verify Convex deploys cleanly**

```bash
npx convex dev --once
```

Expected: no errors, schema migration succeeds.

- [ ] **Step 3: Commit**

```bash
git add convex/schema.ts
git commit -m "feat(schema): add rejectionReason field to substitutions"
```

---

### Task 2: Notify admins on substitution creation (createSubstitution)

**Files:**
- Modify: `convex/substitutions/mutations.ts` — `createSubstitution` handler

- [ ] **Step 1: Replace replacement-teacher notification with admin notifications**

In `createSubstitution` handler, find the `await ctx.db.insert("notifications", {` block that inserts for `userId: args.toUserId`. Replace the entire block with:

```ts
// Notify all admins about the pending substitution request
const allUsers = await ctx.db.query("users").collect();
const adminUsers = allUsers.filter((u) => u.roles.includes("ADMIN"));

for (const admin of adminUsers) {
  await ctx.db.insert("notifications", {
    userId: admin._id,
    type: "substitution",
    status: "unread",
    title: "Запрос замены",
    message: `${fromTeacherName} запрашивает замену журнала "${disciplineName}" на ${args.startDate}–${args.endDate}.`,
    metadata: {
      substitutionId,
      journalId: args.journalId,
    },
    createdAt: Date.now(),
  });
}
```

Note: `fromTeacherName` and `disciplineName` are already computed above this block in the handler.

- [ ] **Step 2: Verify deploy**

```bash
npx convex dev --once
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add convex/substitutions/mutations.ts
git commit -m "feat(substitutions): notify admins instead of replacement teacher on creation"
```

---

### Task 3: Notify admins on bulk substitution creation (createBulkSubstitutions)

**Files:**
- Modify: `convex/substitutions/mutations.ts` — `createBulkSubstitutions` handler

- [ ] **Step 1: Fetch admin users once before the loop**

In `createBulkSubstitutions`, before the `for (const calendarEventId of args.calendarEventIds)` loop, add:

```ts
const allUsers = await ctx.db.query("users").collect();
const adminUsers = allUsers.filter((u) => u.roles.includes("ADMIN"));
```

- [ ] **Step 2: Replace the per-iteration notification block**

Inside the loop, find the `await ctx.db.insert("notifications", {` block that inserts for `userId: args.toUserId`. Replace it with:

```ts
// Notify admins (not replacement teacher) about the pending request
for (const admin of adminUsers) {
  await ctx.db.insert("notifications", {
    userId: admin._id,
    type: "substitution",
    status: "unread",
    title: "Запрос замены",
    message: `${fromTeacherName} запрашивает замену журнала "${disciplineName}" на ${args.startDate}–${args.endDate}.`,
    metadata: { substitutionId, journalId },
    createdAt: now,
  });
}
```

- [ ] **Step 3: Verify deploy**

```bash
npx convex dev --once
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add convex/substitutions/mutations.ts
git commit -m "feat(substitutions): bulk creation notifies admins instead of replacement teacher"
```

---

### Task 4: acceptSubstitution — admin-only, notify both teachers

**Files:**
- Modify: `convex/substitutions/mutations.ts` — `acceptSubstitution` handler

- [ ] **Step 1: Replace authorization check**

Find this block:

```ts
// Verify the user is the receiving teacher
if (substitution.toUserId !== args.userId) {
  throw new Error("Вы не можете принять эту замену");
}
```

Replace with:

```ts
// Verify the user is an admin
const actingUser = await ctx.db.get(args.userId);
if (!actingUser || !actingUser.roles.includes("ADMIN")) {
  throw new Error("Только администратор может одобрить замену");
}
```

- [ ] **Step 2: Remove old mark-as-read block and add post-approval notifications**

After the `await ctx.db.patch(args.substitutionId, { ... })` call (the one that sets `status: "accepted"`), **delete** the entire existing block that starts with `// Mark the related notification as read` (about 15 lines querying notifications by `userId` and patching `status: "read"`). Replace it with:

```ts
// Notify replacement teacher
await ctx.db.insert("notifications", {
  userId: substitution.toUserId,
  type: "substitution",
  status: "unread",
  title: "Замена одобрена",
  message: `Администратор одобрил замену журнала "${substitution.journalSnapshot?.disciplineName ?? ""}". Вы назначены заместителем с ${substitution.startDate} по ${substitution.endDate}.`,
  metadata: { substitutionId: args.substitutionId, journalId: substitution.journalId },
  createdAt: Date.now(),
});

// Notify original teacher
const fromTeacher = await ctx.db
  .query("teachers")
  .collect()
  .then((teachers) => teachers.find((t) => t._id === substitution.fromTeacherId));

if (fromTeacher?.userId) {
  await ctx.db.insert("notifications", {
    userId: fromTeacher.userId,
    type: "system",
    status: "unread",
    title: "Замена одобрена",
    message: `Замена журнала "${substitution.journalSnapshot?.disciplineName ?? ""}" одобрена администратором.`,
    createdAt: Date.now(),
  });
}
```

- [ ] **Step 3: Verify deploy**

```bash
npx convex dev --once
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add convex/substitutions/mutations.ts
git commit -m "feat(substitutions): acceptSubstitution now admin-only, notifies both teachers on approval"
```

---

### Task 5: rejectSubstitution — admin-only, store reason, notify original teacher

**Files:**
- Modify: `convex/substitutions/mutations.ts` — `rejectSubstitution` handler

- [ ] **Step 1: Replace authorization check**

Find:

```ts
// Verify the user is the receiving teacher
if (substitution.toUserId !== args.userId) {
  throw new Error("Вы не можете отклонить эту замену");
}
```

Replace with:

```ts
// Verify the user is an admin
const actingUser = await ctx.db.get(args.userId);
if (!actingUser || !actingUser.roles.includes("ADMIN")) {
  throw new Error("Только администратор может отклонить замену");
}
```

- [ ] **Step 2: Store rejectionReason in the patch**

Find:

```ts
await ctx.db.patch(args.substitutionId, {
  status: "rejected",
  rejectedAt: Date.now(),
  updatedAt: Date.now(),
});
```

Replace with:

```ts
await ctx.db.patch(args.substitutionId, {
  status: "rejected",
  rejectedAt: Date.now(),
  updatedAt: Date.now(),
  rejectionReason: args.rejectionReason,
});
```

- [ ] **Step 3: Fix notification recipient to original teacher**

Find the block that starts with `const fromTeacher = await ctx.db.query("teachers")...` and the subsequent `if (fromTeacher?.userId)` notification block. Replace the entire block (from the query to the end of the if block) with:

```ts
// Notify original teacher about rejection
const fromTeacher = await ctx.db
  .query("teachers")
  .collect()
  .then((teachers) => teachers.find((t) => t._id === substitution.fromTeacherId));

if (fromTeacher?.userId) {
  await ctx.db.insert("notifications", {
    userId: fromTeacher.userId,
    type: "system",
    status: "unread",
    title: "Замена отклонена",
    message: `Замена журнала "${substitution.journalSnapshot?.disciplineName ?? ""}" отклонена администратором${args.rejectionReason ? `: ${args.rejectionReason}` : "."}`,
    createdAt: Date.now(),
  });
}
```

- [ ] **Step 4: Verify deploy**

```bash
npx convex dev --once
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add convex/substitutions/mutations.ts
git commit -m "feat(substitutions): rejectSubstitution now admin-only, stores reason, notifies original teacher"
```

---

### Task 6: Protocol query — teacher sees only submitted requests

**Files:**
- Modify: `convex/substitutions/queries.ts` — `listProtocolWithRoleAccessInternal`

- [ ] **Step 1: Remove received substitutions from teacher view**

Find the `if (isTeacher && !isAdmin)` branch. It currently does:

```ts
const [sentSubstitutions, receivedSubstitutions] = await Promise.all([
  ctx.db.query("substitutions").withIndex("by_fromTeacher", ...).collect(),
  ctx.db.query("substitutions").withIndex("by_toTeacher", ...).collect(),
]);
// Merge and deduplicate by _id
const substitutionMap = new Map();
for (const sub of [...sentSubstitutions, ...receivedSubstitutions]) {
  substitutionMap.set(sub._id, sub);
}
substitutions = Array.from(substitutionMap.values());
```

Replace with:

```ts
// Teachers only see their own submitted requests (sent), not received ones
substitutions = await ctx.db
  .query("substitutions")
  .withIndex("by_fromTeacher", (q) => q.eq("fromTeacherId", teacherRecord._id))
  .collect();
```

- [ ] **Step 2: Verify deploy**

```bash
npx convex dev --once
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add convex/substitutions/queries.ts
git commit -m "feat(protocol): teacher protocol shows only their submitted requests"
```

---

### Task 7: Gate accept/reject in NotificationCenterPopover to admin only

**Files:**
- Modify: `src/components/NotificationCenterPopover.vue`

- [ ] **Step 1: Add isAdmin computed**

In the `<script setup>` section, find the line:

```ts
const currentUserId = computed(() => userStore.currentUser?.id as Id<"users"> | undefined);
```

Add below it:

```ts
const isAdmin = computed(() => userStore.isAdmin);
```

- [ ] **Step 2: Gate the accept/reject button block**

Find the block at approximately line 88:

```html
v-if="notification.type === 'substitution' && notification.substitution && notification.substitution.status === 'pending'"
```

Change the `v-if` condition to also require `isAdmin`:

```html
v-if="isAdmin && notification.type === 'substitution' && notification.substitution && notification.substitution.status === 'pending'"
```

- [ ] **Step 3: Commit**

```bash
git add src/components/NotificationCenterPopover.vue
git commit -m "feat(notifications): substitution accept/reject actions only shown to admins"
```

---

### Task 8: Gate accept/reject in notifications.vue to admin only

**Files:**
- Modify: `src/pages/notifications.vue`

- [ ] **Step 1: Add isAdmin computed**

In the `<script setup>` section, find where `userStore` is used. Add:

```ts
const isAdmin = computed(() => userStore.isAdmin);
```

- [ ] **Step 2: Gate the accept/reject button block**

Find the block at approximately line 102:

```html
v-if="notification.substitution && notification.substitution.status === 'pending'"
```

Change to:

```html
v-if="isAdmin && notification.substitution && notification.substitution.status === 'pending'"
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/notifications.vue
git commit -m "feat(notifications): substitution accept/reject actions only shown to admins"
```

---

### Task 9: Protocol page — remove action buttons for TEACHER role

**Files:**
- Modify: `src/pages/protocol.vue`

- [ ] **Step 1: Add isAdmin computed**

In `<script setup>`, after the `protocolStore` is imported, add:

```ts
const userStore = useUserStore();
const isAdmin = computed(() => userStore.isAdmin);
```

If `useUserStore` is not yet imported, add:

```ts
import { useUserStore } from '@/stores/userStore';
```

- [ ] **Step 2: Wrap action buttons in v-if="isAdmin"**

Find the section that renders "Принять" / "Отклонить" buttons for `pending` entries. The buttons will be inside a block conditional on `entry.status === 'pending'`. Wrap the entire button group with `v-if="isAdmin"`:

```html
<template v-if="isAdmin && entry.status === 'pending'">
  <!-- existing approve and reject buttons unchanged -->
</template>
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/protocol.vue
git commit -m "feat(protocol): action buttons only shown to admins, teachers see read-only history"
```

---

### Task 10: Playwright E2E verification

**Files:**
- No code changes — verification only

> Run the dev server before starting: `npm run dev` (separate terminal)

- [ ] **Step 1: Open browser and login as teacher**

```ts
await page.goto('http://localhost:5173');
// Login as mnikitenko / ZkFpGwkbfhhH
```

- [ ] **Step 2: Submit a substitution request**

Navigate to Журналы → select any journal → open the Замена (substitution) popover → pick any replacement teacher → fill required fields → click "Отправить на модерацию".

Expected: request submitted successfully, no immediate notification to replacement teacher.

- [ ] **Step 3: Check replacement teacher gets no notification yet**

Login as the replacement teacher. Open notification center.

Expected: no new "Замена" notification.

- [ ] **Step 4: Login as admin and verify notification**

Login as rkilash / qZwnB6zt2mom. Open notification center.

Expected: notification titled "Запрос замены" is visible.

- [ ] **Step 5: Admin navigates to Protocol**

Navigate to Протокол page.

Expected: the pending substitution entry appears with "Принять" and "Отклонить" buttons.

- [ ] **Step 6: Admin rejects with reason**

Click "Отклонить", enter rejection reason "Тест отклонения", confirm.

Expected: entry status changes to "Отклонена". Original teacher (mnikitenko) receives a notification: "Замена отклонена: Тест отклонения".

- [ ] **Step 7: Submit a second substitution and admin approves**

Login as mnikitenko, submit another substitution. Login as admin, go to Protocol, click "Принять".

Expected:
- Entry status changes to "Принята"
- Replacement teacher receives notification "Замена одобрена"
- Original teacher (mnikitenko) receives notification "Замена журнала … одобрена администратором"

- [ ] **Step 8: Teacher Protocol is read-only**

Login as mnikitenko, navigate to Протокол.

Expected: substitution entries are visible but there are no "Принять" / "Отклонить" buttons.

- [ ] **Step 9: Replacement teacher Protocol shows no received substitutions**

Login as the replacement teacher, navigate to Протокол.

Expected: no substitution entries shown (they did not submit any themselves).

- [ ] **Step 10: Commit any fixes found during verification**

If any issues were found and fixed during steps 1–9, commit them:

```bash
git add -p
git commit -m "fix(protocol): e2e verification fixes"
```
