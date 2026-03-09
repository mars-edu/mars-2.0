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
                class="protocol-entry rounded-lg bg-card p-4 shadow-sm border border-border"
              >
                <!-- Entry Type Badge -->
                <div class="mb-2 flex items-center gap-2">
                  <span
                    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                    :class="getStatusBadgeClass(entry.status)"
                  >
                    {{ protocolStore.getStatusText(entry.status) }}
                  </span>
                  <span class="text-xs text-muted-foreground">
                    {{ formatTime(entry.createdAt) }}
                  </span>
                </div>

                <!-- Entry Content -->
                <div class="space-y-1.5">
                  <div v-if="entry.type === 'substitution'">
                    <p class="text-sm font-medium text-foreground">
                      Установлена замена
                    </p>
                    <p class="text-sm text-muted-foreground leading-relaxed mt-1">
                      Журнал
                      <span class="font-medium text-foreground">{{
                        entry.disciplineName || "БМД Владеть основами философских знаний"
                      }}</span>
                      <span v-if="entry.journal?.groupName">
                        {{ entry.journal.groupName }}
                      </span>
                      преподавателя
                      <span class="font-medium text-foreground">{{
                        protocolStore.getTeacherName(entry.fromTeacher)
                      }}</span>
                      переведен преподавателю
                      <span class="font-medium text-foreground">{{
                        protocolStore.getTeacherName(entry.toTeacher)
                      }}</span>
                      в период с
                      <span class="font-medium text-foreground">{{
                        protocolStore.formatDate(entry.startDate)
                      }}</span>
                      г. по
                      <span class="font-medium text-foreground">{{
                        protocolStore.formatDate(entry.endDate)
                      }}</span>
                      г.
                      <span v-if="entry.serviceLetterNumber">
                        на основании служебного письма от
                        <span class="font-medium text-foreground">{{
                          entry.serviceLetterNumber
                        }}</span>
                        г.
                      </span>
                    </p>
                  </div>

                  <!-- Reason if provided -->
                  <p
                    v-if="entry.reason"
                    class="text-xs text-muted-foreground italic mt-2"
                  >
                    Причина: {{ entry.reason }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </f7-page-content>
  </f7-page>
</template>

<script setup lang="ts">
import { useSidebar } from "@/composables/useSidebar";
const { contentMargin } = useSidebar();
import { onMounted, ref, computed } from "vue";
import { f7ready, f7Page, f7PageContent, f7Preloader } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import Select from "@/components/ui/Select.vue";
import { useProtocolStore } from "@/stores/protocolStore";
import { useUserStore } from "@/stores/userStore";
import { useTeacherStore } from "@/stores/teacherStore";

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
 * Get CSS classes for status badge
 */
function getStatusBadgeClass(status: string): string {
  const classes = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    accepted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  };
  return classes[status as keyof typeof classes] || classes.pending;
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
