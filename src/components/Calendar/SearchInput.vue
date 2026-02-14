<template>
  <div>
    <div
      id="search-input"
      class="flex items-center bg-card border border-input rounded-full pl-3 pr-1 py-3 shadow-sm w-52 cursor-pointer"
      @click="openSearchPopover"
    >
      <i
        class="f7-icons text-muted-foreground text-lg mr-2 flex items-center justify-center"
        >search</i
      >
      <div class="bg-transparent outline-none text-sm text-muted-foreground">
        {{ placeholder }}
      </div>
    </div>

    <!-- Framework7 Popover -->
    <GuardedPopover
      id="search-popover"
      style="width: 350px !important"
      target="#search-input"
    >
      <div class="search-popover bg-card">
        <!-- Header with search input -->
        <div class="p-3 border-b border-input">
          <div class="flex items-center bg-secondary rounded-lg px-3 py-2">
            <i class="f7-icons text-muted-foreground text-lg mr-2">search</i>
            <input
              type="text"
              :placeholder="placeholder"
              class="bg-transparent outline-none w-full text-sm placeholder-muted-foreground text-foreground"
              v-model="searchQuery"
              @input="emitSearch"
              ref="searchInputField"
              autofocus
            />
            <button
              v-if="searchQuery"
              class="flex items-center justify-center w-5 h-5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
              @click="clearSearch"
            >
              <i class="f7-icons text-muted-foreground text-xs">xmark</i>
            </button>
          </div>
        </div>

        <!-- Search results -->
        <div class="p-2 max-h-80 overflow-y-auto">
          <div
            v-if="!searchQuery"
            class="text-center text-muted-foreground py-4"
          >
            Начните вводить для поиска
          </div>
          <div
            v-else-if="searchResults.length === 0"
            class="text-center text-muted-foreground py-4"
          >
            Ничего не найдено
          </div>
          <div v-else class="divide-y divide-border">
            <div
              v-for="(result, index) in searchResults"
              :key="index"
              class="py-3 px-2 flex items-center hover:bg-secondary cursor-pointer rounded-md"
              @click="handleResultClick(result)"
            >
              <div
                class="w-8 h-8 rounded-full bg-primary flex items-center justify-center"
              >
                <i class="f7-icons text-primary-foreground text-sm"
                  >doc_text_fill</i
                >
              </div>
              <div class="ml-3">
                <div class="text-sm font-medium text-foreground">
                  {{ result.title }}
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ result.category }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { f7, f7Popover } from "framework7-vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";

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
