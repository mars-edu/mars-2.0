# MARS MCP — AI Tools Integration Design

**Date:** 2026-03-11
**Status:** Approved

## Problem

The AI assistant answers data questions (e.g. "what are my grades?") with generic navigation advice instead of real data, because it has no access to the Convex database.

## Goal

Give the AI tools to query all MARS data domains, scoped to the calling user's role, so it can answer questions directly from live data.

---

## Architecture

```
Frontend (AiAssistantPanel.vue)
  └── DefaultChatTransport
        └── headers: { Authorization: "Bearer <token>" }  ← from userStore.token
              ↓
Convex HTTP Action (convex/livekit/chat.ts)
  1. Extract + validate JWT → { userId, roles }
  2. Resolve user + linked teacher/student record
  3. Build dynamic system prompt (user name + role injected)
  4. createMarsTools(ctx, user) → tool set
  5. streamText({ model, tools, maxSteps: 5, messages })
              ↓
convex/livekit/tools.ts  (NEW)
  Domain groups: grades, journals, schedule, people, ktp, admin
        ↓
ctx.runQuery(api.*.queries.*)  (existing Convex queries)
```

---

## Files Changed

| File | Change |
|------|--------|
| `convex/livekit/tools.ts` | NEW — all tool definitions grouped by domain |
| `convex/livekit/chat.ts` | Add JWT validation, wire tools into streamText |
| `convex/livekit/marsSystemPrompt.ts` | Add dynamic user-context header |
| `src/components/AiAssistantPanel.vue` | Pass Authorization header via userStore.token |
| `convex/http.ts` | Already uses `*` for CORS headers ✓ |

---

## Tools (13 total)

Role-gated at runtime — tool returns `{ error: "Access denied" }` if caller lacks permission.

| Tool | Description | Allowed Roles |
|------|-------------|---------------|
| `getCurrentUser` | Caller's name, role, linked teacher/student ID | all |
| `listMyJournals` | Journals where caller is teacher or student | teacher, student |
| `getJournalMarks` | All marks in a specific journal (by journalId) | teacher, student* |
| `getMyMarks` | All marks for calling student across all journals | student |
| `getSchedule` | Calendar events for caller, optional date range | all |
| `getStudentList` | Students in a specialty/course | teacher, admin |
| `getStudentCard` | One student's full info + marks summary | teacher, admin |
| `getTeacherList` | List of teachers | admin |
| `getKTP` | KTP details for a journal | teacher, admin |
| `getSubstitutions` | Substitution requests | teacher, admin |
| `getNotifications` | Caller's unread notifications | all |
| `getAcademicYear` | Current active academic year + semesters | all |
| `getDisciplineList` | Disciplines + specialties | all |

*student can only see their own journal's marks

`maxSteps: 5` allows the AI to chain tools (e.g. list journals → fetch marks for chosen journal).

---

## Auth Flow

1. `AiAssistantPanel.vue` reads `useUserStore().token` (reactive)
2. Passed as `Authorization: Bearer <token>` header via `DefaultChatTransport`
3. Convex HTTP action: `request.headers.get("Authorization")` → strip `"Bearer "`
4. `validateToken(token)` (existing helper) → `{ userId, roles }`
5. `ctx.runQuery(api.users.queries.getById, { id: userId })` → full user object
6. Resolve linked teacher or student record by `userId`
7. Pass `{ userId, roles, teacherId?, studentId?, name }` into `createMarsTools(ctx, user)`

**Unauthenticated requests:** return `401` with CORS headers. AI falls back to general navigation help only.

---

## Dynamic System Prompt

Static `MARS_SYSTEM_PROMPT` is prepended with a user-context block at request time:

```
## Текущий пользователь
Имя: {firstName} {lastName}
Роль: {role}
ID: {teacherId | studentId}

## Инструменты
У тебя есть доступ к реальным данным через инструменты.
ВСЕГДА используй инструменты для вопросов о данных.
НЕ говори "перейдите в раздел" — получи данные сам и покажи их.
```

---

## Tool Implementation Pattern

```ts
// convex/livekit/tools.ts
export function createMarsTools(ctx: ActionCtx, user: ResolvedUser) {
  return {
    getMyMarks: tool({
      description: "Get all marks for the current student",
      parameters: z.object({ journalId: z.string().optional() }),
      execute: async ({ journalId }) => {
        if (!user.studentId) return { error: "Only students can use this tool" };
        return ctx.runQuery(api.marks.queries.listByStudent, {
          studentId: user.studentId,
          journalId,
        });
      },
    }),
    // ... other tools
  };
}
```
