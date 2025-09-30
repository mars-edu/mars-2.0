<template>
  <div class="tag-input-container">
    <label v-if="label" :for="inputId" class="text-sm text-foreground">
      {{ label }}
    </label>
    <div class="tag-input-wrapper">
      <!-- Existing tags as chips -->
      <div class="tags-display" v-if="modelValue.length > 0">
        <f7-chip
          v-for="tag in modelValue"
          :key="tag"
          :text="tag"
          :outline="chipVariant === 'outline'"
          :color="chipColor"
          deleteable
          @delete="removeTag(tag)"
          class="tag-chip"
        />
      </div>

      <!-- Input for new tags -->
      <f7-input
        :id="inputId"
        ref="inputRef"
        type="text"
        :placeholder="placeholder"
        :disabled="
          disabled || (maxTags !== undefined && modelValue.length >= maxTags)
        "
        :value="inputValue"
        @input="onInput"
        @keydown="onKeydown"
        class="tag-input"
        :class="{ 'has-tags': modelValue.length > 0 }"
      />
    </div>

    <!-- Helper text -->
    <div v-if="helperText" class="text-xs text-muted-foreground mt-1">
      {{ helperText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from "vue";
import { f7Input, f7Chip } from "framework7-vue";

interface Props {
  modelValue: string[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  maxTags?: number;
  allowDuplicates?: boolean;
  chipVariant?: "solid" | "outline";
  chipColor?: string;
  helperText?: string;
  id?: string;
}

const props = withDefaults(defineProps<Props>(), {
  label: "",
  placeholder: "Добавить тег...",
  disabled: false,
  maxTags: undefined,
  allowDuplicates: false,
  chipVariant: "solid",
  chipColor: "",
  helperText: "",
});

const emit = defineEmits<{
  "update:modelValue": [tags: string[]];
  add: [tag: string];
  remove: [tag: string];
}>();

const inputRef = ref<any>(null);
const inputValue = ref("");

// Generate unique ID for the input
const inputId = computed(
  () => props.id || `tag-input-${Math.random().toString(36).substr(2, 9)}`
);

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  inputValue.value = target.value;
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Enter" || event.key === ",") {
    event.preventDefault();
    addTagFromInput();
  } else if (
    event.key === "Backspace" &&
    inputValue.value === "" &&
    props.modelValue.length > 0
  ) {
    // Remove last tag when backspacing on empty input
    const lastTag = props.modelValue[props.modelValue.length - 1];
    removeTag(lastTag);
  }
};

const addTagFromInput = () => {
  const tag = inputValue.value.trim();
  if (!tag) return;

  if (!props.allowDuplicates && props.modelValue.includes(tag)) {
    inputValue.value = "";
    return;
  }

  if (props.maxTags && props.modelValue.length >= props.maxTags) {
    inputValue.value = "";
    return;
  }

  const newTags = [...props.modelValue, tag];
  emit("update:modelValue", newTags);
  emit("add", tag);
  inputValue.value = "";

  nextTick(() => {
    inputRef.value?.focus();
  });
};

const removeTag = (tagToRemove: string) => {
  const newTags = props.modelValue.filter((tag) => tag !== tagToRemove);
  emit("update:modelValue", newTags);
  emit("remove", tagToRemove);

  nextTick(() => {
    inputRef.value?.focus();
  });
};

// Focus input when component mounts or when enabled
watch(
  () => props.disabled,
  (newDisabled) => {
    if (!newDisabled) {
      nextTick(() => {
        inputRef.value?.focus();
      });
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.tag-input-container {
  @apply space-y-2;
}

.tag-input-wrapper {
  @apply flex flex-wrap gap-2 items-center min-h-[44px] p-2 border border-border rounded-lg bg-background;
  @apply focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20;
}

.tags-display {
  @apply flex flex-wrap gap-1;
}

.tag-chip {
  @apply transition-all duration-200;
}

.tag-input {
  @apply flex-1 min-w-[120px] border-none bg-transparent outline-none;
  @apply text-sm placeholder:text-muted-foreground;
}

.tag-input.has-tags {
  @apply min-w-[80px];
}

/* Framework7 chip styling adjustments */
:deep(.chip) {
  @apply text-xs font-medium;
}

:deep(.chip.deleteable .chip-delete) {
  @apply opacity-70 hover:opacity-100;
}
</style>
