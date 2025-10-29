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
            :rowspan="frozenHeaderRowspan"
            class="px-3 py-3 text-center align-middle"
          >
            №
          </th>
          <th
            :rowspan="frozenHeaderRowspan"
            class="px-3 py-3 text-left align-middle"
          >
            Ф.И.О.
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
            v-for="form in finalFormsFiltered"
            :key="form.id"
            :colspan="disciplinesByForm[form.id]?.length"
            class="px-3 py-3 text-center align-middle"
          >
            {{ form.title }}
          </th>
          <th
            :rowspan="frozenHeaderRowspan"
            class="px-3 py-3 text-center align-middle"
          >
            Ср
          </th>
        </tr>
        <tr v-if="hasAnySubheaders" class="bg-muted/60 text-foreground">
          <th
            v-for="discipline in disciplinesSemester"
            :key="discipline.id"
            class="px-2 py-2 text-center align-middle w-6 min-w-6"
          >
            <div
              class="flex items-center justify-center"
              :style="{ height: headerHeightPx + 'px' }"
            >
              <span
                class="block transform -rotate-90 text-xs font-medium truncate"
                :title="discipline.title"
                :data-title="discipline.title"
                :ref="registerHeaderLabel"
                :style="{ maxWidth: headerHeightPx - 12 + 'px' }"
              >
                {{ discipline.title }}
              </span>
            </div>
          </th>
          <th
            v-for="discipline in disciplinesWithoutFinal"
            :key="`without-final-${discipline.id}`"
            class="px-2 py-2 text-center align-middle w-6 min-w-6"
          >
            <div
              class="flex items-center justify-center"
              :style="{ height: headerHeightPx + 'px' }"
            >
              <span
                class="block transform -rotate-90 text-xs font-medium truncate"
                :title="discipline.title"
                :data-title="discipline.title"
                :ref="registerHeaderLabel"
                :style="{ maxWidth: headerHeightPx - 12 + 'px' }"
              >
                {{ discipline.title }}
              </span>
            </div>
          </th>
          <template
            v-for="form in finalFormsFiltered"
            :key="`final-row-${form.id}`"
          >
            <th
              v-for="discipline in disciplinesByForm[form.id]"
              :key="`${form.id}-${discipline.id}`"
              class="px-2 py-2 text-center align-middle w-6 min-w-6"
            >
              <div
                class="flex items-center justify-center"
                :style="{ height: headerHeightPx + 'px' }"
              >
                <span
                  class="block transform -rotate-90 text-xs font-medium truncate"
                  :title="discipline.title"
                  :data-title="discipline.title"
                  :ref="registerHeaderLabel"
                  :style="{ maxWidth: headerHeightPx - 12 + 'px' }"
                >
                  {{ discipline.title }}
                </span>
              </div>
            </th>
          </template>
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

          <td
            v-for="discipline in disciplinesSemester"
            :key="`${row.studentId}-${discipline.id}`"
            class="px-1 py-2 text-center text-xs w-6 min-w-6"
          >
            {{ formatScore(row.semester[discipline.id]) }}
          </td>
          <td
            v-for="discipline in disciplinesWithoutFinal"
            :key="`${row.studentId}-without-final-${discipline.id}`"
            class="px-1 py-2 text-center text-xs w-6 min-w-6"
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
              class="px-1 py-2 text-center text-xs w-6 min-w-6"
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
import { computed, ref, onMounted, nextTick, watch } from "vue";
import type { ComponentPublicInstance } from "vue";

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

const finalFormsFiltered = computed(() => {
  const forms = props.finalForms ?? [];
  return forms.filter(
    (form) => (props.disciplinesByForm[form.id]?.length ?? 0) > 0
  );
});

const hasAnySubheaders = computed(() => {
  if (props.disciplinesSemester.length > 0) return true;
  if (props.disciplinesWithoutFinal.length > 0) return true;
  return finalFormsFiltered.value.length > 0;
});

const frozenHeaderRowspan = computed(() => (hasAnySubheaders.value ? 2 : 1));

// Dynamic header height (rotated labels) with truncation
const MIN_HEADER_HEIGHT = 96; // px
const MAX_HEADER_HEIGHT = 180; // px
const headerHeightPx = ref<number>(MIN_HEADER_HEIGHT);
const headerLabelEls: HTMLElement[] = [];
const registerHeaderLabel = (
  value: Element | ComponentPublicInstance | null
) => {
  if (!value) return;
  const el: HTMLElement | null = (value as any).$el
    ? ((value as any).$el as HTMLElement)
    : (value as HTMLElement) || null;
  if (!el) return;
  if (!headerLabelEls.includes(el)) headerLabelEls.push(el);
};

const recomputeHeaderHeight = () => {
  let maxNeeded = MIN_HEADER_HEIGHT;
  const liveEls = headerLabelEls.filter((el) => el && el.isConnected);
  liveEls.forEach((el) => {
    const text = el.getAttribute("data-title") || el.textContent || "";
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const style = window.getComputedStyle(el);
    const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    ctx.font = font;
    const metrics = ctx.measureText(text);
    const width = metrics.width + 24; // padding + margin safety
    maxNeeded = Math.max(maxNeeded, Math.ceil(width));
  });
  headerHeightPx.value = Math.max(
    MIN_HEADER_HEIGHT,
    Math.min(MAX_HEADER_HEIGHT, maxNeeded)
  );
};

onMounted(async () => {
  await nextTick();
  recomputeHeaderHeight();
});

watch(
  () => [
    props.disciplinesSemester.map((d) => d.id + d.title).join("|"),
    props.disciplinesWithoutFinal.map((d) => d.id + d.title).join("|"),
    (props.finalForms ?? [])
      .map((f) => f.id + (props.disciplinesByForm[f.id]?.length ?? 0))
      .join("|"),
  ],
  async () => {
    await nextTick();
    recomputeHeaderHeight();
  }
);

const totalColumnCount = computed(() => {
  let count = 2;
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
