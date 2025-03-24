<template>
  <div
    class="rounded-xl shadow-sm overflow-hidden"
    :class="[
      themeClasses,
      {
        'cursor-pointer hover:shadow-md transition-shadow': clickable,
      },
    ]"
    @click="handleClick"
  >
    <div
      v-if="$slots.header || title"
      class="flex items-center justify-between p-4 border-b"
      :class="borderClass"
    >
      <slot name="header">
        <h2 class="text-lg font-semibold" :class="textClass">{{ title }}</h2>
      </slot>
    </div>
    <div class="p-4">
      <slot></slot>
    </div>
    <div v-if="$slots.footer" class="p-4 border-t" :class="borderClass">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  theme?: "white" | "dark" | "lavanda";
  title?: string;
  clickable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  theme: "white",
  clickable: false,
});

const emit = defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();

const themeClasses = computed(() => {
  switch (props.theme) {
    case "dark":
      return "bg-gray-800 text-white";
    case "lavanda":
      return "bg-purple-50";
    default:
      return "bg-white";
  }
});

const borderClass = computed(() => {
  switch (props.theme) {
    case "dark":
      return "border-gray-700";
    case "lavanda":
      return "border-purple-100";
    default:
      return "border-gray-100";
  }
});

const textClass = computed(() => {
  switch (props.theme) {
    case "dark":
      return "text-white";
    case "lavanda":
      return "text-purple-900";
    default:
      return "text-gray-900";
  }
});

const handleClick = (event: MouseEvent) => {
  if (props.clickable) {
    emit("click", event);
  }
};
</script>
