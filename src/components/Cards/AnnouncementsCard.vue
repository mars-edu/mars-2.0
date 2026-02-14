<template>
  <Card title="Объявления">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h2 class="text-lg font-semibold text-foreground">Объявления</h2>
        <a href="#" class="text-sm font-medium text-red-500 hover:text-red-600">
          подробнее
        </a>
      </div>
    </template>

    <div class="space-y-4">
      <div
        v-for="(announcement, index) in announcements"
        :key="index"
        class="group p-4 rounded-lg transition-colors cursor-pointer bg-muted hover:bg-muted/80"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center bg-destructive/10"
              >
                <i class="text-red-500" :class="announcement.icon"></i>
              </div>
            </div>
            <div>
              <h3 class="text-sm font-medium text-foreground">
                {{ announcement.title }}
              </h3>
              <p class="text-sm text-muted-foreground">
                {{ announcement.date }}
              </p>
            </div>
          </div>
          <i class="f7:chevron_right text-muted-foreground group-hover:text-foreground"></i>
        </div>
        <p class="mt-2 text-sm text-muted-foreground">
          {{ announcement.description }}
        </p>
        <div class="mt-3 flex items-center space-x-2">
          <span
            v-if="announcement.category"
            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border border-border"
          >
            {{ announcement.category }}
          </span>
          <span class="text-xs text-muted-foreground">
            {{ announcement.timeAgo }}
          </span>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Card from "@/components/ui/Card.vue";

interface Props {
  /** @deprecated Theme is now handled by CSS custom properties. */
  theme?: "white" | "dark" | "lavanda";
}

withDefaults(defineProps<Props>(), {
  theme: "white",
});

interface Announcement {
  title: string;
  description: string;
  date: string;
  timeAgo: string;
  category?: string;
  icon: string;
}

const announcements = ref<Announcement[]>([
  {
    title: "Технические работы",
    description: "Плановые технические работы в системе",
    date: "13 января 2025",
    timeAgo: "2 дня назад",
    category: "Система",
    icon: "f7:gear",
  },
]);
</script>
