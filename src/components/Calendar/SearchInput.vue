<template>
  <div>
    <div
      id="search-input"
      class="flex items-center bg-white border border-gray-200 rounded-full pl-3 pr-1 py-3 shadow-sm w-52 cursor-pointer"
      @click="openSearchPopover"
    >
      <i
        class="f7-icons text-gray-500 text-lg mr-2 flex items-center justify-center"
        >search</i
      >
      <div
        class="bg-transparent outline-none text-sm placeholder-gray-400 text-gray-700"
      >
        {{ placeholder }}
      </div>
    </div>

    <!-- Framework7 Popover -->
    <f7-popover
      id="search-popover"
      style="width: 350px !important"
      target="#search-input"
      close-on-escape
    >
      <div class="search-popover">
        <!-- Header with search input -->
        <div class="p-3 border-b border-gray-200">
          <div class="flex items-center bg-gray-100 rounded-lg px-3 py-2">
            <i class="f7-icons text-gray-500 text-lg mr-2">search</i>
            <input
              type="text"
              :placeholder="placeholder"
              class="bg-transparent outline-none w-full text-sm placeholder-gray-400 text-gray-700"
              v-model="searchQuery"
              @input="emitSearch"
              ref="searchInputField"
              autofocus
            />
            <button
              v-if="searchQuery"
              class="flex items-center justify-center w-5 h-5 rounded-full bg-gray-400/20 hover:bg-gray-400/30 transition-colors"
              @click="clearSearch"
            >
              <i class="f7-icons text-gray-500 text-xs">xmark</i>
            </button>
          </div>
        </div>

        <!-- Search results -->
        <div class="p-2 max-h-80 overflow-y-auto">
          <div v-if="!searchQuery" class="text-center text-gray-500 py-4">
            Начните вводить для поиска
          </div>
          <div
            v-else-if="searchResults.length === 0"
            class="text-center text-gray-500 py-4"
          >
            Ничего не найдено
          </div>
          <div v-else class="divide-y divide-gray-100">
            <div
              v-for="(result, index) in searchResults"
              :key="index"
              class="py-3 px-2 flex items-center hover:bg-gray-50 cursor-pointer rounded-md"
              @click="handleResultClick(result)"
            >
              <div
                class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center"
              >
                <i class="f7-icons text-white text-sm">doc_text_fill</i>
              </div>
              <div class="ml-3">
                <div class="text-sm font-medium">{{ result.title }}</div>
                <div class="text-xs text-gray-500">{{ result.category }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { f7, f7Popover } from "framework7-vue";

const props = defineProps<{
  placeholder: string;
}>();

const emit = defineEmits<{
  (e: "search", query: string): void;
}>();

const searchQuery = ref("");
const searchInputField = ref<HTMLInputElement | null>(null);
const searchResults = ref<
  Array<{ title: string; category: string; route?: string }>
>([]);

const emitSearch = () => {
  emit("search", searchQuery.value);
  // Mock search results - in a real app, these would come from an API or store
  if (searchQuery.value) {
    searchResults.value = [
      { title: "Всемирная история", category: "История", route: "/history/1" },
      { title: "История Казахстана", category: "История", route: "/history/2" },
      {
        title: "Культурология",
        category: "Культурология",
        route: "/culture/3",
      },
    ].filter(
      (item) =>
        item.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  } else {
    searchResults.value = [];
  }
};

const openSearchPopover = () => {
  f7.popover.open("#search-popover", "#search-input");
  // Focus the input field after popover is opened
  setTimeout(() => {
    searchInputField.value?.focus();
  }, 300);
};

const closeSearchPopover = () => {
  f7.popover.close("#search-popover");
};

const clearSearch = () => {
  searchQuery.value = "";
  searchResults.value = [];
};

const handleResultClick = (result: {
  title: string;
  category: string;
  route?: string;
}) => {
  if (result.route) {
    f7.views.main.router.navigate(result.route);
  }
  closeSearchPopover();
};
</script>

<style scoped>
.search-popover {
  max-height: 400px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
