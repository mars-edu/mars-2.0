import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { withLoading } from "@/utils/storeAction";

export type NotificationType = "substitution" | "journal_closure" | "system";
export type NotificationStatus = "unread" | "read" | "archived";

export interface Notification {
  _id: Id<"notifications">;
  userId: Id<"users">;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  message: string;
  metadata?: {
    substitutionId?: Id<"substitutions">;
    journalId?: Id<"journals">;
    deadline?: string;
  };
  createdAt: number;
  readAt?: number;
}

export interface Substitution {
  _id: Id<"substitutions">;
  journalId: Id<"journals">;
  fromTeacherId: string;
  toTeacherId: string;
  toUserId: Id<"users">;
  startDate: string;
  endDate: string;
  status: "pending" | "accepted" | "rejected" | "completed";
  reason?: string;
  serviceLetterNumber?: string;
  journalSnapshot?: {
    disciplineName: string;
    groupName?: string;
    course?: string;
    semester?: string;
  };
  createdBy: Id<"users">;
  acceptedAt?: number;
  rejectedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export const useNotificationStore = defineStore("notifications", () => {
  const notifications = ref<Notification[]>([]);
  const unreadCount = ref(0);
  const error = ref<string | null>(null);
  const loading = ref(false);

  let lastRequestId = 0;

  /**
   * Load notifications for a user
   */
  const loadNotifications = async (
    userId: Id<"users">,
    options?: { status?: NotificationStatus; limit?: number }
  ) => {
    const requestId = (lastRequestId += 1);

    if (!userId) {
      notifications.value = [];
      return;
    }

    return await withLoading(loading, error, async () => {
      const data = await convex.query(
              api.notifications.queries.getUserNotifications,
              {
                userId,
                status: options?.status,
                limit: options?.limit,
              }
            );

            if (requestId !== lastRequestId) return;

            notifications.value = (data as Notification[]) ?? [];
      }, "Operation failed");
  };

  /**
   * Load unread count for a user
   */
  const loadUnreadCount = async (userId: Id<"users">) => {
    if (!userId) {
      unreadCount.value = 0;
      return;
    }

    try {
      const count = await convex.query(api.notifications.queries.getUnreadCount, {
        userId,
      });

      unreadCount.value = count ?? 0;
    } catch (err) {
      console.error("[notificationStore] Failed to load unread count:", err);
      unreadCount.value = 0;
    }
  };

  /**
   * Mark a notification as read
   */
  const markAsRead = async (notificationId: Id<"notifications">) => {
    try {
      await convex.mutation(api.notifications.mutations.markAsRead, {
        notificationId,
      });

      // Update local state
      const notification = notifications.value.find((n) => n._id === notificationId);
      if (notification) {
        notification.status = "read";
        notification.readAt = Date.now();
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }
    } catch (err) {
      console.error("[notificationStore] Failed to mark notification as read:", err);
      throw err;
    }
  };

  /**
   * Mark all notifications as read for a user
   */
  const markAllAsRead = async (userId: Id<"users">) => {
    try {
      const result = await convex.mutation(
        api.notifications.mutations.markAllAsRead,
        {
          userId,
        }
      );

      // Update local state
      notifications.value.forEach((n) => {
        if (n.status === "unread") {
          n.status = "read";
          n.readAt = Date.now();
        }
      });
      unreadCount.value = 0;

      return result;
    } catch (err) {
      console.error("[notificationStore] Failed to mark all as read:", err);
      throw err;
    }
  };

  /**
   * Accept a substitution
   */
  const acceptSubstitution = async (
    substitutionId: Id<"substitutions">,
    userId: Id<"users">
  ) => {
    try {
      const result = await convex.mutation(
        api.substitutions.mutations.acceptSubstitution,
        {
          substitutionId,
          userId,
        }
      );

      return result;
    } catch (err) {
      console.error("[notificationStore] Failed to accept substitution:", err);
      throw err;
    }
  };

  /**
   * Reject a substitution
   */
  const rejectSubstitution = async (
    substitutionId: Id<"substitutions">,
    userId: Id<"users">,
    rejectionReason?: string
  ) => {
    try {
      const result = await convex.mutation(
        api.substitutions.mutations.rejectSubstitution,
        {
          substitutionId,
          userId,
          rejectionReason,
        }
      );

      return result;
    } catch (err) {
      console.error("[notificationStore] Failed to reject substitution:", err);
      throw err;
    }
  };

  /**
   * Get unread notifications
   */
  const unreadNotifications = computed(() => {
    return notifications.value.filter((n) => n.status === "unread");
  });

  /**
   * Get substitution notifications
   */
  const substitutionNotifications = computed(() => {
    return notifications.value.filter((n) => n.type === "substitution");
  });

  /**
   * Get journal closure notifications
   */
  const journalClosureNotifications = computed(() => {
    return notifications.value.filter((n) => n.type === "journal_closure");
  });

  /**
   * Reset store
   */
  const reset = () => {
    notifications.value = [];
    unreadCount.value = 0;
    error.value = null;
    loading.value = false;
    lastRequestId = 0;
  };

  return {
    notifications,
    unreadCount,
    error,
    loading,
    loadNotifications,
    loadUnreadCount,
    markAsRead,
    markAllAsRead,
    acceptSubstitution,
    rejectSubstitution,
    unreadNotifications,
    substitutionNotifications,
    journalClosureNotifications,
    reset,
  };
});
