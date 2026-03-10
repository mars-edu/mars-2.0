<template>
  <div class="bg-card rounded-3xl p-8 shadow-sm border border-border flex flex-col">
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-lg font-bold text-foreground">Последняя активность</h3>
      <button
        class="text-primary text-sm font-medium hover:opacity-70 transition-opacity"
        @click="navigateToProtocol"
      >
        Показать все
      </button>
    </div>

    <div class="space-y-5">
      <div
        v-for="item in activityItems"
        :key="item.id"
        class="flex gap-4 group cursor-default"
      >
        <div class="mt-0.5 flex-shrink-0">
          <div
            class="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors"
          >
            <component :is="item.icon" class="text-base" />
          </div>
        </div>
        <div class="border-b border-border pb-5 w-full last:border-0 last:pb-0">
          <div class="flex justify-between mb-1">
            <span class="text-sm font-bold text-foreground">{{ item.title }}</span>
            <span class="text-xs text-muted-foreground">{{ item.time }}</span>
          </div>
          <p class="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {{ item.description }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { f7 } from "framework7-vue";
import IconFileText from "~icons/lucide/file-text";
import IconRefreshCw from "~icons/lucide/refresh-cw";
import IconBell from "~icons/lucide/bell";

const navigateToProtocol = () => {
  f7.views.main.router.navigate("/protocol");
};

// TODO: replace with real activity data from protocolStore or journalHistoryStore
const activityItems = [
  {
    id: 1,
    icon: IconFileText,
    title: "Журнал закрыт",
    time: "14:30",
    description: "Журнал по дисциплине «Философия» для группы 3 РЭХТ закрыт.",
  },
  {
    id: 2,
    icon: IconRefreshCw,
    title: "Назначена пересдача",
    time: "11:15",
    description: "Пересдача экзамена назначена в журнале по дисциплине «История Казахстана».",
  },
  {
    id: 3,
    icon: IconBell,
    title: "Новое объявление",
    time: "09:00",
    description: "Опубликовано объявление: «Заседание кафедры — 5 января, 15:00».",
  },
];
</script>
