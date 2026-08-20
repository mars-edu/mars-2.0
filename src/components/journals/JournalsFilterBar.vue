<template>
  <div class="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl overflow-x-auto max-w-full mb-5">
    <button
      v-for="f in filters"
      :key="f.id"
      type="button"
      :aria-pressed="activeFilter === f.id"
      @click="$emit('update:activeFilter', f.id)"
      class="px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-200 whitespace-nowrap"
      :class="activeFilter === f.id
        ? 'bg-card text-foreground shadow-sm'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'"
    >
      {{ f.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
export interface JournalFilterTab {
  id: string;
  label: string;
}

defineProps<{
  filters: JournalFilterTab[];
  activeFilter: string;
}>();

defineEmits<{
  (e: "update:activeFilter", id: string): void;
}>();
</script>
