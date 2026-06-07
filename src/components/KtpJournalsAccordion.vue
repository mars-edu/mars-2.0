<template>
  <details v-if="journals.length" class="ktp-journals" @click.stop>
    <summary class="ktp-journals__summary" :class="summaryClass">
      <IconChevronRight class="ktp-journals__chev flex-shrink-0" :class="iconSize" />
      <IconBookOpen class="flex-shrink-0" :class="iconSize" />
      Журналы ({{ journals.length }})
    </summary>
    <ul class="mt-1.5 space-y-1">
      <li
        v-for="j in journals"
        :key="j.id"
        class="text-muted-foreground"
        :class="dense ? 'text-xs pl-5' : 'text-sm pl-6'"
      >
        {{ journalStore.getDisciplineTitle(j) }} · {{ journalStore.getJournalSubtitle(j) }}
      </li>
    </ul>
  </details>
</template>

<script setup lang="ts">
import { computed } from "vue";
import IconChevronRight from "~icons/lucide/chevron-right";
import IconBookOpen from "~icons/lucide/book-open";
import { useJournalStore, type Journal } from "@/stores/journalStore";

const props = defineProps<{
  journals: Journal[];
  /** Compact card variant (smaller text / muted summary) vs detail-view variant */
  dense?: boolean;
}>();

const journalStore = useJournalStore();

const iconSize = computed(() => (props.dense ? "w-3 h-3" : "w-3.5 h-3.5"));
const summaryClass = computed(() =>
  props.dense
    ? "text-xs text-muted-foreground/70 gap-1"
    : "text-xs font-semibold text-muted-foreground/80 uppercase tracking-widest gap-1.5"
);
</script>

<style scoped>
.ktp-journals__summary {
  @apply flex items-center cursor-pointer select-none;
  list-style: none;
}
.ktp-journals__summary::-webkit-details-marker {
  display: none;
}
.ktp-journals__chev {
  transition: transform 0.15s;
}
.ktp-journals[open] .ktp-journals__chev {
  transform: rotate(90deg);
}
</style>
