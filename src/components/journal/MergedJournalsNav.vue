<template>
  <div
    v-if="isMergedJournal"
    class="p-4 bg-muted/50 rounded-2xl border border-border/50"
  >
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
      <button
        v-for="child in mergedChildJournals"
        :key="child.id"
        @click="$emit('update:selectedChildJournalId', child.id)"
        class="p-4 rounded-2xl border-2 flex flex-col gap-3 transition-all duration-300 text-left group relative overflow-hidden"
        :class="selectedChildJournalId === child.id
          ? 'border-primary bg-primary/5 shadow-[0_8px_20px_-6px] shadow-primary/20 text-foreground'
          : 'bg-card border-border hover:border-primary/50 hover:shadow-md text-foreground'"
      >
        <div
          v-if="selectedChildJournalId === child.id"
          class="absolute -top-12 -right-12 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none"
        />
        <div class="flex items-center gap-2.5">
          <div
            class="w-3 h-3 rounded-full flex-shrink-0 transition-all duration-500"
            :class="selectedChildJournalId === child.id
              ? 'bg-primary scale-110 shadow-[0_0_12px] shadow-primary/60'
              : 'bg-muted-foreground/40'"
          />
          <div
            class="text-base font-bold truncate tracking-tight leading-tight"
            :class="selectedChildJournalId === child.id ? 'text-foreground' : 'text-foreground/80'"
          >
            {{ child.journal ? journalStore.getDisciplineTitle(child.journal) : child.id }}
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <div
            class="text-[11px] font-bold"
            :class="selectedChildJournalId === child.id ? 'text-primary' : 'text-muted-foreground'"
          >
            {{ child.journal ? journalStore.getJournalSubtitle(child.journal) : '' }}
          </div>
          <div class="flex items-center justify-between mt-1">
            <div
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300"
              :class="selectedChildJournalId === child.id
                ? 'bg-primary/20 text-primary'
                : 'bg-muted text-muted-foreground'"
            >
              <IconUsers class="w-3.5 h-3.5" />
              <span>{{ child.journal?.students.length ?? 0 }}</span>
            </div>
            <span
              v-if="child.journal"
              class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border"
              :class="selectedChildJournalId === child.id
                ? 'bg-card border-primary/20 text-primary'
                : 'bg-card border-border text-muted-foreground'"
            >
              {{ journalStore.getJournalGroupLanguage(child.journal) }}
            </span>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconUsers from "~icons/lucide/users";
import { useJournalStore } from "@/stores/journalStore";
import type { Journal } from "@/types/journal";

const journalStore = useJournalStore();

defineProps<{
  isMergedJournal: boolean;
  mergedChildJournals: Array<{ id: string; journal: Journal | null }>;
  selectedChildJournalId: string;
}>();

defineEmits<{
  (e: "update:selectedChildJournalId", id: string): void;
}>();
</script>
