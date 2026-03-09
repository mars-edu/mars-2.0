<template>
  <div
    :title="collapsed ? label : undefined"
    class="group flex items-center gap-3 rounded-xl cursor-pointer transition-all duration-200 mx-2 px-3 py-2.5"
    :class="[
      active
        ? 'bg-card shadow-sm ring-1 ring-border text-foreground'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted',
    ]"
    @click="$emit('click')"
  >
    <div class="flex-shrink-0 flex items-center justify-center w-5 h-5">
      <slot />
    </div>
    <span
      class="text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-200"
      :class="collapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'"
    >
      {{ label }}
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  active?: boolean;
  collapsed?: boolean;
}>();

defineEmits<{ (e: "click"): void }>();
</script>
