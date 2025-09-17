<template>
  <f7-page
    name="ktp"
    class="flex flex-col h-screen bg-background text-foreground"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <div class="flex flex-1 overflow-hidden">
      <Sidebar v-model:activeNavItem="activeNavItem" class="hidden md:block" />

      <div
        class="flex-1 overflow-y-auto p-3 md:p-4 bg-background pb-16 md:pb-6 md:ml-52 relative"
      >
        <div
          class="bg-card text-card-foreground rounded-xl p-4 md:p-4 shadow-sm"
        >
          <div
            class="flex flex-col md:flex-row md:items-center md:justify-between md:gap-3 mb-4 md:mb-4"
          >
            <span
              class="text-base md:text-lg font-medium md:font-semibold mb-1 md:mb-0"
            >
              Рабочие учебные программы
            </span>
            <div class="flex flex-col md:flex-row md:items-center md:gap-3">
              <Select
                v-model="selectedAcademicYearModel"
                :options="academicYearOptions"
                placeholder="Учебный год:"
                name="academic-year"
                class="w-[250px]"
              />
              <Select
                v-model="selectedSemesterId"
                :options="semesterOptions"
                placeholder="Семестр:"
                name="semester"
                class="w-[220px]"
              />
            </div>
          </div>

          <div class="space-y-3">
            <div class="border border-border rounded-lg overflow-hidden">
              <div
                class="grid grid-cols-[minmax(0,_1fr)_100px_100px_120px_120px] gap-4 px-4 py-2 bg-muted/50 text-sm text-muted-foreground"
              >
                <div class="font-medium">Модуль/дисциплина</div>
                <div class="font-medium text-center">Курс</div>
                <div class="font-medium text-center">Часы</div>
                <div class="font-medium text-center">Язык</div>
                <div class="font-medium text-center">Группы</div>
              </div>

              <div
                v-if="isLoading"
                class="p-4 text-center text-muted-foreground"
              >
                Загрузка данных...
              </div>
              <div
                v-else-if="ktpItems.length === 0"
                class="p-4 text-center text-muted-foreground"
              >
                Нет данных для отображения.
              </div>
              <div v-else class="divide-y divide-border">
                <div
                  v-for="item in filteredKtpItems"
                  :key="item.id"
                  class="grid grid-cols-[minmax(0,_1fr)_100px_100px_120px_120px] gap-4 px-4 py-3 items-center cursor-pointer"
                  :class="{
                    'ring-2 ring-primary bg-primary/10 font-semibold':
                      item.id === selectedItemId,
                    'hover:bg-muted/50': item.id !== selectedItemId,
                  }"
                  @click="selectItem(item)"
                >
                  <div>
                    {{ item.moduleIndex }} - {{ item.moduleName }}
                    <br />
                    <span class="text-muted-foreground text-sm">{{
                      item.learningOutcome
                    }}</span>
                  </div>
                  <div class="text-center">
                    {{ getCourseNumber(item.courseId) }}
                  </div>
                  <div class="text-center">{{ item.totalHours }}</div>
                  <div class="text-center">—</div>
                  <div class="text-center">—</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <KtpDetailPopup
      v-model:opened="isPopupOpened"
      :class9-id="selectedKtpParentId"
    />

    <AddKtpItemForm v-model:opened="isAddItemFormOpen" />

    <template #fixed>
      <f7-fab
        position="right-bottom"
        slot="fixed"
        @click="openAddDialog"
        id="ktp-page-add-button"
        :disabled="isAddDisabled"
      >
        <f7-icon ios="f7:plus" md="material:add"></f7-icon>
      </f7-fab>
    </template>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { f7Page, f7Icon, f7Fab, f7 } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import Select from "@/components/ui/Select.vue";
import KtpDetailPopup from "@/components/KtpDetailPopup.vue";
import AddKtpItemForm from "@/components/AddKtpItemForm.vue";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useClass9Store, type Class9Data } from "@/stores/class9Store";
import { useSelectedItemsStore } from "@/stores/selectedItemsStore";
import { useSemesterStore } from "@/stores/semesterStore";
import { useCourseStore } from "@/stores/courseStore";
import { useKtpStore } from "@/stores/ktpStore";
import { storeToRefs } from "pinia";

const activeNavItem = ref("ktp");

const academicYearStore = useAcademicYearStore();
const { academicYears } = storeToRefs(academicYearStore);

const class9Store = useClass9Store();
const { getAllClass9Items: ktpItems, isLoading } = storeToRefs(class9Store);
const courseStore = useCourseStore();
const semesterStore = useSemesterStore();
const { sortedSemesters } = storeToRefs(semesterStore);
const ktpStore = useKtpStore();

const selectedItemsStore = useSelectedItemsStore();
const {
  selectedAcademicYearId,
  selectedSpecialtyId: selectedSpecialtyIdStore,
  selectedCourseId: selectedCourseIdStore,
} = storeToRefs(selectedItemsStore);
const selectedItemId = ref<string | null>(null);
const isPopupOpened = ref(false);
const selectedKtpParentId = ref<string | null>(null);
const isAddItemFormOpen = ref(false);
const selectedSemesterId = ref<string>("");

const academicYearOptions = computed(() => {
  return academicYears.value.map((year) => ({
    value: year.id,
    text: year.name,
  }));
});

const semesterOptions = computed(() => {
  const yearId = selectedAcademicYearId.value;
  const list = yearId
    ? semesterStore.getSemestersByAcademicYear(yearId)
    : sortedSemesters.value;
  return list.map((s) => ({ value: s.id, text: s.shortName || s.fullName }));
});

const filteredKtpItems = computed(() => {
  const yearId = selectedAcademicYearId.value;
  const semId = selectedSemesterId.value;
  return ktpItems.value.filter((item) => {
    if (yearId && item.academicYearId !== yearId) return false;
    // TODO: If class9 has semester field, also filter by semId
    return true;
  });
});

const isAddDisabled = computed(
  () =>
    !selectedAcademicYearId.value ||
    !selectedSpecialtyIdStore.value ||
    !selectedCourseIdStore.value
);

const getCourseNumber = (courseId: string) => {
  const course = courseStore.getCourseById(courseId);
  return course ? course.number : "—";
};

const selectItem = (item: Class9Data) => {
  selectedItemId.value = item.id;
  selectedKtpParentId.value = item.id;
  isPopupOpened.value = true;
};

const openAddDialog = () => {
  isAddItemFormOpen.value = true;
};

onMounted(async () => {
  const activeYear = academicYearStore.getActiveAcademicYear;
  if (activeYear) {
    selectedItemsStore.setSelectedAcademicYear(activeYear.id);
  }
  const activeSem = semesterStore.getActiveSemester;
  if (
    activeSem &&
    (!selectedAcademicYearId.value ||
      activeSem.academicYearId === selectedAcademicYearId.value)
  ) {
    selectedSemesterId.value = activeSem.id;
  }
  // Run KTP migration once at page entry
  ktpStore.migrateLegacy();
});

const selectedAcademicYearModel = computed({
  get: () => selectedAcademicYearId.value ?? "",
  set: (v: string) => {
    selectedItemsStore.setSelectedAcademicYear(v || null);
  },
});
</script>

<style scoped></style>
