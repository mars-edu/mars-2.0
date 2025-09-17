<template>
  <f7-page
    name="journals"
    class="journals-page flex flex-col h-screen bg-background text-foreground"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <div class="flex flex-1 overflow-hidden">
      <Sidebar v-model:activeNavItem="activeNavItem" class="hidden md:block" />

      <div
        class="flex-1 overflow-y-auto p-3 md:p-4 bg-background pb-16 md:pb-6 md:ml-52"
      >
        <div class="flex flex-col gap-4">
          <div
            class="flex flex-col md:flex-row md:items-center justify-between gap-3 journals-page-header"
          >
            <h1 class="text-2xl font-semibold">Журналы</h1>
            <div class="flex items-center gap-3">
              <Select
                v-model="selectedAcademicYear"
                :options="academicYearOptions"
                placeholder="Учебный год:"
                name="academic-year"
                class="w-44"
              />
              <Select
                v-model="selectedSemesterId"
                :options="semesterOptions"
                placeholder="Семестр:"
                name="semester"
                class="w-44"
              />
            </div>
          </div>

          <div
            class="bg-card text-card-foreground rounded-xl p-4 md:p-5 shadow-md"
          >
            <div class="flex flex-wrap gap-4 mb-6">
              <Select
                v-model="selectedDiscipline"
                :options="disciplineOptions"
                placeholder="Дисциплина"
                name="discipline"
                class="flex-1 min-w-[200px]"
              />
              <Select
                v-model="selectedTerm"
                :options="termOptions"
                placeholder="Срок обучения"
                name="term"
                class="flex-1 min-w-[200px]"
              />
              <Select
                v-model="selectedStatus"
                :options="statusOptions"
                placeholder="Статус"
                name="status"
                class="flex-1 min-w-[200px]"
              />
              <Select
                v-model="selectedGroup"
                :options="groupOptions"
                placeholder="Группа"
                name="group"
                class="flex-1 min-w-[200px]"
              />
              <Select
                v-model="selectedRole"
                :options="roleOptions"
                placeholder="Роль"
                name="role"
                class="flex-1 min-w-[200px]"
              />
            </div>
            <div class="mb-3 flex flex-wrap gap-2 items-center justify-end">
              <f7-button
                id="journal-settings-button"
                small
                default
                @click="onSettingsClick"
                class="bg-gray-200 text-gray-700 hover:bg-primary hover:text-white transition-colors"
              >
                <f7-icon
                  ios="f7:gear"
                  md="material:settings"
                  size="16px"
                  class="mr-2"
                />
                Настройки
              </f7-button>
              <f7-button
                small
                default
                @click="onCloseJournalClick"
                class="bg-gray-200 text-gray-700 hover:bg-primary hover:text-white transition-colors"
              >
                <f7-icon
                  ios="f7:xmark_circle"
                  md="material:cancel"
                  size="16px"
                  class="mr-2"
                />
                Закрыть журнал
              </f7-button>
              <f7-button
                small
                default
                @click="onDownloadClick"
                class="bg-gray-200 text-gray-700 hover:bg-primary hover:text-white transition-colors"
              >
                <f7-icon
                  ios="f7:arrow_down_to_line"
                  md="material:file_download"
                  size="16px"
                  class="mr-2"
                />
                Скачать
              </f7-button>
              <f7-button
                small
                default
                @click="onUploadClick"
                class="bg-gray-200 text-gray-700 hover:bg-primary hover:text-white transition-colors"
              >
                <f7-icon
                  ios="f7:arrow_up_to_line"
                  md="material:file_upload"
                  size="16px"
                  class="mr-2"
                />
                Загрузить
              </f7-button>
              <f7-button
                small
                default
                @click="onShareClick"
                class="bg-gray-200 text-gray-700 hover:bg-primary hover:text-white transition-colors"
              >
                <f7-icon
                  ios="f7:share"
                  md="material:share"
                  size="16px"
                  class="mr-2"
                />
                Поделится
              </f7-button>
            </div>
            <div class="overflow-x-auto">
              <div class="flex gap-5 w-full">
                <template v-for="(course, idx) in courses" :key="course.id">
                  <div class="flex flex-col gap-3 w-full">
                    <h2
                      class="font-semibold text-sm text-center py-1 bg-muted rounded-md text-muted-foreground"
                    >
                      {{ course.number }} курс
                    </h2>
                    <div
                      v-for="journal in journalsByCourse[
                        parseInt(course.number)
                      ]"
                      :key="journal.id"
                    >
                      <JournalCard
                        :title="journalStore.getDisciplineTitle(journal)"
                        :subtitle="journalStore.getJournalSubtitle(journal)"
                        :schedule="journalStore.getJournalScheduleText(journal)"
                        :percent="journalStore.getJournalPercent(journal)"
                        @click="goToJournalDetails(journal.id)"
                      />
                    </div>
                    <div
                      v-if="
                        journalsByCourse[parseInt(course.number)].length === 0
                      "
                      class="rounded-lg p-4 text-gray-500 shadow-sm min-h-[90px] flex items-center justify-center bg-gray-50 border border-gray-100"
                    >
                      <p class="text-sm">Нет доступных журналов</p>
                    </div>
                  </div>
                  <div v-if="idx === 3" class="flex flex-col gap-3 w-full">
                    <h2
                      class="font-semibold text-sm text-center py-1 bg-muted rounded-md text-muted-foreground"
                    >
                      смешанные группы
                    </h2>
                    <div
                      v-for="journal in mixedGroupJournals"
                      :key="journal.id"
                      class="rounded-lg p-4 text-gray-800 shadow-md min-h-[90px] flex flex-col justify-between transition-all duration-200 bg-blue-100 border border-blue-200"
                    >
                      <p class="font-semibold text-sm leading-tight">
                        {{ getJournalTitle(journal) }}
                      </p>
                    </div>
                    <div
                      v-if="mixedGroupJournals.length === 0"
                      class="rounded-lg p-4 text-gray-500 shadow-sm min-h-[90px] flex items-center justify-center bg-gray-50 border border-gray-100"
                    >
                      <p class="text-sm">Нет доступных журналов</p>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { f7Page, f7Input, f7, f7Icon, f7Button } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import Select from "@/components/ui/Select.vue";
import JournalCard from "@/components/Cards/JournalCard.vue";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useSemesterStore } from "@/stores/semesterStore";
import { useJournalStore, type Journal } from "@/stores/journalStore";
import { useCourseStore } from "@/stores/courseStore";
import { storeToRefs } from "pinia";

const activeNavItem = ref("journals");

const journalStore = useJournalStore();
const { journalsByCourse, mixedGroupJournals } = storeToRefs(journalStore);

const courseStore = useCourseStore();
const { courses } = storeToRefs(courseStore);

const academicYearStore = useAcademicYearStore();
const { academicYears } = storeToRefs(academicYearStore);
const semesterStore = useSemesterStore();
const { sortedSemesters } = storeToRefs(semesterStore);

function getJournalTitle(journal: Journal) {
  if (!journal.students || journal.students.length === 0) {
    return `Журнал курса ${journal.courseNumber}`;
  }
  return journalStore.generateJournalTitle(
    journal.courseNumber,
    journal.students || []
  );
}

const selectedAcademicYear = ref("");
const selectedSemesterId = ref("");

const academicYearOptions = computed(() => {
  return academicYears.value.map((year) => ({
    value: year.id,
    text: year.name,
  }));
});

const semesterOptions = computed(() => {
  const yearId = selectedAcademicYear.value;
  const list = yearId
    ? semesterStore.getSemestersByAcademicYear(yearId)
    : sortedSemesters.value;
  return list.map((s) => ({ value: s.id, text: s.shortName || s.fullName }));
});

onMounted(async () => {
  selectedAcademicYear.value =
    academicYearStore.getActiveAcademicYear?.id || "";
  const activeSem = semesterStore.getActiveSemester;
  if (
    activeSem &&
    (!selectedAcademicYear.value ||
      activeSem.academicYearId === selectedAcademicYear.value)
  ) {
    selectedSemesterId.value = activeSem.id;
  }
});

const goToJournalDetails = (id: number | string) => {
  f7.views.main.router.navigate(`/journals/${id}`);
};

const selectedDiscipline = ref("");
const disciplineOptions = [{ value: "philosophy", text: "Философия" }];

const selectedTerm = ref("");
const termOptions = ref([{ value: "1y", text: "1 год" }]);

const selectedStatus = ref("");
const statusOptions = ref([{ value: "active", text: "Активный" }]);

const selectedGroup = ref("");
const groupOptions = ref([{ value: "pi-1-21", text: "ПИ-1-21" }]);

const selectedRole = ref("");
const roleOptions = ref([{ value: "student", text: "Студент" }]);

function onSettingsClick() {
  f7.dialog.alert("Откроются настройки журнала");
}

function onCloseJournalClick() {
  f7.dialog.alert("Журнал будет закрыт");
}

function onDownloadClick() {
  f7.dialog.alert("Скачать данные журналов");
}

function onUploadClick() {
  f7.dialog.alert("Загрузить данные в журналы");
}

function onShareClick() {
  f7.dialog.alert("Поделиться журналами");
}
</script>

<style>
.journals-page-header .smart-select-list-container {
  background-color: #ffffff !important;
}

.journals-page-header .smart-select-list-container .item-inner {
  background-color: #ffffff !important;
}
</style>
