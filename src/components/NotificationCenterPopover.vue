<template>
  <GuardedPopover
    id="notification-center-popover"
    class="notification-popover"
    @popover:open="refresh"
  >
    <div class="bg-card text-card-foreground overflow-hidden flex flex-col" style="width: 440px; max-width: calc(100vw - 32px); max-height: 600px;">
      <!-- Header -->
      <div class="p-6 border-b border-border flex items-center justify-between bg-muted/30">
        <div>
          <h3 class="text-lg font-bold leading-none mb-1">Уведомления</h3>
          <p v-if="unreadCount > 0" class="text-xs text-muted-foreground font-medium">
            {{ unreadCount }} новых сообщений
          </p>
        </div>
        <button
          v-if="notifications.filter(n => n.status === 'unread').length > 0"
          @click="markAllAsRead"
          :disabled="processing"
          class="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
          title="Отметить все как прочитанные"
        >
          <IconCheckCheck class="w-5 h-5" />
        </button>
      </div>

      <!-- Content -->
      <div class="overflow-y-auto flex-1 custom-scrollbar" style="max-height: 450px;">
        <div v-if="loading" class="p-12 text-center">
          <div class="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
          <p class="text-sm text-muted-foreground">Загрузка...</p>
        </div>

        <div
          v-else-if="notifications.length === 0"
          class="p-12 text-center"
        >
          <div class="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <IconBellOff class="w-8 h-8 text-muted-foreground/50" />
          </div>
          <p class="text-sm font-medium text-muted-foreground">Нет уведомлений</p>
        </div>

        <div v-else class="divide-y divide-border/50">
          <div
            v-for="notification in notifications"
            :key="notification._id"
            class="group p-4 hover:bg-muted/50 transition-all cursor-pointer relative"
            :class="{
              'bg-primary/5': notification.status === 'unread',
            }"
            @click="markAsRead(notification._id)"
          >
            <!-- Unread Indicator Dot -->
            <div 
              v-if="notification.status === 'unread'"
              class="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full"
            ></div>

            <div class="flex gap-4">
              <!-- Icon Column -->
              <div class="flex-shrink-0">
                <div 
                  class="w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                  :class="getTypeStyles(notification).bg"
                >
                  <component :is="getTypeStyles(notification).icon" class="w-5 h-5" :class="getTypeStyles(notification).text" />
                </div>
              </div>

              <!-- Content Column -->
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start mb-1 gap-2">
                  <h4 class="text-sm font-bold truncate group-hover:text-primary transition-colors">
                    {{ notification.title }}
                  </h4>
                  <span class="text-[10px] font-semibold text-muted-foreground whitespace-nowrap uppercase tracking-wider">
                    {{ formatDateTime(notification.createdAt) }}
                  </span>
                </div>

                <p class="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                  {{ notification.message }}
                </p>

                <!-- Actions for Substitutions -->
                <div
                  v-if="notification.type === 'substitution' && notification.substitution && notification.substitution.status === 'pending'"
                  class="flex gap-2"
                  @click.stop
                >
                  <button
                    @click="acceptSubstitution(notification.substitution._id, notification._id)"
                    class="flex-1 py-2 px-3 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
                  >
                    Принять
                  </button>
                  <button
                    @click="rejectSubstitution(notification.substitution._id, notification._id)"
                    class="py-2 px-3 bg-muted text-foreground text-xs font-bold rounded-xl hover:bg-border transition-all active:scale-95 border border-border"
                  >
                    Отклонить
                  </button>
                </div>

                <div
                  v-else-if="notification.type === 'substitution' && notification.substitution && notification.substitution.status === 'accepted'"
                  class="flex items-center gap-1.5 text-[10px] font-bold text-green-600 uppercase tracking-wide"
                >
                  <IconCheck class="w-3.5 h-3.5" />
                  Принято
                </div>

                <!-- Deadline for Journal Closures -->
                <div
                  v-if="notification.type === 'journal_closure' && notification.metadata?.deadline"
                  class="flex items-center gap-1.5 text-[10px] font-bold text-orange-600 uppercase tracking-wide bg-orange-50 dark:bg-orange-950/30 px-2 py-1 rounded-lg w-fit"
                >
                  <IconClock class="w-3 h-3" />
                  До {{ formatDate(notification.metadata.deadline) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Active reminders section -->
      <div
        v-if="activeReminders.length > 0"
        class="p-4 bg-orange-50 dark:bg-orange-900/10 border-t border-orange-100 dark:border-orange-900/20"
      >
        <div class="flex items-center gap-2 mb-2 text-orange-600">
          <IconAlertTriangle class="w-4 h-4" />
          <h4 class="text-xs font-bold uppercase tracking-wider">Важное объявление</h4>
        </div>
        <div class="space-y-2">
          <div
            v-for="reminder in activeReminders"
            :key="reminder._id"
            class="text-xs font-medium leading-relaxed"
          >
            {{ reminder.message }}
          </div>
        </div>
      </div>

      <!-- Footer Action -->
      <div class="p-4 border-t border-border bg-muted/30">
        <button
          @click="openNotificationsTab"
          class="w-full py-2.5 px-4 bg-secondary text-secondary-foreground text-xs font-bold rounded-2xl hover:bg-secondary/80 transition-all flex items-center justify-center gap-2 group"
        >
          Все уведомления
          <IconArrowRight class="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  </GuardedPopover>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7 } from "framework7-vue";
import { formatDateTime, formatDate } from '@/utils/dateUtils';
import { useConvexQuery, useConvexMutation } from 'convex-vue';
import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import { useUserStore } from '@/stores/userStore';
import GuardedPopover from "@/components/ui/GuardedPopover.vue";

// Icons
import IconUsers from "~icons/lucide/users";
import IconAlertTriangle from "~icons/lucide/alert-triangle";
import IconInfo from "~icons/lucide/info";
import IconCheckCheck from "~icons/lucide/check-check";
import IconBellOff from "~icons/lucide/bell-off";
import IconCheck from "~icons/lucide/check";
import IconClock from "~icons/lucide/clock";
import IconArrowRight from "~icons/lucide/arrow-right";

const userStore = useUserStore();

const currentUserId = computed(() => userStore.currentUser?.id as Id<"users"> | undefined);

const processing = ref(false);

// Convex Reactive Queries
const notificationsResult = useConvexQuery(
  api.notifications.queries.getUserNotifications,
  computed(() => currentUserId.value ? {
    userId: currentUserId.value,
    limit: 50,
  } : "skip")
) as any;

const activeRemindersResult = useConvexQuery(
  api.notifications.queries.getActiveJournalClosureReminders,
  computed(() => ({}))
) as any;

// Computed values
const notifications = computed(() => notificationsResult.data.value ?? []);
const activeReminders = computed(() => activeRemindersResult.data.value ?? []);
const loading = computed(() => notificationsResult.isPending.value);
const unreadCount = computed(() => notifications.value.filter(n => n.status === 'unread').length);

// Mutations
const markAsReadMutation = useConvexMutation(api.notifications.mutations.markAsRead);
const markAllAsReadMutation = useConvexMutation(api.notifications.mutations.markAllAsRead);
const acceptSubstitutionMutation = useConvexMutation(api.substitutions.mutations.acceptSubstitution);
const rejectSubstitutionMutation = useConvexMutation(api.substitutions.mutations.rejectSubstitution);

const refresh = () => {
  // Convex queries are reactive
};

const getTypeStyles = (notification: any) => {
  switch (notification.type) {
    case 'substitution':
      return {
        icon: IconUsers,
        bg: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
        text: 'text-indigo-600 dark:text-indigo-400'
      };
    case 'journal_closure':
      return {
        icon: IconAlertTriangle,
        bg: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
        text: 'text-orange-600 dark:text-orange-400'
      };
    default:
      return {
        icon: IconInfo,
        bg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        text: 'text-blue-600 dark:text-blue-400'
      };
  }
};

const markAsRead = async (notificationId: Id<"notifications">) => {
  if (!currentUserId.value) return;
  const notification = notifications.value.find(n => n._id === notificationId);
  if (!notification || notification.status === 'read') return;

  try {
    await markAsReadMutation.mutate({ notificationId });
  } catch (err) {
    console.error("Failed to mark notification as read:", err);
  }
};

const markAllAsRead = async () => {
  if (!currentUserId.value) return;

  try {
    processing.value = true;
    await markAllAsReadMutation.mutate({
      userId: currentUserId.value,
    });
    f7.toast.create({
      text: "Все уведомления прочитаны",
      position: "center",
      closeTimeout: 2000,
    }).open();
  } catch (err: any) {
    f7.toast.create({
      text: err.message || "Ошибка",
      position: "center",
      closeTimeout: 2000,
    }).open();
  } finally {
    processing.value = false;
  }
};

const acceptSubstitution = async (substitutionId: Id<"substitutions">, notificationId: Id<"notifications">) => {
  if (!currentUserId.value) return;

  try {
    processing.value = true;
    await acceptSubstitutionMutation.mutate({
      substitutionId,
      userId: currentUserId.value,
    });
    await markAsRead(notificationId);
    f7.toast.create({
      text: "Замена принята",
      position: "center",
      closeTimeout: 2000,
    }).open();
  } catch (err: any) {
    f7.toast.create({
      text: err.message || "Ошибка",
      position: "center",
      closeTimeout: 2000,
    }).open();
  } finally {
    processing.value = false;
  }
};

const rejectSubstitution = async (substitutionId: Id<"substitutions">, notificationId: Id<"notifications">) => {
  if (!currentUserId.value) return;

  f7.dialog.prompt(
    "Причина отклонения:",
    "Отклонить замену",
    async (reason: string) => {
      try {
        processing.value = true;
        await rejectSubstitutionMutation.mutate({
          substitutionId,
          userId: currentUserId.value!,
          rejectionReason: reason || undefined,
        });
        await markAsRead(notificationId);
        f7.toast.create({
          text: "Замена отклонена",
          position: "center",
          closeTimeout: 2000,
        }).open();
      } catch (err: any) {
        f7.toast.create({
          text: err.message || "Ошибка",
          position: "center",
          closeTimeout: 2000,
        }).open();
      } finally {
        processing.value = false;
      }
    }
  );
};

const openNotificationsTab = () => {
  f7.popover.close("#notification-center-popover");
  f7.views.main.router.navigate("/notifications/");
};
</script>

<style scoped>
.notification-popover {
  width: 440px !important;
  max-width: calc(100vw - 32px) !important;
  border-radius: 32px !important;
  overflow: hidden;
}

:deep(.popover-inner) {
  padding: 0 !important;
  border-radius: 32px !important;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: hsl(var(--border));
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.3);
}
</style>

