<template>
  <div class="bg-card rounded-[32px] p-6 md:p-8 shadow-sm border border-border">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 md:mb-6 gap-4">
      <div class="flex items-center gap-3">
        <div class="bg-orange-500/15 text-orange-600 p-2 rounded-xl">
          <IconMegaphone class="text-xl w-5 h-5" />
        </div>
        <h3 class="text-lg font-bold text-foreground">{{ home_announcements_title() }}</h3>
        <div class="flex items-center gap-1.5 ml-2">
          <button
            v-if="canManageAnnouncements"
            @click="isAddModalOpen = true"
            class="flex-none w-8 h-8 flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all active:scale-95"
            :title="home_announcements_create_tooltip()"
          >
            <IconPlus class="w-4 h-4" />
          </button>
          <button
            v-if="canManageAnnouncements"
            @click="isSettingsModalOpen = true"
            class="flex-none w-8 h-8 flex items-center justify-center bg-muted hover:bg-muted/80 text-muted-foreground rounded-xl transition-all active:scale-95 border border-border/50"
            title="Настройки"
          >
            <IconSettings class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="flex p-1 bg-muted rounded-xl overflow-x-auto">
        <button
          v-for="filter in filters"
          :key="filter.id"
          class="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
          :class="
            activeFilter === filter.id
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          "
          @click="activeFilter = filter.id"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <!-- Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-if="loading" class="col-span-full text-center py-8 text-muted-foreground text-sm">
        Загрузка...
      </div>
      <template v-else-if="filteredItems.length > 0">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="p-5 rounded-3xl border border-border bg-muted hover:bg-card hover:shadow-md transition-all cursor-default group"
        >
          <div class="flex justify-between items-start mb-3">
            <span
              class="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide"
              :class="item.badgeClass"
            >
              {{ item.badge }}
            </span>
            <span class="text-xs text-muted-foreground font-medium">{{ item.date }}</span>
          </div>
          <h4
            class="text-sm font-bold text-foreground mb-2 leading-tight group-hover:text-primary transition-colors"
          >
            {{ item.title }}
          </h4>
          <p class="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {{ item.description }}
          </p>
        </div>
      </template>
      <div v-else class="col-span-full text-center py-8 text-muted-foreground text-sm">
        {{ home_announcements_empty() }}
      </div>
    </div>

    <AddAnnouncementModal
      v-model:opened="isAddModalOpen"
      :categories="customCategories"
      @add="handleAddAnnouncement"
    />

    <AnnouncementSettingsModal
      v-model:opened="isSettingsModalOpen"
      :initial-categories="customCategories"
      @save="handleSaveCategories"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { storeToRefs } from "pinia";
import { f7 } from "framework7-vue";
import IconMegaphone from "~icons/lucide/megaphone";
import IconPlus from "~icons/lucide/plus";
import IconSettings from "~icons/lucide/settings";
import AddAnnouncementModal from "@/components/Home/AddAnnouncementModal.vue";
import AnnouncementSettingsModal from "@/components/Home/AnnouncementSettingsModal.vue";
import {
  home_announcements_title,
  home_announcements_create_tooltip,
  home_announcements_empty,
} from "@/paraglide/messages";
import { useI18n } from "@/composables/useI18n";
import { getAnnouncementFilters, getAnnouncementTypes } from "@/utils/homeUtils";
import { useUserStore } from "@/stores/userStore";
import { useAnnouncementStore } from "@/stores/announcementStore";
import type { AnnouncementCardItem, AnnouncementCategory } from "@/types/announcement";

const { locale } = useI18n();
const userStore = useUserStore();
const announcementStore = useAnnouncementStore();
const { categories, announcements, loading } = storeToRefs(announcementStore);
const activeFilter = ref("all");
const isAddModalOpen = ref(false);
const isSettingsModalOpen = ref(false);

const staticFilters = computed(() => getAnnouncementFilters(locale.value));
const typeLabels = computed(() => getAnnouncementTypes(locale.value));
const canManageAnnouncements = computed(() => userStore.isAdmin);

const defaultCategories = computed(() =>
  staticFilters.value
    .filter((filter) => filter.id !== "all")
    .map((filter, index) => ({
      id: filter.id,
      label: filter.label,
      labels: { [locale.value]: filter.label },
      position: index,
    }))
);

const customCategories = computed(() => {
  const backendCategories = categories.value;
  return backendCategories.length > 0 ? backendCategories : defaultCategories.value;
});

const filters = computed(() => {
  const allFilter = staticFilters.value.find(f => f.id === 'all') || { id: "all", label: "Все" };
  return [allFilter, ...customCategories.value.map(c => ({ id: c.id, label: getLocalizedValue(c.labels) || c.label || c.id }))];
});

const getLocalizedValue = (values: Record<string, string | undefined> | undefined) => {
  if (!values) return "";
  return values[locale.value] || values.ru || values.kk || values.en || "";
};

const getBadge = (type: string) => {
  return typeLabels.value.find((item) => item.id === type)?.label || typeLabels.value[0]?.label || "Инфо";
};

const getBadgeClass = (type: string, category: string) => {
  return type === "alert"
      ? "bg-red-500/10 text-red-600 dark:text-red-400"
      : type === "system"
      ? "bg-muted text-muted-foreground border border-border"
      : category === "contests"
      ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
      : category === "events"
      ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
      : "bg-blue-500/10 text-blue-600 dark:text-blue-400";
};

const filteredItems = computed<AnnouncementCardItem[]>(() =>
  announcements.value.map((item: any) => ({
    id: item._id,
    title: getLocalizedValue(item.titles),
    description: getLocalizedValue(item.descriptions),
    date: item.displayDate,
    category: item.category,
    badge: getBadge(item.type),
    badgeClass: getBadgeClass(item.type, item.category),
  }))
);

watch(customCategories, (categories) => {
  if (
    activeFilter.value !== "all" &&
    !categories.some((category) => category.id === activeFilter.value)
  ) {
    activeFilter.value = "all";
  }
});

watch(
  activeFilter,
  (category) => {
    announcementStore.setActiveCategory(category);
  },
  { immediate: true }
);

const showToast = (text: string, cssClass?: string) => {
  f7.toast.create({ text, closeTimeout: 2500, cssClass }).open();
};

const handleSaveCategories = async (newCategories: AnnouncementCategory[]) => {
  try {
    await announcementStore.saveCategories(newCategories);
    showToast("Категории сохранены", "color-green");
  } catch (error) {
    console.error("[AnnouncementsCard] Failed to save categories:", error);
    showToast("Не удалось сохранить категории", "color-red");
  }
};

const handleAddAnnouncement = async (newAnnouncement: any) => {
  try {
    await announcementStore.createAnnouncement({
      kind: "announcement",
      category: newAnnouncement.category,
      type: newAnnouncement.type,
      titles: newAnnouncement.titles,
      descriptions: newAnnouncement.descriptions,
      displayDate:
        newAnnouncement.date ||
        new Date().toLocaleDateString(locale.value, { day: "numeric", month: "long" }),
      isPublished: true,
    });
    showToast("Объявление опубликовано", "color-green");
  } catch (error) {
    console.error("[AnnouncementsCard] Failed to create announcement:", error);
    showToast("Не удалось опубликовать объявление", "color-red");
  }
};
</script>
