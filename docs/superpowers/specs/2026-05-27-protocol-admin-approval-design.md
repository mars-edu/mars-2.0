# Protocol — Admin-Centric Approval Flow

**Date:** 2026-05-27  
**Status:** Approved

## Context

Previously, substitution requests (замена) were sent directly to the replacement teacher for acceptance/rejection. The new requirement shifts the approval gatekeeper to the admin:

- Teacher (or admin acting on behalf of a teacher) initiates замена, пересдача, or отработка from the journal
- Request goes to admin for approval — not the replacement teacher
- Admin sees **all** requests in Protocol
- Teacher sees **only their own submitted requests** (read-only history) in Protocol
- Admin approves or rejects with a written reason
- On approval, replacement teacher is notified

## Schema Changes

**`substitutions` table** — add one field:

```ts
rejectionReason: v.optional(v.string())
```

Status enum stays unchanged (`pending | accepted | rejected | completed`), but meaning shifts:

| Status | New meaning |
|---|---|
| `pending` | Awaiting admin approval |
| `accepted` | Admin approved |
| `rejected` | Admin rejected |
| `completed` | Substitution period ended |

## Convex Mutations

### `createBulkSubstitutions` / `createSubstitution`

- **Remove**: notification to `toUserId` (replacement teacher) at creation time
- **Add**: query all `users` where `roles.includes("ADMIN")`, insert notification for each:
  - Title: `"Запрос замены"`
  - Message: `"Запрос замены: [fromTeacher] → [toTeacher], журнал '[discipline]', с [start] по [end]"`

### `acceptSubstitution` (admin approves)

- **Remove**: authorization check `substitution.toUserId === args.userId`
- **Add**: load user, check `user.roles.includes("ADMIN")` — throw if not admin
- **Add** after patch: notify replacement teacher (`toUserId`):
  - `"Замена журнала '[discipline]' одобрена. Вы назначены заместителем с [start] по [end]"`
- **Add** after patch: notify original teacher (`fromTeacher.userId`):
  - `"Замена журнала '[discipline]' одобрена администратором"`

### `rejectSubstitution` (admin rejects)

- **Remove**: authorization check `substitution.toUserId === args.userId`
- **Add**: load user, check `user.roles.includes("ADMIN")` — throw if not admin
- **Add**: `ctx.db.patch(substitutionId, { ..., rejectionReason: args.rejectionReason })`
- **Change**: notify `fromTeacher.userId` (original teacher, not replacement):
  - `"Замена отклонена: [reason]"`

## Convex Queries

### `listProtocolWithRoleAccessInternal`

- **Admin**: all substitutions — no change
- **Teacher**: change from "sent + received" to **sent only** (`fromTeacherId === teacher._id`)
  - Remove the `receivedSubstitutions` query and merge logic

## Frontend

### `protocolStore.ts`

- `acceptEntry` / `rejectEntry` — no API changes; backend now enforces admin-only authorization

### `protocol.vue`

- **Admin view**: Approve / Reject action buttons on `pending` entries — no change
- **Teacher view**: read-only history of their submitted requests with status badge — remove action buttons for TEACHER role

## Notifications Summary

| Event | Recipient | Title | Message |
|---|---|---|---|
| Substitution created | All admins | Запрос замены | `[fromTeacher] → [toTeacher], журнал '[discipline]'` |
| Admin approves | Replacement teacher | Замена одобрена | `Вы назначены заместителем с [start] по [end]` |
| Admin approves | Original teacher | Замена одобрена | `Замена журнала '[discipline]' одобрена администратором` |
| Admin rejects | Original teacher | Замена отклонена | `[reason]` |

## Verification (Playwright)

End-to-end flow to verify:

1. Login as teacher (mnikitenko / ZkFpGwkbfhhH)
2. Navigate to Журналы → select journal → open Замена popover
3. Select replacement teacher and submit → confirm no notification sent to replacement teacher yet
4. Verify admin (rkilash) receives notification in notification center
5. Login as admin → navigate to Протокол → confirm pending entry appears
6. Admin clicks Reject with reason → confirm original teacher gets rejection notification
7. Repeat steps 1-4 → admin clicks Approve → confirm replacement teacher receives approval notification
8. Verify original teacher's Protocol shows the entry as history (read-only, no action buttons)
9. Verify replacement teacher's Protocol does NOT show received substitutions (only own submitted ones)
