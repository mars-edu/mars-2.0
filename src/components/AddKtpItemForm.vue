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

        <!-- Specialty (faculty) -->
        <div>
          <label class="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">
            Специальность
          </label>
          <Select
            placeholder="Все специальности"
            v-model="selectedSpecialtyId"
            :options="specialtySelectOptions"
            name="ktp-item-specialty"
            id="ktp-item-specialty"
            searchable
          />
        </div>

        <!-- Study year + Semester -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">
              Учебный год
            </label>
            <Select
              placeholder="Учебный год"
              v-model="innerAcademicYearId"
              :options="academicYearOptions"
              name="ktp-item-academic-year"
              id="ktp-item-academic-year"
            />
          </div>
          <div>
            <label class="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">
              Семестр
            </label>
            <Select
              placeholder="Семестр"
              v-model="innerSemesterId"
              :options="innerSemesterOptions"
              name="ktp-item-semester"
              id="ktp-item-semester"
            />
          </div>
        </div>

        <!-- RUP Entry Select -->
        <div>
          <label class="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">
            Дисциплина
          </label>
          <Select
            placeholder="Выберите из списка..."
            v-model="rupEntryId"
            :options="filteredRupEntryOptions"
            name="ktp-item-rupEntry"
            id="ktp-item-rupEntry"
            searchable
          />
        </div>

        <!-- Info hint -->
        <div
          v-if="!rupEntryId"
          class="flex items-start gap-3 p-4 rounded-xl bg-muted/50 text-muted-foreground text-sm"
        >
          <IconInfo class="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            Тематический план будет привязан к выбранной дисциплине
            для выбранного учебного года и семестра.
          </div>
        </div>

        <!-- Selected entry preview -->
        <div
          v-if="selectedEntry"
          class="p-4 rounded-xl border border-border bg-muted/30 space-y-2"
        >
          <div class="flex items-center gap-2">
            <IconBookOpen class="w-4 h-4 text-primary" />
            <span class="text-sm font-semibold">{{ selectedEntry.moduleIndex }} — {{ selectedEntry.moduleName }}</span>
          </div>
          <p
            v-if="selectedEntry.learningOutcome"
            class="text-xs text-muted-foreground ml-6"
          >
            {{ selectedEntry.learningOutcome }}
          </p>
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

        <!-- Languages -->
        <div>
          <label class="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">
            Языки обучения
          </label>
          <div class="flex gap-2">
            <button
              v-for="lang in KTP_LANGUAGES"
              :key="lang"
              type="button"
              class="px-4 py-2 rounded-xl text-sm font-bold transition-all"
              :class="selectedLanguages.includes(lang)
                ? 'bg-primary text-primary-foreground scale-105'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'"
              :data-testid="`ktp-lang-${lang}`"
              @click="toggleLanguage(lang)"
            >
              {{ lang }}
            </button>
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
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import Select from "@/components/ui/Select.vue";
import IconAlertCircle from "~icons/lucide/alert-circle";
import IconInfo from "~icons/lucide/info";
import IconBookOpen from "~icons/lucide/book-open";
import { KTP_COLORS, KTP_LANGUAGES } from "@/lib/ktpHelpers";
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
const specialtyStore = useSpecialtyStore();
const academicYearStore = useAcademicYearStore();
const { rupEntryOptions } = storeToRefs(rupEntryStore);
const { specialtyOptions } = storeToRefs(specialtyStore);
const { academicYears } = storeToRefs(academicYearStore);

const formError = ref("");

const rupEntryId = ref("");
const selectedColor = ref(KTP_COLORS[0]);
const selectedLanguages = ref<string[]>([]);

// In-form context selectors (defaulted from the page filters via props)
const selectedSpecialtyId = ref("");
const innerAcademicYearId = ref(props.selectedAcademicYearId ?? "");
const innerSemesterId = ref(props.selectedSemesterId ?? "");

const specialtySelectOptions = computed(() => [
  { value: "", text: "Все специальности" },
  ...specialtyOptions.value,
]);

const academicYearOptions = computed(() =>
  academicYears.value.map((year) => ({ value: year.id, text: year.name }))
);

const innerSemesterOptions = computed(() => {
  const yearId = innerAcademicYearId.value;
  const list = yearId
    ? academicYearSemesterStore.getAcademicYearSemestersByAcademicYear(yearId)
    : [];
  return list.map((ays) => ({
    value: ays.semesterNumber.toString(),
    text: `Семестр ${ays.semesterNumber}`,
  }));
});

// Sync defaults from page filters each time the popover opens
watch(
  () => props.opened,
  (opened) => {
    if (!opened) return;
    if (props.selectedAcademicYearId) {
      innerAcademicYearId.value = props.selectedAcademicYearId;
    }
    if (props.selectedSemesterId) {
      innerSemesterId.value = props.selectedSemesterId;
    }
  }
);

// Year change invalidates the semester choice; auto-select when possible
watch(innerAcademicYearId, (newYearId, oldYearId) => {
  if (newYearId === oldYearId) return;
  const auto = newYearId
    ? academicYearSemesterStore.getAutoSelectedSemesterForYear(newYearId)
    : null;
  innerSemesterId.value = auto ? auto.semesterNumber.toString() : "";
});

const toggleLanguage = (lang: string) => {
  if (selectedLanguages.value.includes(lang)) {
    selectedLanguages.value = selectedLanguages.value.filter((l) => l !== lang);
  } else {
    selectedLanguages.value = [...selectedLanguages.value, lang];
  }
};

// Disciplines filtered by the in-form specialty + RUP academic year.
// Semester deliberately does NOT hide disciplines: requiring a РУП hour
// distribution for the selected semester left teachers with a near-empty
// list (most РУПs only have rows for one semester). The semester is still
// used for the KTP record and the planned-hours budget lookup.
const filteredRupEntryOptions = computed(() => {
  const yearId = innerAcademicYearId.value;
  const specialtyId = selectedSpecialtyId.value;

  return rupEntryOptions.value.filter((option) => {
    const rupEntryItem = rupEntryStore.getRupEntryById(option.value);
    if (!rupEntryItem) return false;

    if (specialtyId && !rupEntryItem.specialtyIds.includes(specialtyId)) {
      return false;
    }

    return !yearId || rupEntryItem.academicYearId === yearId;
  });
});

// Clear a discipline that fell out of the filtered list
watch(filteredRupEntryOptions, (options) => {
  if (
    rupEntryId.value &&
    !options.some((o) => o.value === rupEntryId.value)
  ) {
    rupEntryId.value = "";
  }
});

// Show a preview of the selected RUP entry
const selectedEntry = computed(() => {
  if (!rupEntryId.value) return null;
  return rupEntryStore.getRupEntryById(rupEntryId.value) ?? null;
});

const isFormValid = computed(() => {
  return (
    !!rupEntryId.value &&
    !!innerAcademicYearId.value &&
    !!innerSemesterId.value
  );
});

const resetForm = () => {
  rupEntryId.value = "";
  formError.value = "";
  selectedColor.value = KTP_COLORS[0];
  selectedLanguages.value = [];
  selectedSpecialtyId.value = "";
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

    const ktp = await ktpStore.ensureKtpForRupEntry(
      rupEntryId.value,
      innerAcademicYearId.value,
      innerSemesterId.value,
      undefined,
      undefined,
      {
        color: selectedColor.value,
        languages: selectedLanguages.value.length
          ? selectedLanguages.value
          : undefined,
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
