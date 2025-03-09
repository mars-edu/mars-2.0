<template>
  <div class="min-h-screen bg-gray-50">
    <Header
      @searchbar-enable="handleSearchbarEnable"
      @searchbar-disable="handleSearchbarDisable"
      @language-change="handleLanguageChange"
    />
    <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">
          {{ monthName }} {{ year }}
        </h1>
        <a
          href="#/"
          class="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          @click.prevent="goBack"
        >
          <i class="f7-icons">chevron_left</i>
          <span>Назад к календарю</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { f7, f7ready } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import { useLanguage } from "@/composables/useLanguage";

const year = ref("");
const monthIndex = ref(0);
const searchbarEnabled = ref(false);

// Language management
const { activeLanguage, availableLanguages, setLanguage } = useLanguage();

// Get route params when component is mounted
onMounted(() => {
  f7ready(() => {
    const currentRoute = f7.views.main.router.currentRoute;
    if (currentRoute.params) {
      year.value = currentRoute.params.year || "";
      monthIndex.value = parseInt(currentRoute.params.month || "1") - 1;
    }
  });
});

// Function to navigate back
const goBack = () => {
  // f7.views.main.router.back();
  window.location.href = "/";
};

// Event handlers for Header component
const handleSearchbarEnable = () => {
  searchbarEnabled.value = true;
};

const handleSearchbarDisable = () => {
  searchbarEnabled.value = false;
};

const handleLanguageChange = (code: string) => {
  setLanguage(code);
};

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
