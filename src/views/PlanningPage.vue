<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold text-gray-900">
            {{ monthName }} {{ year }}
          </h1>
          <router-link
            to="/"
            class="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <i class="f7-icons">chevron_left</i>
            <span>Назад к календарю</span>
          </router-link>
        </div>
      </div>
    </header>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const year = computed(() => route.params.year);
const monthIndex = computed(() => parseInt(route.params.month as string) - 1);

const monthName = computed(() => {
  const months = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
  ];
  return months[monthIndex.value];
});
</script>
