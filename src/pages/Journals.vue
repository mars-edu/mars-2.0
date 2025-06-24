<template>
  <f7-page
    name="journals"
    class="flex flex-col h-screen bg-background text-foreground"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <div class="flex flex-1 overflow-hidden">
      <Sidebar v-model:activeNavItem="activeNavItem" class="hidden md:block" />

      <div
        class="flex-1 overflow-y-auto p-3 md:p-4 bg-background pb-16 md:pb-6 md:ml-52"
      >
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold">Журналы</h1>
            <div class="flex items-center gap-2">
              <SmartSelect
                v-model="selectedAcademicYear"
                :options="academicYearOptions"
                placeholder="Учебный год:"
                name="academic-year"
                class="w-40"
              />
              <f7-input
                type="text"
                placeholder="Семестр:"
                class="!border !border-border !rounded-lg !w-32 !text-center"
              />
            </div>
          </div>

          <div
            class="bg-card text-card-foreground rounded-xl p-3 md:p-4 shadow-sm"
          >
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div class="flex flex-col gap-2">
                <SmartSelect
                  v-model="selectedLessonType"
                  :options="lessonTypeOptions"
                  placeholder="Тип занятия: все"
                  name="lesson-type"
                />
              </div>
              <div class="flex flex-col gap-2">
                <SmartSelect
                  v-model="selectedTechnology"
                  :options="technologyOptions"
                  placeholder="Технология обучения: все"
                  name="technology"
                />
              </div>
              <div class="flex flex-col gap-2">
                <div class="grid grid-cols-2 gap-2">
                  <SmartSelect
                    v-model="selectedDiscipline"
                    :options="disciplineOptions"
                    placeholder="Дисциплина: все"
                    name="discipline"
                  />
                  <SmartSelect
                    v-model="selectedTerm"
                    :options="termOptions"
                    placeholder="Срок обучения: все"
                    name="term"
                  />
                </div>
              </div>
              <div class="flex flex-col gap-2">
                <div class="grid grid-cols-3 gap-2">
                  <SmartSelect
                    v-model="selectedStatus"
                    :options="statusOptions"
                    placeholder="Статус: все"
                    name="status"
                  />
                  <SmartSelect
                    v-model="selectedGroup"
                    :options="groupOptions"
                    placeholder="Группа: все"
                    name="group"
                  />
                  <SmartSelect
                    v-model="selectedRole"
                    :options="roleOptions"
                    placeholder="Роль: все"
                    name="role"
                  />
                </div>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                v-for="course in courses"
                :key="course.id"
                class="flex flex-col gap-2"
              >
                <h2 class="font-semibold text-sm text-center text-muted-foreground">
                  {{ course.number }} курс
                </h2>
                <div
                  v-for="journal in journalsByCourse[parseInt(course.number)]"
                  :key="journal.id"
                  class="rounded-lg p-3 text-gray-800 shadow-md min-h-[80px] flex flex-col justify-between transition-all duration-200"
                  :class="{
                    'bg-yellow-400 cursor-pointer hover:scale-102 hover:bg-yellow-500':
                      !journal.isPlaceholder,
                    'bg-yellow-200': journal.isPlaceholder,
                  }"
                  @click="!journal.isPlaceholder && goToJournalDetails(journal.id)"
                >
                  <p class="font-semibold text-sm leading-tight">
                    {{ journal.title }}
                  </p>
                  <div v-if="journal.status" class="flex justify-end mt-1">
                    <span
                      class="bg-green-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold"
                      >{{ journal.status }}</span
                    >
                  </div>
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
import SmartSelect from "@/components/ui/SmartSelect.vue";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useJournalStore } from "@/stores/journalStore";
import { useCourseStore } from "@/stores/courseStore";
import { storeToRefs } from "pinia";

const activeNavItem = ref("journals");

const academicYearStore = useAcademicYearStore();
const { academicYears } = storeToRefs(academicYearStore);

const journalStore = useJournalStore();
const { journalsByCourse } = storeToRefs(journalStore);

const courseStore = useCourseStore();
const { courses } = storeToRefs(courseStore);

const selectedAcademicYear = ref("");

const academicYearOptions = computed(() => {
  return academicYears.value.map((year) => ({
    value: year.id,
    text: year.name,
  }));
});

onMounted(async () => {
  await academicYearStore.fetchAcademicYears();
  selectedAcademicYear.value = academicYearStore.getActiveAcademicYear?.id || "";
  await courseStore.fetchCourses();
  await journalStore.fetchJournals();
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