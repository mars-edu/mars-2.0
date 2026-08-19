<template>
  <div
    v-if="conflicts.length > 0"
    class="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2 text-amber-900 dark:text-amber-200 animate-fade-in"
  >
    <div class="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-300">
      <IconAlertTriangle class="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
      <span>Обнаружены пересечения в расписании ({{ conflicts.length }})</span>
    </div>

    <ul class="space-y-1.5 pl-6 list-disc text-xs leading-relaxed">
      <li v-for="(c, idx) in conflicts" :key="idx">
        <span class="font-semibold">{{ c.message }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { ScheduleConflict } from "@/lib/scheduleConflicts";
import IconAlertTriangle from "~icons/lucide/triangle-alert";

defineProps<{
  conflicts: ScheduleConflict[];
}>();
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}
</style>
