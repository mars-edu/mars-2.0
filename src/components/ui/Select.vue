<template>
  <div
    ref="rootRef"
    class="select-wrapper relative"
    :class="[attrs.class, { 'opacity-50 pointer-events-none': props.disabled }]"
  >
    <div v-if="label" class="text-xs font-medium text-muted-foreground mb-1">
      {{ label }}
    </div>

    <!-- Trigger Button -->
    <button
      ref="triggerRef"
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
      
      <!-- Hidden inputs for form submission -->
      <template v-if="name">
        <template v-if="props.multiple && Array.isArray(modelValue)">
          <input v-for="val in modelValue" :key="val" type="hidden" :name="name" :value="val" />
        </template>
        <template v-else>
          <input type="hidden" :name="name" :value="modelValue" />
        </template>
      </template>
    </button>

    <!-- Teleported dropdown: renders at body level to escape any overflow/stacking context -->
    <Teleport to="body">
      <template v-if="isOpened">
        <div class="dropdown-backdrop" @click="close" data-popover-ignore="true" />
        <div class="dropdown-panel" :style="dropdownStyle" data-popover-ignore="true">
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
                :class="{ active: isOptionSelected(option.value) }"
                @click="selectOption(option)"
              >
                <slot name="option" :option="option" :selected="isOptionSelected(option.value)">
                  <span class="flex-1 text-left whitespace-normal break-words leading-snug">{{ option.text }}</span>
                </slot>
                <IconCheck v-if="isOptionSelected(option.value)" class="w-4 h-4 text-primary shrink-0 mt-0.5" />
              </button>
            </div>
            <div v-else class="p-4 text-center text-sm text-muted-foreground">
              {{ noResultsText || 'Ничего не найдено' }}
            </div>
          </div>
        </div>
      </template>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useAttrs, nextTick } from "vue";
import IconChevronDown from "~icons/lucide/chevron-down";
import IconSearch from "~icons/lucide/search";
import IconCheck from "~icons/lucide/check";
import { useAnchoredDropdown } from "@/composables/useAnchoredDropdown";

defineOptions({ inheritAttrs: false });

const attrs = useAttrs();

interface SelectOption {
  value: string | number;
  text: string;
  [key: string]: any; // extra fields passed through to the #option slot
}

const props = defineProps<{
  modelValue: string | number | Array<string | number> | null;
  options: Array<SelectOption>;
  label?: string;
  name?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
  disabled?: boolean;
  multiple?: boolean;
  id?: string;
}>();

const emit = defineEmits(["update:modelValue", "before-open", "after-close"]);

const isOpened = ref(false);
const searchQuery = ref("");
const searchInput = ref<HTMLInputElement | null>(null);
const rootRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLButtonElement | null>(null);
const { dropdownStyle } = useAnchoredDropdown(triggerRef, isOpened, { maxHeight: 300, matchWidth: true, zIndex: 99999 });

const triggerId = computed(() => props.id || `select-trigger-${Math.random().toString(36).substr(2, 9)}`);

const selectedOptionText = computed(() => {
  if (!props.options || props.options.length === 0) return "Нет данных";
  
  if (props.multiple && Array.isArray(props.modelValue)) {
    if (props.modelValue.length === 0) return props.placeholder || "Выберите...";
    const texts = props.options
      .filter((o) => (props.modelValue as Array<string | number>).includes(o.value))
      .map((o) => o.text);
    return texts.join(", ");
  }
  const selected = props.options.find((o) => o.value == props.modelValue);
  return selected ? selected.text : props.placeholder || "Выберите...";
});

const isShowingPlaceholder = computed(() => {
  if (!props.options || props.options.length === 0) return false;
  if (props.multiple && Array.isArray(props.modelValue)) {
    return props.modelValue.length === 0;
  }
  return !props.options.find((o) => o.value == props.modelValue);
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
  nextTick(() => searchInput.value?.focus());
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

const isOptionSelected = (value: string | number) => {
  if (props.multiple && Array.isArray(props.modelValue)) {
    return props.modelValue.includes(value);
  }
  return props.modelValue == value;
};

const selectOption = (option: SelectOption) => {
  if (props.multiple) {
    const current = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    const index = current.indexOf(option.value);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(option.value);
    }
    emit("update:modelValue", current);
  } else {
    if (props.modelValue == option.value) {
      emit("update:modelValue", null);
    } else {
      emit("update:modelValue", option.value);
    }
    close();
  }
};
</script>

<style scoped>
.select-wrapper {
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
  z-index: 99998;
}

.dropdown-panel {
  max-height: 300px;
  display: flex;
  flex-direction: column;
  @apply bg-card border border-border/60 rounded-xl overflow-hidden shadow-2xl;
}

.search-wrapper {
  @apply p-2 border-b border-border/60 bg-card sticky top-0 z-10;
}

.search-input {
  @apply w-full pl-9 pr-3 py-2 bg-muted border-transparent rounded-lg text-sm focus:ring-2 focus:ring-foreground/20 transition-all outline-none;
}

.option-item {
  @apply w-full flex items-start gap-3 px-3.5 py-3 text-[15px] font-medium text-foreground hover:bg-muted/60 transition-colors outline-none border-b border-border/40 last:border-b-0 cursor-pointer;
}

.option-item.active {
  @apply text-foreground bg-primary/5;
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
