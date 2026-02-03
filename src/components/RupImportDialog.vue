<template>
  <f7-popover
    id="rup-import-popover"
    :opened="opened"
    :arrow="false"
    style="
      width: calc(100vw - 60px) !important;
      max-width: 600px !important;
      height: auto !important;
      max-height: 80dvh !important;
    "
    @popover:closed="$emit('update:opened', false)"
  >
    <div class="rup-import-dialog bg-card text-card-foreground">
      <div class="fixed-header">
        <PopoverHeader
          title="Импорт тем из существующих РУП"
          cancel-text="Отмена"
          :on-cancel="handleClose"
          :is-loading="loading"
        />
      </div>

      <div class="scrollable-content p-4 space-y-4">
        <div class="text-sm text-muted-foreground">
          Выберите РУП, из которого хотите импортировать темы:
        </div>

        <!-- Filters -->
        <div
          class="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-muted/20 rounded-lg"
        >
          <Select
            v-model="selectedAcademicYear"
            :options="academicYearOptions"
            placeholder="Учебный год"
            name="academic-year-filter"
            class="w-full"
          />
          <Select
            v-model="selectedSemester"
            :options="semesterOptions"
            placeholder="Семестр"
            name="semester-filter"
            class="w-full"
          />
        </div>

        <div v-if="isLoading" class="text-center text-muted-foreground py-8">
          Загрузка РУП...
        </div>

        <div
          v-else-if="availableRups.length === 0"
          class="text-center text-muted-foreground py-8"
        >
          <div>Нет доступных РУП для импорта</div>
          <div class="text-xs mt-2">
            {{
              selectedAcademicYear || selectedSemester
                ? "Попробуйте изменить фильтры"
                : "Создайте дополнительные РУП в системе"
            }}
          </div>
        </div>

        <div v-else class="space-y-2">
          <div class="text-sm text-muted-foreground">
            Найдено РУП: {{ availableRups.length }}
          </div>
          <div
            v-for="rup in availableRups"
            :key="rup.id"
            class="border border-border rounded-lg p-3 cursor-pointer transition-colors"
            :class="{
              'ring-2 ring-primary bg-primary/10': selectedRupId === rup.id,
              'hover:bg-muted/50': selectedRupId !== rup.id,
            }"
            @click="selectRup(rup.id)"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="font-medium text-sm">
                  {{ rup.moduleIndex }} - {{ rup.moduleName }}
                </div>
                <div class="text-xs text-muted-foreground mt-1">
                  <span>Курс: {{ getCourseNumber(rup.courseId) }}</span>
                  <span class="mx-2">•</span>
                  <span>Часы: {{ rup.totalHours || "—" }}</span>
                  <span class="mx-2">•</span>
                  <span>Тем: {{ getThemeCount(rup.id) }}</span>
                </div>
              </div>
              <div class="flex items-center">
                <f7-radio
                  :value="rup.id"
                  :checked="selectedRupId === rup.id"
                  @change="selectRup(rup.id)"
                />
              </div>
            </div>
          </div>
        </div>

        <div v-if="selectedRupId && selectedRupThemes.length > 0" class="mt-6">
          <div class="text-sm font-medium mb-3">
            Темы для импорта ({{ selectedRupThemes.length }}):
          </div>
          <div class="max-h-48 overflow-y-auto border border-border rounded-lg">
            <div
              v-for="(theme, index) in selectedRupThemes"
              :key="theme.id"
              class="px-3 py-2 text-sm border-b border-border last:border-b-0"
            >
              <div class="flex items-start gap-2">
                <span class="text-muted-foreground min-w-[2rem]">
                  {{ theme.position }}.
                </span>
                <span class="flex-1">{{ theme.theme }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="fixed-footer border-t border-border bg-card p-4">
        <div class="flex gap-3 justify-end">
          <f7-button fill color="gray" @click="handleClose"> Отмена </f7-button>
          <f7-button
            fill
            :disabled="!selectedRupId || isImporting"
            @click="handleImport"
          >
            <f7-preloader v-if="isImporting" size="16" class="mr-2" />
            {{ isImporting ? "Импорт..." : "Импортировать" }}
          </f7-button>
        </div>
      </div>
    </div>
  </f7-popover>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { f7, f7Popover, f7Button, f7Radio, f7Preloader } from "framework7-vue";
import { useClass9Store, type Class9Data } from "@/stores/class9Store";
import { useKtpStore, type KtpDetail } from "@/stores/ktpStore";
import { useCourseStore } from "@/stores/courseStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useSemesterStore } from "@/stores/semesterStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import Select from "@/components/ui/Select.vue";
import { storeToRefs } from "pinia";

const props = defineProps<{
  opened: boolean;
  currentKtpId: string | null;
}>();

const emit = defineEmits<{
  (e: "update:opened", value: boolean): void;
  (e: "imported", count: number): void;
}>();

const class9Store = useClass9Store();
const ktpStore = useKtpStore();
const courseStore = useCourseStore();
const academicYearStore = useAcademicYearStore();
const semesterStore = useSemesterStore();
const { getAllClass9Items: allRups, isLoading } = storeToRefs(class9Store);
const { academicYears } = storeToRefs(academicYearStore);
const { semesters } = storeToRefs(semesterStore);

const selectedRupId = ref<string | null>(null);
const selectedAcademicYear = ref<string>("");
const selectedSemester = ref<string>("");
const isImporting = ref(false);
const loading = ref(false);

// Computed options for selectors
const academicYearOptions = computed(() => {
  const options = [{ value: "", text: "Все годы" }];
  return options.concat(
    academicYears.value.map((year) => ({
      value: year.id,
      text: year.name,
    }))
  );
});

const semesterOptions = computed(() => {
  // Add custom semesters from store if any
  return semesters.value.map((semester) => ({
    value: semester.id,
    text: semester.shortName || semester.fullName,
  }));
});

// Filter available RUPs excluding the current one and by selected filters
const availableRups = computed(() => {
  let filtered = allRups.value;

  // Exclude current parent
  if (props.currentKtpId) {
    filtered = filtered.filter((rup) => rup.id !== props.currentKtpId);
  }

  // Filter by academic year
  if (selectedAcademicYear.value) {
    filtered = filtered.filter(
      (rup) => rup.academicYearId === selectedAcademicYear.value
    );
  }

  // Note: Semester filtering would require additional data structure
  // For now, we'll keep it as placeholder since Class9Data doesn't have semester info

  return filtered;
});

// Get themes for the selected RUP
const selectedRupThemes = computed(() => {
  if (!selectedRupId.value) return [];
  // Use direct KTP ID method instead of class9-based method
  const ktp = ktpStore.findKtpByClass9Id(selectedRupId.value, selectedAcademicYear.value, selectedSemester.value);
  return ktp ? ktpStore.getDetailsByKtpId(ktp.id) : [];
});

const getCourseNumber = (courseId: string) => {
  const course = courseStore.getCourseById(courseId);
  return course ? course.number : "—";
};

const getThemeCount = (rupId: string) => {
  // Use direct KTP ID method instead of class9-based method
  const ktp = ktpStore.findKtpByClass9Id(rupId, selectedAcademicYear.value, selectedSemester.value);
  return ktp ? ktpStore.getDetailsByKtpId(ktp.id).length : 0;
};

const selectRup = (rupId: string) => {
  selectedRupId.value = rupId;
};

const handleClose = () => {
  selectedRupId.value = null;
  selectedAcademicYear.value = "";
  selectedSemester.value = "";
  emit("update:opened", false);
};

const handleImport = async () => {
  if (!selectedRupId.value || !props.currentKtpId) return;

  try {
    isImporting.value = true;

    const themesToImport = selectedRupThemes.value;
    if (themesToImport.length === 0) {
      f7.toast
        .create({
          text: "Нет тем для импорта",
          closeTimeout: 3000,
          cssClass: "color-red",
        })
        .open();
      return;
    }

    // Copy themes to current parent
    const importedThemes: Partial<KtpDetail>[] = themesToImport.map(
      (theme, index) => ({
        position: index + 1,
        theme: theme.theme,
        totalHours: theme.totalHours,
        srsp: theme.srsp,
        srs: theme.srs,
        homework: theme.homework,
        notes: theme.notes,
      })
    );

    // Clear existing themes for this KTP, then add imported ones
    const ktp = ktpStore.findKtpById(props.currentKtpId);
    if (!ktp) {
      throw new Error("KTP не найден");
    }
    ktpStore.ktpDetails = ktpStore.ktpDetails.filter((d) => d.ktpId !== ktp.id);

    for (const themeData of importedThemes) {
      ktpStore.addKtpDetail(ktp.id, themeData);
    }

    f7.toast
      .create({
        text: `Успешно импортировано ${importedThemes.length} тем`,
        closeTimeout: 3000,
        cssClass: "color-green",
      })
      .open();

    emit("imported", importedThemes.length);
    handleClose();
  } catch (error) {
    console.error("Import error:", error);
    f7.toast
      .create({
        text: "Ошибка при импорте тем",
        closeTimeout: 3000,
        cssClass: "color-red",
      })
      .open();
  } finally {
    isImporting.value = false;
  }
};

// Reset selected RUP when filters change
watch([selectedAcademicYear, selectedSemester], () => {
  selectedRupId.value = null;
});

</script>

<style scoped>
.rup-import-dialog {
  height: 100%;
  display: flex;
  flex-direction: column;
  max-height: 80dvh;
}

.fixed-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--f7-popover-bg-color);
  border-bottom: 1px solid var(--f7-border-color);
}

.scrollable-content {
  flex: 1;
  overflow-y: auto;
}

.fixed-footer {
  position: sticky;
  bottom: 0;
  z-index: 10;
  background-color: var(--f7-popover-bg-color);
}

#rup-import-popover {
  left: 50%;
  transform: translateX(-50%);
  top: 50%;
  transform: translate(-50%, -50%);
}
</style>
