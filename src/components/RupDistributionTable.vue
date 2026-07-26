<template>
  <div>
    <div class="mt-6 pt-4 border-t border-border">
      <div class="flex items-center justify-between mb-2">
        <div class="text-sm font-semibold text-foreground">
          Распределение по курсам и семестрам
        </div>
        <f7-button
          small
          fill
          @click="emit('add')"
          class="add-distribution-btn"
        >
          <IconPlus class="w-3.5 h-3.5 mr-1" />
          Добавить
        </f7-button>
      </div>

      <div class="distribution-table border border-input rounded-lg">
        <div class="overflow-x-auto">
          <div
            class="distribution-grid distribution-header"
            :style="gridStyle"
          >
            <div>Учебный год</div>
            <div>Семестр</div>
            <div class="text-center">Групп</div>
            <div v-if="visibleColumns.srs" class="text-center">СРС</div>
            <div v-if="visibleColumns.srsp" class="text-center">СРСП</div>
            <div v-if="visibleColumns.individual" class="text-center">Индив.</div>
            <div>Форма контроля</div>
            <div></div>
          </div>

          <div
            v-if="entries.length === 0"
            class="text-center py-6 text-muted-foreground text-sm bg-card"
          >
            Нет записей распределения. Нажмите «Добавить», чтобы создать первую запись.
          </div>

          <div v-else class="distribution-body">
            <div
              v-for="entry in entries"
              :key="entry.id"
              class="distribution-grid distribution-row"
              :style="gridStyle"
            >
              <Select
                :modelValue="entry.academicYearId"
                :options="academicYearOptions"
                placeholder="Выберите год"
                search-placeholder="Поиск учебного года..."
                @update:modelValue="
                  (value: string) => {
                    entry.academicYearId = value;
                    entry.semesterId = '';
                    entry.finalControlId = null;
                  }
                "
              />

              <Select
                :modelValue="entry.semesterId"
                :options="semesterOptionsFor(entry.academicYearId)"
                placeholder="Выберите семестр"
                search-placeholder="Поиск семестра..."
                @update:modelValue="(value: string) => { entry.semesterId = value }"
              />

              <Input
                v-model="entry.hours"
                type="text" inputmode="numeric"
                placeholder="0"
                :show-checkmark="false"
                :clear-button="false"
                class="distribution-hours-input"
              />

              <Input
                v-if="visibleColumns.srs"
                v-model="(entry as any).srsHours"
                type="text" inputmode="numeric"
                placeholder="0"
                :show-checkmark="false"
                :clear-button="false"
                class="distribution-hours-input"
              />
              <Input
                v-if="visibleColumns.srsp"
                v-model="(entry as any).srspHours"
                type="text" inputmode="numeric"
                placeholder="0"
                :show-checkmark="false"
                :clear-button="false"
                class="distribution-hours-input"
              />
              <Input
                v-if="visibleColumns.individual"
                v-model="(entry as any).individualHours"
                type="text" inputmode="numeric"
                placeholder="0"
                :show-checkmark="false"
                :clear-button="false"
                class="distribution-hours-input"
              />

              <Select
                :modelValue="entry.finalControlId ?? ''"
                @update:modelValue="entry.finalControlId = ($event as string) || null"
                :options="finalControlOptionsFor(entry.academicYearId, entry.semesterId)"
                placeholder="Выберите форму контроля"
                search-placeholder="Поиск формы контроля..."
              />

              <div class="distribution-actions">
                <f7-button
                  small
                  @click="emit('remove', entry.id)"
                  class="remove-entry-btn"
                >
                  <IconTrash class="w-3.5 h-3.5" />
                </f7-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="entries.length > 0"
      class="mt-4 p-4 bg-muted/50 rounded-xl border border-border text-sm"
    >
      <div class="font-semibold mb-2">Итоги распределения:</div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <span class="text-muted-foreground">Групп:</span>
          <span class="text-muted-foreground font-medium">
            {{ summary.group }} / {{ summary.targetGroup }}
          </span>
        </div>
        <div v-if="visibleColumns.srs">
          <span class="text-muted-foreground">СРС:</span>
          <span class="text-muted-foreground font-medium">
            {{ summary.srs }} / {{ summary.targetSrs }}
          </span>
        </div>
        <div v-if="visibleColumns.srsp">
          <span class="text-muted-foreground">СРСП:</span>
          <span class="text-muted-foreground font-medium">
            {{ summary.srsp }} / {{ summary.targetSrsp }}
          </span>
        </div>
        <div v-if="visibleColumns.individual">
          <span class="text-muted-foreground">Индивидуальные:</span>
          <span class="text-muted-foreground font-medium">
            {{ summary.individual }} / {{ summary.targetIndividual }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Select from "@/components/ui/Select.vue";
import Input from "@/components/ui/Input.vue";
import IconPlus from "~icons/lucide/plus";
import IconTrash from "~icons/lucide/trash-2";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useScheduledFinalControlStore } from "@/stores/scheduledFinalControlStore";
import type { DistributionSummary } from "@/lib/rupHours";

/**
 * Extracted from RupEntryPopup (spec P3, step 5). Renders the per-semester
 * distribution grid (year/semester/hours + optional srs/srsp/individual
 * columns + final-control picker + delete) and the "Итоги распределения"
 * summary panel below it.
 *
 * `entries` is a live reactive array from the parent's `step.distributionEntries`
 * — this component mutates individual entry fields in place through v-model
 * (year/semester/hours/etc.) and emits `add` / `remove(id)` for structural
 * changes. Same pattern the parent used inline before extraction.
 *
 * Store access (academicYears / academicYearSemesters / scheduledFinalControls
 * / finalControls) moves in here so the parent no longer has to know about
 * the option lists or the final-control lookup.
 */

interface DistributionEntry {
  id: string;
  academicYearId: string;
  semesterId: string;
  hours: string;
  finalControlId?: string | null;
  [key: string]: unknown;
}

const props = defineProps<{
  entries: DistributionEntry[];
  visibleColumns: { srs: boolean; srsp: boolean; individual: boolean };
  summary: DistributionSummary;
}>();

const emit = defineEmits<{
  (e: "add"): void;
  (e: "remove", entryId: string): void;
}>();

const academicYearStore = useAcademicYearStore();
const academicYearSemesterStore = useAcademicYearSemesterStore();
const scheduledFinalControlStore = useScheduledFinalControlStore();

const academicYearOptions = computed(() =>
  academicYearStore.academicYears.map((y) => ({
    value: y.id,
    text: `${y.startYear}-${y.endYear}`,
  }))
);

function semesterOptionsFor(academicYearId: string) {
  return academicYearSemesterStore
    .getAcademicYearSemestersByAcademicYear(academicYearId)
    .map((s) => ({ value: s.id, text: `Семестр ${s.semesterNumber}` }));
}

function finalControlOptionsFor(academicYearId: string, _semesterId?: string) {
  if (!academicYearId) return [{ value: "", text: "Не выбрано" }];
  const scheduled =
    scheduledFinalControlStore.getScheduledFinalControlsByAcademicYear(academicYearId);
  return [
    { value: "", text: "Не выбрано" },
    ...scheduled.map((c) => ({ value: c.id, text: c.shortName })),
  ];
}

const gridStyle = computed(() => {
  const extraCount =
    (props.visibleColumns.srs ? 1 : 0) +
    (props.visibleColumns.srsp ? 1 : 0) +
    (props.visibleColumns.individual ? 1 : 0);
  // year | semester | group | (extras) | control | delete
  return {
    gridTemplateColumns: `minmax(160px,1fr) minmax(160px,1fr) 100px ${"100px ".repeat(extraCount)}minmax(220px,1.4fr) 32px`,
    minWidth: `${760 + extraCount * 110}px`,
  };
});
</script>
