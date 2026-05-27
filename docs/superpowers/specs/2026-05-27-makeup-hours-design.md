# Добавить отработку часов — Design Spec
**Date:** 2026-05-27  
**Source:** Ported from concept-v2 `JournalView.tsx`

---

## Overview

Teachers can request makeup hours for missed scheduled sessions. A teacher opens the journal, picks one or more (scheduled date → new date + time slot) pairs, provides a reason, and submits to admin for approval. The request appears in the Protocol page alongside substitutions. Admins accept or reject it the same way.

---

## Architecture

### Backend (Convex)
- **New table:** `makeupRequests` in `convex/schema.ts`
- **New files:**
  - `convex/makeupRequests/mutations.ts` — `createMakeupRequest`, `acceptMakeupRequest`, `rejectMakeupRequest`
  - `convex/makeupRequests/queries.ts` — `listMakeupRequestsWithRoleAccess` (same JWT-based role pattern as substitutions)

### Frontend
- **New component:** `src/components/MakeupHoursPopover.vue` — GuardedPopover form
- **Modified:** `src/components/JournalTab.vue` — add trigger button in tools dropdown; pass journal dates to popover
- **Modified:** `src/stores/protocolStore.ts` — extend `ProtocolEntry` to discriminated union; fetch + merge makeup requests
- **Modified:** `src/pages/protocol.vue` — render makeup request card variant
- **New i18n keys:** all 3 locales (ru, en, kk) in `messages/` + `src/paraglide/messages/`

---

## Data Model

```ts
makeupRequests: defineTable({
  journalId: v.id("journals"),
  teacherId: v.string(),           // references teachers table
  createdBy: v.id("users"),
  reason: v.optional(v.string()),
  dates: v.array(v.object({
    existingDate: v.string(),      // ISO YYYY-MM-DD from journal schedule
    newDate: v.string(),           // ISO YYYY-MM-DD for makeup
    startScheduleId: v.string(),   // educationSchedules._id
    endScheduleId: v.string(),
  })),
  status: v.union(
    v.literal("pending"),
    v.literal("accepted"),
    v.literal("rejected")
  ),
  rejectionReason: v.optional(v.string()),
  journalSnapshot: v.optional(v.object({
    disciplineName: v.string(),
    groupName: v.optional(v.string()),
  })),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_journal",    ["journalId"])
  .index("by_teacher",    ["teacherId"])
  .index("by_status",     ["status"])
  .index("by_createdAt",  ["createdAt"])
```

---

## Component Design

### MakeupHoursPopover.vue

**Framework:** `GuardedPopover` (id=`makeup-hours-popover`, width=520px, `close-by-outside-click=false`)

**Props:**
```ts
{
  journalId: string
  journalDates: Array<{ isoDate: string; label: string }>  // from JournalTab tableHeaders
  isLoading?: boolean
}
```

**Emits:** `save(data: MakeupHoursData)`, `cancel()`

**Local state:**
```ts
reason: string
dates: Array<{ id: number; existingDate: string; newDate: Date[]; startScheduleId: string; endScheduleId: string }>
```

**Form layout:**
1. Textarea — "Основание назначения отработки"
2. Dynamic list of date-pair cards, each:
   - Row 1: Select(existingDate from journalDates) | DatePicker(newDate)
   - Row 2: Select(startTime from educationScheduleStore) | Select(endTime)
   - Delete button if more than 1 entry
3. Dashed "+ Добавить ещё дату" button
4. Footer: Cancel | "Отправить на модерацию" (disabled if no valid pair)

**Validation:** At least one pair where both `existingDate` and `newDate` are set.

**isDirty:** true when any field is non-empty.

### JournalTab.vue changes

- Import `MakeupHoursPopover` and include in template (after existing popovers)
- Compute `journalDatesForMakeup` from `tableHeaders` filtered to `type === "date"`, mapped to `{ isoDate, label }`
- Add button in tools dropdown (before the divider before "Закрыть журнал"):
  ```html
  <button @click="close(); onMakeupHoursClick()">
    <IconClock />  Добавить отработку часов
  </button>
  ```
- `onMakeupHoursClick()` opens the popover via `f7.popover.open`
- `onMakeupHoursSave(data)` handler: calls `createMakeupRequest` mutation via store, shows toast on success

---

## Protocol Store Extension

`ProtocolEntry` becomes a discriminated union:
```ts
export type ProtocolEntry = SubstitutionEntry | MakeupRequestEntry

export interface SubstitutionEntry {
  type: "substitution"
  _id: Id<"substitutions">
  // existing fields...
}

export interface MakeupRequestEntry {
  type: "makeup_request"
  _id: Id<"makeupRequests">
  journalId: Id<"journals">
  teacherId: string
  reason?: string
  dates: Array<{ existingDate: string; newDate: string; startScheduleId: string; endScheduleId: string }>
  status: "pending" | "accepted" | "rejected"
  rejectionReason?: string
  journalSnapshot?: { disciplineName: string; groupName?: string }
  teacher?: { _id: string; firstName: string; surname: string; patronymic: string }
  createdAt: number
  updatedAt: number
}
```

`fetchProtocolWithRoleAccess` fetches substitutions AND makeup requests in parallel, merges by `createdAt` descending.

New store actions: `acceptMakeupRequest(id)`, `rejectMakeupRequest(id, reason?)` — mirror existing `acceptEntry`/`rejectEntry`.

---

## Protocol Page Card (makeup_request)

```
[blue/green/red bar] | dot + time | [Journal name] [ОТРАБОТКА badge]
                     |             Преподаватель: [name]
                     |             Дисциплина: [name] [group]
                     |             Даты:
                     |               • 15.04 → 22.04 (пара 1 – пара 3)
                     |               • 20.04 → 25.04 (пара 2 – пара 4)
                     |             Основание: [reason]
                     |
                     |                          [Отклонить] [Принять] (admin only)
```

---

## i18n Keys

All keys added to `messages/ru.json`, `messages/en.json`, `messages/kk.json` and exported from `src/paraglide/messages/_index.js`:

| Key | Russian |
|-----|---------|
| `makeup_hours_title` | Добавить отработку часов |
| `makeup_hours_reason_label` | Основание назначения отработки |
| `makeup_hours_reason_placeholder` | Укажите причину для всех выбранных дат... |
| `makeup_hours_scheduled_date` | Дата по расписанию |
| `makeup_hours_new_date` | Новая дата отработки |
| `makeup_hours_time_from` | Время от |
| `makeup_hours_time_to` | Время до |
| `makeup_hours_add_date` | Добавить ещё дату |
| `makeup_hours_submit` | Отправить на модерацию |
| `makeup_hours_success_title` | Отправлено на модерацию |
| `makeup_hours_success_message` | Запрос на отработку часов успешно отправлен администратору |
| `protocol_makeup_request_label` | ОТРАБОТКА |
| `protocol_makeup_request_title` | Запрос на отработку часов |
| `protocol_makeup_dates_label` | Даты отработки |

---

## Error Handling

- Mutation failure: show F7 toast with error message
- Empty journal dates: show placeholder text in select ("Нет дат в журнале")
- Submit disabled until at least one complete date pair

---

## Build Sequence

1. Schema — add `makeupRequests` table to `convex/schema.ts`
2. Backend — `convex/makeupRequests/mutations.ts` + `queries.ts`
3. i18n — add keys to all locale files + paraglide exports
4. Store — extend `protocolStore.ts` with union type + new fetch/actions
5. Popover — `MakeupHoursPopover.vue`
6. JournalTab — trigger button + handler + popover include
7. Protocol page — makeup request card rendering
