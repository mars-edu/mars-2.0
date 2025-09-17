<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || isLoading"
    v-bind="$attrs"
    @click="$emit('click', $event)"
  >
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";

export interface ButtonProps {
  variant?: "primary" | "secondary" | "success" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  isLoading?: boolean;
}

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: "primary",
  size: "md",
  disabled: false,
  isLoading: false,
});

defineEmits<{
  click: [event: MouseEvent];
}>();

const buttonClasses = computed(() => {
  const baseClasses =
    "w-fit px-5 rounded-md transition-colors border-solid border-2";

  const sizeClasses = {
    sm: "px-3 py-1 text-sm",
    md: "px-5",
    lg: "px-6 py-3 text-lg",
  };

  const variantClasses = {
    primary:
      "!text-primary hover:!bg-primary/30 hover:!text-primary/90 disabled:text-muted-foreground border-primary",
    secondary:
      "!text-secondary-foreground hover:!bg-secondary hover:!text-secondary-foreground/90 disabled:text-muted-foreground border-secondary",
    success:
      "!text-green-500 hover:!bg-green-500/30 hover:!text-green-600 disabled:text-muted-foreground border-green-500",
    danger:
      "!text-red-500 hover:!bg-red-500/30 hover:!text-red-600 disabled:text-muted-foreground border-red-500",
    ghost:
      "!text-muted-foreground hover:!bg-muted hover:!text-foreground disabled:text-muted-foreground border-transparent",
  };

  return [
    baseClasses,
    sizeClasses[props.size],
    variantClasses[props.variant],
  ].join(" ");
});
</script>
