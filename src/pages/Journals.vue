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
              <f7-input
                type="text"
                placeholder="Семестр:"
                class="!border !border-border !rounded-lg !w-36 !text-center !h-10 !bg-white"
              />
            </div>
          </div>

          <div
            class="bg-card text-card-foreground rounded-xl p-4 md:p-5 shadow-md"
          >
            <div class="flex flex-wrap gap-4 mb-6">
              <Select
                v-model="selectedLessonType"
                :options="lessonTypeOptions"
                placeholder="Тип занятия"
                name="lesson-type"
                class="flex-1 min-w-[200px]"
              />
              <Select
                v-model="selectedTechnology"
                :options="technologyOptions"
                placeholder="Технология обучения"
                name="technology"
                class="flex-1 min-w-[200px]"
              />
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
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div
                v-for="course in courses"
                :key="course.id"
                class="flex flex-col gap-3"
              >
                <h2
                  class="font-semibold text-sm text-center py-1 bg-muted rounded-md text-muted-foreground"
                >
                  {{ course.number }} курс
                </h2>
                <div
                  v-for="journal in journalEventsByCourse[
                    parseInt(course.number)
                  ]"
                  :key="journal.id"
                  class="rounded-lg p-4 text-gray-800 shadow-md min-h-[90px] flex flex-col justify-between transition-all duration-200"
                  :class="{
                    'bg-amber-400 cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:bg-amber-500':
                      !journal.isPlaceholder,
                    'bg-amber-100 border border-amber-200':
                      journal.isPlaceholder,
                  }"
                  @click="
                    !journal.isPlaceholder && goToJournalDetails(journal.id)
                  "
                >
                  <p class="font-semibold text-sm leading-tight">
                    {{ journal.title }}
                  </p>
                  <div v-if="journal.status" class="flex justify-end mt-2">
                    <span
                      class="bg-green-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold shadow-sm"
                      >{{ journal.status }}</span
                    >
                  </div>
                </div>
                <div
                  v-if="
                    journalEventsByCourse[parseInt(course.number)].length === 0
                  "
                  class="rounded-lg p-4 text-gray-500 shadow-sm min-h-[90px] flex items-center justify-center bg-gray-50 border border-gray-100"
                >
                  <p class="text-sm">Нет доступных журналов</p>
                </div>
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
import { f7Page, f7Input, f7 } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import Select from "@/components/ui/Select.vue";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useJournalStore } from "@/stores/journalStore";
import { useCourseStore } from "@/stores/courseStore";
import { useCalendarStore } from "@/stores/calendarStore";
import { storeToRefs } from "pinia";

const activeNavItem = ref("journals");

const academicYearStore = useAcademicYearStore();
const { academicYears } = storeToRefs(academicYearStore);

const journalStore = useJournalStore();
const { journalsByCourse } = storeToRefs(journalStore);

const courseStore = useCourseStore();
const { courses } = storeToRefs(courseStore);

const calendarStore = useCalendarStore();
const { events } = storeToRefs(calendarStore);

const selectedAcademicYear = ref("");

const academicYearOptions = computed(() => {
  return academicYears.value.map((year) => ({
    value: year.id,
    text: year.name,
  }));
});

// Convert calendar events to journal format
const journalEventsByCourse = computed(() => {
  const result: Record<number, any[]> = {};

  // Initialize result with empty arrays for each course
  courses.value.forEach((course) => {
    result[parseInt(course.number)] = [];
  });

  // Filter calendar events that can be considered as journals
  // and organize them by course
  events.value.forEach((event) => {
    // Extract course number from the event title or participants
    // For this example, we'll assume the first participant's first character is the course number
    if (event.participants && event.participants.length > 0) {
      const courseNumber = parseInt(event.participants[0].charAt(0));

      if (!isNaN(courseNumber) && result[courseNumber]) {
        result[courseNumber].push({
          id: event.id,
          title: event.title,
          isPlaceholder: false,
          status: event.result ? "✓" : null,
        });
      }
    }
  });

  // Fill with placeholder data if needed
  courses.value.forEach((course) => {
    const courseNumber = parseInt(course.number);
    if (result[courseNumber].length === 0) {
      result[courseNumber] = journalsByCourse.value[courseNumber] || [];
    }
  });

  return result;
});

onMounted(async () => {
  await academicYearStore.fetchAcademicYears();
  selectedAcademicYear.value =
    academicYearStore.getActiveAcademicYear?.id || "";
  await courseStore.fetchCourses();
  await journalStore.fetchJournals();
  await calendarStore.fetchEvents();
});

const goToJournalDetails = (id: number | string) => {
  f7.views.main.router.navigate(`/journals/${id}`);
};

const selectedLessonType = ref("");
const lessonTypeOptions = ref([
  { value: "", text: "все" },
  { value: "lecture", text: "Лекция" },
  { value: "practice", text: "Практика" },
]);

const selectedTechnology = ref("");
const technologyOptions = ref([
  { value: "", text: "все" },
  { value: "online", text: "Онлайн" },
  { value: "offline", text: "Офлайн" },
]);

const selectedDiscipline = ref("");
const disciplineOptions = ref([
  { value: "", text: "все" },
  { value: "philosophy", text: "Философия" },
]);

const selectedTerm = ref("");
const termOptions = ref([
  { value: "", text: "все" },
  { value: "1y", text: "1 год" },
]);

const selectedStatus = ref("");
const statusOptions = ref([
  { value: "", text: "все" },
  { value: "active", text: "Активный" },
]);

const selectedGroup = ref("");
const groupOptions = ref([
  { value: "", text: "все" },
  { value: "pi-1-21", text: "ПИ-1-21" },
]);

const selectedRole = ref("");
const roleOptions = ref([
  { value: "", text: "все" },
  { value: "student", text: "Студент" },
]);
</script>

<style>
.journals-page-header .smart-select-list-container {
  background-color: #ffffff !important;
}

.journals-page-header .smart-select-list-container .item-inner {
  background-color: #ffffff !important;
}
</style>
