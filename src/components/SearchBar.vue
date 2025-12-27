<template>
  <div class="relative">
    <!-- Search Input -->
    <div
      class="flex items-center bg-gray-100/80 backdrop-blur rounded-lg px-3 h-9 focus-within:bg-white focus-within:shadow-sm transition-colors"
      :class="{ 'bg-white shadow-sm': isActive }"
    >
      <i class="f7:search text-gray-400 text-lg"></i>
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="search"
        class="w-full bg-transparent ml-2 text-base text-gray-900 placeholder-gray-500 outline-none"
        :placeholder="placeholder"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown.down.prevent="handleKeyDown"
        @keydown.up.prevent="handleKeyUp"
        @keydown.enter="handleEnter"
        @keydown.esc="handleEscape"
      />
      <button
        v-if="searchQuery"
        class="flex items-center justify-center w-5 h-5 rounded-full bg-gray-400/20 hover:bg-gray-400/30 transition-colors"
        @click="clearSearch"
      >
        <i class="f7:xmark text-gray-500 text-xs"></i>
      </button>
    </div>

    <!-- Search Results -->
    <div
      v-if="isActive && (searchQuery || showEmptyState)"
      class="absolute left-0 right-0 top-full mt-2 bg-white/95 backdrop-blur rounded-xl shadow-lg overflow-hidden z-50"
    >
      <!-- No Results State -->
      <div v-if="!filteredResults.length" class="p-4 text-center text-gray-500">
        {{ searchQuery ? "Ничего не найдено" : "Начните вводить для поиска" }}
      </div>

      <!-- Results List -->
      <div v-else class="divide-y divide-gray-100">
        <button
          v-for="(result, index) in filteredResults"
          :key="result.id"
          class="w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors"
          :class="{ 'bg-gray-50': selectedIndex === index }"
          @mouseenter="selectedIndex = index"
          @click="handleResultClick(result)"
        >
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center"
            :class="getIconBackground(result.type)"
          >
            <i class="f7-icons text-white text-sm">{{
              getIconClass(result.type)
            }}</i>
          </div>
          <div class="ml-3 min-w-0">
            <div class="text-sm font-medium text-gray-900 truncate">
              {{ result.title }}
            </div>
            <div class="text-xs text-gray-500">{{ result.category }}</div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7 } from "framework7-vue";

interface SearchResult {
  id: string;
  title: string;
  category: string;
  type: string;
  route?: string;
}

const props = withDefaults(
  defineProps<{
    placeholder?: string;
    showEmptyState?: boolean;
  }>(),
  {
    placeholder: "Поиск",
    showEmptyState: true,
  }
);

const emit = defineEmits<{
  (e: "enable"): void;
  (e: "disable"): void;
}>();

const searchInput = ref<HTMLInputElement | null>(null);
const searchQuery = ref("");
const isActive = ref(false);
const selectedIndex = ref(0);


const searchResults = ref<SearchResult[]>([
  {
    id: "1",
    title: "История Казахстана",
    category: "Предмет",
    type: "subject",
    route: "/subjects/history",
  },
  {
    id: "2",
    title: "Расписание на неделю",
    category: "Расписание",
    type: "schedule",
    route: "/schedule",
  },
  {
    id: "3",
    title: "Журнал посещаемости",
    category: "Журналы",
    type: "journal",
    route: "/journals/attendance",
  },
  {
    id: "4",
    title: "РУП 2024-2025",
    category: "Документы",
    type: "document",
    route: "/documents/curriculum",
  },
]);

const filteredResults = computed(() => {
  if (!searchQuery.value) return [];
  return searchResults.value.filter(
    (result) =>
      result.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      result.category.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});


const handleFocus = () => {
  isActive.value = true;
  selectedIndex.value = 0;
  emit("enable");
};

const handleBlur = () => {
  
  setTimeout(() => {
    isActive.value = false;
    emit("disable");
  }, 200);
};

const handleKeyDown = () => {
  if (selectedIndex.value < filteredResults.value.length - 1) {
    selectedIndex.value++;
  }
};

const handleKeyUp = () => {
  if (selectedIndex.value > 0) {
    selectedIndex.value--;
  }
};

const handleEnter = () => {
  const selectedResult = filteredResults.value[selectedIndex.value];
  if (selectedResult) {
    handleResultClick(selectedResult);
  }
};

const handleEscape = () => {
  searchInput.value?.blur();
  clearSearch();
};

const handleResultClick = (result: SearchResult) => {
  if (result.route) {
    f7.views.main.router.navigate(result.route);
  }
  clearSearch();
};

const clearSearch = () => {
  searchQuery.value = "";
  isActive.value = false;
  emit("disable");
};


const getIconClass = (type: string) => {
  const icons = {
    subject: "f7:book_fill",
    schedule: "f7:calendar",
    journal: "f7:doc_text_fill",
    document: "f7:doc_fill",
  };
  return icons[type as keyof typeof icons] || "f7:doc_fill";
};

const getIconBackground = (type: string) => {
  const backgrounds = {
    subject: "bg-blue-500",
    schedule: "bg-purple-500",
    journal: "bg-green-500",
    document: "bg-red-500",
  };
  return backgrounds[type as keyof typeof backgrounds] || "bg-gray-500";
};
</script>

<style scoped>

input[type="search"]::-webkit-search-decoration,
input[type="search"]::-webkit-search-cancel-button,
input[type="search"]::-webkit-search-results-button,
input[type="search"]::-webkit-search-results-decoration {
  display: none;
}
</style>
