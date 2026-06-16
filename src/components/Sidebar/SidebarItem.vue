<template>
  <div class="relative group/item">
    <div
      class="flex items-center h-11 rounded-xl cursor-pointer transition-all duration-200"
      :class="[
        collapsed ? 'justify-center' : 'px-3.5 gap-4',
        active
          ? 'bg-card text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10'
          : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5',
      ]"
      @click="$emit('click')"
    >
      <div
        class="flex-shrink-0 flex items-center justify-center w-[22px] h-[22px] transition-colors duration-200"
        :class="active ? 'text-primary' : 'text-muted-foreground group-hover/item:text-foreground'"
      >
        <slot />
      </div>
      <span
        v-if="!collapsed"
        class="text-[13px] font-bold leading-none whitespace-nowrap overflow-hidden truncate"
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
