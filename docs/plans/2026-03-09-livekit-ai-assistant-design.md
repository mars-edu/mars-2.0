# LiveKit AI Assistant + Chat Integration Design

**Date:** 2026-03-09
**Branch:** experental-convex-api
**Status:** Approved

---

## Overview

Add an AI assistant to MARS 2.0 with two interaction modes:
1. **Voice** — LiveKit real-time audio session with Google Gemini 2.5 Flash Native Audio
2. **Chat** — Streaming text chat using Vercel AI SDK (`@ai-sdk/vue`) + Google Gemini

Entry point: a floating FAB button (indigo, distinct from existing red FABs) rendered globally in `app.vue`.

---

## Architecture

### Part 1: `agent/` — LiveKit Voice Agent (standalone Node.js process)

```
agent/
  agent.ts         ← TypeScript LiveKit agent with MARS domain knowledge
  package.json     ← @livekit/agents, @livekit/agents-plugin-google, @google/genai
  tsconfig.json
  .env.local       ← LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, GOOGLE_API_KEY
```

- Runs separately: `cd agent && npm run dev`
- Uses `gemini-2.5-flash-native-audio-preview-09-2025` with `Modality.AUDIO`
- System instructions include full MARS domain context (tables, roles, workflows)
- Greets user automatically on connect

### Part 2: `convex/http.ts` — Convex HTTP Router (two endpoints)

**`POST /api/livekit/token`**
- Generates a unique room name + participant identity
- Creates LiveKit JWT using `jose` (already in project dependencies)
- Signs with HMAC-SHA256 using `LIVEKIT_API_SECRET`
- Returns `{ serverUrl, roomName, participantToken, participantName }`

**`POST /api/chat`**
- Accepts `{ messages: UIMessage[] }` (Vercel AI SDK format)
- Calls `streamText()` from `ai` package with `@ai-sdk/google` Gemini model
- Uses `convertToModelMessages()` to strip UI metadata
- Returns `result.toUIMessageStreamResponse()` — standard streaming `Response`
- Compatible with Convex HTTP actions (which return standard `Response`)

**Environment variables (Convex):**
- `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`
- `GOOGLE_API_KEY`

### Part 3: Vue Components

#### `src/components/AiAssistantFab.vue`
- Fixed position: `bottom-24 right-6` (above existing red FABs at `bottom-6`)
- Indigo/violet color (`bg-indigo-500 hover:bg-indigo-600`)
- `Bot` icon from `lucide-vue-next`
- Manages `isOpen` state, renders `AiAssistantPanel`
- Added to `app.vue` globally (outside `<f7-view>`)

#### `src/components/AiAssistantPanel.vue`
- Frosted-glass overlay: `backdrop-blur-md bg-black/50`
- Fixed panel (bottom-right anchored, 380px wide, ~580px tall)
- Two tabs: **Voice** | **Chat**
- Header: title + minimize/close button

**Voice tab:**
- Radial SVG visualizer (24 bars arranged in circle)
- Agent state badge: `connecting` → `listening` → `thinking` → `speaking`
- Mic mute toggle + End Call button
- Audio plays through `livekit-client` `RoomAudioRenderer` equivalent

**Chat tab:**
- Message list with `v-for` over `chat.messages`
- Renders `parts` array per message (text parts)
- Auto-scroll to bottom on new messages
- Text input + send button
- `status` indicator (streaming spinner)

#### `src/composables/useAgentSession.ts`
- Calls `POST /api/livekit/token` to get connection details
- Creates and connects `livekit-client` `Room`
- Subscribes to agent audio track for visualizer data (Web Audio API AnalyserNode)
- Tracks `AgentState` via LiveKit data messages
- Exposes: `state`, `connect()`, `disconnect()`, `isMicMuted`, `toggleMic()`, `frequencyBands`

### Part 4: New npm packages

**Frontend (`package.json`):**
```json
"livekit-client": "^2.x",
"ai": "^4.x",
"@ai-sdk/vue": "^1.x"
```

**Agent (`agent/package.json`):**
```json
"@livekit/agents": "^0.x",
"@livekit/agents-plugin-google": "^0.x",
"@google/genai": "^0.x",
"livekit-server-sdk": "^2.x"
```

**Convex (added to root `package.json` for Convex bundling):**
```json
"ai": "^4.x",
"@ai-sdk/google": "^0.x"
```

---

## GOOGLE_API_KEY Decision

Two separate runtimes need it:
- `agent/.env.local` → for the standalone Node.js LiveKit agent
- Convex environment variables → for the HTTP chat action

Same key, two locations. No workaround. Set once in each place.

---

## Key Technical Decisions

### Vercel AI SDK API Style
Use the **new class-based `Chat`** from `@ai-sdk/vue` (not deprecated `useChat` hook):
```ts
import { Chat, DefaultChatTransport } from "@ai-sdk/vue"
const chat = new Chat({
  transport: new DefaultChatTransport({ url: `${CONVEX_SITE_URL}/api/chat` })
})
```

### Convex HTTP Streaming
`toUIMessageStreamResponse()` returns a standard Web API `Response` with `ReadableStream` body — fully compatible with Convex HTTP actions.

### Visualizer
Pure SVG/CSS animation using Web Audio API `AnalyserNode` for frequency data. No React dependencies. Bars animate based on `getByteFrequencyData()` mapped radially.

### Token Generation
Use `jose` `SignJWT` with `HS256` algorithm. LiveKit token claims:
```json
{
  "iss": "API_KEY",
  "sub": "identity",
  "video": { "room": "...", "roomJoin": true, "canPublish": true, "canSubscribe": true }
}
```

---

## MARS Agent System Prompt (outline)

The voice agent and chat backend both receive a system prompt describing:
- What MARS is (education management system for Kazakhstani vocational colleges)
- 35 tables: academic structure, students, teachers, disciplines, journals, marks, KTPs, RUP, etc.
- User roles: ADMIN, TEACHER, STUDENT, PARENT
- Key workflows: grading, journal management, KTP planning, RUP import, substitutions
- Navigation guide: which pages do what
- Language: respond in Russian by default (matches app locale)

---

## File Changes Summary

**New files:**
- `agent/agent.ts`
- `agent/package.json`
- `agent/tsconfig.json`
- `agent/.env.local`
- `convex/http.ts`
- `convex/livekit/token.ts`
- `convex/livekit/chat.ts`
- `src/components/AiAssistantFab.vue`
- `src/components/AiAssistantPanel.vue`
- `src/composables/useAgentSession.ts`

**Modified files:**
- `src/app.vue` — add `<AiAssistantFab />`
- `package.json` — add `livekit-client`, `ai`, `@ai-sdk/vue`
- `convex/.env.local` — add LiveKit + Google API keys
