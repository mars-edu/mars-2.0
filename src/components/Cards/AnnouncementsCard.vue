<template>
  <div class="bg-white rounded-xl shadow-sm overflow-hidden">
    <div class="flex items-center justify-between p-4 border-b border-gray-100">
      <h2 class="text-lg font-semibold text-gray-900">Объявления</h2>
      <a href="#" class="text-sm font-medium text-red-500 hover:text-red-600">
        подробнее
      </a>
    </div>
    <div class="p-4">
      <div class="space-y-4">
        <div
          v-for="(announcement, index) in announcements"
          :key="index"
          class="group p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <div
                  class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"
                >
                  <i class="text-red-500" :class="announcement.icon"></i>
                </div>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-900">
                  {{ announcement.title }}
                </h3>
                <p class="text-sm text-gray-500">{{ announcement.date }}</p>
              </div>
            </div>
            <i
              class="f7:chevron_right text-gray-400 group-hover:text-gray-600"
            ></i>
          </div>
          <p class="mt-2 text-sm text-gray-600">
            {{ announcement.description }}
          </p>
          <div class="mt-3 flex items-center space-x-2">
            <span
              v-if="announcement.category"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
              :class="getCategoryStyle(announcement.category)"
            >
              {{ announcement.category }}
            </span>
            <span class="text-xs text-gray-500">
              {{ announcement.timeAgo }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

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

const getCategoryStyle = (category: string) => {
  const styles = {
    Важное: "bg-red-100 text-red-800",
    Курсы: "bg-blue-100 text-blue-800",
    Система: "bg-gray-100 text-gray-800",
  };
  return styles[category as keyof typeof styles] || "bg-gray-100 text-gray-800";
};
</script>
