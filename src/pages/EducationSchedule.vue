<template>
  <f7-page
    name="education-schedule"
    class="flex flex-col h-screen bg-background text-foreground"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <div class="flex flex-1 overflow-hidden">
      <Sidebar v-model:activeNavItem="activeNavItem" class="hidden md:block" />

      <div
        class="flex-1 overflow-y-auto p-3 md:p-4 bg-background pb-16 md:pb-6 md:ml-52"
      >
        <div
          class="bg-card text-card-foreground rounded-xl p-4 md:p-4 shadow-sm"
        >
          <div
            class="flex flex-col md:flex-row md:items-center md:gap-3 mb-4 md:mb-4"
          >
            <div
              class="flex flex-col md:flex-row md:items-center md:gap-3 flex-1 mb-4 md:mb-0"
            >
              <span
                class="text-base md:text-lg font-medium md:font-semibold mb-1 md:mb-0"
                >График звонков:</span
              >
            </div>
          </div>

          <Accordion>
            <AccordionItem id="schedule" :default-expanded="true">
              <template #title>Расписание звонков:</template>
              <template #actions>
                <AddEducationScheduleButton />
              </template>
              <div
                v-if="educationScheduleStore.isLoading"
                class="p-4 flex justify-center"
              >
                <f7-preloader></f7-preloader>
              </div>
              <div
                v-else-if="educationScheduleStore.getError"
                class="p-4 text-destructive"
              >
                {{ educationScheduleStore.getError }}
              </div>
              <div v-else class="flex flex-wrap items-center gap-2 md:gap-3">
                <div
                  v-for="schedule in schedules"
                  :key="schedule.id"
                  class="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                  :id="`schedule-item-${schedule.id}`"
                  @click.stop="openEditSchedule(schedule)"
                >
                  <span class="font-medium">
                    {{ schedule.lessonNumber }}.
                  </span>
                  <span class="text-sm">
                    {{ schedule.startTime }} - {{ schedule.endTime }}
                  </span>
                  <button
                    class="p-1 hover:bg-primary/10 rounded-md transition-colors"
                    @click.stop="openEditSchedule(schedule)"
                    aria-label="Edit Schedule"
                    type="button"
                  >
                    <f7-icon
                      ios="f7:pencil"
                      md="material:edit"
                      size="18px"
                      class="text-primary"
                    ></f7-icon>
                  </button>
                </div>
                <EditEducationScheduleButton
                  v-for="schedule in schedules"
                  :key="`edit-${schedule.id}`"
                  :schedule="schedule"
                />
              </div>
            </AccordionItem>

            <!-- Added Languages Section -->
            <AccordionItem id="languages" :default-expanded="false">
              <template #title>Языки:</template>
              <template #actions>
                <AddLanguageButton />
              </template>
              <div
                v-if="languageStore.isLoading"
                class="p-4 flex justify-center"
              >
                <f7-preloader></f7-preloader>
              </div>
              <div
                v-else-if="languageStore.getError"
                class="p-4 text-destructive"
              >
                {{ languageStore.getError }}
              </div>
              <div v-else class="flex flex-wrap items-center gap-2 md:gap-3">
                <div
                  v-for="language in languages"
                  :key="language.id"
                  class="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                  :id="`language-item-${language.id}`"
                >
                  <span class="font-medium">
                    {{ language.name }}
                  </span>
                  <span class="text-xs px-2 py-0.5 bg-muted rounded-full">
                    {{ language.code }}
                  </span>
                  <button
                    class="p-1 hover:bg-primary/10 rounded-md transition-colors"
                    @click.stop="openEditLanguage(language)"
                    aria-label="Edit Language"
                    type="button"
                  >
                    <f7-icon
                      ios="f7:pencil"
                      md="material:edit"
                      size="18px"
                      class="text-primary"
                    />
                  </button>
                </div>
                <EditLanguageButton
                  v-for="language in languages"
                  :key="`edit-${language.id}`"
                  :language="language"
                />
              </div>
            </AccordionItem>

            <!-- Added Courses Section -->
            <AccordionItem id="courses" :default-expanded="false">
              <template #title>Курсы:</template>
              <template #actions>
                <AddCourseButton />
              </template>
              <div v-if="courseStore.isLoading" class="p-4 flex justify-center">
                <f7-preloader></f7-preloader>
              </div>
              <div
                v-else-if="courseStore.getError"
                class="p-4 text-destructive"
              >
                {{ courseStore.getError }}
              </div>
              <div v-else class="flex flex-wrap items-center gap-2 md:gap-3">
                <div
                  v-for="course in courses"
                  :key="course.id"
                  class="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                  :id="`course-item-${course.id}`"
                >
                  <span class="font-medium">
                    {{ course.number }}
                  </span>
                  <button
                    class="p-1 hover:bg-primary/10 rounded-md transition-colors"
                    @click.stop="openEditCourse(course)"
                    aria-label="Edit Course"
                    type="button"
                  >
                    <f7-icon
                      ios="f7:pencil"
                      md="material:edit"
                      size="18px"
                      class="text-primary"
                    />
                  </button>
                </div>
                <EditCourseButton
                  v-for="course in courses"
                  :key="`edit-${course.id}`"
                  :course="{
                    id: course.id,
                    number: course.number,
                    admissionYear: course.admissionYear,
                  }"
                />
              </div>
            </AccordionItem>

            <!-- Added Academic Years Section -->
            <AccordionItem id="academic-years" :default-expanded="false">
              <template #title>Учебный год:</template>
              <template #actions>
                <AddAcademicYearButton />
              </template>
              <div
                v-if="academicYearStore.isLoading"
                class="p-4 flex justify-center"
              >
                <f7-preloader></f7-preloader>
              </div>
              <div
                v-else-if="academicYearStore.getError"
                class="p-4 text-destructive"
              >
                {{ academicYearStore.getError }}
              </div>
              <div v-else class="flex flex-wrap items-center gap-2 md:gap-3">
                <div
                  v-for="academicYear in academicYearStore.getSortedAcademicYears"
                  :key="academicYear.id"
                  @click.stop="handleSetActiveAcademicYear(academicYear)"
                  class="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                  :id="`academic-year-item-${academicYear.id}`"
                  :class="{ 'border-primary': academicYear.isActive }"
                >
                  <span class="font-medium">
                    {{ academicYear.name }}
                  </span>
                  <span
                    v-if="academicYear.isActive"
                    class="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full"
                  >
                    Активный
                  </span>
                  <button
                    v-if="!academicYear.isActive"
                    class="ml-auto p-1 hover:bg-primary/10 rounded-md transition-colors"
                    @click.stop="handleSetActiveAcademicYear(academicYear)"
                    aria-label="Set Active"
                    type="button"
                  >
                    <f7-icon
                      ios="f7:checkmark_circle"
                      md="material:check_circle"
                      size="18px"
                      class="text-primary"
                    />
                  </button>
                  <button
                    class="p-1 hover:bg-primary/10 rounded-md transition-colors"
                    @click.stop="openEditAcademicYear(academicYear)"
                    aria-label="Edit Academic Year"
                    type="button"
                  >
                    <f7-icon
                      ios="f7:pencil"
                      md="material:edit"
                      size="18px"
                      class="text-primary"
                    />
                  </button>
                </div>
                <EditAcademicYearButton
                  v-for="academicYear in academicYears"
                  :key="`edit-${academicYear.id}`"
                  :academic-year="academicYear"
                />
              </div>
            </AccordionItem>

            <AccordionItem id="semesters" :default-expanded="false">
              <template #title>Семестры:</template>
              <template #actions>
                <AddSemesterButton prefix="semester" default-type="semester" />
              </template>
              <div
                v-if="semesterStore.isLoading"
                class="p-4 flex justify-center"
              >
                <f7-preloader />
              </div>
              <div
                v-else-if="semesterStore.getError"
                class="p-4 text-destructive"
              >
                {{ semesterStore.getError }}
              </div>
              <div v-else class="flex flex-wrap items-center gap-2 md:gap-3">
                <div
                  v-for="period in semesters"
                  :key="period.id"
                  class="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                  :id="`period-item-${period.id}`"
                  @click.stop="openEditPeriod(period)"
                >
                  <span class="font-medium">{{ period.name }}</span>
                  <span class="text-xs px-2 py-0.5 bg-muted rounded-full"
                    >{{ period.startDate }} - {{ period.endDate }}</span
                  >
                  <button
                    class="p-1 hover:bg-primary/10 rounded-md transition-colors"
                    @click.stop="openEditPeriod(period)"
                    aria-label="Edit Semester"
                    type="button"
                  >
                    <f7-icon
                      ios="f7:pencil"
                      md="material:edit"
                      size="18px"
                      class="text-primary"
                    />
                  </button>
                </div>
              </div>
            </AccordionItem>

            <AccordionItem id="vacations" :default-expanded="false">
              <template #title>Каникулы:</template>
              <template #actions
                ><AddSemesterButton prefix="vacation" default-type="vacation"
              /></template>
              <div
                v-if="semesterStore.isLoading"
                class="p-4 flex justify-center"
              >
                <f7-preloader />
              </div>
              <div
                v-else-if="semesterStore.getError"
                class="p-4 text-destructive"
              >
                {{ semesterStore.getError }}
              </div>
              <div v-else class="flex flex-wrap items-center gap-2 md:gap-3">
                <div
                  v-for="period in vacations"
                  :key="period.id"
                  class="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                  :id="`period-item-${period.id}`"
                  @click.stop="openEditPeriod(period)"
                >
                  <span class="font-medium">{{ period.name }}</span>
                  <span class="text-xs px-2 py-0.5 bg-muted rounded-full"
                    >{{ period.startDate }} - {{ period.endDate }}</span
                  >
                  <button
                    class="p-1 hover:bg-primary/10 rounded-md transition-colors"
                    @click.stop="openEditPeriod(period)"
                    aria-label="Edit Vacation"
                    type="button"
                  >
                    <f7-icon
                      ios="f7:pencil"
                      md="material:edit"
                      size="18px"
                      class="text-primary"
                    />
                  </button>
                </div>
              </div>
            </AccordionItem>

            <AccordionItem id="sessions" :default-expanded="false">
              <template #title>Сессии:</template>
              <template #actions
                ><AddSemesterButton prefix="session" default-type="session"
              /></template>
              <div
                v-if="semesterStore.isLoading"
                class="p-4 flex justify-center"
              >
                <f7-preloader />
              </div>
              <div
                v-else-if="semesterStore.getError"
                class="p-4 text-destructive"
              >
                {{ semesterStore.getError }}
              </div>
              <div v-else class="flex flex-wrap items-center gap-2 md:gap-3">
                <div
                  v-for="period in sessions"
                  :key="period.id"
                  class="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                  :id="`period-item-${period.id}`"
                  @click.stop="openEditPeriod(period)"
                >
                  <span class="font-medium">{{ period.name }}</span>
                  <span class="text-xs px-2 py-0.5 bg-muted rounded-full"
                    >{{ period.startDate }} - {{ period.endDate }}</span
                  >
                  <button
                    class="p-1 hover:bg-primary/10 rounded-md transition-colors"
                    @click.stop="openEditPeriod(period)"
                    aria-label="Edit Session"
                    type="button"
                  >
                    <f7-icon
                      ios="f7:pencil"
                      md="material:edit"
                      size="18px"
                      class="text-primary"
                    />
                  </button>
                </div>
              </div>
            </AccordionItem>
          </Accordion>
          <EditSemesterButton v-if="selectedPeriod" :period="selectedPeriod" />
        </div>
      </div>
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from "vue";
import { f7Page, f7Icon, f7, f7Preloader } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import Accordion from "@/components/ui/accordion/Accordion.vue";
import AccordionItem from "@/components/ui/accordion/AccordionItem.vue";
import AddEducationScheduleButton from "@/components/AddEducationScheduleButton.vue";
import EditEducationScheduleButton from "@/components/EditEducationScheduleButton.vue";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { storeToRefs } from "pinia";
import type { EducationSchedule } from "@/stores/educationScheduleStore";
import AddLanguageButton from "@/components/AddLanguageButton.vue";
import EditLanguageButton from "@/components/EditLanguageButton.vue";
import { useLanguageStore } from "@/stores/languageStore";
import type { Language } from "@/stores/languageStore";
import AddCourseButton from "@/components/AddCourseButton.vue";
import EditCourseButton from "@/components/EditCourseButton.vue";
import { useCourseStore } from "@/stores/courseStore";
import type { Course } from "@/stores/courseStore";
import AddAcademicYearButton from "@/components/AddAcademicYearButton.vue";
import EditAcademicYearButton from "@/components/EditAcademicYearButton.vue";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import type { AcademicYear } from "@/stores/academicYearStore";
import AddSemesterButton from "@/components/AddSemesterButton.vue";
import EditSemesterButton from "@/components/EditSemesterButton.vue";
import { useSemesterStore } from "@/stores/semesterStore";
import type { AcademicPeriod } from "@/stores/semesterStore";

const activeNavItem = ref("education-schedule");
const educationScheduleStore = useEducationScheduleStore();
const { schedules } = storeToRefs(educationScheduleStore);

const languageStore = useLanguageStore();
const { languages } = storeToRefs(languageStore);

const courseStore = useCourseStore();
const { courses } = storeToRefs(courseStore);

const academicYearStore = useAcademicYearStore();
const { academicYears } = storeToRefs(academicYearStore);

const semesterStore = useSemesterStore();
const selectedPeriod = ref<AcademicPeriod | null>(null);
const semesters = computed(() => semesterStore.getPeriodsByType("semester"));
const vacations = computed(() => semesterStore.getPeriodsByType("vacation"));
const sessions = computed(() => semesterStore.getPeriodsByType("session"));

const openEditSchedule = (schedule: EducationSchedule) => {
  const targetEl = document.getElementById(`schedule-item-${schedule.id}`);
  if (targetEl) {
    f7.popover.open(`#edit-schedule-popover-${schedule.id}`, targetEl);
  }
};

const openEditLanguage = (language: Language) => {
  const targetEl = document.getElementById(`language-item-${language.id}`);
  if (targetEl) {
    f7.popover.open(`#edit-language-popover-${language.id}`, targetEl);
  }
};

const openEditCourse = (course: Course) => {
  const targetEl = document.getElementById(`course-item-${course.id}`);
  if (targetEl) {
    f7.popover.open(`#edit-settings-course-popover-${course.id}`, targetEl);
  }
};

const handleSetActiveAcademicYear = (academicYear: AcademicYear) => {
  academicYearStore.setActiveAcademicYear(academicYear.id);
};

const openEditAcademicYear = (academicYear: AcademicYear) => {
  const targetEl = document.getElementById(
    `academic-year-item-${academicYear.id}`
  );
  if (targetEl) {
    f7.popover.open(`#edit-academic-year-popover-${academicYear.id}`, targetEl);
  }
};

const formatPeriodType = (type: string) => {
  switch (type) {
    case "semester":
      return "Семестр";
    case "vacation":
      return "Каникулы";
    case "session":
      return "Сессия";
    default:
      return type;
  }
};

const openEditPeriod = async (period: AcademicPeriod) => {
  selectedPeriod.value = period;
  await nextTick();
  const targetEl = document.getElementById(`period-item-${period.id}`);
  if (targetEl) {
    f7.popover.open(`#edit-period-popover-${period.id}`, targetEl);
  }
};

onMounted(async () => {});
</script>
