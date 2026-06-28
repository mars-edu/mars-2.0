<template>
  <Select
    :model-value="modelValue"
    :options="options"
    :searchable="searchable"
    :placeholder="placeholder"
    :search-placeholder="searchPlaceholder"
    :label="label"
    :name="name"
    :id="id"
    :disabled="disabled"
    @update:model-value="emit('update:modelValue', ($event as string) || null)"
  >
    <template #option="{ option, selected }">
      <div class="flex-1 text-left min-w-0">
        <span
          class="text-[15px] font-semibold whitespace-normal break-words"
          :class="selected ? 'text-primary' : ''"
        >
          {{ option.moduleIndex }} {{ option.moduleName }} — {{ option.learningOutcome }}<template v-if="option.year"> ({{ option.year }})</template>
        </span>
        <span
          v-if="option.semester"
          class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 flex-shrink-0 ml-2 align-middle"
        >
          {{ option.semester }} семестр
        </span>
        <span
          v-if="option.language"
          class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary flex-shrink-0 ml-2 align-middle"
        >
          {{ option.language.toUpperCase() }}
        </span>
        <div
          v-if="option.specialtyChips && option.specialtyChips.length"
          class="flex flex-wrap items-center gap-1 mt-1.5"
        >
          <span
            v-for="sp in option.specialtyChips"
            :key="sp.id"
            class="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
          >
            {{ sp.codeName || sp.name }}
          </span>
        </div>
      </div>
    </template>
  </Select>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { storeToRefs } from "pinia";
import Select from "@/components/ui/Select.vue";
import { useRupEntryStore } from "@/stores/rupEntryStore";
import { useSpecialtyStore, type Specialty } from "@/stores/specialtyStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";

const props = withDefaults(
  defineProps<{
    modelValue: string | null;
    /** Filter to a single academicYearId; omit to show all years. */
    yearId?: string;
    /**
     * Semester context used to resolve each option's semester badge (same logic
     * the wizard uses to auto-pick a semester). Defaults to the active semester
     * (current year / month). Pass the planning filter's selected-month semester
     * to override.
     */
    semesterContextId?: string;
    searchable?: boolean;
    placeholder?: string;
    searchPlaceholder?: string;
    label?: string;
    name?: string;
    id?: string;
    disabled?: boolean;
  }>(),
  { searchable: true }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string | null): void;
}>();

const rupEntryStore = useRupEntryStore();
const specialtyStore = useSpecialtyStore();
const academicYearStore = useAcademicYearStore();
const academicYearSemesterStore = useAcademicYearSemesterStore();
const { rupEntryOptions } = storeToRefs(rupEntryStore);

// rupEntry options enriched with language badge + specialty chips for the
// Select #option slot, optionally filtered to one academic year.
const options = computed(() =>
  rupEntryOptions.value
    .filter((option) => {
      const rupEntryItem = rupEntryStore.getRupEntryById(option.value);
      if (!rupEntryItem) return false;
      return !props.yearId || rupEntryItem.academicYearId === props.yearId;
    })
    .map((option) => {
      const rupEntryItem = rupEntryStore.getRupEntryById(option.value)!;
      // Admission/РУП year — indicator so the same subject for different intake
      // years (e.g. История Казахстана 2023 vs 2024) is distinguishable.
      const year = academicYearStore.getAcademicYearById(
        rupEntryItem.academicYearId
      )?.startYear;
      // Semester resolved for the current context (the active semester, or the
      // passed-in selected-month one) — same logic the wizard uses to auto-pick
      // a semester, so the badge matches what gets selected next. No badge when
      // the entry has no distributed hours.
      const hasDistribution = (rupEntryItem.distributionEntries || []).some(
        (d: any) => Number(d.hours) > 0 && d.semesterId
      );
      const contextSemesterId =
        props.semesterContextId ||
        academicYearSemesterStore.getActiveAcademicYearSemester?.id;
      const resolvedSemesterId = hasDistribution
        ? rupEntryStore.getAutoSelectedSemesterForRupEntry(
            option.value,
            contextSemesterId
          )
        : undefined;
      const semester = resolvedSemesterId
        ? academicYearSemesterStore.getAcademicYearSemesterById(
            resolvedSemesterId
          )?.semesterNumber
        : undefined;
      return {
        ...option,
        moduleIndex: option.moduleIndex || rupEntryItem.moduleIndex,
        moduleName: option.moduleName || rupEntryItem.moduleName,
        learningOutcome: option.learningOutcome || rupEntryItem.learningOutcome,
        language: rupEntryItem.language,
        year,
        semester,
        specialtyChips: (rupEntryItem.specialtyIds || [])
          .map((sid) => specialtyStore.specialties.find((s: Specialty) => s.id === sid))
          .filter((s): s is Specialty => !!s),
      };
    })
);

// Clear a selection that fell out of the (year-)filtered list.
watch(options, (opts) => {
  if (props.modelValue && !opts.some((o) => o.value === props.modelValue)) {
    emit("update:modelValue", null);
  }
});
</script>
