<template>
  <div class="flex justify-between items-center mb-3">
    <h1 class="text-xl text-gray-900">{{ monthName }} {{ year }}</h1>
    <div class="text-xl font-bold uppercase text-gray-900">ПЛАНИРОВАНИЕ</div>
    <div class="w-52 flex justify-end">
      <button
        @click="$emit('today')"
        class="flex items-center w-fit hover:bg-gray-100 rounded-lg p-2 transition-colors"
      >
        <span
          class="w-9 h-9 bg-green-600 text-white rounded-full flex items-center justify-center mr-2"
          :class="{ 'bg-red-600': ifHoladay }"
        >
          {{ todayDate }}
        </span>
        <span
          class="text-green-600 font-semibold"
          :class="{ 'text-red-600': ifHoladay }"
          >Сегодня</span
        >
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

defineProps<{
  monthName: string;
  year: string;
  todayDate: string;
}>();

defineEmits<{
  (e: "today"): void;
}>();

const ifHoladay = ref(false);
</script>
