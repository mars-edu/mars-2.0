<template>
  <div
    ref="rootRef"
    class="searchable-select-popover-wrapper relative"
    :class="[attrs.class, { 'opacity-50 pointer-events-none': props.disabled }]"
  >
    <div v-if="label" class="text-xs font-medium text-muted-foreground mb-1">
      {{ label }}
    </div>

    <!-- Trigger Button -->
    <button
      :id="triggerId"
      type="button"
      class="select-trigger"
      :class="{ 'select-placeholder': isShowingPlaceholder, 'trigger-active': isOpened }"
      @click="toggle"
      :disabled="disabled"
    >
      <div class="flex items-center gap-2 truncate">
        <span class="truncate">{{ selectedOptionText }}</span>
      </div>
      <IconChevronDown class="chevron-icon" :class="{ 'rotate-180': isOpened }" />
    </button>

    <!-- Inline anchored dropdown -->
    <template v-if="isOpened">
      <div class="dropdown-backdrop" @click="close" />
      <div class="dropdown-panel">
        <div class="search-wrapper">
          <div class="relative">
            <IconSearch class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              :placeholder="searchPlaceholder || 'Поиск...'"
              class="search-input"
              @keydown.esc="close"
            />
          </div>
        </div>

        <div class="overflow-y-auto custom-scrollbar flex-1">
          <div v-if="filteredOptions.length > 0">
            <button
              v-for="option in filteredOptions"
              :key="option.value"
              type="button"
              class="option-item"
              :class="{ active: modelValue === option.value }"
              @click="selectOption(option)"
            >
              <span class="flex-1 text-left whitespace-normal break-words leading-snug">{{ option.text }}</span>
              <IconCheck v-if="modelValue === option.value" class="w-4 h-4 text-primary shrink-0 mt-0.5" />
            </button>
          </div>
          <div v-else class="p-4 text-center text-sm text-muted-foreground">
            {{ noResultsText || 'Ничего не найдено' }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useAttrs, nextTick, watch } from "vue";
import IconChevronDown from "~icons/lucide/chevron-down";
import IconSearch from "~icons/lucide/search";
import IconCheck from "~icons/lucide/check";

defineOptions({ inheritAttrs: false });

const attrs = useAttrs();

interface SelectOption {
  value: string | number;
  text: string;
}

const props = defineProps<{
  modelValue: string | number | null;
  options: Array<SelectOption>;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
  disabled?: boolean;
  id?: string;
}>();

const emit = defineEmits(["update:modelValue", "before-open", "after-close"]);

const isOpened = ref(false);
const searchQuery = ref("");
const searchInput = ref<HTMLInputElement | null>(null);
const rootRef = ref<HTMLElement | null>(null);

const triggerId = computed(() => props.id || `select-trigger-${Math.random().toString(36).substr(2, 9)}`);

const selectedOptionText = computed(() => {
  const selected = props.options.find((o) => o.value === props.modelValue);
  return selected ? selected.text : props.placeholder || "Выберите...";
});

const isShowingPlaceholder = computed(() => {
  return !props.options.find((o) => o.value === props.modelValue);
});

const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options;
  const query = searchQuery.value.toLowerCase();
  return props.options.filter((o) => o.text.toLowerCase().includes(query));
});

const open = () => {
  if (props.disabled) return;
  emit("before-open");
  isOpened.value = true;
  nextTick(() => {
    searchInput.value?.focus();
  });
};

const close = () => {
  if (!isOpened.value) return;
  isOpened.value = false;
  searchQuery.value = "";
  emit("after-close");
};

const toggle = () => {
  if (isOpened.value) close();
  else open();
};

const selectOption = (option: SelectOption) => {
  emit("update:modelValue", option.value);
  close();
};
</script>

<style scoped>
.searchable-select-popover-wrapper {
  display: flex;
  flex-direction: column;
}

.select-trigger {
  @apply flex items-center justify-between w-full px-4 py-2.5 bg-muted rounded-xl text-sm transition-all border border-transparent hover:bg-muted/80 outline-none text-foreground;
  min-height: 44px;
}

.select-trigger.trigger-active {
  @apply ring-2 ring-foreground/80 bg-card;
}

.select-placeholder {
  @apply text-muted-foreground;
}

.chevron-icon {
  @apply w-4 h-4 text-muted-foreground transition-transform duration-200;
}

.dropdown-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
}

.dropdown-panel {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  z-index: 50;
  max-height: 300px;
  display: flex;
  flex-direction: column;
  @apply bg-card/90 border border-border/60 rounded-xl overflow-hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.search-wrapper {
  @apply p-2 border-b border-border/60 bg-card/50 sticky top-0 z-10;
}

.search-input {
  @apply w-full pl-9 pr-3 py-2 bg-muted border-transparent rounded-lg text-sm focus:ring-2 focus:ring-foreground/20 transition-all outline-none;
}

.option-item {
  @apply w-full flex items-start gap-3 px-3.5 py-3 text-[15px] font-medium text-foreground hover:bg-muted/60 transition-colors outline-none border-b border-border/40 last:border-b-0 cursor-pointer;
}

.option-item.active {
  @apply text-foreground;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  @apply bg-transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  @apply bg-muted-foreground/20 rounded-full;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  @apply bg-muted-foreground/40;
}
</style>
