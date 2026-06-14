<!-- src/components/AiAssistantPanel.vue -->
<template>
  <div class="ai-panel-root bg-card text-foreground">

    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-border bg-card flex-shrink-0">
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
    <div v-if="activeTab === 'voice'" class="flex flex-col items-center justify-center gap-6 p-6 flex-1 min-h-0 overflow-y-auto">

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

      <p v-if="voiceError" class="text-xs text-red-500 text-center px-4">{{ voiceError }}</p>
    </div>

    <!-- Chat Tab -->
    <div v-else class="flex flex-col flex-1 min-h-0 overflow-hidden">
      <!-- Messages -->
      <div ref="messagesContainer" class="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        <div
          v-for="(message, idx) in chat.messages"
          :key="message.id ?? idx"
          class="flex"
          :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div v-if="message.role === 'assistant'" class="w-7 h-7 rounded-full bg-indigo-500/10 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
            <BotIcon :size="14" class="text-indigo-500" />
          </div>
          <div
            class="max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed"
            :class="message.role === 'user'
              ? 'bg-indigo-500 text-white rounded-br-sm'
              : 'bg-muted text-foreground rounded-bl-sm'"
          >
            <template v-for="(part, pIdx) in message.parts" :key="pIdx">
              <span v-if="part.type === 'text' && message.role === 'user'">{{ part.text }}</span>
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div v-else-if="part.type === 'text'" class="prose-ai" v-html="renderMarkdown(part.text)" />
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
        <div v-if="chat.messages.length === 0" class="flex flex-col items-center justify-center text-center gap-3 py-8">
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
      <div class="p-3 border-t border-border flex-shrink-0 bg-card">
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
import { marked } from 'marked';
import DOMPurify from 'dompurify';
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
import { Chat } from '@ai-sdk/vue';
import { DefaultChatTransport } from 'ai';
import { useAgentSession } from '@/composables/useAgentSession';
import { useUserStore } from '@/stores/userStore';

const CONVEX_SITE_URL = import.meta.env.VITE_CONVEX_SITE_URL;

defineEmits<{ close: [] }>();

const userStore = useUserStore();

const activeTab = ref<'voice' | 'chat'>('voice');

// ── Voice (LiveKit) ──────────────────────────────────────────────────────────
const { agentState, isMicMuted, frequencyBands, isConnected, connect, disconnect, toggleMic } =
  useAgentSession();

const voiceError = ref('');

async function handleConnect() {
  voiceError.value = '';
  try {
    await connect();
  } catch (err: any) {
    if (err.message && err.message.includes('unavailable')) {
      voiceError.value = 'Агент сейчас недоступен (сервер не отвечает).';
    } else {
      voiceError.value = 'Не удалось подключиться. Проверьте микрофон и попробуйте снова.';
    }
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
    if (band > 0.6) return 'fill-indigo-400';
    if (band > 0.3) return 'fill-indigo-500/70';
    return 'fill-indigo-600/40';
  }
  if (agentState.value === 'listening') return 'fill-indigo-400/40';
  return 'fill-muted-foreground/20';
}

// ── Markdown ─────────────────────────────────────────────────────────────────
marked.setOptions({ breaks: true, gfm: true });

function renderMarkdown(text: string): string {
  const rawHtml = marked.parse(text) as string;
  return DOMPurify.sanitize(rawHtml);
}

// ── Chat (Vercel AI SDK) ──────────────────────────────────────────────────────
const chat = new Chat({
  transport: new DefaultChatTransport({
    api: `${CONVEX_SITE_URL}/api/chat`,
    headers: () =>
      userStore.token ? { Authorization: `Bearer ${userStore.token}` } : {},
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

<style scoped>
/* Markdown rendered inside assistant bubbles */
.prose-ai :deep(p) {
  margin: 0 0 0.5em;
}
.prose-ai :deep(p:last-child) {
  margin-bottom: 0;
}
.prose-ai :deep(strong) {
  font-weight: 600;
}
.prose-ai :deep(em) {
  font-style: italic;
}
.prose-ai :deep(ul),
.prose-ai :deep(ol) {
  margin: 0.4em 0;
  padding-left: 1.25em;
}
.prose-ai :deep(ul) {
  list-style-type: disc;
}
.prose-ai :deep(ol) {
  list-style-type: decimal;
}
.prose-ai :deep(li) {
  margin: 0.15em 0;
}
.prose-ai :deep(h1),
.prose-ai :deep(h2),
.prose-ai :deep(h3) {
  font-weight: 600;
  margin: 0.6em 0 0.3em;
  line-height: 1.3;
}
.prose-ai :deep(h1) { font-size: 1.1em; }
.prose-ai :deep(h2) { font-size: 1.05em; }
.prose-ai :deep(h3) { font-size: 1em; }
.prose-ai :deep(code) {
  font-family: ui-monospace, monospace;
  font-size: 0.85em;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 4px;
  padding: 0.1em 0.35em;
}
.prose-ai :deep(pre) {
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  padding: 0.75em 1em;
  margin: 0.5em 0;
  overflow-x: auto;
}
.prose-ai :deep(pre code) {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.8em;
}
.prose-ai :deep(blockquote) {
  border-left: 3px solid hsl(var(--border));
  margin: 0.4em 0;
  padding-left: 0.75em;
  color: hsl(var(--muted-foreground));
}
.prose-ai :deep(hr) {
  border: none;
  border-top: 1px solid hsl(var(--border));
  margin: 0.5em 0;
}
.prose-ai :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0.4em 0;
  font-size: 0.85em;
}
.prose-ai :deep(th),
.prose-ai :deep(td) {
  border: 1px solid hsl(var(--border));
  padding: 0.3em 0.6em;
  text-align: left;
}
.prose-ai :deep(th) {
  background: hsl(var(--background));
  font-weight: 600;
}
</style>
