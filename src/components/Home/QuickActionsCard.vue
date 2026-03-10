<template>
  <div class="flex flex-col gap-4">
    <!-- Report Card -->
    <div
      class="bg-card rounded-3xl p-8 shadow-sm border border-border cursor-pointer hover:bg-muted transition-colors group flex flex-col justify-between min-h-[180px]"
      @click="navigate('/reports')"
    >
      <div>
        <div class="flex justify-between items-start mb-5">
          <div
            class="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform"
          >
            <IconFileBarChart class="text-2xl w-6 h-6" />
          </div>
          <IconArrowUpRight class="text-2xl w-6 h-6 text-muted-foreground/40 group-hover:text-blue-500 transition-colors" />
        </div>
        <h3 class="text-lg font-bold text-foreground">Сформировать отчет</h3>
        <p class="text-muted-foreground text-sm mt-2 leading-relaxed">
          Выгрузка статистики успеваемости и посещаемости за текущий месяц.
        </p>
      </div>
      <div class="mt-4 pt-4 border-t border-border">
        <span class="text-primary text-sm font-bold flex items-center gap-1">
          Начать <IconChevronRight class="text-xs w-3 h-3" />
        </span>
      </div>
    </div>

    <!-- Announcement Card -->
    <div
      class="bg-card rounded-3xl p-8 shadow-sm border border-border cursor-pointer hover:bg-muted transition-colors group flex flex-col justify-between min-h-[180px]"
      @click="navigate('/notifications')"
    >
      <div>
        <div class="flex justify-between items-start mb-5">
          <div
            class="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform"
          >
            <IconMegaphone class="text-2xl w-6 h-6" />
          </div>
          <IconPlus class="text-2xl w-6 h-6 text-muted-foreground/40 group-hover:text-orange-500 transition-colors" />
        </div>
        <h3 class="text-lg font-bold text-foreground">Создать объявление</h3>
        <p class="text-muted-foreground text-sm mt-2 leading-relaxed">
          Опубликовать новость для студентов или преподавателей.
        </p>
      </div>
      <div class="mt-4 pt-4 border-t border-border">
        <span class="text-primary text-sm font-bold flex items-center gap-1">
          Создать <IconChevronRight class="text-xs w-3 h-3" />
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { f7 } from "framework7-vue";
import IconFileBarChart from "~icons/lucide/file-bar-chart";
import IconArrowUpRight from "~icons/lucide/arrow-up-right";
import IconChevronRight from "~icons/lucide/chevron-right";
import IconMegaphone from "~icons/lucide/megaphone";
import IconPlus from "~icons/lucide/plus";

const navigate = (path: string) => {
  f7.views.main.router.navigate(path);
};
</script>
