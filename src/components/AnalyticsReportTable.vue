<template>
  <div
    class="overflow-x-auto rounded-xl border border-border bg-card shadow-sm"
  >
    <table class="min-w-full table-fixed text-sm">
      <thead
        class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        <tr class="bg-muted/40">
          <th
            :rowspan="
              (disciplinesSemester.length ? 2 : 1) + (finalForms?.length ?? 0)
            "
            class="px-3 py-3 text-center align-middle"
          >
            №
          </th>
          <th
            :rowspan="
              (disciplinesSemester.length ? 2 : 1) + (finalForms?.length ?? 0)
            "
            class="px-3 py-3 text-left align-middle"
          >
            Ф.И.О.
          </th>
          <th
            :rowspan="
              (disciplinesSemester.length ? 2 : 1) + (finalForms?.length ?? 0)
            "
            class="px-3 py-3 text-center align-middle"
          >
            Курс
          </th>
          <th
            v-if="disciplinesSemester.length"
            :colspan="disciplinesSemester.length"
            class="px-3 py-3 text-center align-middle"
          >
            Семестровые дисциплины
          </th>
          <th
            v-if="disciplinesWithoutFinal.length"
            :colspan="disciplinesWithoutFinal.length"
            class="px-3 py-3 text-center align-middle"
          >
            Без итогового контроля
          </th>
          <th
            v-for="form in finalForms"
            :key="form.id"
            :colspan="disciplinesByForm[form.id]?.length ?? 0"
            class="px-3 py-3 text-center align-middle"
          >
            {{ form.title }}
          </th>
          <th
            :rowspan="
              (disciplinesSemester.length ? 2 : 1) + (finalForms?.length ?? 0)
            "
            class="px-3 py-3 text-center align-middle"
          >
            Ср
          </th>
        </tr>
        <tr
          v-if="disciplinesSemester.length"
          class="bg-muted/60 text-foreground"
        >
          <th
            v-for="discipline in disciplinesSemester"
            :key="discipline.id"
            class="px-3 py-2 text-center align-middle"
          >
            <span
              class="block max-w-[24rem] truncate"
              :title="discipline.title"
            >
              {{ discipline.title }}
            </span>
          </th>
        </tr>
        <tr
          v-if="disciplinesWithoutFinal.length"
          class="bg-muted/60 text-foreground"
        >
          <th
            v-for="discipline in disciplinesWithoutFinal"
            :key="`without-final-${discipline.id}`"
            class="px-3 py-2 text-center align-middle"
          >
            <span
              class="block max-w-[24rem] truncate"
              :title="discipline.title"
            >
              {{ discipline.title }}
            </span>
          </th>
        </tr>
        <tr
          v-for="(form, formIdx) in finalForms"
          :key="`final-header-${form.id}`"
          class="bg-muted/60 text-foreground"
        >
          <th
            v-for="discipline in disciplinesByForm[form.id]"
            :key="`${form.id}-${discipline.id}`"
            class="px-3 py-2 text-center align-middle"
          >
            <span
              class="block max-w-[24rem] truncate"
              :title="discipline.title"
            >
              {{ discipline.title }}
            </span>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-border text-foreground">
        <tr v-if="isLoading">
          <td
            :colspan="totalColumnCount"
            class="px-4 py-6 text-center text-muted-foreground"
          >
            Загрузка отчёта...
          </td>
        </tr>
        <tr v-else-if="rows.length === 0">
          <td
            :colspan="totalColumnCount"
            class="px-4 py-6 text-center text-muted-foreground"
          >
            Нет данных для отображения. Измените фильтры или выберите
            обучающихся.
          </td>
        </tr>
        <tr
          v-else
          v-for="row in rows"
          :key="row.studentId"
          class="bg-card hover:bg-muted/30"
        >
          <td class="px-3 py-2 text-center font-medium">{{ row.index }}</td>
          <td class="px-3 py-2">
            <div class="font-medium">{{ row.fullName }}</div>
          </td>
          <td class="px-3 py-2 text-center text-muted-foreground">
            {{ row.courseLabel || "—" }}
          </td>
          <td
            v-for="discipline in disciplinesSemester"
            :key="`${row.studentId}-${discipline.id}`"
            class="px-3 py-2 text-center"
          >
            {{ formatScore(row.semester[discipline.id]) }}
          </td>
          <td
            v-for="discipline in disciplinesWithoutFinal"
            :key="`${row.studentId}-without-final-${discipline.id}`"
            class="px-3 py-2 text-center"
          >
            {{ formatScore(row.withoutFinal[discipline.id]) }}
          </td>
          <template
            v-for="(form, formIdx) in finalForms"
            :key="`${row.studentId}-final-${formIdx}`"
          >
            <td
              v-for="discipline in disciplinesByForm[form.id]"
              :key="`${row.studentId}-${form.id}-${discipline.id}`"
              class="px-3 py-2 text-center"
            >
              {{ formatScore(row.finals[form.id]?.[discipline.id] ?? null) }}
            </td>
          </template>
          <td class="px-3 py-2 text-center font-semibold">
            {{ formatScore(row.overallAverage) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface ReportTableRow {
  studentId: string;
  index: number;
  fullName: string;
  courseLabel: string;
  semester: Record<string, number | null>;
  withoutFinal: Record<string, number | null>;
  finals: Record<string, Record<string, number | null>>;
  overallAverage: number | null;
}

interface ReportDisciplineColumn {
  id: string;
  title: string;
}

interface ReportFinalForm {
  id: string;
  title: string;
}

const props = defineProps<{
  rows: ReportTableRow[];
  disciplinesSemester: ReportDisciplineColumn[];
  disciplinesWithoutFinal: ReportDisciplineColumn[];
  disciplinesByForm: Record<string, ReportDisciplineColumn[]>;
  finalForms?: ReportFinalForm[];
  isLoading?: boolean;
}>();

const totalColumnCount = computed(() => {
  let count = 3;
  count += props.disciplinesSemester.length;
  count += props.disciplinesWithoutFinal.length;
  if (props.finalForms?.length) {
    props.finalForms.forEach((form) => {
      count += props.disciplinesByForm[form.id]?.length ?? 0;
    });
  }
  count += 1;
  return count;
});

const formatScore = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  const rounded = Number.parseFloat(value.toFixed(1));
  if (Math.abs(rounded - Math.round(rounded)) < 0.05) {
    return String(Math.round(rounded));
  }
  return rounded.toFixed(1);
};
</script>
