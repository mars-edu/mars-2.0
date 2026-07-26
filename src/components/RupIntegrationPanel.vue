<template>
  <div>
    <!-- Integration with other specialties from other years -->
    <div class="pb-4 border-b border-border">
      <label class="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          v-model="isIntegrationEnabled"
          class="form-checkbox h-5 w-5 rounded border-gray-300 text-green-500 focus:ring-green-200 cursor-pointer"
        />
        <span class="flex items-center gap-2 text-foreground font-medium">
          <IconLink
            class="w-4 h-4"
            :class="isIntegrationEnabled ? 'text-green-600' : 'text-muted-foreground'"
          />
          Добавить интеграцию с другими специальностями других годов
        </span>
      </label>

      <div
        v-if="isIntegrationEnabled"
        class="mt-3 bg-green-500/8 border border-green-500/25 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <Select
          v-model="integrationYear"
          :options="availableIntegrationYears"
          label="Год поступления"
          placeholder="Выберите год"
        />
        <Select
          v-model="integrationSubjectId"
          :options="availableIntegrationSubjects"
          label="Предмет"
          placeholder="Выберите предмет"
          :disabled="!integrationYear"
          @update:modelValue="onApply"
        />
      </div>
    </div>

    <!-- Connect with base-9 (only for base-11 items) -->
    <div v-if="(props.baseClass ?? 9) === 11" class="pb-4 border-b border-border">
      <label class="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          v-model="isConnectChecked"
          class="form-checkbox h-5 w-5 rounded border-gray-300 text-yellow-500 focus:ring-yellow-200 cursor-pointer"
        />
        <span class="flex items-center gap-2 text-foreground font-medium">
          <IconLink
            class="w-4 h-4"
            :class="isConnectChecked ? 'text-yellow-600' : 'text-muted-foreground'"
          />
          Связать с базой 9 класса
        </span>
      </label>

      <div
        v-if="isConnectChecked"
        class="mt-3 bg-yellow-500/8 border border-yellow-500/25 rounded-xl p-4 space-y-2"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            v-model="connectYear"
            :options="availableConnectYears"
            label="Год поступления (база 9 кл)"
            placeholder="Выберите год"
          />
          <Select
            v-model="connectSubjectId"
            :options="availableConnectSubjects"
            label="Предмет"
            placeholder="Выберите предмет"
            :disabled="!connectYear"
            @update:modelValue="onApply"
          />
        </div>
        <p class="text-xs text-muted-foreground">
          Выберите предмет из сохранённой базы 9 класса, чтобы автоматически заполнить поля.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import Select from "@/components/ui/Select.vue";
import IconLink from "~icons/lucide/link";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useRupEntryStore } from "@/stores/rupEntryStore";

/**
 * Extracted from RupEntryPopup (spec-rupEntry-refactor P3): the two
 * "copy fields from another RUP entry" panels — integration (any year,
 * matching baseClass) and base-9 connect (only shown for base-11).
 * Emits `apply-source(subjectId)` when the user picks a source subject;
 * the parent's `applySource` handler does the actual copy into its form
 * state. This component owns only its own picker UI state.
 */
const props = defineProps<{
  academicYearId: string;
  baseClass?: number;
}>();

const emit = defineEmits<{
  (e: "apply-source", subjectId: string): void;
}>();

const academicYearStore = useAcademicYearStore();
const rupEntryStore = useRupEntryStore();

const isIntegrationEnabled = ref(false);
const integrationYear = ref("");
const integrationSubjectId = ref("");

const isConnectChecked = ref(false);
const connectYear = ref("");
const connectSubjectId = ref("");

const availableIntegrationYears = computed(() =>
  academicYearStore.academicYears
    .filter((y) => y.id !== props.academicYearId)
    .map((y) => ({
      value: y.id,
      text: `${y.startYear}-${y.endYear}`,
    }))
);

const availableIntegrationSubjects = computed(() => {
  if (!integrationYear.value) return [];
  const targetBase = props.baseClass ?? 9;
  return rupEntryStore.rupEntries
    .filter(
      (e) =>
        e.academicYearId === integrationYear.value &&
        (e.baseClass?.includes(targetBase) ?? false)
    )
    .map((e) => ({
      value: e.id,
      text: e.moduleIndex
        ? `${e.moduleIndex} — ${e.moduleName || "—"}`
        : e.moduleName || "—",
    }));
});

const availableConnectYears = computed(() =>
  academicYearStore.academicYears.map((y) => ({
    value: y.id,
    text: `${y.startYear}-${y.endYear}`,
  }))
);

const availableConnectSubjects = computed(() => {
  if (!connectYear.value) return [];
  return rupEntryStore.rupEntries
    .filter(
      (e) =>
        e.academicYearId === connectYear.value &&
        (e.baseClass?.includes(9) ?? false)
    )
    .map((e) => ({
      value: e.id,
      text: e.moduleIndex
        ? `${e.moduleIndex} — ${e.moduleName || "—"}`
        : e.moduleName || "—",
    }));
});

function onApply(subjectId: string) {
  if (subjectId) emit("apply-source", subjectId);
}

/** Called from parent's resetLocalState so a closed/reopened popup starts blank. */
defineExpose({
  reset() {
    isIntegrationEnabled.value = false;
    integrationYear.value = "";
    integrationSubjectId.value = "";
    isConnectChecked.value = false;
    connectYear.value = "";
    connectSubjectId.value = "";
  },
});
</script>
