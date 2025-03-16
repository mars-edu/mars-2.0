<template>
  <div class="bg-white rounded-xl shadow-sm overflow-hidden">
    <!-- Date range header -->
    <div class="p-4 border-b border-gray-100">
      <div class="mb-2">
        <div class="flex items-center mb-2">
          <div class="text-lg font-medium mr-2">Дата начала:</div>
          <input
            type="date"
            class="border rounded-md px-2 py-1"
            v-model="startDate"
          />
        </div>
        <div class="flex items-center">
          <div class="text-lg font-medium mr-2">Дата окончания:</div>
          <input
            type="date"
            class="border rounded-md px-2 py-1"
            v-model="endDate"
          />
        </div>
      </div>
    </div>

    <!-- Weekly schedule container -->
    <div class="p-4">
      <!-- Week days header -->
      <div class="rounded-lg border border-gray-200 overflow-hidden">
        <div class="p-4">
          <h3 class="text-xl font-medium mb-4">Недели</h3>

          <!-- Weekday buttons -->
          <div class="flex space-x-4 mb-6 justify-center">
            <button
              v-for="(day, index) in weekDays"
              :key="index"
              class="w-14 h-14 rounded-full flex items-center justify-center text-sm font-medium relative"
              :class="[
                getDayClass(index),
                selectedDay === index ? 'ring-2 ring-offset-2' : '',
              ]"
              @click="selectDay(index)"
              @mouseover="hoveredDay = index"
              @mouseleave="hoveredDay = null"
            >
              {{ day }}
              <span
                v-if="hoveredDay === index"
                class="absolute text-lg font-bold"
                :class="[
                  selectedDay === index ? 'text-white' : 'text-gray-700',
                ]"
              >
                ✕
              </span>
            </button>
          </div>

          <!-- Time slots for selected day -->
          <div>
            <h3
              class="text-xl font-medium mb-4"
              :class="getDayTextClass(selectedDay)"
            >
              Время ({{ weekDays[selectedDay] }})
            </h3>

            <div class="space-y-4">
              <div
                v-for="(timeSlot, index) in timeSlots"
                :key="index"
                class="flex items-center"
              >
                <div class="w-16 text-gray-500 text-right mr-2">от</div>
                <div
                  class="w-32 px-4 py-2 rounded-lg text-center mx-2 border"
                  :class="getDayBgClass(selectedDay)"
                >
                  {{ timeSlot.start }}
                </div>

                <div class="w-16 text-gray-500 text-right mr-2">до</div>
                <div
                  class="w-32 px-4 py-2 rounded-lg text-center mx-2 border"
                  :class="getDayBgClass(selectedDay)"
                >
                  {{ timeSlot.end }}
                </div>
              </div>

              <!-- Ellipsis to indicate more time slots -->
              <div class="flex justify-center">
                <div class="text-gray-400 text-2xl">.....</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary footer -->
      <div class="mt-4 bg-gray-200 rounded-lg p-4">
        <div class="flex justify-between">
          <div class="text-gray-700">
            По плану: <span class="font-medium">36 часов</span>
          </div>
          <div class="text-red-500">
            Запланировано: <span class="font-medium">38 часов</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

// Weekday labels in Russian
const weekDays = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"];

// State for selected and hovered day
const selectedDay = ref(0); // Default to Monday (ПН)
const hoveredDay = ref<number | null>(null);

// Date range
const startDate = ref("2025-02-28");
const endDate = ref("2025-03-28");

// Sample time slots
const timeSlots = ref([
  { start: "08:00", end: "08:45" },
  { start: "08:50", end: "09:35" },
  { start: "09:45", end: "10:30" },
  { start: "10:35", end: "11:20" },
]);

// Function to select a day
const selectDay = (index: number) => {
  selectedDay.value = index;
};

// Color mapping for each day of the week
const getDayClass = (dayIndex: number) => {
  const classes = {
    0: "bg-pink-200 hover:bg-pink-300", // Monday
    1: "bg-blue-200 hover:bg-blue-300", // Tuesday
    2: "bg-green-200 hover:bg-green-300", // Wednesday
    3: "bg-gray-300 hover:bg-gray-400", // Thursday
    4: "bg-yellow-200 hover:bg-yellow-300", // Friday
    5: "bg-purple-200 hover:bg-purple-300", // Saturday
    6: "bg-orange-200 hover:bg-orange-300", // Sunday
  };

  return classes[dayIndex as keyof typeof classes] || "bg-gray-200";
};

// Background color for time slots based on selected day
const getDayBgClass = (dayIndex: number) => {
  const classes = {
    0: "bg-pink-100", // Monday
    1: "bg-blue-100", // Tuesday
    2: "bg-green-100", // Wednesday
    3: "bg-gray-200", // Thursday
    4: "bg-yellow-100", // Friday
    5: "bg-purple-100", // Saturday
    6: "bg-orange-100", // Sunday
  };

  return classes[dayIndex as keyof typeof classes] || "bg-gray-100";
};

// Text color for day header
const getDayTextClass = (dayIndex: number) => {
  const classes = {
    0: "text-pink-500", // Monday
    1: "text-blue-500", // Tuesday
    2: "text-green-500", // Wednesday
    3: "text-gray-500", // Thursday
    4: "text-yellow-600", // Friday
    5: "text-purple-500", // Saturday
    6: "text-orange-500", // Sunday
  };

  return classes[dayIndex as keyof typeof classes] || "text-gray-500";
};
</script>
