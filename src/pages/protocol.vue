<template>
  <f7-page
    name="protocol"
    @page:init="onPageInit"
    @page:mounted="onPageMounted"
    class="bg-background"
  >
    <div class="desktop-header-container">
      <Header />
    </div>

    <f7-page-content class="protocol-content">
      <Sidebar v-model:activeNavItem="activeNavItem" />

      <div class="flex-1 overflow-y-auto p-3 md:p-4 bg-background pb-16 md:pb-6 transition-all duration-200" :class="contentMargin">
        <div class="flex flex-col gap-4">
          <!-- Page Header with Teacher Selector -->
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <h1 class="text-2xl font-semibold text-foreground">Протокол</h1>

            <!-- Admin Teacher Selector -->
            <div v-if="userStore.isAdmin">
              <Select
                v-model="selectedTeacherId"
                :options="teacherOptions"
                placeholder="Преподаватель:"
                name="teacher"
                class="w-full sm:w-[250px]"
                :searchable="true"
              />
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="protocolStore.loading" class="flex justify-center py-12">
            <f7-preloader />
          </div>

          <!-- Error State -->
          <div
            v-else-if="protocolStore.error"
            class="rounded-lg bg-destructive/10 p-4 text-center text-destructive"
          >
            {{ protocolStore.error }}
          </div>

          <!-- Empty State -->
          <div
            v-else-if="protocolStore.entries.length === 0"
            class="rounded-lg bg-muted p-8 text-center"
          >
            <p class="text-muted-foreground">
              Нет записей в протоколе
            </p>
          </div>

          <!-- Protocol Entries Grouped by Date -->
          <div v-else class="space-y-6">
          <div
            v-for="group in protocolStore.entriesByDate"
            :key="group.date"
            class="protocol-date-group"
          >
            <!-- Date Header -->
            <div class="mb-3">
              <h2 class="text-lg font-medium text-foreground capitalize">
                {{ group.date }}
              </h2>
            </div>

            <!-- Entries for this date -->
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
                        {{ formatTime(entry.acceptedAt) }}
                      </div>
                    </template>

                    <!-- Rejected -->
                    <template v-else-if="entry.status === 'rejected'">
                      <div class="flex items-center gap-1.5 text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full">
                        <span class="text-xs font-bold">✕ Отклонено</span>
                      </div>
                      <div v-if="entry.rejectedAt" class="text-[10px] text-muted-foreground text-right">
                        {{ formatTime(entry.rejectedAt) }}
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
          </div>
          </div>

          <!-- Action Error -->
          <div
            v-if="protocolStore.actionError"
            class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive text-center"
          >
            {{ protocolStore.actionError }}
          </div>

        </div>
      </div>

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
    </f7-page-content>
  </f7-page>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { f7ready, f7Page, f7PageContent, f7Preloader } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import Select from "@/components/ui/Select.vue";
import { useProtocolStore } from "@/stores/protocolStore";
import type { ProtocolEntry } from "@/stores/protocolStore";
import { useUserStore } from "@/stores/userStore";
import type { Id } from "@convex/_generated/dataModel";
import { useTeacherStore } from "@/stores/teacherStore";
import { useSidebar } from "@/composables/useSidebar";

const { contentMargin } = useSidebar();
const activeNavItem = ref("protocol");
const protocolStore = useProtocolStore();
const userStore = useUserStore();
const teacherStore = useTeacherStore();

// Teacher selection for admins
const selectedTeacherId = computed({
  get: () => protocolStore.selectedTeacherId || "all",
  set: (value: string) => {
    protocolStore.setSelectedTeacher(value === "all" ? null : value);
  },
});

const teacherOptions = computed(() => [
  { value: "all", text: "Все" },
  ...teacherStore.teacherSelectOptions,
]);

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

/**
 * Format timestamp to time string (HH:MM)
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Page initialization
 */
function onPageInit() {
  console.log("[protocol] Page initialized");
}

/**
 * Page mounted
 */
function onPageMounted() {
  console.log("[protocol] Page mounted");

  f7ready(() => {
    // Fetch protocol entries when page is ready
    protocolStore.fetchProtocolWithRoleAccess();
  });
}

// Cleanup on unmount
onMounted(() => {
  return () => {
    // Optional: reset store on unmount
    // protocolStore.reset();
  };
});
</script>

<style scoped>
.protocol-content {
  background-color: hsl(var(--background));
}

.protocol-date-group {
  animation: fadeIn 0.3s ease-in;
}

.protocol-entry {
  transition: all 0.2s ease;
}

.protocol-entry:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
