# Protocol UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the "Протокол изменений и действий" timeline UI from `1-руп-и-каталог-дисциплин(1)/components/ProtocolView.tsx` into `src/pages/protocol.vue`, adding accept/reject actions wired to the existing Convex backend mutations.

**Architecture:** Add `acceptEntry` / `rejectEntry` methods to `protocolStore.ts` calling existing Convex mutations (`acceptSubstitution`, `rejectSubstitution`). Then redesign `protocol.vue` with the concept's timeline card layout — left color bar, dot+time column, content, actions column — plus a confirmation modal.

**Tech Stack:** Vue 3 Composition API, Pinia, Tailwind CSS (design tokens), Framework7-Vue, Convex client

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/stores/protocolStore.ts` | Modify | Add `acceptEntry`, `rejectEntry`, `actionLoading`, `actionError` |
| `src/pages/protocol.vue` | Modify | Full timeline UI redesign + confirmation modal |

No Convex backend changes — `acceptSubstitution` and `rejectSubstitution` mutations already exist.

---

## Chunk 1: Store — Accept/Reject Actions

### Task 1: Add accept/reject to protocolStore

**Files:**
- Modify: `src/stores/protocolStore.ts`

**Key facts:**
- `convex.mutation(api.substitutions.mutations.acceptSubstitution, { substitutionId, userId })` — `userId` must match `entry.toUserId` or backend throws
- `convex.mutation(api.substitutions.mutations.rejectSubstitution, { substitutionId, userId, rejectionReason? })`
- Current user's Convex ID: `userStore.currentUser?.id as Id<"users">`
- After mutating, call `fetchProtocolWithRoleAccess()` to refresh

- [ ] **Step 1: Add `actionLoading` and `actionError` refs to the store**

In `src/stores/protocolStore.ts`, after the existing `loading` and `error` refs:

```ts
const actionLoading = ref(false);
const actionError = ref<string | null>(null);
```

- [ ] **Step 2: Add `acceptEntry` method**

Add after the `setSelectedTeacher` function:

```ts
async function acceptEntry(substitutionId: Id<"substitutions">) {
  const userId = userStore.currentUser?.id as Id<"users">;
  if (!userId) return;

  actionLoading.value = true;
  actionError.value = null;

  try {
    await convex.mutation(api.substitutions.mutations.acceptSubstitution, {
      substitutionId,
      userId,
    });
    await fetchProtocolWithRoleAccess();
  } catch (err: any) {
    console.error("[protocolStore] acceptEntry failed:", err);
    actionError.value = err?.message || "Не удалось принять замену";
  } finally {
    actionLoading.value = false;
  }
}
```

- [ ] **Step 3: Add `rejectEntry` method**

Add directly after `acceptEntry`:

```ts
async function rejectEntry(
  substitutionId: Id<"substitutions">,
  reason?: string
) {
  const userId = userStore.currentUser?.id as Id<"users">;
  if (!userId) return;

  actionLoading.value = true;
  actionError.value = null;

  try {
    await convex.mutation(api.substitutions.mutations.rejectSubstitution, {
      substitutionId,
      userId,
      rejectionReason: reason,
    });
    await fetchProtocolWithRoleAccess();
  } catch (err: any) {
    console.error("[protocolStore] rejectEntry failed:", err);
    actionError.value = err?.message || "Не удалось отклонить замену";
  } finally {
    actionLoading.value = false;
  }
}
```

- [ ] **Step 4: Export the new state and methods**

In the `return { ... }` object at the bottom of the store, add:

```ts
actionLoading,
actionError,
acceptEntry,
rejectEntry,
```

- [ ] **Step 5: Verify the store compiles**

```bash
cd /home/olge/SOFT/git/mars-2.0
npx tsc --noEmit 2>&1 | grep -E "protocolStore|error"
```

Expected: No errors about protocolStore.

- [ ] **Step 6: Commit**

```bash
git add src/stores/protocolStore.ts
git commit -m "feat(protocol): add acceptEntry/rejectEntry actions to protocolStore"
```

---

## Chunk 2: UI Redesign — Timeline Cards + Modal

### Task 2: Redesign protocol.vue template

**Files:**
- Modify: `src/pages/protocol.vue`

**Design reference:** `1-руп-и-каталог-дисциплин(1)/components/ProtocolView.tsx`

**Card anatomy (each entry):**
```
┌─ [4px color bar] ──────────────────────────────────────────┐
│ [dot+ring] [HH:MM] │ title [badge] │          [actions]    │
│                    │ description   │                        │
│                    │ source        │                        │
└────────────────────────────────────────────────────────────┘
```

- Left bar color: `pending`→blue-400, `accepted`→green-400, `rejected`→red-400, `completed`→muted
- Dot ring: `pending`→blue-100/ring-blue, `accepted`→green-100/ring-green, `rejected`→red-100/ring-red
- Actions column (right): accept/reject buttons if `isCurrentUserToTeacher && pending`; else status pill
- Show accept/reject only when `userStore.currentUser?.id === entry.toUserId`

**Status pill colors (concept mapping to app statuses):**
- `accepted` → green-50/green-600 "Принято"
- `rejected` → red-50/red-600 "Отклонено"
- `completed` → muted "Завершено"
- `pending` (non-toTeacher view) → blue-50/blue-600 "Ожидает"

**Type badge:** All current entries are substitutions → always show `Замена` badge in gray-100/gray-600.

- [ ] **Step 1: Add modal state refs in `<script setup>`**

Replace or extend the existing `<script setup>` to add:

```ts
const modalOpen = ref(false);
const pendingAction = ref<{
  id: Id<"substitutions">;
  type: "accept" | "reject";
} | null>(null);

function openModal(id: Id<"substitutions">, type: "accept" | "reject") {
  pendingAction.value = { id, type };
  modalOpen.value = true;
}

function closeModal() {
  modalOpen.value = false;
  pendingAction.value = null;
}

async function confirmAction() {
  if (!pendingAction.value) return;
  const { id, type } = pendingAction.value;
  closeModal();
  if (type === "accept") {
    await protocolStore.acceptEntry(id);
  } else {
    await protocolStore.rejectEntry(id);
  }
}

function isCurrentUserToTeacher(entry: ProtocolEntry): boolean {
  return userStore.currentUser?.id === entry.toUserId;
}
```

Also update imports at the top of `<script setup>`:
```ts
import type { Id } from "@convex/_generated/dataModel";
import type { ProtocolEntry } from "@/stores/protocolStore";
```

- [ ] **Step 2: Redesign entry card in the template**

Replace the existing `<!-- Entries for this date -->` section with the new card layout. The full replacement for the `<div class="space-y-3">` block:

```html
<div class="space-y-3">
  <div
    v-for="entry in group.entries"
    :key="entry._id"
    class="protocol-entry relative overflow-hidden rounded-lg bg-card border border-border shadow-sm"
  >
    <!-- Left color bar -->
    <div
      class="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
      :class="{
        'bg-blue-400':    entry.status === 'pending',
        'bg-green-400':   entry.status === 'accepted',
        'bg-red-400':     entry.status === 'rejected',
        'bg-muted-foreground/30': entry.status === 'completed',
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
            'bg-muted-foreground ring-4 ring-muted/50':                  entry.status === 'completed',
          }"
        ></div>
        <span class="text-xs text-muted-foreground font-mono">
          {{ formatTime(entry.createdAt) }}
        </span>
      </div>

      <!-- Center: content -->
      <div class="flex-grow min-w-0">
        <div class="flex items-center gap-2 mb-1 flex-wrap">
          <h3 class="text-sm font-semibold text-foreground">Установлена замена</h3>
          <span class="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded uppercase font-bold tracking-wide">
            Замена
          </span>
        </div>

        <p class="text-sm text-muted-foreground leading-relaxed mb-2">
          Журнал
          <span class="font-medium text-foreground">{{ entry.disciplineName || entry.journalSnapshot?.disciplineName || 'Дисциплина' }}</span>
          <span v-if="entry.journal?.groupName"> {{ entry.journal.groupName }}</span>
          преподавателя
          <span class="font-medium text-foreground">{{ protocolStore.getTeacherName(entry.fromTeacher) }}</span>
          переведен преподавателю
          <span class="font-medium text-foreground">{{ protocolStore.getTeacherName(entry.toTeacher) }}</span>
          в период с
          <span class="font-medium text-foreground">{{ protocolStore.formatDate(entry.startDate) }}</span>
          г. по
          <span class="font-medium text-foreground">{{ protocolStore.formatDate(entry.endDate) }}</span>
          г.<span v-if="entry.serviceLetterNumber"> на основании служебного письма от <span class="font-medium text-foreground">{{ entry.serviceLetterNumber }}</span> г.</span>
        </p>

        <p v-if="entry.reason" class="text-xs text-muted-foreground italic">
          Причина: {{ entry.reason }}
        </p>
      </div>

      <!-- Right: actions / status -->
      <div class="flex-shrink-0 md:w-44 flex flex-col justify-center items-end gap-2">
        <!-- Pending + current user is toTeacher → show action buttons -->
        <template v-if="entry.status === 'pending' && isCurrentUserToTeacher(entry)">
          <span class="text-xs font-medium text-muted-foreground self-end">Действие:</span>
          <div class="flex gap-2">
            <button
              @click="openModal(entry._id, 'reject')"
              :disabled="protocolStore.actionLoading"
              class="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded border border-red-200 hover:bg-red-100 transition-colors text-xs font-bold disabled:opacity-50 dark:bg-red-900/20 dark:border-red-800 dark:hover:bg-red-900/30"
            >
              ✕ Отклонить
            </button>
            <button
              @click="openModal(entry._id, 'accept')"
              :disabled="protocolStore.actionLoading"
              class="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 rounded border border-green-200 hover:bg-green-100 transition-colors text-xs font-bold disabled:opacity-50 dark:bg-green-900/20 dark:border-green-800 dark:hover:bg-green-900/30"
            >
              ✓ Принять
            </button>
          </div>
        </template>

        <!-- Pending but not toTeacher → show waiting pill -->
        <template v-else-if="entry.status === 'pending'">
          <div class="flex items-center gap-1.5 text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full">
            <span class="text-xs font-bold">Ожидает</span>
          </div>
        </template>

        <!-- Accepted -->
        <template v-else-if="entry.status === 'accepted'">
          <div class="flex items-center gap-1.5 text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full">
            <span class="text-xs font-bold">✓ Принято</span>
          </div>
          <div v-if="entry.acceptedAt" class="text-[10px] text-muted-foreground text-right">
            {{ new Date(entry.acceptedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) }}
          </div>
        </template>

        <!-- Rejected -->
        <template v-else-if="entry.status === 'rejected'">
          <div class="flex items-center gap-1.5 text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full">
            <span class="text-xs font-bold">✕ Отклонено</span>
          </div>
          <div v-if="entry.rejectedAt" class="text-[10px] text-muted-foreground text-right">
            {{ new Date(entry.rejectedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) }}
          </div>
        </template>

        <!-- Completed -->
        <template v-else-if="entry.status === 'completed'">
          <div class="flex items-center gap-1.5 text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
            <span class="text-xs font-bold">Завершено</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 3: Add confirmation modal to the template**

Add before the closing `</f7-page-content>` tag:

```html
<!-- Confirmation Modal -->
<Teleport to="body">
  <div
    v-if="modalOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    @click.self="closeModal"
  >
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeModal"></div>
    <div class="relative bg-card rounded-xl shadow-xl w-full max-w-sm p-6 border border-border">
      <div class="flex flex-col items-center text-center">
        <!-- Icon -->
        <div
          class="w-12 h-12 rounded-full flex items-center justify-center mb-4 text-xl"
          :class="pendingAction?.type === 'accept'
            ? 'bg-green-100 text-green-600 dark:bg-green-900/30'
            : 'bg-red-100 text-red-600 dark:bg-red-900/30'"
        >
          {{ pendingAction?.type === 'accept' ? '✓' : '✕' }}
        </div>

        <h3 class="text-lg font-bold text-foreground mb-2">
          {{ pendingAction?.type === 'accept' ? 'Принять замену?' : 'Отклонить замену?' }}
        </h3>
        <p class="text-sm text-muted-foreground mb-6">
          Это действие будет зафиксировано в протоколе и не может быть отменено. Статус замены будет обновлён.
        </p>

        <div class="flex gap-3 w-full">
          <button
            @click="closeModal"
            class="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
          >
            Отмена
          </button>
          <button
            @click="confirmAction"
            :disabled="protocolStore.actionLoading"
            class="flex-1 px-4 py-2 text-white rounded-lg font-bold shadow-sm transition-colors disabled:opacity-50"
            :class="pendingAction?.type === 'accept'
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-red-600 hover:bg-red-700'"
          >
            {{ protocolStore.actionLoading ? 'Подождите...' : 'Подтвердить' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</Teleport>
```

- [ ] **Step 4: Add actionError display**

After the `<!-- Error State -->` block in the template, add an action error display inside the main content area (after the entries list):

```html
<!-- Action Error -->
<div
  v-if="protocolStore.actionError"
  class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive text-center"
>
  {{ protocolStore.actionError }}
</div>
```

- [ ] **Step 5: Verify the page compiles (type check)**

```bash
cd /home/olge/SOFT/git/mars-2.0
npx tsc --noEmit 2>&1 | grep -E "protocol\.vue|error"
```

Expected: No TypeScript errors for protocol.vue.

- [ ] **Step 6: Verify dev server starts**

```bash
cd /home/olge/SOFT/git/mars-2.0
npm run dev 2>&1 | head -20
```

Expected: Vite dev server starts without build errors.

- [ ] **Step 7: Commit**

```bash
git add src/pages/protocol.vue
git commit -m "feat(protocol): redesign UI with timeline cards, left bar, and accept/reject actions"
```

---

## Chunk 3: Cleanup & Verification

### Task 3: Remove dead code and verify full flow

**Files:**
- Modify: `src/pages/protocol.vue` (remove old `getStatusBadgeClass` if unused)

- [ ] **Step 1: Remove unused `getStatusBadgeClass` function**

In `src/pages/protocol.vue`, if `getStatusBadgeClass` is no longer referenced in the template, delete the function body (lines ~194-202 in original).

- [ ] **Step 2: Check for leftover hardcoded journal name**

Search for the hardcoded fallback `"БМД Владеть основами философских знаний"` and remove it — the template now uses `entry.disciplineName || entry.journalSnapshot?.disciplineName || 'Дисциплина'`.

- [ ] **Step 3: Final type check**

```bash
cd /home/olge/SOFT/git/mars-2.0
npx tsc --noEmit 2>&1
```

Expected: Zero errors.

- [ ] **Step 4: Commit if any cleanup was done**

```bash
git add src/pages/protocol.vue
git commit -m "chore(protocol): remove unused getStatusBadgeClass after redesign"
```

---

## Summary

| Task | Files | Outcome |
|------|-------|---------|
| 1 | `protocolStore.ts` | accept/reject actions + loading/error state |
| 2 | `protocol.vue` | timeline UI, modal, wired to store |
| 3 | `protocol.vue` | cleanup dead code |
