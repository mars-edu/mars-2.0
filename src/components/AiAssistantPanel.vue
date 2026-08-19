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

    <!-- ── Voice Tab ─────────────────────────────────────────────────────────── -->
    <div v-show="activeTab === 'voice'" class="flex-1 flex flex-col justify-between p-6 overflow-hidden">
      <!-- Top / Status -->
      <div class="text-center space-y-1">
        <div class="flex items-center justify-center gap-1.5 text-xs">
          <WifiIcon v-if="isConnected" :size="12" class="text-emerald-500" />
          <span :class="stateLabelClass" class="font-medium">{{ stateLabel }}</span>
        </div>
        <p v-if="voiceError" class="text-xs text-rose-500 mt-1 max-w-xs mx-auto leading-relaxed">
          {{ voiceError }}
        </p>
      </div>

      <!-- Center: Visualizer -->
      <div class="flex flex-col items-center justify-center my-auto py-8">
        <div
          class="w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500"
          :class="[
            agentState === 'speaking' ? 'bg-indigo-500/20 ring-4 ring-indigo-500/30 scale-105' : '',
            agentState === 'listening' ? 'bg-indigo-500/10 ring-2 ring-indigo-500/20' : '',
            agentState === 'thinking' ? 'bg-amber-500/10 ring-2 ring-amber-500/20' : '',
            agentState === 'disconnected' || agentState === 'idle' ? 'bg-muted' : '',
          ]"
        >
          <!-- Frequency Bars SVG -->
          <svg
            v-if="isConnected && (agentState === 'speaking' || agentState === 'listening')"
            class="w-16 h-12"
            viewBox="0 0 64 32"
          >
            <rect
              v-for="(band, i) in frequencyBands"
              :key="i"
              :x="i * 8 + 2"
              :y="16 - barHeight(band) / 2"
              :width="barWidth"
              :height="barHeight(band)"
              rx="2"
              :class="barClass(band)"
              class="transition-all duration-75"
            />
          </svg>

          <!-- Spinner when thinking / connecting -->
          <Loader2Icon
            v-else-if="agentState === 'thinking' || agentState === 'connecting'"
            :size="32"
            class="text-indigo-400 animate-spin"
          />

          <!-- Bot icon when idle/disconnected -->
          <BotIcon
            v-else
            :size="32"
            :class="isConnected ? 'text-indigo-400' : 'text-muted-foreground/40'"
          />
        </div>

        <p class="text-xs text-muted-foreground/60 mt-4 text-center max-w-xs">
          {{ isConnected
            ? 'Говорите свободно — ассистент слушает и отвечает в реальном времени'
            : 'Подключитесь для голосового общения с ассистентом MARS'
          }}
        </p>
      </div>

      <!-- Bottom Controls -->
      <div class="flex items-center justify-center gap-3 pt-2">
        <template v-if="isConnected">
          <!-- Mute/Unmute Mic -->
          <button
            class="w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm"
            :class="isMicMuted
              ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/30'
              : 'bg-muted hover:bg-muted/80 text-foreground border border-border'"
            :title="isMicMuted ? 'Включить микрофон' : 'Отключить микрофон'"
            @click="toggleMic"
          >
            <MicOffIcon v-if="isMicMuted" :size="20" />
            <MicIcon v-else :size="20" />
          </button>

          <!-- Disconnect button -->
          <button
            class="px-5 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-medium text-xs
                   transition-all shadow-sm flex items-center gap-2"
            @click="handleDisconnect"
          >
            Завершить
          </button>
        </template>

        <template v-else>
          <!-- Connect button -->
          <button
            class="w-full max-w-xs py-3.5 px-6 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white
                   font-semibold text-sm transition-all shadow-lg shadow-indigo-500/25
                   flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            :disabled="agentState === 'connecting'"
            @click="handleConnect"
          >
            <Loader2Icon v-if="agentState === 'connecting'" :size="18" class="animate-spin" />
            <Volume2Icon v-else :size="18" />
            <span>{{ agentState === 'connecting' ? 'Подключение...' : 'Начать разговор' }}</span>
          </button>
        </template>
      </div>
    </div>

    <!-- ── Chat Tab ──────────────────────────────────────────────────────────── -->
    <div v-show="activeTab === 'chat'" class="flex-1 flex flex-col overflow-hidden">
      <!-- Messages List -->
      <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
        <template v-for="message in chat.messages" :key="message.id">
          <!-- User message -->
          <div v-if="message.role === 'user'" class="flex justify-end">
            <div class="max-w-[85%] bg-indigo-500 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm">
              <template v-for="(part, pIdx) in message.parts" :key="pIdx">
                <p v-if="part.type === 'text'" class="whitespace-pre-wrap leading-relaxed">{{ part.text }}</p>
              </template>
            </div>
          </div>

          <!-- Assistant message -->
          <div v-else-if="message.role === 'assistant'" class="flex justify-start items-start gap-2">
            <div class="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <BotIcon :size="14" class="text-indigo-400" />
            </div>
            <div class="max-w-[85%] bg-muted text-foreground rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm space-y-2">
              <template v-for="(part, pIdx) in message.parts" :key="pIdx">
                <!-- Text part (rendered as markdown) -->
                <div
                  v-if="part.type === 'text'"
                  class="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed"
                  v-html="renderMarkdown(part.text)"
                />
              </template>
            </div>
          </div>
        </template>

        <!-- Loading indicator -->
        <div v-if="chat.status === 'streaming' || chat.status === 'submitted'" class="flex justify-start items-start gap-2">
          <div class="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <BotIcon :size="14" class="text-indigo-400" />
          </div>
          <div class="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 text-sm">
            <div class="flex gap-1 items-center h-5">
              <div class="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style="animation-delay: 0ms" />
              <div class="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style="animation-delay: 150ms" />
              <div class="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style="animation-delay: 300ms" />
            </div>
          </div>
        </div>

        <!-- Empty state with quick command prompts -->
        <div v-if="chat.messages.length === 0" class="flex flex-col items-center justify-center text-center gap-4 py-6">
          <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <BotIcon :size="26" />
          </div>
          <div>
            <p class="text-sm font-bold text-foreground">Чем могу помочь?</p>
            <p class="text-xs text-muted-foreground mt-0.5">Выберите быстрый запрос или напишите вопрос</p>
          </div>

          <!-- Quick Action Prompts -->
          <div class="flex flex-col gap-2 w-full max-w-xs mt-2">
            <button
              v-for="prompt in QUICK_PROMPTS"
              :key="prompt.text"
              type="button"
              class="flex items-center gap-2.5 px-3.5 py-2.5 bg-muted/60 hover:bg-muted text-xs font-semibold text-foreground rounded-xl border border-border transition-all text-left group active:scale-98"
              @click="applyQuickPrompt(prompt.text)"
            >
              <span class="text-base shrink-0">{{ prompt.icon }}</span>
              <span class="flex-1 truncate">{{ prompt.text }}</span>
              <IconChevronRight class="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </button>
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
import IconChevronRight from '~icons/lucide/chevron-right';
import { Chat } from '@ai-sdk/vue';
import { DefaultChatTransport } from 'ai';
import { useAgentSession } from '@/composables/useAgentSession';
import { useUserStore } from '@/stores/userStore';

const CONVEX_SITE_URL = import.meta.env.VITE_CONVEX_SITE_URL;

defineEmits<{ close: [] }>();

const userStore = useUserStore();

const activeTab = ref<'voice' | 'chat'>('voice');

const QUICK_PROMPTS = [
  { icon: '📅', text: 'Какое расписание на сегодня?' },
  { icon: '📊', text: 'Покажи сводку успеваемости студентов' },
  { icon: '🕒', text: 'Сколько учебных часов запланировано по нагрузке?' },
  { icon: '📚', text: 'Какие дисциплины есть в учебном плане (РУП)?' },
];

function applyQuickPrompt(text: string) {
  chatInput.value = text;
  sendChatMessage();
}

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
.ai-panel-root {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
