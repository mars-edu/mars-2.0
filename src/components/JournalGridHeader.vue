<template>
  <th
    class="px-1 py-2 text-center text-[12px] border-r border-b border-border transition-all duration-300 relative align-middle"
    :class="[
      header.isFinalSummary
        ? 'bg-destructive/5 text-destructive font-bold cursor-default min-w-[80px] w-20'
        : 'min-w-[56px] w-16',
      isClickable && !header.isFinalSummary ? 'cursor-pointer hover:bg-muted/80' : '',
      {
        'bg-muted/70 text-foreground font-bold': header.type === 'session',
        'bg-muted/50 text-muted-foreground': header.type === 'pk' || header.type === 'e' || header.type === 'i',
        'scale-125 bg-green-100 text-green-600 font-bold z-20 shadow-sm': isEditing,
      }
    ]"
    @click="isClickable && !header.isFinalSummary && header.index >= 0 ? $emit('header-click', header, header.index) : null"
  >
    <div class="flex flex-col items-center justify-center w-full h-full">
      <IconPaperclip
        v-if="header.type === 'date' && hasKtp"
        class="h-8 text-gray-400 cursor-pointer hover:text-primary transition-colors"
        @click.stop="$emit('paperclip-click', header, index)"
        :id="`paperclip-${index}`"
      />
      <span v-html="header.label.replace(/\\n|\n/g, '<br/>')"></span>
    </div>
  </th>
</template>

<script setup lang="ts">
import IconPaperclip from "~icons/lucide/paperclip";

defineProps<{
  header: any;
  index: number;
  isEditing?: boolean;
  hasKtp?: boolean;
  isClickable?: boolean;
}>();

defineEmits<{
  (e: 'header-click', header: any, index: number): void;
  (e: 'paperclip-click', header: any, index: number): void;
}>();
</script>
