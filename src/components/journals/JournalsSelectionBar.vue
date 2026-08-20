<template>
  <div
    v-if="isSelectionMode"
    class="mb-3 flex items-center gap-3 bg-card p-2 rounded-xl border border-primary/20 shadow-sm"
  >
    <div
      class="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg text-primary font-bold text-sm whitespace-nowrap flex-shrink-0"
    >
      <IconCircleCheck class="w-4 h-4 flex-shrink-0" />
      <span class="whitespace-nowrap">Выбрано: {{ selectedCount }}</span>
    </div>
    <div class="h-6 w-px bg-border mx-1" />
    <button
      @click="$emit('select-all')"
      class="px-4 py-1.5 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
    >
      {{ journal_select_all() }}
    </button>
    <button
      @click="$emit('deselect-all')"
      class="px-4 py-1.5 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
    >
      {{ journal_deselect_all() }}
    </button>
    <div class="flex-1" />
    <button
      @click="$emit('cancel')"
      class="px-4 py-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
    >
      {{ common_cancel() }}
    </button>
    <button
      @click="$emit('done')"
      :disabled="selectedCount === 0"
      :class="[
        'px-6 py-1.5 text-sm font-bold rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        selectionAction === 'delete' || selectionAction === 'close'
          ? 'bg-red-500 hover:bg-red-600 text-white'
          : selectionAction === 'open'
            ? 'bg-green-500 hover:bg-green-600 text-white'
            : 'bg-primary hover:bg-primary/90 text-primary-foreground',
      ]"
    >
      {{ doneText }}
    </button>
  </div>
</template>

<script setup lang="ts">
import IconCircleCheck from "~icons/lucide/circle-check";
import {
  journal_select_all,
  journal_deselect_all,
  common_cancel,
} from "@/paraglide/messages";

defineProps<{
  isSelectionMode: boolean;
  selectedCount: number;
  selectionAction: string;
  doneText: string;
}>();

defineEmits<{
  (e: "select-all"): void;
  (e: "deselect-all"): void;
  (e: "cancel"): void;
  (e: "done"): void;
}>();
</script>
