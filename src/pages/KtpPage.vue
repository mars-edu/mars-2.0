<template>
  <f7-page
    name="ktp"
    class="flex flex-col h-screen bg-background text-foreground"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <div class="flex flex-1 overflow-hidden">
      <Sidebar v-model:activeNavItem="activeNavItem" class="hidden md:block" />

      <div
        class="flex-1 overflow-y-auto p-3 md:p-4 bg-background pb-16 md:pb-6 relative transition-all duration-200"
        :class="contentMargin"
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
                class="grid grid-cols-[minmax(0,_1fr)_100px_100px_120px_100px] gap-4 px-4 py-2 bg-muted/50 text-sm text-muted-foreground"
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
                  class="grid grid-cols-[minmax(0,_1fr)_100px_100px_120px_100px] gap-4 px-4 py-3 items-center cursor-pointer hover:bg-muted/50"
                  @click="selectItem(item)"
                >
                  <div>
                    {{ item.moduleIndex }} - {{ item.moduleName }}
                    <br />
                    <span class="text-muted-foreground text-xs font-medium">{{
                      getKtpSubtitle(item)
                    }}</span>
                    <br />
                    <span class="text-muted-foreground text-sm">{{
                      item.learningOutcome
                    }}</span>
                  </div>
                  <div class="text-center">
                    {{ getCourseNumber((item as any).courseId || "") }}
                  </div>
                  <div class="text-center">{{ item.ktpTotalHours }}</div>
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
      :ktp-id="
        getKtpIdForClass9(
          selectedKtpParentId,
          selectedAcademicYearId ?? undefined,
          selectedSemesterId
        )
      "
    />

    <AddKtpItemForm
      v-model:opened="isAddItemFormOpen"
      :selected-academic-year-id="selectedAcademicYearId ?? undefined"
      :selected-semester-id="selectedSemesterId ?? undefined"
    />

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
import { ref, onMounted, computed, watch } from "vue";
import { f7Page, f7Icon, f7Fab, f7 } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import Select from "@/components/ui/Select.vue";
import KtpDetailPopup from "@/components/KtpDetailPopup.vue";
import AddKtpItemForm from "@/components/AddKtpItemForm.vue";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useClass9Store } from "@/stores/class9Store";
import { useSelectedItemsStore } from "@/stores/selectedItemsStore";
import { useSemesterStore } from "@/stores/semesterStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useCourseStore } from "@/stores/courseStore";
import { useKtpStore } from "@/stores/ktpStore";
import { useJournalStore } from "@/stores/journalStore";
import { useCalendarStore } from "@/stores/calendarStore";
import { storeToRefs } from "pinia";
import { useSidebar } from "@/composables/useSidebar";

const { contentMargin } = useSidebar();
const activeNavItem = ref("ktp");

const academicYearStore = useAcademicYearStore();
const { academicYears } = storeToRefs(academicYearStore);
const academicYearSemesterStore = useAcademicYearSemesterStore();

const class9Store = useClass9Store();
const journalStore = useJournalStore();
const calendarStore = useCalendarStore();

// Get KTP data and enrich with class9 information
const ktpItems = computed(() => {
  const ktps = ktpStore.ktps;
  const class9Items = class9Store.getAllClass9Items;

  return ktps
    .map((ktp) => {
      const class9Item = class9Items.find((c) => c.id === ktp.class9Id);
      if (!class9Item) return null;

      // Calculate total hours from KTP details
      const details = ktpStore.getDetailsByKtpId(ktp.id);
      const totalHours = details.reduce((sum, detail) => {
        return sum + (detail.totalHours || 0);
      }, 0);

      return {
        ...class9Item,
        ktpId: ktp.id,
        ktpTotalHours: totalHours,
        academicYearId: ktp.academicYearId,
        semesterId: ktp.semesterId,
        createdAt: ktp.createdAt,
        updatedAt: ktp.updatedAt,
      };
    })
    .filter(Boolean);
});

const isLoading = computed(() => ktpStore.loading || class9Store.isLoading);
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
    ? academicYearSemesterStore.getAcademicYearSemestersByAcademicYear(yearId)
    : [];
  return list.map((academicYearSemester) => ({
    value: academicYearSemester.semesterNumber.toString(),
    text: `Семестр ${academicYearSemester.semesterNumber}`,
  }));
});

const filteredKtpItems = computed(() => {
  const yearId = selectedAcademicYearId.value;
  const semId = selectedSemesterId.value;
  return ktpItems.value
    .filter((item) => item !== null)
    .filter((item) => {
      if (yearId && item.academicYearId !== yearId) return false;
      if (semId && item.semesterId !== semId) return false;
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

const getKtpSubtitle = (item: any) => {
  // Find the calendar event that corresponds to this KTP's class9Id and semester
  const events = calendarStore.filteredEvents;
  const matchingEvent = events.find((event: any) => {
    const actualEvent = event._custom?.value || event;
    return (
      actualEvent.class9Id === item.id &&
      actualEvent.semester === item.semesterId
    );
  });

  if (!matchingEvent) {
    return "";
  }

  // Get the journal using the event ID
  const eventId = matchingEvent._custom?.value?.id || matchingEvent.id;
  const journal = journalStore.getJournalById(eventId);

  if (!journal) {
    return "";
  }

  // Use the journalStore's subtitle method
  return journalStore.getJournalSubtitle(journal);
};

const { getKtpIdForClass9, getModuleTitleForKtp } = storeToRefs(ktpStore);

const selectItem = (item: any) => {
  selectedItemId.value = item.id;
  selectedKtpParentId.value = item.id;
  isPopupOpened.value = true;
};

const openAddDialog = () => {
  if (!selectedAcademicYearId.value) {
    f7.dialog.alert(
      "Пожалуйста, выберите учебный год перед добавлением КТП",
      "Предупреждение"
    );
    return;
  }
  if (!selectedSemesterId.value) {
    f7.dialog.alert(
      "Пожалуйста, выберите семестр перед добавлением КТП",
      "Предупреждение"
    );
    return;
  }
  isAddItemFormOpen.value = true;
};

onMounted(async () => {
  const activeYear = academicYearStore.getActiveAcademicYear;
  if (activeYear) {
    selectedItemsStore.setSelectedAcademicYear(activeYear.id);
  }

  // Set default semester if we have an active academic year
  if (activeYear && !selectedAcademicYearId.value) {
    const activeSemesters =
      academicYearSemesterStore.getActiveAcademicYearSemesters;
    if (activeSemesters.length > 0) {
      selectedSemesterId.value = activeSemesters[0].semesterNumber.toString();
    }
  }
});

const selectedAcademicYearModel = computed({
  get: () => selectedAcademicYearId.value ?? "",
  set: (v: string) => {
    selectedItemsStore.setSelectedAcademicYear(v || null);
    // Clear semester selection when academic year changes
    if (v !== selectedAcademicYearId.value) {
      selectedSemesterId.value = "";
    }
  },
});

// Watch for academic year changes and update semester options
watch(selectedAcademicYearId, (newYearId, oldYearId) => {
  if (newYearId !== oldYearId && newYearId) {
    // Clear semester selection when academic year changes
    selectedSemesterId.value = "";
  }
});
</script>

<style scoped></style>
