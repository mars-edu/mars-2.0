<template>
  <div class="bg-card rounded-[32px] p-8 shadow-sm border border-border flex flex-col h-full overflow-hidden">
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-xl font-bold text-foreground truncate mr-4">Последняя активность</h3>
      <button
        class="text-primary text-sm font-medium hover:opacity-70 transition-opacity flex-shrink-0 whitespace-nowrap"
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
            class="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors"
          >
            <IconFileText class="text-base" />
          </div>
        </div>
        <div class="border-b border-border pb-5 flex-1 min-w-0 last:border-0 last:pb-0">
          <div class="flex justify-between mb-1">
            <span class="text-sm font-bold text-foreground truncate pr-2">{{ item.title }}</span>
            <span class="text-xs text-muted-foreground flex-shrink-0">{{ item.time }}</span>
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
import * as m from "@/paraglide/messages";

const navigateToProtocol = () => {
  f7.views.main.router.navigate("/protocol");
};

// Mock activity data synchronized with concept
const activityItems = [
  {
    id: 1,
    title: "Назначена пересдача (Запрос)",
    time: "14:30",
    description: "Преподаватель Килаш Расул Жангелдыулы назначил пересдачу экзамена в журнале БМ4 Владеть основами философских знаний.",
  },
  {
    id: 2,
    title: "Назначена пересдача (Запрос)",
    time: "11:15",
    description: "Преподаватель Килаш Расул Жангелдыулы назначил пересдачу экзамена в журнале БМ4 Владеть основами философских знаний.",
  },
  {
    id: 3,
    title: "Назначена пересдача (Запрос)",
    time: "09:00",
    description: "Преподаватель Килаш Расул Жангелдыулы назначил пересдачу экзамена в журнале БМ4 Владеть основами философских знаний.",
  },
];
</script>
