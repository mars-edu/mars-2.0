<template>
  <div class="search-root group">
    <div class="search-icon-wrap">
      <IconSearch class="search-icon" />
    </div>

    <input
      ref="searchInput"
      v-model="searchQuery"
      type="text"
      class="search-input"
      :class="{ 'search-input--active': isActive, 'search-input--has-value': !!searchQuery }"
      :placeholder="placeholder"
      @focus="handleFocus"
      @blur="handleBlur"
      @keydown.down.prevent="handleKeyDown"
      @keydown.up.prevent="handleKeyUp"
      @keydown.enter="handleEnter"
      @keydown.esc="handleEscape"
    />

    <button v-if="searchQuery" class="search-clear" @click="clearSearch">
      <IconX class="search-clear-icon" />
    </button>

    <Transition name="search-dropdown">
      <div v-if="isActive && searchQuery" class="search-results">
        <div v-if="!filteredResults.length" class="search-empty">
          Ничего не найдено
        </div>
        <div v-else class="search-list">
          <button
            v-for="(result, index) in filteredResults"
            :key="result.id"
            class="search-result-item"
            :class="{ 'search-result-item--selected': selectedIndex === index }"
            @mouseenter="selectedIndex = index"
            @click="handleResultClick(result)"
          >
            <div class="search-result-icon" :class="getIconBackground(result.type)">
              <component :is="getIconComponent(result.type)" class="search-result-type-icon" />
            </div>
            <div class="search-result-text">
              <span class="search-result-title">{{ result.title }}</span>
              <span class="search-result-category">{{ result.category }}</span>
            </div>
            <IconChevronRight class="search-result-arrow" />
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7 } from "framework7-vue";
import IconSearch from "~icons/lucide/search";
import IconX from "~icons/lucide/x";
import IconBook from "~icons/lucide/book";
import IconCalendar from "~icons/lucide/calendar";
import IconFileText from "~icons/lucide/file-text";
import IconFile from "~icons/lucide/file";
import IconChevronRight from "~icons/lucide/chevron-right";

interface SearchResult {
  id: string;
  title: string;
  category: string;
  type: string;
  route?: string;
}

withDefaults(
  defineProps<{ placeholder?: string }>(),
  { placeholder: "Поиск" }
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
  { id: "1", title: "История Казахстана", category: "Предмет", type: "subject", route: "/subjects/history" },
  { id: "2", title: "Расписание на неделю", category: "Расписание", type: "schedule", route: "/schedule" },
  { id: "3", title: "Журнал посещаемости", category: "Журналы", type: "journal", route: "/journals/attendance" },
  { id: "4", title: "РУП 2024-2025", category: "Документы", type: "document", route: "/documents/curriculum" },
]);

const filteredResults = computed(() => {
  if (!searchQuery.value) return [];
  const q = searchQuery.value.toLowerCase();
  return searchResults.value.filter(
    (r) => r.title.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)
  );
});

const handleFocus = () => { isActive.value = true; selectedIndex.value = 0; emit("enable"); };
const handleBlur = () => { setTimeout(() => { isActive.value = false; emit("disable"); }, 200); };
const handleKeyDown = () => { if (selectedIndex.value < filteredResults.value.length - 1) selectedIndex.value++; };
const handleKeyUp = () => { if (selectedIndex.value > 0) selectedIndex.value--; };
const handleEnter = () => { const r = filteredResults.value[selectedIndex.value]; if (r) handleResultClick(r); };
const handleEscape = () => { searchInput.value?.blur(); clearSearch(); };
const handleResultClick = (result: SearchResult) => { if (result.route) f7.views.main.router.navigate(result.route); clearSearch(); };
const clearSearch = () => { searchQuery.value = ""; isActive.value = false; emit("disable"); };

const getIconComponent = (type: string) => {
  const map = { subject: IconBook, schedule: IconCalendar, journal: IconFileText, document: IconFile };
  return map[type as keyof typeof map] ?? IconFile;
};

const getIconBackground = (type: string) => {
  const map = { subject: "bg-blue", schedule: "bg-purple", journal: "bg-green", document: "bg-red" };
  return map[type as keyof typeof map] ?? "bg-neutral";
};
</script>

<style scoped>
.search-root {
  position: relative;
  width: 100%;
  max-width: 28rem;
}

/* Icon */
.search-icon-wrap {
  position: absolute;
  inset-block: 0;
  left: 0;
  padding-left: 0.75rem;
  display: flex;
  align-items: center;
  pointer-events: none;
  z-index: 1;
}
.search-icon {
  width: 1rem;
  height: 1rem;
  color: hsl(var(--muted-foreground));
  transition: color 0.2s;
}
.search-root:focus-within .search-icon {
  color: hsl(var(--foreground));
}

/* Input */
.search-input {
  display: block;
  width: 100%;
  height: 2.5rem;
  padding-left: 2.5rem;
  padding-right: 0.75rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  border: 1px solid transparent;
  border-radius: 9999px;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: hsl(var(--foreground));
  background-color: hsl(var(--input));
  box-shadow: inset 0 1px 3px 0 hsl(var(--muted-foreground) / 0.12);
  transition: background-color 0.2s, border-color 0.2s, box-shadow 0.2s;
  outline: none;
}
.search-input::placeholder {
  color: hsl(var(--muted-foreground));
}
.search-input:focus {
  background-color: hsl(var(--card));
  border-color: hsl(var(--border) / 0.4);
  box-shadow:
    inset 0 1px 3px 0 hsl(var(--muted-foreground) / 0.1),
    0 0 0 4px hsl(var(--muted-foreground) / 0.08);
}
.search-input--has-value {
  padding-right: 2.25rem;
}

/* Dark mode */
:global(.dark) .search-input {
  background-color: hsl(var(--foreground) / 0.1);
  box-shadow: none;
}
:global(.dark) .search-input:focus {
  background-color: hsl(var(--foreground) / 0.15);
  border-color: hsl(var(--border) / 0.5);
  box-shadow: 0 0 0 4px hsl(var(--muted-foreground) / 0.1);
}

/* Clear button */
.search-clear {
  position: absolute;
  right: 0.625rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background-color: hsl(var(--muted-foreground) / 0.15);
  border: none;
  cursor: pointer;
  transition: background-color 0.15s;
}
.search-clear:hover {
  background-color: hsl(var(--muted-foreground) / 0.25);
}
.search-clear-icon {
  width: 0.75rem;
  height: 0.75rem;
  color: hsl(var(--muted-foreground));
}

/* Dropdown */
.search-results {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 0.5rem);
  background-color: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 1rem;
  box-shadow: 0 10px 25px -5px hsl(var(--foreground) / 0.08), 0 4px 10px -6px hsl(var(--foreground) / 0.06);
  overflow: hidden;
  z-index: 50;
  padding: 0.25rem;
}
.search-empty {
  padding: 2rem 1rem;
  text-align: center;
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
}
.search-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.search-result-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  border-radius: 0.75rem;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background-color 0.15s;
  text-align: left;
}
.search-result-item:hover,
.search-result-item--selected {
  background-color: hsl(var(--muted) / 0.7);
}
.search-result-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 0.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.search-result-icon.bg-blue   { background-color: hsl(217 91% 60%); }
.search-result-icon.bg-purple { background-color: hsl(271 81% 56%); }
.search-result-icon.bg-green  { background-color: hsl(142 71% 45%); }
.search-result-icon.bg-red    { background-color: hsl(0 72% 51%); }
.search-result-icon.bg-neutral { background-color: hsl(var(--muted-foreground)); }
.search-result-type-icon {
  width: 1rem;
  height: 1rem;
  color: white;
}
.search-result-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.search-result-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: hsl(var(--foreground));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.search-result-category {
  font-size: 0.6875rem;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.search-result-arrow {
  width: 1rem;
  height: 1rem;
  color: hsl(var(--muted-foreground));
  opacity: 0;
  flex-shrink: 0;
  transition: opacity 0.15s;
}
.search-result-item:hover .search-result-arrow,
.search-result-item--selected .search-result-arrow {
  opacity: 0.5;
}

/* Dropdown transition */
.search-dropdown-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.search-dropdown-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
.search-dropdown-enter-from,
.search-dropdown-leave-to {
  opacity: 0;
  transform: translateY(4px) scale(0.98);
}
</style>
