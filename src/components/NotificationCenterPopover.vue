<template>
  <f7-popover
    id="notification-center-popover"
    class="notification-popover"
    @popover:open="refresh"
  >
    <div class="bg-card text-card-foreground" style="width: 700px; max-height: 600px;">
      <!-- Header -->
      <div class="p-4 border-b border-border flex items-center justify-between">
        <h3 class="text-lg font-semibold">Центр уведомлений</h3>
        <div class="flex gap-2">
          <button
            v-if="notifications.filter(n => n.status === 'unread').length > 0"
            @click="markAllAsRead"
            :disabled="processing"
            class="text-xs px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
          >
            Отметить все как прочитанные
          </button>
          <button
            @click="openNotificationsTab"
            class="text-xs px-3 py-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
          >
            Открыть вкладку уведомлений
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="overflow-y-auto" style="max-height: 500px;">
        <div v-if="loading" class="p-4 text-center text-muted-foreground">
          Загрузка...
        </div>

        <div
          v-else-if="notifications.length === 0"
          class="p-4 text-center text-muted-foreground"
        >
          Нет уведомлений
        </div>

        <template v-else>
          <!-- Substitution notifications -->
          <div
            v-for="notification in notifications"
            :key="notification._id"
            class="border-b border-border hover:bg-muted/30 transition-colors"
            :class="{
              'bg-blue-50 dark:bg-blue-950/20': notification.status === 'unread',
            }"
          >
            <!-- Substitution notification -->
            <div
              v-if="notification.type === 'substitution'"
              class="p-4"
            >
              <div class="flex justify-between items-start mb-2">
                <h4 class="font-semibold">{{ notification.title }}</h4>
                <span class="text-xs text-muted-foreground">
                  {{ formatDateTime(notification.createdAt) }}
                </span>
              </div>

              <p class="text-sm text-muted-foreground mb-3">
                {{ notification.message }}
              </p>

              <div
                v-if="notification.substitution && notification.substitution.status === 'pending'"
                class="flex gap-2"
              >
                <button
                  @click="acceptSubstitution(notification.substitution._id, notification._id)"
                  class="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Принять
                </button>
                <button
                  @click="rejectSubstitution(notification.substitution._id, notification._id)"
                  class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200"
                >
                  Принять
                </button>
              </div>

              <div
                v-else-if="notification.substitution && notification.substitution.status === 'accepted'"
                class="text-sm text-green-600 font-medium"
              >
                ✓ Принято
              </div>
            </div>

            <!-- Journal closure notification -->
            <div
              v-else-if="notification.type === 'journal_closure'"
              class="p-4"
            >
              <div class="flex justify-between items-start mb-2">
                <h4 class="font-semibold text-orange-600">{{ notification.title }}</h4>
                <span class="text-xs text-muted-foreground">
                  {{ formatDateTime(notification.createdAt) }}
                </span>
              </div>

              <p class="text-sm mb-2">
                {{ notification.message }}
              </p>

              <div
                v-if="notification.metadata?.deadline"
                class="text-xs text-muted-foreground"
              >
                Крайний срок: {{ formatDate(notification.metadata.deadline) }}
              </div>
            </div>

            <!-- System notification -->
            <div
              v-else
              class="p-4"
            >
              <div class="flex justify-between items-start mb-2">
                <h4 class="font-semibold">{{ notification.title }}</h4>
                <span class="text-xs text-muted-foreground">
                  {{ formatDateTime(notification.createdAt) }}
                </span>
              </div>

              <p class="text-sm text-muted-foreground">
                {{ notification.message }}
              </p>
            </div>
          </div>
        </template>
      </div>

      <!-- Active reminders section -->
      <div
        v-if="activeReminders.length > 0"
        class="border-t border-border bg-orange-50 dark:bg-orange-950/20"
      >
        <div class="p-3">
          <h4 class="font-semibold text-orange-600 mb-2">Внимание объявление</h4>
          <div
            v-for="reminder in activeReminders"
            :key="reminder._id"
            class="text-sm mb-1"
          >
            <p>{{ reminder.message }}</p>
          </div>
        </div>
      </div>
    </div>
  </f7-popover>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7 } from "framework7-vue";
import { formatDateTime, formatDate } from '@/utils/dateUtils';
import { useConvexQuery, useConvexMutation } from 'convex-vue';
import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import { useUserStore } from '@/stores/userStore';

const userStore = useUserStore();

const currentUserId = computed(() => userStore.currentUser?.id as Id<"users"> | undefined);

const processing = ref(false);

// Convex Reactive Queries - automatically sync in real-time!
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

// Computed values from reactive queries
const notifications = computed(() => notificationsResult.data.value ?? []);
const activeReminders = computed(() => activeRemindersResult.data.value ?? []);
const loading = computed(() => notificationsResult.isPending.value);
const error = computed(() => notificationsResult.error.value);

// Mutations
const markAsReadMutation = useConvexMutation(api.notifications.mutations.markAsRead);
const markAllAsReadMutation = useConvexMutation(api.notifications.mutations.markAllAsRead);
const acceptSubstitutionMutation = useConvexMutation(api.substitutions.mutations.acceptSubstitution);
const rejectSubstitutionMutation = useConvexMutation(api.substitutions.mutations.rejectSubstitution);

const refresh = () => {
  // No need to manually refresh - Convex queries are reactive!
  // They automatically update when data changes in the database
};

const markAllAsRead = async () => {
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
    // No need to manually refresh - Convex will auto-update the UI!
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

const acceptSubstitution = async (substitutionId: Id<"substitutions">, notificationId: Id<"notifications">) => {
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

    // UI auto-updates via Convex reactive queries!
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

const rejectSubstitution = async (substitutionId: Id<"substitutions">, notificationId: Id<"notifications">) => {
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

        // UI auto-updates via Convex reactive queries!
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

const openNotificationsTab = () => {
  // Close popover
  f7.popover.close("#notification-center-popover");

  // Navigate to notifications page
  f7.views.main.router.navigate("/notifications/");
};
</script>

<style scoped>
.notification-popover {
  width: 700px !important;
}
</style>
