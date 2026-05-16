import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useConvexQuery } from "convex-vue";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useUserStore } from "@/stores/userStore";
import type {
  AnnouncementCategory,
  AnnouncementCreatePayload,
} from "@/types/announcement";

export const useAnnouncementStore = defineStore("announcements", () => {
  const activeCategory = ref<string>("all");
  const limit = ref(20);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const categoriesResult = useConvexQuery(
    api.announcements.queries.listCategories,
    ref({})
  ) as any;

  const announcementsResult = useConvexQuery(
    api.announcements.queries.listActive,
    computed(() => ({
      category: activeCategory.value === "all" ? undefined : activeCategory.value,
      limit: limit.value,
    }))
  ) as any;

  const categories = computed<AnnouncementCategory[]>(() =>
    categoriesResult.data.value ?? []
  );

  const announcements = computed(() => announcementsResult.data.value ?? []);

  const loading = computed(
    () =>
      isLoading.value ||
      categoriesResult.isPending.value ||
      announcementsResult.isPending.value
  );

  const getAuthToken = () => {
    const userStore = useUserStore();
    return userStore.token || localStorage.getItem("auth_token");
  };

  const requireToken = () => {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication token is required");
    }
    return token;
  };

  const setActiveCategory = (category: string) => {
    activeCategory.value = category || "all";
  };

  const saveCategories = async (nextCategories: AnnouncementCategory[]) => {
    isLoading.value = true;
    error.value = null;

    try {
      await convex.action(api.announcements.mutations.saveCategories, {
        token: requireToken(),
        categories: nextCategories.map(({ id, labels }) => ({ id, labels })),
      });
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to save announcement categories";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const createAnnouncement = async (payload: AnnouncementCreatePayload) => {
    isLoading.value = true;
    error.value = null;

    try {
      return await convex.action(api.announcements.mutations.create, {
        token: requireToken(),
        kind: payload.kind ?? "announcement",
        category: payload.category,
        type: payload.type,
        titles: payload.titles,
        descriptions: payload.descriptions,
        displayDate: payload.displayDate,
        publishAt: payload.publishAt,
        expiresAt: payload.expiresAt,
        isPublished: payload.isPublished ?? true,
      });
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to create announcement";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    activeCategory,
    limit,
    categories,
    announcements,
    loading,
    error,
    setActiveCategory,
    saveCategories,
    createAnnouncement,
  };
});
