# LiveKit AI Assistant Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a floating AI assistant FAB to MARS 2.0 with a voice mode (LiveKit + Gemini Native Audio) and a chat mode (Vercel AI SDK streaming), both with full MARS domain knowledge.

**Architecture:** Standalone Node.js LiveKit agent (`agent/`) + two Convex HTTP actions (`/api/livekit/token` + `/api/chat`) + Vue components using `livekit-client` and `@ai-sdk/vue`. No separate server — Convex HTTP router handles all backend needs.

**Tech Stack:** `livekit-client`, `@livekit/agents`, `@ai-sdk/vue`, `ai`, `@ai-sdk/google`, `jose` (already installed), Vue 3 Composition API, Tailwind CSS design tokens, lucide-vue-next

---

## Environment Facts

- Convex deployment: `sleek-bird-839.convex.cloud`
- Convex HTTP site URL: `https://sleek-bird-839.convex.site` (HTTP actions live here)
- Frontend env file: `.env.local` (add `VITE_CONVEX_SITE_URL`)
- Convex env file: `convex/.env.local`
- LiveKit cloud URL: `wss://dfgfdgd-ra49o9e3.livekit.cloud`

---

## Task 1: Install frontend packages

**Files:**
- Modify: `package.json`

**Step 1: Install packages**

```bash
cd /home/olge/SOFT/git/mars-2.0
npm install livekit-client ai @ai-sdk/vue
```

Expected output: `added N packages` with no errors.

**Step 2: Add VITE_CONVEX_SITE_URL to .env.local**

Append to `.env.local`:
```
VITE_CONVEX_SITE_URL=https://sleek-bird-839.convex.site
```

**Step 3: Update `src/env.d.ts` to declare the new env var**

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_CONVEX_URL: string;
  readonly VITE_CONVEX_SITE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

**Step 4: Commit**

```bash
git add package.json package-lock.json .env.local src/env.d.ts
git commit -m "chore: install livekit-client, ai, @ai-sdk/vue"
```

---

## Task 2: Create the LiveKit agent package

**Files:**
- Create: `agent/package.json`
- Create: `agent/tsconfig.json`
- Create: `agent/.env.local` (gitignored)
- Create: `agent/agent.ts`

**Step 1: Create `agent/` directory and package.json**

```json
// agent/package.json
{
  "name": "mars-ai-agent",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node --env-file=.env.local -r ts-node/register/esm agent.ts dev",
    "start": "node --env-file=.env.local -r ts-node/register/esm agent.ts start"
  },
  "dependencies": {
    "@google/genai": "^0.7.0",
    "@livekit/agents": "^0.5.0",
    "@livekit/agents-plugin-google": "^0.5.0",
    "livekit-server-sdk": "^2.13.2"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.0.0"
  }
}
```

**Step 2: Create `agent/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "./dist"
  },
  "include": ["*.ts"]
}
```

**Step 3: Create `agent/.env.local`** (never commit this file)

```env
LIVEKIT_URL=wss://dfgfdgd-ra49o9e3.livekit.cloud
LIVEKIT_API_KEY=APIduWv4BGCkXHH
LIVEKIT_API_SECRET=WyZ5OSHR5y1mCJsdVAwMQUe6QGhKjJpPGQO8WSGkeZm
GOOGLE_API_KEY=<your-google-api-key-here>
```

**Step 4: Create `agent/.gitignore`**

```
.env.local
node_modules/
dist/
```

**Step 5: Create `agent/agent.ts`**

```ts
import {
  defineAgent,
  type JobContext,
  WorkerOptions,
  cli,
  voice,
} from '@livekit/agents';
import * as google from '@livekit/agents-plugin-google';
import { fileURLToPath } from 'node:url';
import { Modality } from '@google/genai';

const MARS_INSTRUCTIONS = `Ты — голосовой ИИ-ассистент системы MARS 2.0 (Минимальная Автоматизация Расписания Специальностей). Это система управления образованием для казахстанских колледжей.

## Твоя роль
Помогай пользователям (администраторам, преподавателям, студентам) разобраться в системе, находить нужные функции и решать задачи.

## Система MARS 2.0

### Основные роли пользователей
- **ADMIN** — полный доступ, управление пользователями, настройка системы
- **TEACHER** — работа с журналами, КТП, расписанием, оценками
- **STUDENT** — просмотр оценок, расписания
- **PARENT** — просмотр успеваемости ребёнка

### Ключевые модули и страницы

**Учебная структура:**
- Учебные годы (academicYears) — периоды обучения, например 2024-2025
- Семестры (semesterDefinitions + academicYearSemesters) — 1-8 семестр
- Специальности (specialties) — программы с кодами, например "00012200"
- Курсы (courses) — номера курсов
- Базы (bases) — уровень базового образования (9 или 11 классов)

**Дисциплины и учебные планы:**
- Дисциплины (disciplines) — предметы с модулями и результатами обучения
- Class9 Items (class9Items) — модули учебной программы с распределением часов:
  - Теоретические часы (лекции)
  - Лабораторные работы
  - Практические занятия
  - СРСП (Самостоятельная работа студента под руководством преподавателя)
  - СРС (Самостоятельная работа студента)
  - Учебная практика
- РУП (rupEntries) — Рабочий Учебный План, страница /rup

**КТП (Календарно-Тематическое Планирование):**
- KTP (ktps) — заголовки КТП, привязаны к class9Items
- KTP детали (ktpDetails) — отдельные темы уроков с часами, ДЗ, примечаниями
- Страница /ktp

**Расписание:**
- Календарные события (calendarEvents) — занятия с временными слотами
- Временные слоты (educationSchedules) — стандартные периоды уроков
- Страница планирования /planning

**Журналы и оценки:**
- Журналы (journals) — электронные классные журналы
- Студенты в журнале (journalStudents) — связь многие-ко-многим
- Оценки (marks) — индивидуальные оценки с типом контроля
- История оценок (markHistory) — журнал изменений оценок
- Страница /journals, /journal-details

**Контроль и аттестация:**
- Промежуточный контроль (intermediateControls, scheduledIntermediateControls)
- Итоговый контроль (finalControls, scheduledFinalControls)
- Протокол /protocol

**Студенты и преподаватели:**
- Студенты (students) — с привязкой к специальности, языку, полу
- Преподаватели (teachers) — с должностью и годом устройства
- Карточка студента /student-card, преподавателя /teacher-card

**Уведомления и workflows:**
- Уведомления (notifications) — замены, закрытие журналов
- Замены (substitutions) — передача журнала с workflow: pending → accepted → completed
- Каникулы (vacations), сессии (sessions)

**Аналитика и отчёты:**
- Страницы /analytics, /reports

### Навигация
Боковое меню содержит: Главная, Каталог специальностей, Каталог дисциплин, Расписание, Протокол, Журналы, РУП, Аналитика, Отчёты, Расписание занятий, Карточка студента, Карточка преподавателя

## Стиль общения
- Общайся на русском языке по умолчанию
- Будь кратким и конкретным
- Если пользователь спрашивает на казахском — отвечай на казахском
- Говори быстро, по-деловому, но дружелюбно
- Если не знаешь точного ответа — честно скажи и предложи где искать
`;

export default defineAgent({
  entry: async (ctx: JobContext) => {
    await ctx.connect();

    const agent = new voice.Agent({
      instructions: MARS_INSTRUCTIONS,
    });

    const session = new voice.AgentSession({
      llm: new google.beta.realtime.RealtimeModel({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        voice: 'Puck',
        temperature: 0.8,
        modalities: [Modality.AUDIO],
      }),
    });

    await session.start({
      agent,
      room: ctx.room,
    });

    await session.generateReply({
      instructions: 'Поприветствуй пользователя по-русски, представься как ИИ-ассистент MARS и предложи помощь.',
    });
  },
});

cli.runApp(new WorkerOptions({ agent: fileURLToPath(import.meta.url) }));
```

**Step 6: Install agent dependencies**

```bash
cd /home/olge/SOFT/git/mars-2.0/agent
npm install
cd ..
```

**Step 7: Commit**

```bash
git add agent/package.json agent/tsconfig.json agent/agent.ts agent/.gitignore
git commit -m "feat(agent): add LiveKit voice agent with MARS domain knowledge"
```

---

## Task 3: Create Convex HTTP router with LiveKit token endpoint

**Files:**
- Create: `convex/http.ts`
- Create: `convex/livekit/token.ts`
- Modify: `convex/.env.local`

**Step 1: Add LiveKit secrets to `convex/.env.local`**

Append to `convex/.env.local`:
```
LIVEKIT_URL=wss://dfgfdgd-ra49o9e3.livekit.cloud
LIVEKIT_API_KEY=APIduWv4BGCkXHH
LIVEKIT_API_SECRET=WyZ5OSHR5y1mCJsdVAwMQUe6QGhKjJpPGQO8WSGkeZm
GOOGLE_API_KEY=<your-google-api-key-here>
```

Also set these in Convex dashboard environment variables (Settings → Environment Variables):
- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `GOOGLE_API_KEY`

**Step 2: Create `convex/livekit/token.ts`**

This generates a LiveKit participant token using `jose` (already in project dependencies — no new install needed).

```ts
// convex/livekit/token.ts
import { SignJWT } from 'jose';

export interface TokenOptions {
  apiKey: string;
  apiSecret: string;
  roomName: string;
  participantIdentity: string;
  participantName: string;
  ttlSeconds?: number;
}

export interface ConnectionDetails {
  serverUrl: string;
  roomName: string;
  participantToken: string;
  participantName: string;
}

export async function createLiveKitToken(opts: TokenOptions): Promise<string> {
  const secret = new TextEncoder().encode(opts.apiSecret);
  const now = Math.floor(Date.now() / 1000);
  const ttl = opts.ttlSeconds ?? 900; // 15 minutes default

  const token = await new SignJWT({
    video: {
      room: opts.roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    },
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(opts.apiKey)
    .setSubject(opts.participantIdentity)
    .setNotBefore(now)
    .setIssuedAt(now)
    .setExpirationTime(now + ttl)
    .sign(secret);

  return token;
}

export function generateRoomName(): string {
  const id = Math.random().toString(36).substring(2, 10);
  return `mars_room_${id}`;
}

export function generateParticipantIdentity(): string {
  const id = Math.random().toString(36).substring(2, 10);
  return `mars_user_${id}`;
}
```

**Step 3: Create `convex/http.ts`** (Convex HTTP router)

```ts
// convex/http.ts
import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import {
  createLiveKitToken,
  generateRoomName,
  generateParticipantIdentity,
} from './livekit/token';

const http = httpRouter();

// ── LiveKit Token Endpoint ────────────────────────────────────────────────────
http.route({
  path: '/api/livekit/token',
  method: 'POST',
  handler: httpAction(async (_ctx, _request) => {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const serverUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !serverUrl) {
      return new Response(
        JSON.stringify({ error: 'LiveKit credentials not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const roomName = generateRoomName();
    const participantIdentity = generateParticipantIdentity();
    const participantName = 'Пользователь';

    const participantToken = await createLiveKitToken({
      apiKey,
      apiSecret,
      roomName,
      participantIdentity,
      participantName,
    });

    return new Response(
      JSON.stringify({
        serverUrl,
        roomName,
        participantToken,
        participantName,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }),
});

// CORS preflight for token endpoint
http.route({
  path: '/api/livekit/token',
  method: 'OPTIONS',
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }),
});

export default http;
```

**Step 4: Verify Convex dev server picks up the new HTTP router**

```bash
# In a separate terminal, Convex dev should already be running via npm run dev:all
# Check that convex/http.ts is recognized — look for "HTTP routes" in Convex dev output
```

**Step 5: Test the token endpoint**

```bash
curl -X POST https://sleek-bird-839.convex.site/api/livekit/token \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected: JSON response with `serverUrl`, `roomName`, `participantToken`, `participantName`.

**Step 6: Commit**

```bash
git add convex/http.ts convex/livekit/token.ts convex/.env.local
git commit -m "feat(convex): add LiveKit token HTTP endpoint"
```

---

## Task 4: Add Convex chat endpoint (Vercel AI SDK streaming)

**Files:**
- Create: `convex/livekit/chat.ts`
- Create: `convex/livekit/marsSystemPrompt.ts`
- Modify: `convex/http.ts`
- Modify: `package.json` (add `@ai-sdk/google` for Convex)

**Step 1: Install `@ai-sdk/google` in root (used by Convex)**

```bash
npm install @ai-sdk/google
```

**Step 2: Create `convex/livekit/marsSystemPrompt.ts`**

```ts
// convex/livekit/marsSystemPrompt.ts
export const MARS_SYSTEM_PROMPT = `Ты — ИИ-ассистент системы MARS 2.0 (Минимальная Автоматизация Расписания Специальностей). Это система управления образованием для казахстанских колледжей.

## Твоя роль
Помогай пользователям (администраторам, преподавателям, студентам) разобраться в системе, находить нужные функции и решать задачи в текстовом чате.

## Структура системы MARS 2.0

### Роли: ADMIN, TEACHER, STUDENT, PARENT

### Модули:
- **Учебная структура**: academicYears, semesterDefinitions, specialties, courses, bases
- **Учебные планы**: disciplines, class9Items (модули с часами: лекции/лаб/практика/СРСП/СРС/учпрактика), rupEntries (РУП — страница /rup)
- **КТП**: ktps + ktpDetails — календарно-тематическое планирование (страница /ktp)
- **Расписание**: calendarEvents, educationSchedules (страница /planning)
- **Журналы**: journals, marks, markHistory, journalStudents (страницы /journals, /journal-details)
- **Контроль**: intermediateControls, finalControls, scheduled* версии
- **Люди**: students, teachers (страницы /student-card, /teacher-card)
- **Замены**: substitutions — workflow передачи журнала (pending→accepted→completed)
- **Отчёты**: /protocol, /analytics, /reports
- **Уведомления**: /notifications

### Навигация (боковое меню):
Главная → Каталог специальностей → Каталог дисциплин → Расписание → Протокол → Журналы → РУП → Аналитика → Отчёты → Расписание занятий → Карточка студента → Карточка преподавателя

## Стиль
- Краткие, конкретные ответы
- Русский язык по умолчанию, казахский если пользователь пишет на казахском
- При вопросе "где найти X" — указывай конкретный раздел меню или URL
- Markdown для форматирования допускается
`;
```

**Step 3: Create `convex/livekit/chat.ts`**

```ts
// convex/livekit/chat.ts
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import {
  streamText,
  convertToModelMessages,
  type UIMessage,
} from 'ai';
import { MARS_SYSTEM_PROMPT } from './marsSystemPrompt';

export async function handleChatRequest(request: Request): Promise<Response> {
  const googleApiKey = process.env.GOOGLE_API_KEY;
  if (!googleApiKey) {
    return new Response(
      JSON.stringify({ error: 'GOOGLE_API_KEY not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let messages: UIMessage[];
  try {
    const body = await request.json();
    messages = body.messages as UIMessage[];
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const google = createGoogleGenerativeAI({ apiKey: googleApiKey });

  const result = streamText({
    model: google('gemini-2.0-flash'),
    system: MARS_SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
  });

  const response = result.toUIMessageStreamResponse();

  // Add CORS headers
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');

  return new Response(response.body, {
    status: response.status,
    headers,
  });
}
```

**Step 4: Update `convex/http.ts`** — add chat route

Add these routes after the existing token route, before `export default http`:

```ts
import { handleChatRequest } from './livekit/chat';

// ── AI Chat Endpoint ─────────────────────────────────────────────────────────
http.route({
  path: '/api/chat',
  method: 'POST',
  handler: httpAction(async (_ctx, request) => {
    return handleChatRequest(request);
  }),
});

http.route({
  path: '/api/chat',
  method: 'OPTIONS',
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }),
});
```

**Step 5: Test chat endpoint**

```bash
curl -X POST https://sleek-bird-839.convex.site/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"id":"1","role":"user","parts":[{"type":"text","text":"Что такое РУП в MARS?"}],"createdAt":"2026-01-01T00:00:00Z"}]}'
```

Expected: streaming response with text chunks.

**Step 6: Commit**

```bash
git add convex/http.ts convex/livekit/chat.ts convex/livekit/marsSystemPrompt.ts package.json package-lock.json
git commit -m "feat(convex): add streaming AI chat endpoint with MARS context"
```

---

## Task 5: Create `useAgentSession` composable

**Files:**
- Create: `src/composables/useAgentSession.ts`

This composable manages the full LiveKit voice session lifecycle.

**Step 1: Create `src/composables/useAgentSession.ts`**

```ts
// src/composables/useAgentSession.ts
import { ref, computed, onUnmounted } from 'vue';
import {
  Room,
  RoomEvent,
  Track,
  type RemoteTrack,
  type RemoteAudioTrack,
  ConnectionState,
} from 'livekit-client';

export type AgentState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'disconnected';

const CONVEX_SITE_URL = import.meta.env.VITE_CONVEX_SITE_URL;

export function useAgentSession() {
  const room = new Room();

  const agentState = ref<AgentState>('idle');
  const isMicMuted = ref(false);
  const frequencyBands = ref<number[]>(new Array(24).fill(0));
  const isConnected = computed(() => agentState.value !== 'idle' && agentState.value !== 'disconnected');

  let audioContext: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let animationId: number | null = null;
  let agentAudioTrack: RemoteAudioTrack | null = null;

  // ── Audio Visualizer ──────────────────────────────────────────────────────
  function startVisualizer(track: RemoteAudioTrack) {
    stopVisualizer();

    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;

    const mediaStream = new MediaStream([track.mediaStreamTrack]);
    const source = audioContext.createMediaStreamSource(mediaStream);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const bands = 24;

    function tick() {
      if (!analyser) return;
      analyser.getByteFrequencyData(dataArray);

      const step = Math.floor(bufferLength / bands);
      frequencyBands.value = Array.from({ length: bands }, (_, i) => {
        const start = i * step;
        const slice = dataArray.slice(start, start + step);
        const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
        return avg / 255; // normalize 0-1
      });

      animationId = requestAnimationFrame(tick);
    }

    tick();
  }

  function stopVisualizer() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }
    analyser = null;
    frequencyBands.value = new Array(24).fill(0);
  }

  // ── Room Events ───────────────────────────────────────────────────────────
  room.on(RoomEvent.Connected, () => {
    agentState.value = 'listening';
  });

  room.on(RoomEvent.Disconnected, () => {
    agentState.value = 'disconnected';
    stopVisualizer();
  });

  room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
    if (state === ConnectionState.Connecting) {
      agentState.value = 'connecting';
    }
  });

  room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
    if (track.kind === Track.Kind.Audio) {
      agentAudioTrack = track as RemoteAudioTrack;
      track.attach(); // plays audio through speakers
    }
  });

  room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
    if (track.kind === Track.Kind.Audio) {
      track.detach();
      agentAudioTrack = null;
      stopVisualizer();
    }
  });

  // Listen for agent state updates via participant attributes
  room.on(RoomEvent.ParticipantAttributesChanged, (changedAttributes: Record<string, string>, participant) => {
    // LiveKit agents publish state via attributes
    if (changedAttributes['lk.agent.state']) {
      const state = changedAttributes['lk.agent.state'];
      if (state === 'listening') agentState.value = 'listening';
      else if (state === 'thinking') {
        agentState.value = 'thinking';
        stopVisualizer();
      }
      else if (state === 'speaking') {
        agentState.value = 'speaking';
        if (agentAudioTrack) startVisualizer(agentAudioTrack);
      }
    }
  });

  // ── Public API ────────────────────────────────────────────────────────────
  async function connect() {
    agentState.value = 'connecting';
    try {
      const res = await fetch(`${CONVEX_SITE_URL}/api/livekit/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) throw new Error('Failed to get LiveKit token');

      const { serverUrl, participantToken } = await res.json();

      await room.connect(serverUrl, participantToken, {
        autoSubscribe: true,
      });

      // Enable microphone
      await room.localParticipant.setMicrophoneEnabled(true);
      isMicMuted.value = false;

    } catch (err) {
      console.error('[useAgentSession] connect error:', err);
      agentState.value = 'disconnected';
      throw err;
    }
  }

  async function disconnect() {
    stopVisualizer();
    await room.disconnect();
    agentState.value = 'idle';
  }

  async function toggleMic() {
    const newState = !isMicMuted.value;
    await room.localParticipant.setMicrophoneEnabled(!newState);
    isMicMuted.value = newState;
  }

  onUnmounted(() => {
    stopVisualizer();
    room.disconnect();
  });

  return {
    agentState,
    isMicMuted,
    frequencyBands,
    isConnected,
    connect,
    disconnect,
    toggleMic,
  };
}
```

**Step 2: Commit**

```bash
git add src/composables/useAgentSession.ts
git commit -m "feat: add useAgentSession composable for LiveKit voice"
```

---

## Task 6: Create `AiAssistantFab.vue`

**Files:**
- Create: `src/components/AiAssistantFab.vue`

**Step 1: Create `src/components/AiAssistantFab.vue`**

```vue
<!-- src/components/AiAssistantFab.vue -->
<template>
  <div>
    <!-- FAB Button -->
    <button
      class="fixed z-[999] bottom-24 right-6 w-14 h-14 rounded-full shadow-lg
             bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700
             flex items-center justify-center
             transition-all duration-200 ease-out
             hover:scale-105 active:scale-95"
      :class="{ 'ring-2 ring-indigo-300 ring-offset-2': isOpen }"
      aria-label="AI Ассистент"
      @click="isOpen = !isOpen"
    >
      <BotIcon v-if="!isOpen" :size="24" class="text-white" />
      <XIcon v-else :size="24" class="text-white" />
    </button>

    <!-- Assistant Panel -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 scale-95 translate-y-2"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 scale-100 translate-y-0"
        leave-to-class="opacity-0 scale-95 translate-y-2"
      >
        <AiAssistantPanel v-if="isOpen" @close="isOpen = false" />
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { BotIcon, XIcon } from 'lucide-vue-next';
import AiAssistantPanel from './AiAssistantPanel.vue';

const isOpen = ref(false);
</script>
```

**Step 2: Commit**

```bash
git add src/components/AiAssistantFab.vue
git commit -m "feat: add AiAssistantFab floating button"
```

---

## Task 7: Create `AiAssistantPanel.vue`

**Files:**
- Create: `src/components/AiAssistantPanel.vue`

This is the main AI panel with Voice tab (LiveKit) and Chat tab (Vercel AI SDK).

**Step 1: Create `src/components/AiAssistantPanel.vue`**

```vue
<!-- src/components/AiAssistantPanel.vue -->
<template>
  <div
    class="fixed z-[998] bottom-[104px] right-6
           w-[380px] h-[560px]
           rounded-2xl shadow-2xl overflow-hidden
           bg-card/95 border border-border
           backdrop-blur-xl
           flex flex-col"
  >
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
        <span class="font-semibold text-sm text-foreground">MARS Ассистент</span>
      </div>
      <div class="flex items-center gap-1">
        <!-- Tab Switcher -->
        <div class="flex rounded-lg bg-muted p-0.5 text-xs">
          <button
            class="px-3 py-1 rounded-md transition-colors"
            :class="activeTab === 'voice'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'"
            @click="activeTab = 'voice'"
          >
            Голос
          </button>
          <button
            class="px-3 py-1 rounded-md transition-colors"
            :class="activeTab === 'chat'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'"
            @click="activeTab = 'chat'"
          >
            Чат
          </button>
        </div>
        <button
          class="ml-1 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          @click="$emit('close')"
        >
          <XIcon :size="16" />
        </button>
      </div>
    </div>

    <!-- Voice Tab -->
    <div v-if="activeTab === 'voice'" class="flex-1 flex flex-col items-center justify-center gap-6 p-6">

      <!-- Radial Visualizer -->
      <div class="relative w-48 h-48">
        <svg viewBox="0 0 200 200" class="w-full h-full" :class="visualizerClass">
          <g transform="translate(100, 100)">
            <circle
              cx="0" cy="0" r="32"
              class="fill-indigo-500/10 stroke-indigo-500/30"
              stroke-width="1"
            />
            <rect
              v-for="(band, i) in frequencyBands"
              :key="i"
              :x="-barWidth / 2"
              :y="-(barHeight(band) + 36)"
              :width="barWidth"
              :height="barHeight(band)"
              rx="2"
              :transform="`rotate(${(i / 24) * 360})`"
              :class="barClass(band)"
            />
          </g>
        </svg>

        <!-- Center icon / state -->
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center">
            <MicIcon v-if="agentState === 'listening'" :size="24" class="text-indigo-400" />
            <Loader2Icon v-else-if="agentState === 'thinking'" :size="24" class="text-indigo-400 animate-spin" />
            <Volume2Icon v-else-if="agentState === 'speaking'" :size="24" class="text-indigo-500" />
            <WifiIcon v-else-if="agentState === 'connecting'" :size="24" class="text-muted-foreground animate-pulse" />
            <BotIcon v-else :size="24" class="text-muted-foreground" />
          </div>
        </div>
      </div>

      <!-- State label -->
      <div class="text-sm font-medium text-center" :class="stateLabelClass">
        {{ stateLabel }}
      </div>

      <!-- Controls -->
      <div class="flex items-center gap-3">
        <!-- Mic toggle (only when connected) -->
        <button
          v-if="isConnected"
          class="w-12 h-12 rounded-full flex items-center justify-center transition-all"
          :class="isMicMuted
            ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
            : 'bg-muted text-foreground hover:bg-muted/80'"
          @click="toggleMic"
        >
          <MicOffIcon v-if="isMicMuted" :size="20" />
          <MicIcon v-else :size="20" />
        </button>

        <!-- Connect / Disconnect -->
        <button
          class="h-12 px-6 rounded-full font-semibold text-sm transition-all"
          :class="isConnected
            ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20'
            : 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-md'"
          :disabled="agentState === 'connecting'"
          @click="isConnected ? handleDisconnect() : handleConnect()"
        >
          <span v-if="agentState === 'connecting'" class="flex items-center gap-2">
            <Loader2Icon :size="16" class="animate-spin" />
            Подключение...
          </span>
          <span v-else-if="isConnected">Завершить</span>
          <span v-else>Начать разговор</span>
        </button>
      </div>

      <!-- Error message -->
      <p v-if="voiceError" class="text-xs text-red-500 text-center px-4">{{ voiceError }}</p>
    </div>

    <!-- Chat Tab -->
    <div v-else class="flex-1 flex flex-col overflow-hidden">
      <!-- Messages -->
      <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
        <div
          v-for="(message, idx) in chat.messages"
          :key="message.id ?? idx"
          class="flex"
          :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <!-- Assistant avatar -->
          <div v-if="message.role === 'assistant'" class="w-7 h-7 rounded-full bg-indigo-500/10 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
            <BotIcon :size="14" class="text-indigo-500" />
          </div>

          <!-- Message bubble -->
          <div
            class="max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed"
            :class="message.role === 'user'
              ? 'bg-indigo-500 text-white rounded-br-sm'
              : 'bg-muted text-foreground rounded-bl-sm'"
          >
            <template v-for="(part, pIdx) in message.parts" :key="pIdx">
              <span v-if="part.type === 'text'">{{ part.text }}</span>
            </template>
          </div>
        </div>

        <!-- Streaming indicator -->
        <div v-if="chat.status === 'streaming' || chat.status === 'submitted'" class="flex justify-start">
          <div class="w-7 h-7 rounded-full bg-indigo-500/10 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
            <BotIcon :size="14" class="text-indigo-500" />
          </div>
          <div class="bg-muted rounded-2xl rounded-bl-sm px-3 py-2">
            <div class="flex gap-1 items-center h-5">
              <div class="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style="animation-delay: 0ms" />
              <div class="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style="animation-delay: 150ms" />
              <div class="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style="animation-delay: 300ms" />
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="chat.messages.length === 0" class="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
          <div class="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center">
            <BotIcon :size="24" class="text-indigo-400" />
          </div>
          <div>
            <p class="text-sm font-medium text-foreground">Чем могу помочь?</p>
            <p class="text-xs text-muted-foreground mt-1">Задай вопрос о системе MARS</p>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="p-3 border-t border-border flex-shrink-0">
        <form class="flex gap-2" @submit.prevent="sendChatMessage">
          <input
            v-model="chatInput"
            type="text"
            placeholder="Напиши сообщение..."
            class="flex-1 text-sm bg-muted border border-border rounded-xl px-3 py-2
                   text-foreground placeholder:text-muted-foreground
                   focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50"
            :disabled="chat.status === 'streaming' || chat.status === 'submitted'"
          />
          <button
            type="submit"
            class="w-9 h-9 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white
                   flex items-center justify-center transition-colors flex-shrink-0
                   disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!chatInput.trim() || chat.status === 'streaming' || chat.status === 'submitted'"
          >
            <SendIcon :size="16" />
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import {
  XIcon,
  BotIcon,
  MicIcon,
  MicOffIcon,
  Volume2Icon,
  WifiIcon,
  Loader2Icon,
  SendIcon,
} from 'lucide-vue-next';
import { Chat, DefaultChatTransport } from '@ai-sdk/vue';
import { useAgentSession } from '@/composables/useAgentSession';

const CONVEX_SITE_URL = import.meta.env.VITE_CONVEX_SITE_URL;

defineEmits<{ close: [] }>();

// ── Tabs ──────────────────────────────────────────────────────────────────────
const activeTab = ref<'voice' | 'chat'>('voice');

// ── Voice (LiveKit) ──────────────────────────────────────────────────────────
const { agentState, isMicMuted, frequencyBands, isConnected, connect, disconnect, toggleMic } =
  useAgentSession();

const voiceError = ref('');

async function handleConnect() {
  voiceError.value = '';
  try {
    await connect();
  } catch {
    voiceError.value = 'Не удалось подключиться. Проверьте микрофон и попробуйте снова.';
  }
}

async function handleDisconnect() {
  await disconnect();
}

const stateLabel = computed(() => {
  switch (agentState.value) {
    case 'connecting': return 'Подключение...';
    case 'listening': return 'Слушаю вас';
    case 'thinking': return 'Думаю...';
    case 'speaking': return 'Говорю';
    case 'disconnected': return 'Отключено';
    default: return 'Нажмите "Начать разговор"';
  }
});

const stateLabelClass = computed(() => {
  switch (agentState.value) {
    case 'listening': return 'text-indigo-500';
    case 'speaking': return 'text-indigo-600';
    case 'thinking': return 'text-amber-500';
    default: return 'text-muted-foreground';
  }
});

const visualizerClass = computed(() => {
  if (agentState.value === 'speaking') return 'text-indigo-500';
  if (agentState.value === 'listening') return 'text-indigo-400';
  return 'text-muted-foreground/30';
});

const barWidth = 4;

function barHeight(band: number): number {
  if (agentState.value === 'speaking') return Math.max(4, band * 28);
  if (agentState.value === 'listening') return 5;
  if (agentState.value === 'thinking') return 3;
  return 3;
}

function barClass(band: number): string {
  if (agentState.value === 'speaking') {
    const intensity = band;
    if (intensity > 0.6) return 'fill-indigo-400';
    if (intensity > 0.3) return 'fill-indigo-500/70';
    return 'fill-indigo-600/40';
  }
  if (agentState.value === 'listening') return 'fill-indigo-400/40';
  return 'fill-muted-foreground/20';
}

// ── Chat (Vercel AI SDK) ─────────────────────────────────────────────────────
const chat = new Chat({
  transport: new DefaultChatTransport({
    url: `${CONVEX_SITE_URL}/api/chat`,
  }),
});

const chatInput = ref('');
const messagesContainer = ref<HTMLElement | null>(null);

function sendChatMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = '';
  chat.sendMessage({ text });
}

// Auto-scroll to bottom when new messages arrive
watch(
  () => chat.messages.length,
  async () => {
    await nextTick();
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  }
);
</script>
```

**Step 2: Commit**

```bash
git add src/components/AiAssistantPanel.vue
git commit -m "feat: add AiAssistantPanel with voice + chat tabs"
```

---

## Task 8: Wire into app.vue and verify

**Files:**
- Modify: `src/app.vue`

**Step 1: Import and add `AiAssistantFab` to `app.vue`**

In `app.vue`, add inside the `<f7-app>` template (after `<f7-view>`):

```vue
<template>
  <f7-app v-bind="f7params">
    <f7-view ...></f7-view>
    <AiAssistantFab />
  </f7-app>
</template>

<script setup lang="ts">
// ... existing imports ...
import AiAssistantFab from './components/AiAssistantFab.vue';
// ... rest of script ...
</script>
```

**Step 2: Verify dev server runs cleanly**

```bash
npm run dev
```

Open browser. You should see the indigo FAB button in the bottom-right. Click it to open the panel. The Voice tab should show the visualizer + "Начать разговор" button. The Chat tab should show an empty message list with input.

**Step 3: Test voice flow**

1. Start the LiveKit agent: `cd agent && npm run dev`
2. Click FAB → Voice tab → "Начать разговор"
3. Browser prompts for mic permission — allow it
4. Agent should greet in Russian after connecting

**Step 4: Test chat flow**

1. Click FAB → Chat tab
2. Type "Что такое РУП?" → Send
3. Should stream back a response about РУП/working curriculum

**Step 5: Final commit**

```bash
git add src/app.vue
git commit -m "feat: integrate AiAssistantFab globally in app.vue"
```

---

## Post-Implementation Notes

### Running the agent in production
The LiveKit agent must be deployed as a long-running Node.js process. Options:
- Local: `cd agent && npm run dev`
- Server: PM2, systemd, Railway, Fly.io

### Convex environment variables
Must be set in Convex dashboard (not just `.env.local`) for production:
```
LIVEKIT_URL
LIVEKIT_API_KEY
LIVEKIT_API_SECRET
GOOGLE_API_KEY
```

### Panel z-index
The panel uses `z-[998]`, FAB uses `z-[999]`. Framework7 uses z-index ~13500 for modals — the assistant panel sits below those. If you need the panel above F7 modals, increase to `z-[14000]`.
