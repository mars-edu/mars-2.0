<template>
  <div class="flex flex-col gap-4 p-4">
    <div
      class="flex flex-wrap items-center justify-between gap-3 bg-card border border-border rounded-lg shadow-sm p-4"
    >
      <div class="flex items-baseline gap-3">
        <h2 class="text-base font-bold text-foreground">
          {{ journal_participants_title() }}
        </h2>
        <span class="text-sm text-muted-foreground font-medium">
          {{ journal_participants_count({ filtered: participantsFiltered.length, total: participantsAll.length }) }}
        </span>
      </div>
      <SearchInput
        :model-value="participantsSearch"
        @update:model-value="$emit('update:participantsSearch', $event)"
        :placeholder="journal_participants_search()"
        wrapper-class="w-full sm:w-72"
      />
    </div>
    <StudentTable
      :students="participantsFiltered"
      :show-row-number="true"
      :show-specialty="true"
      :show-status="true"
      :show-language="true"
      :show-course="true"
      :clickable="true"
      @row-click="$emit('student-click', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import SearchInput from "@/components/ui/SearchInput.vue";
import StudentTable from "@/components/StudentTable.vue";
import type { Student } from "@/types/student";
import {
  journal_participants_title,
  journal_participants_count,
  journal_participants_search,
} from "@/paraglide/messages";

defineProps<{
  participantsFiltered: Student[];
  participantsAll: Student[];
  participantsSearch: string;
}>();

defineEmits<{
  (e: "update:participantsSearch", value: string): void;
  (e: "student-click", student: Student): void;
}>();
</script>
