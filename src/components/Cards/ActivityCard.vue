<template>
  <div class="bg-card rounded-[32px] p-6 md:p-8 shadow-sm border border-border flex flex-col">
    <div class="grid grid-cols-[1fr_auto] items-center mb-6 md:mb-8">
      <div class="text-xl font-bold text-foreground leading-[1.1]">
        {{ home_activity_title() }}
      </div>
      <button
        class="text-primary text-sm font-semibold hover:opacity-70 transition-opacity whitespace-nowrap"
        @click="navigateToProtocol"
      >
        {{ home_activity_show_all() }}
      </button>
    </div>

    <div class="space-y-6">
      <template v-for="(item, index) in activityItems" :key="item.id">
        <div class="flex gap-4 group cursor-default">
          <div class="mt-0.5 flex-shrink-0">
            <div
              class="w-10 h-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-primary/60 group-hover:bg-primary/10 group-hover:text-primary transition-colors"
            >
              <IconFileText class="text-base" />
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-start mb-1">
              <div class="flex flex-wrap items-center gap-x-2 pr-2">
                <span class="text-sm font-bold text-foreground">{{ item.title }}</span>
                <span v-if="item.label" class="text-sm font-bold text-foreground">({{ item.label }})</span>
              </div>
              <span class="text-xs text-muted-foreground flex-shrink-0 mt-0.5">{{ item.time }}</span>
            </div>
            <p class="text-sm text-muted-foreground leading-relaxed">
              {{ item.description }}
            </p>
          </div>
        </div>
        <div v-if="index < activityItems.length - 1" class="h-px bg-border/60 ml-14"></div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { f7 } from "framework7-vue";
import IconFileText from "~icons/lucide/file-text";
import { home_activity_title, home_activity_show_all } from "@/paraglide/messages";

const navigateToProtocol = () => {
  f7.views.main.router.navigate("/protocol");
};

// Mock activity data synchronized with concept
const activityItems = [
  {
    id: 1,
    title: "Назначена пересдача",
    label: "Запрос",
    time: "14:30",
    description: "Преподаватель Килаш Расул Жангелдыулы назначил пересдачу экзамена в журнале БМ4 Владеть основами философских знаний.",
  },
  {
    id: 2,
    title: "Назначена пересдача",
    label: "Запрос",
    time: "14:30",
    description: "Преподаватель Килаш Расул Жангелдыулы назначил пересдачу экзамена в журнале БМ4 Владеть основами философских знаний.",
  },
  {
    id: 3,
    title: "Назначена пересдача",
    label: "Запрос",
    time: "14:30",
    description: "Преподаватель Килаш Расул Жангелдыулы назначил пересдачу экзамена в журнале БМ4 Владеть основами философских знаний.",
  },
];
</script>
