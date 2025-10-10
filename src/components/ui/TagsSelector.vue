<template>
  <div class="tags-selector-container">
    <label v-if="label" :for="inputId" class="text-sm text-foreground">
      {{ label }}
    </label>
    <div class="tags-selector-wrapper">
      <!-- Selected tags as chips -->
      <div class="tags-display" v-if="selectedItems.length > 0">
        <f7-chip
          v-for="item in selectedItems"
          :key="item.id"
          :text="getDisplayText(item)"
          :outline="chipVariant === 'outline'"
          :color="chipColor"
          deleteable
          @delete="removeItem(item.id)"
          class="tag-chip"
        />
      </div>

      <!-- Dropdown trigger -->
      <div class="relative">
        <button
          type="button"
          @click="toggleDropdown"
          :disabled="disabled"
          class="tags-input flex-1 min-w-[120px] border-none bg-transparent outline-none text-sm placeholder:text-muted-foreground cursor-pointer"
          :class="{ 'has-tags': selectedItems.length > 0 }"
        >
          <span v-if="selectedItems.length === 0" class="text-muted-foreground">
            {{ placeholder }}
          </span>
          <span v-else class="text-foreground">
            {{ selectedItems.length }}
            {{ selectedItems.length === 1 ? "элемент" : "элементов" }} выбрано
          </span>
          <f7-icon
            :ios="isOpen ? 'f7:chevron_up' : 'f7:chevron_down'"
            :md="isOpen ? 'material:expand_less' : 'material:expand_more'"
            size="16px"
            class="ml-2 opacity-60"
          />
        </button>

        <!-- Dropdown menu -->
        <div
          v-if="isOpen"
          class="dropdown-menu absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
        >
          <div v-if="showSearch" class="p-2">
            <f7-input
              v-model:value="searchTerm"
              type="text"
              placeholder="Поиск..."
              class="search-input"
              clear-button
            />
          </div>
          <div class="max-h-48 overflow-y-auto">
            <div
              v-for="item in filteredItems"
              :key="item.id"
              @click="toggleItemSelection(item.id)"
              class="dropdown-item px-3 py-2 cursor-pointer flex items-center gap-2 select-none"
              :class="{ 'bg-primary/10': isSelected(item.id) }"
            >
              <f7-checkbox
                :checked="isSelected(item.id)"
                class="pointer-events-none"
              />
              <span class="flex-1">{{ getDisplayText(item) }}</span>
            </div>
            <div
              v-if="filteredItems.length === 0"
              class="px-3 py-2 text-muted-foreground text-sm"
            >
              Ничего не найдено
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Helper text -->
    <div v-if="helperText" class="text-xs text-muted-foreground mt-1">
      {{ helperText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from "vue";
import { f7Input, f7Chip, f7Icon, f7Checkbox } from "framework7-vue";

interface SelectableItem {
  id: string;
  [key: string]: any; // Allow additional properties for display text
}

interface Props {
  modelValue: string[];
  items: SelectableItem[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  maxTags?: number;
  allowDuplicates?: boolean;
  chipVariant?: "solid" | "outline";
  chipColor?: string;
  helperText?: string;
  id?: string;
  displayField?: string; // Field to use for display text (e.g., 'codeName', 'name')
  showSearch?: boolean; // Whether to show the search input
}

const props = withDefaults(defineProps<Props>(), {
  label: "",
  placeholder: "Выберите элементы...",
  disabled: false,
  maxTags: undefined,
  allowDuplicates: false,
  chipVariant: "solid",
  chipColor: "",
  helperText: "",
  displayField: "name", // Default to 'name' field
  showSearch: true, // Show search input by default
});

const emit = defineEmits<{
  "update:modelValue": [ids: string[]];
}>();

const inputId = computed(
  () => props.id || `tags-selector-${Math.random().toString(36).substr(2, 9)}`
);
const isOpen = ref(false);
const searchTerm = ref("");

// Selected items (full objects, not just IDs)
const selectedItems = ref<SelectableItem[]>([]);

// Filter items based on search term
const filteredItems = computed(() => {
  if (!props.showSearch) {
    return props.items;
  }

  if (!searchTerm.value.trim()) {
    return props.items;
  }

  const search = searchTerm.value.toLowerCase();
  return props.items.filter((item) => {
    const displayText = getDisplayText(item).toLowerCase();
    return displayText.includes(search);
  });
});

// Check if item is selected
const isSelected = (itemId: string) => {
  return selectedItems.value.some((item) => item.id === itemId);
};

// Get display text for an item
const getDisplayText = (item: SelectableItem) => {
  if (props.displayField && item[props.displayField]) {
    return item[props.displayField];
  }

  // Fallback to common display fields
  return item.codeName || item.name || item.title || item.label || item.id;
};

// Toggle dropdown visibility
const toggleDropdown = () => {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
};

// Toggle item selection
const toggleItemSelection = (itemId: string) => {
  const item = props.items.find((i) => i.id === itemId);
  if (!item) return;

  if (isSelected(itemId)) {
    removeItem(itemId);
  } else {
    addItem(item);
  }
};

// Add item to selection
const addItem = (item: SelectableItem) => {
  if (props.disabled) return;

  if (props.maxTags && selectedItems.value.length >= props.maxTags) {
    return;
  }

  if (props.allowDuplicates || !isSelected(item.id)) {
    selectedItems.value.push(item);
    updateModelValue();
  }
};

// Remove item from selection
const removeItem = (itemId: string) => {
  const index = selectedItems.value.findIndex((item) => item.id === itemId);
  if (index > -1) {
    selectedItems.value.splice(index, 1);
    updateModelValue();
  }
};

// Update model value with selected IDs
const updateModelValue = () => {
  const ids = selectedItems.value.map((item) => item.id);
  emit("update:modelValue", ids);
};

// Watch for external changes to modelValue
watch(
  () => props.modelValue,
  (newIds) => {
    // Sync selected items with model value
    selectedItems.value = props.items.filter((item) =>
      newIds.includes(item.id)
    );
  },
  { immediate: true }
);

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  const container = target.closest(".tags-selector-container");
  if (!container) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

// Focus management
watch(isOpen, (open) => {
  if (open && props.showSearch) {
    nextTick(() => {
      const searchInput = document.querySelector(
        ".search-input input"
      ) as HTMLInputElement;
      searchInput?.focus();
    });
  }
});
</script>

<style scoped>
.tags-selector-container {
  @apply space-y-2;
}

.tags-selector-wrapper {
  @apply flex flex-wrap gap-2 items-center min-h-[44px] p-2 border border-border rounded-lg bg-background;
  @apply focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20;
}

.tags-display {
  @apply flex flex-wrap gap-1;
}

.tag-chip {
  @apply transition-all duration-200;
}

.tags-input {
  @apply flex items-center justify-between w-full;
}

.dropdown-menu {
  @apply bg-card border-border shadow-lg;
}

.dropdown-item {
  @apply transition-colors duration-150;
}

.dropdown-item:hover {
  @apply bg-muted/70;
}

.dropdown-item:active {
  @apply bg-primary/20;
}

.search-input :deep(.input) {
  @apply border-border bg-muted/30;
}

/* Framework7 chip styling adjustments */
:deep(.chip) {
  @apply text-xs font-medium;
}

:deep(.chip.deleteable .chip-delete) {
  @apply opacity-70 hover:opacity-100;
}
</style>
