<template>
  <div class="bg-card rounded-[32px] p-8 shadow-sm border border-border">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div class="flex items-center gap-3">
        <div class="bg-orange-100 text-orange-600 p-2 rounded-xl">
          <IconMegaphone class="text-xl w-5 h-5" />
        </div>
        <h3 class="text-lg font-bold text-foreground">Объявления и новости</h3>
        <button
          @click="isAddModalOpen = true"
          class="ml-2 flex-none w-8 h-8 flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all active:scale-95"
          title="Создать объявление"
        >
          <IconPlus class="w-4 h-4" />
        </button>
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
      <template v-if="filteredItems.length > 0">
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
        {{ m.home_announcements_empty() }}
      </div>
    </div>

    <AddAnnouncementModal
      v-model:opened="isAddModalOpen"
      @add="handleAddAnnouncement"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import IconMegaphone from "~icons/lucide/megaphone";
import IconPlus from "~icons/lucide/plus";
import AddAnnouncementModal from "@/components/Home/AddAnnouncementModal.vue";
import * as m from "@/paraglide/messages";

const activeFilter = ref("all");
const isAddModalOpen = ref(false);

const filters = computed(() => [
  { id: "all", label: m.home_announcements_filter_all() },
  { id: "academic", label: m.home_announcements_filter_academic() },
  { id: "contests", label: m.home_announcements_filter_contests() },
  { id: "events", label: m.home_announcements_filter_events() },
  { id: "system", label: m.home_announcements_filter_system() },
]);

// TODO: replace with real data from notificationStore or a dedicated announcements API
interface AnnouncementItem {
  id: number;
  title: string;
  description: string;
  date: string;
  category: string;
  badge: string;
  badgeClass: string;
}

const items = ref<AnnouncementItem[]>([
  {
    id: 1,
    title: "Заседание кафедры",
    date: "5 марта, 15:00",
    category: "academic",
    badge: "Инфо",
    badgeClass: "bg-blue-50 text-blue-600",
    description: "Обсуждение плана на 2 семестр. Явка обязательна.",
  },
  {
    id: 2,
    title: "Срок сдачи ведомостей",
    date: "до 10 марта",
    category: "academic",
    badge: "Важно",
    badgeClass: "bg-red-50 text-red-600",
    description: "Необходимо закрыть все электронные журналы до конца недели.",
  },
  {
    id: 3,
    title: "Обновление системы",
    date: "11 марта",
    category: "system",
    badge: "Система",
    badgeClass: "bg-muted text-muted-foreground border border-border",
    description: "Плановые технические работы с 22:00 до 00:00.",
  },
  {
    id: 4,
    title: "Конкурс «Лучший куратор»",
    date: "Заявки до 20.03",
    category: "contests",
    badge: "Конкурс",
    badgeClass: "bg-yellow-50 text-yellow-600",
    description: "Открыт приём заявок на ежегодный конкурс.",
  },
  {
    id: 5,
    title: "Весенний концерт",
    date: "22 марта",
    category: "events",
    badge: "Мероприятие",
    badgeClass: "bg-purple-50 text-purple-600",
    description: "Праздничное мероприятие в актовом зале в 17:00.",
  },
]);

const filteredItems = computed(() =>
  activeFilter.value === "all"
    ? items.value
    : items.value.filter((i) => i.category === activeFilter.value)
);

const handleAddAnnouncement = (newAnnouncement: any) => {
  const badgeClass =
    newAnnouncement.type === "alert"
      ? "bg-red-50 text-red-600"
      : newAnnouncement.type === "system"
      ? "bg-muted text-muted-foreground border border-border"
      : newAnnouncement.category === "contests"
      ? "bg-yellow-50 text-yellow-600"
      : newAnnouncement.category === "events"
      ? "bg-purple-50 text-purple-600"
      : "bg-blue-50 text-blue-600";

  items.value.unshift({
    ...newAnnouncement,
    badge:
      newAnnouncement.type === "alert"
        ? "Важно"
        : newAnnouncement.type === "system"
        ? "Система"
        : "Инфо",
    badgeClass,
  });
};
</script>
