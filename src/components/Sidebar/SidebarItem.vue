<template>
  <div class="relative group/item mx-2">
    <div
      class="flex items-center h-11 rounded-xl cursor-pointer transition-all duration-200"
      :class="[
        collapsed ? 'justify-center' : 'gap-3 px-3',
        active
          ? 'bg-card shadow-sm ring-1 ring-border text-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
      ]"
      @click="$emit('click')"
    >
      <div
        class="flex-shrink-0 flex items-center justify-center w-5 h-5 transition-colors duration-200"
        :class="active ? 'text-primary' : ''"
      >
        <slot />
      </div>
      <span
        v-if="!collapsed"
        class="text-sm font-medium whitespace-nowrap overflow-hidden"
      >
        {{ label }}
      </span>
    </div>

    <!-- Tooltip when collapsed -->
    <div
      v-if="collapsed"
      class="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-popover text-popover-foreground text-xs font-medium rounded-lg opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-200 whitespace-nowrap z-[9999] shadow-lg border border-border pointer-events-none"
    >
      {{ label }}
    </div>
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
