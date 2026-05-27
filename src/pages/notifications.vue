<template>
  <f7-page
    name="notifications"
    class="flex flex-col h-screen bg-background text-foreground"
    :data-page-id="`notifications-${pageId}`"
    data-page-name="notifications"
  >
    <!-- Desktop Header -->
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <Sidebar v-model:activeNavItem="activeNavItem" />

    <div class="flex flex-1 overflow-hidden">
      <!-- Page Content -->
      <div class="flex-1 overflow-y-auto p-3 md:p-4 bg-background pb-16 md:pb-6 transition-all duration-200" :class="contentMargin">
        <div class="max-w-4xl mx-auto">
          <!-- Header -->
          <div class="mb-6">
          <div class="flex items-center justify-between mb-2">
            <h1 class="text-3xl font-bold text-foreground flex items-center gap-3">
              {{ notifications_title() }}
              <span v-if="unreadNotifications.length" class="text-sm px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 font-medium border border-blue-200 dark:border-blue-800">
                {{ unreadNotifications.length }} {{ t_unread }}
              </span>
            </h1>
            <button
              v-if="unreadNotifications.length > 0"
              @click="handleMarkAllAsRead"
              class="w-fit px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium whitespace-nowrap"
            >
              {{ notifications_mark_all_read() }}
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
            <IconTriangleAlert class="w-6 h-6 text-orange-600" />
            <div class="flex-1">
              <h3 class="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                {{ notifications_important() }}
              </h3>
              <div
                v-for="reminder in activeReminders"
                :key="reminder._id"
                class="text-sm text-orange-800 dark:text-orange-200 mb-1"
              >
                <p>{{ reminder.message }}</p>
                <p class="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  {{ notifications_deadline() }} {{ formatHumanDate(reminder.deadline) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-12">
          <f7-preloader />
          <p class="text-muted-foreground mt-4">{{ notifications_loading() }}</p>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="notifications.length === 0"
          class="text-center py-12 bg-card rounded-lg border border-border"
        >
          <IconBellOff class="w-16 h-16 text-muted-foreground mb-4" />
          <h3 class="text-xl font-semibold text-foreground mb-2">{{ notifications_empty() }}</h3>
          <p class="text-muted-foreground">{{ notifications_empty_desc() }}</p>
        </div>

                <!-- Notifications List -->
        <div v-else class="space-y-6">
          <div v-if="newNotifications.length > 0" class="space-y-3">
            <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">{{ t_new }}</h2>
            <div
              v-for="notification in newNotifications"
              :key="notification._id"
              class="relative bg-card rounded-lg border border-border overflow-hidden transition-all hover:shadow-md ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20"
            >
              <!-- Unread dot -->
              <div class="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>

            <!-- Substitution Notification -->
            <div v-if="notification.type === 'substitution'" class="p-4 pt-5">
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-start gap-3 flex-1">
                  <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                    <IconRefreshCw class="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-foreground mb-1">{{ notification.title }}</h3>
                    <p class="text-sm text-muted-foreground">{{ notification.message }}</p>
                  </div>
                </div>
                <span class="text-xs text-muted-foreground whitespace-nowrap ml-4">
                  {{ formatRelativeTime(notification.createdAt) }}
                </span>
              </div>

              <!-- Substitution Actions -->
              <div
                v-if="isAdmin && notification.substitution && notification.substitution.status === 'pending'"
                class="flex gap-2 mt-3 pt-3 border-t border-border"
              >
                <button
                  @click="handleAcceptSubstitution(notification.substitution._id, notification._id)"
                  :disabled="processing"
                  class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                >
                  {{ notifications_accept() }}
                </button>
                <button
                  @click="handleRejectSubstitution(notification.substitution._id, notification._id)"
                  :disabled="processing"
                  class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 font-medium"
                >
                  {{ notifications_reject() }}
                </button>
              </div>

              <!-- Substitution Status -->
              <div
                v-else-if="notification.substitution"
                class="mt-3 pt-3 border-t border-border flex items-center"
              >
                <span
                  v-if="notification.substitution.status === 'accepted'"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 text-sm font-medium border border-green-200 dark:border-green-800"
                >
                  <IconCircleCheck class="w-4 h-4" />
                  {{ notifications_accepted() }}
                </span>
                <span
                  v-else-if="notification.substitution.status === 'rejected'"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 text-sm font-medium border border-red-200 dark:border-red-800"
                >
                  <IconCircleX class="w-4 h-4" />
                  {{ notifications_rejected() }}
                </span>
                <span
                  v-else-if="notification.substitution.status === 'completed'"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 text-sm font-medium border border-gray-200 dark:border-gray-700"
                >
                  <IconCircleCheck class="w-4 h-4" />
                  {{ notifications_completed() }}
                </span>
              </div>
            </div>

            <!-- Journal Closure Notification -->
            <div v-else-if="notification.type === 'journal_closure'" class="p-4 pt-5">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center flex-shrink-0">
                  <IconCalendarX class="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between mb-1">
                    <h3 class="font-semibold text-orange-600 dark:text-orange-400">{{ notification.title }}</h3>
                    <span class="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {{ formatRelativeTime(notification.createdAt) }}
                    </span>
                  </div>
                  <p class="text-sm text-foreground mb-2">{{ notification.message }}</p>
                  <p
                    v-if="notification.metadata?.deadline"
                    class="text-xs text-muted-foreground"
                  >
                    {{ notifications_deadline() }} {{ formatHumanDate(notification.metadata.deadline) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- System Notification -->
            <div v-else class="p-4 pt-5">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <IconInfo class="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between mb-1">
                    <h3 class="font-semibold text-foreground">{{ notification.title }}</h3>
                    <span class="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {{ formatRelativeTime(notification.createdAt) }}
                    </span>
                  </div>
                  <p class="text-sm text-muted-foreground">{{ notification.message }}</p>
                </div>
              </div>
            </div>
          </div>
          </div>

          <div v-if="earlierNotifications.length > 0" class="space-y-3">
            <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">{{ t_earlier }}</h2>
            <div
              v-for="notification in earlierNotifications"
              :key="notification._id"
              class="relative bg-card rounded-lg border border-border overflow-hidden transition-all hover:shadow-md"
            >

            <!-- Substitution Notification -->
            <div v-if="notification.type === 'substitution'" class="p-4 pt-5">
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-start gap-3 flex-1">
                  <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                    <IconRefreshCw class="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-foreground mb-1">{{ notification.title }}</h3>
                    <p class="text-sm text-muted-foreground">{{ notification.message }}</p>
                  </div>
                </div>
                <span class="text-xs text-muted-foreground whitespace-nowrap ml-4">
                  {{ formatRelativeTime(notification.createdAt) }}
                </span>
              </div>

              <!-- Substitution Actions -->
              <div
                v-if="isAdmin && notification.substitution && notification.substitution.status === 'pending'"
                class="flex gap-2 mt-3 pt-3 border-t border-border"
              >
                <button
                  @click="handleAcceptSubstitution(notification.substitution._id, notification._id)"
                  :disabled="processing"
                  class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                >
                  {{ notifications_accept() }}
                </button>
                <button
                  @click="handleRejectSubstitution(notification.substitution._id, notification._id)"
                  :disabled="processing"
                  class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 font-medium"
                >
                  {{ notifications_reject() }}
                </button>
              </div>

              <!-- Substitution Status -->
              <div
                v-else-if="notification.substitution"
                class="mt-3 pt-3 border-t border-border flex items-center"
              >
                <span
                  v-if="notification.substitution.status === 'accepted'"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 text-sm font-medium border border-green-200 dark:border-green-800"
                >
                  <IconCircleCheck class="w-4 h-4" />
                  {{ notifications_accepted() }}
                </span>
                <span
                  v-else-if="notification.substitution.status === 'rejected'"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 text-sm font-medium border border-red-200 dark:border-red-800"
                >
                  <IconCircleX class="w-4 h-4" />
                  {{ notifications_rejected() }}
                </span>
                <span
                  v-else-if="notification.substitution.status === 'completed'"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 text-sm font-medium border border-gray-200 dark:border-gray-700"
                >
                  <IconCircleCheck class="w-4 h-4" />
                  {{ notifications_completed() }}
                </span>
              </div>
            </div>

            <!-- Journal Closure Notification -->
            <div v-else-if="notification.type === 'journal_closure'" class="p-4 pt-5">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center flex-shrink-0">
                  <IconCalendarX class="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between mb-1">
                    <h3 class="font-semibold text-orange-600 dark:text-orange-400">{{ notification.title }}</h3>
                    <span class="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {{ formatRelativeTime(notification.createdAt) }}
                    </span>
                  </div>
                  <p class="text-sm text-foreground mb-2">{{ notification.message }}</p>
                  <p
                    v-if="notification.metadata?.deadline"
                    class="text-xs text-muted-foreground"
                  >
                    {{ notifications_deadline() }} {{ formatHumanDate(notification.metadata.deadline) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- System Notification -->
            <div v-else class="p-4 pt-5">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <IconInfo class="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between mb-1">
                    <h3 class="font-semibold text-foreground">{{ notification.title }}</h3>
                    <span class="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {{ formatRelativeTime(notification.createdAt) }}
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
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7, f7Page, f7Preloader } from "framework7-vue";
import IconTriangleAlert from "~icons/lucide/triangle-alert";
import IconBellOff from "~icons/lucide/bell-off";
import IconRefreshCw from "~icons/lucide/refresh-cw";
import IconCircleCheck from "~icons/lucide/circle-check";
import IconCircleX from "~icons/lucide/circle-x";
import IconCalendarX from "~icons/lucide/calendar-x";
import IconInfo from "~icons/lucide/info";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import { formatDateTime, formatDate } from '@/utils/dateUtils';
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ru";
import "dayjs/locale/kk";
dayjs.extend(relativeTime);
import { useConvexQuery, useConvexMutation } from 'convex-vue';
import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import { useUserStore } from '@/stores/userStore';
import { useSidebar } from "@/composables/useSidebar";
import {
  notifications_title,
  notifications_mark_all_read,
  notifications_important,
  notifications_deadline,
  notifications_loading,
  notifications_empty,
  notifications_empty_desc,
  notifications_accept,
  notifications_reject,
  notifications_accepted,
  notifications_rejected,
  notifications_completed,
  notifications_marked_read,
  notifications_update_error,
  notifications_substitution_accepted,
  notifications_substitution_accept_error,
  notifications_substitution_rejected,
  notifications_substitution_reject_error,
  notifications_reject_reason,
  notifications_reject_title,
} from "@/paraglide/messages";
import { useI18n } from "@/composables/useI18n";

const { locale } = useI18n();
const { contentMargin } = useSidebar();
const userStore = useUserStore();

const t_new = computed(() => locale.value === 'kk' ? 'Жаңа' : locale.value === 'en' ? 'New' : 'Новые');
const t_earlier = computed(() => locale.value === 'kk' ? 'Бұрынғы' : locale.value === 'en' ? 'Earlier' : 'Ранее');
const t_unread = computed(() => locale.value === 'kk' ? 'оқылмаған' : locale.value === 'en' ? 'unread' : 'непрочитанных');

const formatRelativeTime = (timestamp: number) => {
  return dayjs(timestamp).locale(locale.value).fromNow();
};

const formatHumanDate = (dateString: string | number) => {
  return dayjs(dateString).locale(locale.value).format("D MMMM YYYY");
};
const processing = ref(false);
const pageId = ref(Date.now());
const activeNavItem = ref("notifications");

const currentUserId = computed(() => userStore.currentUser?.id as Id<"users"> | undefined);
const isAdmin = computed(() => userStore.isAdmin);

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

const newNotifications = computed(() => notifications.value.filter((n: any) => n.status === 'unread'));
const earlierNotifications = computed(() => notifications.value.filter((n: any) => n.status !== 'unread'));

// Mutations
const markAllAsReadMutation = useConvexMutation(api.notifications.mutations.markAllAsRead);
const acceptSubstitutionMutation = useConvexMutation(api.substitutions.mutations.acceptSubstitution);
const rejectSubstitutionMutation = useConvexMutation(api.substitutions.mutations.rejectSubstitution);

const handleMarkAllAsRead = async () => {
  if (!currentUserId.value) return;

  try {
    processing.value = true;
    await markAllAsReadMutation.mutate({
      userId: currentUserId.value,
    });
    f7.toast.create({
      text: notifications_marked_read(),
      position: "center",
      closeTimeout: 2000,
    }).open();
  } catch (err: any) {
    f7.toast.create({
      text: err.message || notifications_update_error(),
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
    await acceptSubstitutionMutation.mutate({
      substitutionId,
      userId: currentUserId.value,
    });

    f7.toast.create({
      text: notifications_substitution_accepted(),
      position: "center",
      closeTimeout: 2000,
    }).open();
  } catch (err: any) {
    f7.toast.create({
      text: err.message || notifications_substitution_accept_error(),
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
    notifications_reject_reason(),
    notifications_reject_title(),
    async (reason: string) => {
      try {
        processing.value = true;
        await rejectSubstitutionMutation.mutate({
          substitutionId,
          userId: currentUserId.value!,
          rejectionReason: reason || undefined,
        });

        f7.toast.create({
          text: notifications_substitution_rejected(),
          position: "center",
          closeTimeout: 2000,
        }).open();
      } catch (err: any) {
        f7.toast.create({
          text: err.message || notifications_substitution_reject_error(),
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
