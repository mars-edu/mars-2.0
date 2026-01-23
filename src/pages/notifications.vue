<template>
  <f7-page
    name="notifications"
    class="flex flex-col h-screen bg-background text-foreground"
    :data-page-id="`notifications-${pageId}`"
    data-page-name="notifications"
  >
    <!-- Desktop Header -->
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <Sidebar v-model:activeNavItem="activeNavItem" class="hidden md:block" />

      <!-- Page Content -->
      <div class="flex-1 overflow-y-auto p-3 md:p-4 bg-background pb-16 md:pb-6 md:ml-32">
        <div class="max-w-4xl mx-auto">
          <!-- Header -->
          <div class="mb-6">
          <div class="flex items-center justify-between mb-2">
            <h1 class="text-3xl font-bold text-foreground">Уведомления</h1>
            <button
              v-if="unreadNotifications.length > 0"
              @click="handleMarkAllAsRead"
              class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              Отметить все как прочитанные
            </button>
          </div>
          </div>
        </div>

        <!-- Active Journal Closure Reminders -->
        <div
          v-if="activeReminders.length > 0"
          class="mb-6 p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800"
        >
          <div class="flex items-start gap-3">
            <i class="icon f7-icons text-orange-600 text-2xl">exclamationmark_triangle_fill</i>
            <div class="flex-1">
              <h3 class="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                Важное объявление
              </h3>
              <div
                v-for="reminder in activeReminders"
                :key="reminder._id"
                class="text-sm text-orange-800 dark:text-orange-200 mb-1"
              >
                <p>{{ reminder.message }}</p>
                <p class="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  Крайний срок: {{ formatDate(reminder.deadline) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-12">
          <f7-preloader />
          <p class="text-muted-foreground mt-4">Загрузка уведомлений...</p>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="notifications.length === 0"
          class="text-center py-12 bg-card rounded-lg border border-border"
        >
          <i class="icon f7-icons text-6xl text-muted-foreground mb-4">bell_slash</i>
          <h3 class="text-xl font-semibold text-foreground mb-2">Нет уведомлений</h3>
          <p class="text-muted-foreground">У вас пока нет уведомлений</p>
        </div>

        <!-- Notifications List -->
        <div v-else class="space-y-3">
          <div
            v-for="notification in notifications"
            :key="notification._id"
            class="bg-card rounded-lg border border-border overflow-hidden transition-all hover:shadow-md"
            :class="{
              'ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20': notification.status === 'unread',
            }"
          >
            <!-- Substitution Notification -->
            <div v-if="notification.type === 'substitution'" class="p-4">
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-start gap-3 flex-1">
                  <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                    <i class="icon f7-icons text-blue-600 dark:text-blue-400">arrow_2_squarepath</i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-foreground mb-1">{{ notification.title }}</h3>
                    <p class="text-sm text-muted-foreground">{{ notification.message }}</p>
                  </div>
                </div>
                <span class="text-xs text-muted-foreground whitespace-nowrap ml-4">
                  {{ formatDateTime(notification.createdAt) }}
                </span>
              </div>

              <!-- Substitution Actions -->
              <div
                v-if="notification.substitution && notification.substitution.status === 'pending'"
                class="flex gap-2 mt-3 pt-3 border-t border-border"
              >
                <button
                  @click="handleAcceptSubstitution(notification.substitution._id, notification._id)"
                  :disabled="processing"
                  class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                >
                  Принять
                </button>
                <button
                  @click="handleRejectSubstitution(notification.substitution._id, notification._id)"
                  :disabled="processing"
                  class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 font-medium"
                >
                  Отклонить
                </button>
              </div>

              <!-- Substitution Status -->
              <div
                v-else-if="notification.substitution"
                class="mt-3 pt-3 border-t border-border"
              >
                <span
                  v-if="notification.substitution.status === 'accepted'"
                  class="inline-flex items-center gap-1 text-sm font-medium text-green-600"
                >
                  <i class="icon f7-icons">checkmark_circle_fill</i>
                  Принято
                </span>
                <span
                  v-else-if="notification.substitution.status === 'rejected'"
                  class="inline-flex items-center gap-1 text-sm font-medium text-red-600"
                >
                  <i class="icon f7-icons">xmark_circle_fill</i>
                  Отклонено
                </span>
                <span
                  v-else-if="notification.substitution.status === 'completed'"
                  class="inline-flex items-center gap-1 text-sm font-medium text-gray-600"
                >
                  <i class="icon f7-icons">checkmark_circle</i>
                  Завершено
                </span>
              </div>
            </div>

            <!-- Journal Closure Notification -->
            <div v-else-if="notification.type === 'journal_closure'" class="p-4">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center flex-shrink-0">
                  <i class="icon f7-icons text-orange-600 dark:text-orange-400">calendar_badge_exclamationmark</i>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between mb-1">
                    <h3 class="font-semibold text-orange-600 dark:text-orange-400">{{ notification.title }}</h3>
                    <span class="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {{ formatDateTime(notification.createdAt) }}
                    </span>
                  </div>
                  <p class="text-sm text-foreground mb-2">{{ notification.message }}</p>
                  <p
                    v-if="notification.metadata?.deadline"
                    class="text-xs text-muted-foreground"
                  >
                    Крайний срок: {{ formatDate(notification.metadata.deadline) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- System Notification -->
            <div v-else class="p-4">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <i class="icon f7-icons text-gray-600 dark:text-gray-400">info_circle_fill</i>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between mb-1">
                    <h3 class="font-semibold text-foreground">{{ notification.title }}</h3>
                    <span class="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {{ formatDateTime(notification.createdAt) }}
                    </span>
                  </div>
                  <p class="text-sm text-muted-foreground">{{ notification.message }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7, f7Page, f7Preloader } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import { formatDateTime, formatDate } from '@/utils/dateUtils';
import { useConvexQuery, useConvexMutation } from 'convex-vue';
import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import { useUserStore } from '@/stores/userStore';

const userStore = useUserStore();
const processing = ref(false);
const pageId = ref(Date.now());
const activeNavItem = ref("notifications");

const currentUserId = computed(() => userStore.currentUser?.id as Id<"users"> | undefined);

// Convex Reactive Queries - reusing same functionality as NotificationCenterPopover
const notificationsResult = useConvexQuery(
  api.notifications.queries.getUserNotifications,
  computed(() => currentUserId.value ? {
    userId: currentUserId.value,
    limit: 100, // Show more on dedicated page
  } : "skip")
) as any;

const activeRemindersResult = useConvexQuery(
  api.notifications.queries.getActiveJournalClosureReminders,
  computed(() => ({}))
) as any;

// Computed values from reactive queries
const notifications = computed(() => notificationsResult.data.value ?? []);
const activeReminders = computed(() => activeRemindersResult.data.value ?? []);
const loading = computed(() => notificationsResult.isPending.value);

const unreadNotifications = computed(() =>
  notifications.value.filter((n: any) => n.status === 'unread')
);

// Mutations
const markAllAsReadMutation = useConvexMutation(api.notifications.mutations.markAllAsRead);
const acceptSubstitutionMutation = useConvexMutation(api.substitutions.mutations.acceptSubstitution);
const rejectSubstitutionMutation = useConvexMutation(api.substitutions.mutations.rejectSubstitution);

const handleMarkAllAsRead = async () => {
  if (!currentUserId.value) return;

  try {
    processing.value = true;
    await markAllAsReadMutation({
      userId: currentUserId.value,
    });
    f7.toast.create({
      text: "Все уведомления отмечены как прочитанные",
      position: "center",
      closeTimeout: 2000,
    }).open();
  } catch (err: any) {
    f7.toast.create({
      text: err.message || "Ошибка при обновлении уведомлений",
      position: "center",
      closeTimeout: 2000,
    }).open();
  } finally {
    processing.value = false;
  }
};

const handleAcceptSubstitution = async (substitutionId: Id<"substitutions">, notificationId: Id<"notifications">) => {
  if (!currentUserId.value) return;

  try {
    processing.value = true;
    await acceptSubstitutionMutation({
      substitutionId,
      userId: currentUserId.value,
    });

    f7.toast.create({
      text: "Замена принята",
      position: "center",
      closeTimeout: 2000,
    }).open();
  } catch (err: any) {
    f7.toast.create({
      text: err.message || "Ошибка при принятии замены",
      position: "center",
      closeTimeout: 2000,
    }).open();
  } finally {
    processing.value = false;
  }
};

const handleRejectSubstitution = async (substitutionId: Id<"substitutions">, notificationId: Id<"notifications">) => {
  if (!currentUserId.value) return;

  f7.dialog.prompt(
    "Причина отклонения (необязательно):",
    "Отклонить замену",
    async (reason: string) => {
      try {
        processing.value = true;
        await rejectSubstitutionMutation({
          substitutionId,
          userId: currentUserId.value!,
          rejectionReason: reason || undefined,
        });

        f7.toast.create({
          text: "Замена отклонена",
          position: "center",
          closeTimeout: 2000,
        }).open();
      } catch (err: any) {
        f7.toast.create({
          text: err.message || "Ошибка при отклонении замены",
          position: "center",
          closeTimeout: 2000,
        }).open();
      } finally {
        processing.value = false;
      }
    }
  );
};
</script>

<style scoped>
.page-content {
  background-color: hsl(var(--background));
}
</style>
