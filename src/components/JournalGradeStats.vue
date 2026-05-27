<template>
  <div
    class="mt-4 mb-4 bg-card rounded-2xl shadow-sm border border-border p-6"
  >
    <div class="flex items-baseline justify-between mb-4">
      <h3 class="text-[13px] font-bold text-foreground uppercase tracking-wide">
        {{ journal_grade_stats_title() }}
      </h3>
      <span class="text-[12px] text-muted-foreground font-medium">
        {{ journal_grade_stats_count({ graded: stats.totalGraded, total: totalStudents }) }}
      </span>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
      <div
        v-for="entry in stats.entries"
        :key="entry.letter"
        class="flex justify-between items-center bg-muted p-3 rounded-xl"
      >
        <span class="text-sm font-bold text-foreground">{{ entry.letter }}</span>
        <span
          :class="[
            'text-[12px] font-bold px-2 py-0.5 rounded-md',
            entry.count > 0
              ? 'bg-foreground text-background'
              : 'bg-border text-muted-foreground',
          ]"
        >
          {{ entry.count }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  journal_grade_stats_title,
  journal_grade_stats_count,
} from "@/paraglide/messages";

export interface GradeStats {
  totalGraded: number;
  entries: Array<{
    letter: string;
    count: number;
  }>;
}

const props = defineProps<{
  stats: GradeStats;
  totalStudents: number;
}>();
</script>
