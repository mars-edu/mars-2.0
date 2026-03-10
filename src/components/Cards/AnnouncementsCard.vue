<template>
  <div class="bg-card rounded-3xl p-8 shadow-sm border border-border">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div class="flex items-center gap-3">
        <div class="bg-orange-100 text-orange-600 p-2 rounded-xl">
          <IconMegaphone class="text-xl w-5 h-5" />
        </div>
        <h3 class="text-lg font-bold text-foreground">Объявления и новости</h3>
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
        Нет объявлений в этой категории
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import IconMegaphone from "~icons/lucide/megaphone";

const activeFilter = ref("all");

const filters = [
  { id: "all", label: "Все" },
  { id: "academic", label: "Учебная часть" },
  { id: "contests", label: "Конкурсы" },
  { id: "events", label: "Мероприятия" },
  { id: "system", label: "Система" },
];

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

const items: AnnouncementItem[] = [
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
];

const filteredItems = computed(() =>
  activeFilter.value === "all"
    ? items
    : items.filter((i) => i.category === activeFilter.value)
);
</script>
