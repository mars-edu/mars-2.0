<template>
  <f7-page
    name="protocol"
    @page:init="onPageInit"
    class="bg-background"
  >
    <div class="desktop-header-container">
      <Header />
    </div>

    <Sidebar v-model:activeNavItem="activeNavItem" />

    <f7-page-content class="protocol-content">
      <div class="flex-1 overflow-y-auto p-3 md:p-4 bg-background pb-16 md:pb-6 transition-all duration-200" :class="contentMargin">
        <div class="flex flex-col gap-4">
          <!-- Page Header with Teacher Selector -->
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <h1 class="text-2xl font-semibold text-foreground">{{ protocol_title() }}</h1>

            <!-- Admin Teacher Selector -->
            <div v-if="userStore.isAdmin">
              <Select
                v-model="selectedTeacherId"
                :options="teacherOptions"
                :placeholder="protocol_teacher()"
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
            class="flex flex-col items-center justify-center py-20"
          >
            <div class="bg-card p-12 rounded-3xl shadow-sm border border-border flex flex-col items-center gap-4 max-w-md text-center">
              <div class="w-20 h-20 bg-muted rounded-full flex items-center justify-center text-muted-foreground/40">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
              </div>
              <h2 class="text-xl font-bold text-foreground">Записей пока нет</h2>
              <p class="text-muted-foreground text-sm">{{ protocol_empty() }}</p>
            </div>
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
              <template
                v-for="entry in group.entries"
                :key="entry._id"
              >
                <!-- Substitution card -->
                <template v-if="entry.type === 'substitution'">
                <div
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
                      <h3 class="text-sm font-semibold text-foreground">{{ protocol_substitution_set() }}</h3>
                      <span class="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded uppercase font-bold tracking-wide">
                        {{ protocol_substitution_label() }}
                      </span>
                    </div>

                    <p class="text-sm text-muted-foreground leading-relaxed mb-2">
                      {{ protocol_journal() }}
                      <span class="font-medium text-foreground">{{ entry.disciplineName || entry.journalSnapshot?.disciplineName || protocol_discipline_fallback() }}</span>
                      <span v-if="entry.journal?.groupName"> {{ entry.journal.groupName }}</span>
                      {{ protocol_teacher_from() }}
                      <span class="font-medium text-foreground">{{ protocolStore.getTeacherName(entry.fromTeacher) }}</span>
                      {{ protocol_teacher_to() }}
                      <span class="font-medium text-foreground">{{ protocolStore.getTeacherName(entry.toTeacher) }}</span>
                      {{ protocol_period_from() }}
                      <span class="font-medium text-foreground">{{ protocolStore.formatDate(entry.startDate) }}</span>
                      {{ protocol_period_to() }}
                      <span class="font-medium text-foreground">{{ protocolStore.formatDate(entry.endDate) }}</span>
                      {{ protocol_period_end() }}<span v-if="entry.serviceLetterNumber"> {{ protocol_letter() }} <span class="font-medium text-foreground">{{ entry.serviceLetterNumber }}</span> {{ protocol_period_end() }}</span>
                    </p>

                    <p v-if="entry.reason" class="text-xs text-muted-foreground italic mb-1">
                      {{ protocol_reason() }} {{ entry.reason }}
                    </p>
                    <div v-if="entry.serviceLetterNumber" class="text-xs text-muted-foreground flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                      {{ protocol_letter() }} {{ entry.serviceLetterNumber }}
                    </div>
                  </div>

                  <!-- Right: actions / status -->
                  <div class="flex-shrink-0 md:w-44 flex flex-col justify-center items-end gap-2">
                    <!-- Pending + admin → show action buttons -->
                    <template v-if="isAdmin && entry.status === 'pending'">
                      <span class="text-xs font-semibold text-muted-foreground self-end">{{ protocol_action_label() }}</span>
                      <div class="flex gap-2">
                        <button
                          @click="openModal(entry._id, entry.type, 'reject')"
                          :disabled="protocolStore.actionLoading"
                          class="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs font-bold shadow-sm disabled:opacity-50"
                        >
                          ✕ {{ protocol_reject() }}
                        </button>
                        <button
                          @click="openModal(entry._id, entry.type, 'accept')"
                          :disabled="protocolStore.actionLoading"
                          class="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs font-bold shadow-sm disabled:opacity-50"
                        >
                          ✓ {{ protocol_accept() }}
                        </button>
                      </div>
                    </template>

                    <!-- Pending but not toTeacher → show waiting pill -->
                    <template v-else-if="entry.status === 'pending'">
                      <div class="flex items-center gap-1.5 text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full">
                        <span class="text-xs font-bold">{{ protocol_waiting() }}</span>
                      </div>
                    </template>

                    <!-- Accepted -->
                    <template v-else-if="entry.status === 'accepted'">
                      <div class="flex items-center gap-1.5 text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full">
                        <span class="text-xs font-bold">{{ protocol_accepted() }}</span>
                      </div>
                      <div v-if="entry.acceptedAt" class="text-[10px] text-muted-foreground text-right">
                        {{ formatTime(entry.acceptedAt) }}
                      </div>
                    </template>

                    <!-- Rejected -->
                    <template v-else-if="entry.status === 'rejected'">
                      <div class="flex items-center gap-1.5 text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full">
                        <span class="text-xs font-bold">{{ protocol_rejected() }}</span>
                      </div>
                      <div v-if="entry.rejectedAt" class="text-[10px] text-muted-foreground text-right">
                        {{ formatTime(entry.rejectedAt) }}
                      </div>
                    </template>

                    <!-- Completed -->
                    <template v-else-if="entry.status === 'completed'">
                      <div class="flex items-center gap-1.5 text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                        <span class="text-xs font-bold">{{ protocol_completed() }}</span>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
              </template>

              <!-- Makeup request card -->
              <template v-else-if="entry.type === 'makeup_request'">
                <div class="protocol-entry relative overflow-hidden rounded-lg bg-card border border-border shadow-sm">
                  <div
                    class="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                    :class="{
                      'bg-blue-400':  entry.status === 'pending',
                      'bg-green-400': entry.status === 'accepted',
                      'bg-red-400':   entry.status === 'rejected',
                    }"
                  ></div>

                  <div class="pl-5 pr-4 py-4 flex flex-col md:flex-row gap-4">
                    <div class="flex-shrink-0 flex flex-col items-center gap-1.5 min-w-[52px]">
                      <div
                        class="w-3 h-3 rounded-full mt-0.5"
                        :class="{
                          'bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-900/30':    entry.status === 'pending',
                          'bg-green-500 ring-4 ring-green-100 dark:ring-green-900/30': entry.status === 'accepted',
                          'bg-red-500 ring-4 ring-red-100 dark:ring-red-900/30':       entry.status === 'rejected',
                        }"
                      ></div>
                      <span class="text-xs text-muted-foreground font-mono">
                        {{ formatTime(entry.createdAt) }}
                      </span>
                    </div>

                    <div class="flex-grow min-w-0">
                      <div class="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 class="text-sm font-semibold text-foreground">
                          {{ protocol_makeup_request_title() }}
                        </h3>
                        <span class="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase font-bold tracking-wide">
                          {{ protocol_makeup_request_label() }}
                        </span>
                      </div>

                      <p class="text-sm text-muted-foreground leading-relaxed mb-2">
                        {{ protocol_journal() }}
                        <span class="font-medium text-foreground">
                          {{ entry.journalSnapshot?.disciplineName ?? protocol_discipline_fallback() }}
                        </span>
                        <span v-if="entry.journalSnapshot?.groupName"> {{ entry.journalSnapshot.groupName }}</span>
                        <template v-if="entry.teacher">
                          {{ protocol_teacher_from() }}
                          <span class="font-medium text-foreground">
                            {{ protocolStore.getTeacherName(entry.teacher) }}
                          </span>
                        </template>
                      </p>

                      <div class="mb-2">
                        <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {{ protocol_makeup_dates_label() }}:
                        </span>
                        <ul class="mt-1 space-y-0.5">
                          <li
                            v-for="(d, i) in entry.dates"
                            :key="i"
                            class="text-xs text-foreground font-medium"
                          >
                            {{ d.existingDate }} → {{ d.newDate }}
                          </li>
                        </ul>
                      </div>

                      <p v-if="entry.reason" class="text-xs text-muted-foreground italic">
                        {{ protocol_reason() }} {{ entry.reason }}
                      </p>
                    </div>

                    <div class="flex-shrink-0 md:w-44 flex flex-col justify-center items-end gap-2">
                      <template v-if="isAdmin && entry.status === 'pending'">
                        <span class="text-xs font-semibold text-muted-foreground self-end">{{ protocol_action_label() }}</span>
                        <div class="flex gap-2">
                          <button
                            @click="openModal(entry._id, 'makeup_request', 'reject')"
                            :disabled="protocolStore.actionLoading"
                            class="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs font-bold shadow-sm disabled:opacity-50"
                          >
                            ✕ {{ protocol_reject() }}
                          </button>
                          <button
                            @click="openModal(entry._id, 'makeup_request', 'accept')"
                            :disabled="protocolStore.actionLoading"
                            class="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs font-bold shadow-sm disabled:opacity-50"
                          >
                            ✓ {{ protocol_accept() }}
                          </button>
                        </div>
                      </template>

                      <template v-else-if="entry.status === 'pending'">
                        <div class="flex items-center gap-1.5 text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full">
                          <span class="text-xs font-bold">{{ protocol_waiting() }}</span>
                        </div>
                      </template>

                      <template v-else-if="entry.status === 'accepted'">
                        <div class="flex items-center gap-1.5 text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full">
                          <span class="text-xs font-bold">{{ protocol_accepted() }}</span>
                        </div>
                      </template>

                      <template v-else-if="entry.status === 'rejected'">
                        <div class="flex items-center gap-1.5 text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full">
                          <span class="text-xs font-bold">{{ protocol_rejected() }}</span>
                        </div>
                        <p v-if="entry.rejectionReason" class="text-[10px] text-muted-foreground text-right mt-1">
                          {{ entry.rejectionReason }}
                        </p>
                      </template>
                    </div>
                  </div>
                </div>
              </template>
              </template>
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
          class="fixed inset-0 flex items-center justify-center p-4"
          style="z-index: 99999"
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
                {{ pendingAction?.type === 'accept' ? protocol_confirm_accept() : protocol_confirm_reject() }}
              </h3>
              <p class="text-sm text-muted-foreground mb-4">
                {{ protocol_confirm_desc() }}
              </p>

              <!-- Reject reason textarea -->
              <div v-if="pendingAction?.type === 'reject'" class="w-full mb-4">
                <label class="block text-sm font-semibold text-foreground mb-1.5 text-left">{{ protocol_reason() }}</label>
                <textarea
                  v-model="rejectReason"
                  placeholder="Укажите причину..."
                  rows="3"
                  class="w-full px-4 py-2.5 bg-muted/50 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground resize-none transition-all"
                ></textarea>
              </div>

              <div class="flex gap-3 w-full">
                <button
                  @click="closeModal"
                  class="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
                >
                  {{ common_cancel() }}
                </button>
                <button
                  @click="confirmAction"
                  :disabled="protocolStore.actionLoading || (pendingAction?.type === 'reject' && !rejectReason.trim())"
                  class="flex-1 px-4 py-2 text-white rounded-lg font-bold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  :class="pendingAction?.type === 'accept'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'"
                >
                  {{ protocolStore.actionLoading ? protocol_wait() : common_confirm() }}
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
import type { ProtocolEntry, MakeupRequestEntry } from "@/stores/protocolStore";
import { useUserStore } from "@/stores/userStore";
import type { Id } from "@convex/_generated/dataModel";
import { useTeacherStore } from "@/stores/teacherStore";
import { useSidebar } from "@/composables/useSidebar";
import {
  protocol_title,
  protocol_teacher,
  protocol_empty,
  protocol_substitution_set,
  protocol_substitution_label,
  protocol_journal,
  protocol_teacher_from,
  protocol_teacher_to,
  protocol_period_from,
  protocol_period_to,
  protocol_period_end,
  protocol_letter,
  protocol_reason,
  protocol_action_label,
  protocol_reject,
  protocol_accept,
  protocol_waiting,
  protocol_accepted,
  protocol_rejected,
  protocol_completed,
  protocol_confirm_accept,
  protocol_confirm_reject,
  protocol_confirm_desc,
  protocol_wait,
  protocol_discipline_fallback,
  protocol_makeup_request_label,
  protocol_makeup_request_title,
  protocol_makeup_dates_label,
  common_cancel,
  common_confirm,
  common_all,
} from "@/paraglide/messages";
import { useI18n } from "@/composables/useI18n";

const { locale } = useI18n();
const { contentMargin } = useSidebar();
const activeNavItem = ref("protocol");
const protocolStore = useProtocolStore();
const userStore = useUserStore();
const isAdmin = computed(() => userStore.isAdmin);
const teacherStore = useTeacherStore();

// Teacher selection for admins
const selectedTeacherId = computed({
  get: () => protocolStore.selectedTeacherId || "all",
  set: (value: string) => {
    protocolStore.setSelectedTeacher(value === "all" ? null : value);
  },
});

const teacherOptions = computed(() => {
  void locale;
  return [
    { value: "all", text: common_all() },
    ...teacherStore.teacherSelectOptions,
  ];
});

const modalOpen = ref(false);
const pendingAction = ref<{
  id: string;
  entryType: "substitution" | "makeup_request";
  type: "accept" | "reject";
} | null>(null);
const rejectReason = ref("");

function openModal(
  id: string,
  entryType: "substitution" | "makeup_request",
  type: "accept" | "reject"
) {
  pendingAction.value = { id, entryType, type };
  rejectReason.value = "";
  modalOpen.value = true;
}

function closeModal() {
  modalOpen.value = false;
  pendingAction.value = null;
  rejectReason.value = "";
}

async function confirmAction() {
  if (!pendingAction.value) return;
  const { id, entryType, type } = pendingAction.value;
  closeModal();
  if (entryType === "substitution") {
    if (type === "accept") {
      await protocolStore.acceptEntry(id as Id<"substitutions">);
    } else {
      await protocolStore.rejectEntry(id as Id<"substitutions">, rejectReason.value || undefined);
    }
  } else {
    if (type === "accept") {
      await protocolStore.acceptMakeupRequest(id as Id<"makeupRequests">);
    } else {
      await protocolStore.rejectMakeupRequest(id as Id<"makeupRequests">, rejectReason.value || undefined);
    }
  }
}

/**
 * Format timestamp to time string (HH:MM)
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString(locale.value, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function onPageInit() {
  protocolStore.fetchProtocolWithRoleAccess();
}
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
