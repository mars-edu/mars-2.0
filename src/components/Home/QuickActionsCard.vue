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
            <i class="f7-icons text-2xl">doc_chart_fill</i>
          </div>
          <i class="f7-icons text-2xl text-muted-foreground/40 group-hover:text-blue-500 transition-colors">
            arrow_up_right
          </i>
        </div>
        <h3 class="text-lg font-bold text-foreground">Сформировать отчет</h3>
        <p class="text-muted-foreground text-sm mt-2 leading-relaxed">
          Выгрузка статистики успеваемости и посещаемости за текущий месяц.
        </p>
      </div>
      <div class="mt-4 pt-4 border-t border-border">
        <span class="text-primary text-sm font-bold flex items-center gap-1">
          Начать <i class="f7-icons text-xs">chevron_right</i>
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
            <i class="f7-icons text-2xl">megaphone_fill</i>
          </div>
          <i class="f7-icons text-2xl text-muted-foreground/40 group-hover:text-orange-500 transition-colors">
            plus
          </i>
        </div>
        <h3 class="text-lg font-bold text-foreground">Создать объявление</h3>
        <p class="text-muted-foreground text-sm mt-2 leading-relaxed">
          Опубликовать новость для студентов или преподавателей.
        </p>
      </div>
      <div class="mt-4 pt-4 border-t border-border">
        <span class="text-orange-500 text-sm font-bold flex items-center gap-1">
          Создать <i class="f7-icons text-xs">chevron_right</i>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { f7 } from "framework7-vue";

const navigate = (path: string) => {
  f7.views.main.router.navigate(path);
};
</script>
