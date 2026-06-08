<template>
  <GuardedPopover
    v-slot="{ requestClose }"
    id="add-ktp-item-popover"
    :opened="opened"
    @popover:closed="onPopoverClosed"
    style="width: 575px !important; max-width: calc(100vw - 32px) !important"
  >
    <div class="bg-card text-card-foreground rounded-2xl overflow-hidden flex flex-col" style="max-height: 80dvh">
      <!-- Header -->
      <PopoverHeader
        title="Создание КТП"
        subtitle="Выберите дисциплину для нового плана"
        :on-cancel="requestClose"
      />

      <!-- Body -->
      <div class="flex-1 overflow-y-auto px-8 pb-6 space-y-6">
        <!-- Error banner -->
        <div
          v-if="formError"
          class="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium"
        >
          <IconAlertCircle class="w-4 h-4 flex-shrink-0" />
          {{ formError }}
        </div>

        <!-- Study year -->
        <div>
          <label class="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">
            Учебный год
          </label>
          <Select
            placeholder="Учебный год"
            v-model="selectedYearId"
            :options="academicYearOptions"
            name="ktp-item-academic-year"
            id="ktp-item-academic-year"
          />
        </div>

        <!-- RUP Entry Select -->
        <div>
          <label class="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">
            Дисциплина
          </label>
          <DisciplineSelect
            v-model="rupEntryId"
            :year-id="selectedYearId"
            name="ktp-item-rupEntry"
            id="ktp-item-rupEntry"
            placeholder="Выберите из списка..."
            search-placeholder="Поиск по дисциплине..."
          />
        </div>

        <!-- Info hint -->
        <div
          v-if="!rupEntryId"
          class="flex items-start gap-3 p-4 rounded-xl bg-muted/50 text-muted-foreground text-sm"
        >
          <IconInfo class="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>Тематический план будет привязан к выбранной дисциплине и строке распределения.</div>
        </div>

        <!-- Selected entry preview -->
        <div
          v-if="selectedEntry"
          class="p-4 rounded-xl border border-border bg-muted/30 space-y-2"
        >
          <div class="flex items-center gap-2">
            <IconBookOpen class="w-4 h-4 text-primary" />
            <span class="text-sm font-semibold">{{ selectedEntry.moduleIndex }} — {{ selectedEntry.moduleName }}</span>
            <span
              v-if="selectedEntry.language"
              class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary flex-shrink-0"
            >
              {{ selectedEntry.language.toUpperCase() }}
            </span>
          </div>
          <div
            v-if="specialtyChips.length"
            class="flex items-center gap-1.5 mt-2 ml-6"
          >
            <span
              v-for="sp in specialtyChips"
              :key="sp.id"
              class="px-2 py-0.5 text-[11px] font-bold rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
            >
              {{ sp.codeName || sp.name }}
            </span>
          </div>
          <p
            v-if="selectedEntry.learningOutcome"
            class="text-xs text-muted-foreground ml-6"
          >
            {{ selectedEntry.learningOutcome }}
          </p>
        </div>

        <!-- Распределение по курсам и семестрам -->
        <div v-if="selectedEntry">
          <label class="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">
            Распределение по курсам и семестрам
          </label>
          <div v-if="distributionRows.length" class="flex flex-col gap-2">
            <button
              v-for="row in distributionRows"
              :key="row.id"
              type="button"
              data-testid="ktp-dist-row"
              class="w-full flex items-center gap-3 p-3 rounded-xl border text-left text-sm transition-all"
              :class="selectedDistributionId === row.id
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border hover:border-primary/50'"
              @click="selectedDistributionId = row.id"
            >
              <span
                class="w-3 h-3 rounded-full flex-shrink-0 border"
                :class="selectedDistributionId === row.id
                  ? 'bg-primary border-primary'
                  : 'border-muted-foreground/40'"
              />
              {{ row.label }}
            </button>
          </div>
          <div
            v-else
            class="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 text-amber-600 text-sm"
          >
            <IconAlertCircle class="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>Нет распределения по семестрам — заполните РУП для этой дисциплины.</div>
          </div>
        </div>

        <!-- Color -->
        <div>
          <label class="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">
            Цвет
          </label>
          <div class="flex gap-2">
            <button
              v-for="color in KTP_COLORS"
              :key="color"
              type="button"
              class="w-8 h-8 rounded-lg transition-all"
              :class="selectedColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'"
              :style="{ backgroundColor: color }"
              :data-testid="`ktp-color-${color.slice(1)}`"
              @click="selectedColor = color"
            />
          </div>
        </div>
      </div>

      <!-- Footer -->
      <PopoverFooter
        save-text="Создать"
        save-variant="success"
        :on-save="handleSave"
        :on-cancel="requestClose"
        :disabled="!isFormValid || rupEntryStore.loading"
        :is-loading="rupEntryStore.loading"
      />
    </div>
  </GuardedPopover>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { f7 } from "framework7-vue";
import { storeToRefs } from "pinia";
import { useRupEntryStore } from "@/stores/rupEntryStore";
import { useKtpStore } from "@/stores/ktpStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useSpecialtyStore, type Specialty } from "@/stores/specialtyStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import Select from "@/components/ui/Select.vue";
import DisciplineSelect from "@/components/DisciplineSelect.vue";
import IconAlertCircle from "~icons/lucide/alert-circle";
import IconInfo from "~icons/lucide/info";
import IconBookOpen from "~icons/lucide/book-open";
import { KTP_COLORS, deriveKtpLanguages } from "@/lib/ktpHelpers";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";

const props = defineProps<{
  opened: boolean;
  selectedAcademicYearId?: string;
  selectedSemesterId?: string;
}>();

const emit = defineEmits(["update:opened"]);

const rupEntryStore = useRupEntryStore();
const ktpStore = useKtpStore();
const academicYearSemesterStore = useAcademicYearSemesterStore();
const academicYearStore = useAcademicYearStore();
const specialtyStore = useSpecialtyStore();
const { academicYears, getActiveAcademicYear } = storeToRefs(academicYearStore);

const formError = ref("");

const rupEntryId = ref("");
const selectedColor = ref(KTP_COLORS[0]);

// RUP-style cascade: study year → discipline → distribution row
const selectedYearId = ref("");
const selectedDistributionId = ref("");

const academicYearOptions = computed(() =>
  academicYears.value.map((year) => ({ value: year.id, text: year.name }))
);

// Default year: page filter if set, else the active academic year (rup.vue pattern)
const defaultYearId = () =>
  props.selectedAcademicYearId || getActiveAcademicYear.value?.id || "";

watch(
  () => props.opened,
  (opened) => {
    if (!opened) return;
    selectedYearId.value = defaultYearId();
  },
  { immediate: true }
);

// Year change invalidates discipline + row
watch(selectedYearId, () => {
  rupEntryId.value = "";
  selectedDistributionId.value = "";
});

// Show a preview of the selected RUP entry
const selectedEntry = computed(() => {
  if (!rupEntryId.value) return null;
  return rupEntryStore.getRupEntryById(rupEntryId.value) ?? null;
});

// Specialty chips for the selected discipline (rup.vue / RupEntryViewPopover pattern)
const specialtyChips = computed(() => {
  const entry = selectedEntry.value;
  if (!entry) return [];
  return (entry.specialtyIds || [])
    .map((id) => specialtyStore.specialties.find((s: Specialty) => s.id === id))
    .filter((s): s is Specialty => !!s);
});

interface DistributionRowOption {
  id: string;
  academicYearId: string;
  semesterId: string;
  label: string;
}

// «Распределение по курсам и семестрам» rows of the selected discipline.
// Each row's academicYearId+semesterId directly key the KTP.
const distributionRows = computed<DistributionRowOption[]>(() => {
  const entry = selectedEntry.value;
  if (!entry) return [];
  return entry.distributionEntries.map((d) => {
    const year = academicYearStore.getAcademicYearById(d.academicYearId);
    const yearLabel = year ? `${year.startYear}-${year.endYear}` : "—";
    const ays = academicYearSemesterStore.getAcademicYearSemesterById(
      d.semesterId
    );
    const semLabel = ays ? `Семестр ${ays.semesterNumber}` : "—";
    const hours = d.hours ? `${d.hours} ч.` : "— ч.";
    return {
      id: d.id,
      academicYearId: d.academicYearId,
      semesterId: d.semesterId,
      label: `${yearLabel} · ${semLabel} · ${hours}`,
    };
  });
});

const selectedDistributionRow = computed(
  () =>
    distributionRows.value.find((r) => r.id === selectedDistributionId.value) ??
    null
);

// Auto-select: single row, or the row matching the page filters
watch(
  [rupEntryId, distributionRows],
  () => {
    const rows = distributionRows.value;
    if (
      selectedDistributionId.value &&
      rows.some((r) => r.id === selectedDistributionId.value)
    ) {
      return; // current selection still valid
    }
    if (rows.length === 1) {
      selectedDistributionId.value = rows[0].id;
      return;
    }
    const fromFilters = rows.find(
      (r) =>
        props.selectedAcademicYearId &&
        props.selectedSemesterId &&
        r.academicYearId === props.selectedAcademicYearId &&
        r.semesterId === props.selectedSemesterId
    );
    selectedDistributionId.value = fromFilters ? fromFilters.id : "";
  }
);

const isFormValid = computed(() => {
  return !!rupEntryId.value && !!selectedDistributionRow.value;
});

const resetForm = () => {
  rupEntryId.value = "";
  formError.value = "";
  selectedColor.value = KTP_COLORS[0];
  selectedDistributionId.value = "";
  selectedYearId.value = defaultYearId();
};

const onPopoverClosed = () => {
  resetForm();
  emit("update:opened", false);
};



const handleSave = async () => {
  if (!isFormValid.value) {
    formError.value = "Пожалуйста, заполните все поля.";
    return;
  }

  try {
    const selectedItem = rupEntryStore.getRupEntryById(rupEntryId.value);
    if (!selectedItem) {
      formError.value = "Выбранный элемент не найден.";
      return;
    }

    const row = selectedDistributionRow.value;
    if (!row) {
      formError.value = "Выберите строку распределения.";
      return;
    }

    const ktp = await ktpStore.ensureKtpForRupEntry(
      rupEntryId.value,
      row.academicYearId,
      row.semesterId,
      undefined,
      undefined,
      {
        color: selectedColor.value,
        languages: deriveKtpLanguages(selectedItem.language),
      }
    );

    f7.toast
      .create({
        text: "Тематический план создан",
        closeTimeout: 1500,
        cssClass: "color-green",
      })
      .open();

    emit("update:opened", false);
  } catch (err) {
    formError.value =
      err instanceof Error ? err.message : "Не удалось добавить запись.";
  }
};
</script>
