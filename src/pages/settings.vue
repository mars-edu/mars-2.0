<template>
  <f7-page
    name="settings"
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
                >Настройки:</span
              >
            </div>
          </div>

          <!-- <Accordion>
            <AccordionItem id="courses" :default-expanded="true">
              <template #title>Курсы и семестры:</template>
              <template #actions>
                <AddCourseButton />
              </template>

              <div
                v-if="courseStore.isLoading || semesterStore.isLoading"
                class="p-4 flex justify-center"
              >
                <f7-preloader />
              </div>
              <div v-else class="space-y-6">
                <div
                  v-for="course in courses"
                  :key="course.id"
                  class="space-y-3"
                >
                  <div
                    class="flex items-center gap-2"
                    :id="`course-item-${course.id}`"
                  >
                    <span class="font-medium text-lg">{{ course.number }}</span>
                    <AddSemesterButton
                      :prefix="`course-${course.id}`"
                      default-type="semester"
                    />
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

                  <div class="flex flex-wrap items-center gap-2 md:gap-3">
                    <div
                      v-for="period in getSemestersByCourse(course)"
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
                </div>
              </div>
            </AccordionItem>
          </Accordion> -->
        </div>
      </div>
    </div>
  </f7-page>
  <EditCourseButton v-if="selectedCourse" :course="selectedCourse" />
  <EditSemesterButton v-if="selectedPeriod" :period="selectedPeriod" />
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import { f7, f7Preloader, f7Icon } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import Accordion from "@/components/ui/accordion/Accordion.vue";
import AccordionItem from "@/components/ui/accordion/AccordionItem.vue";
import AddCourseButton from "@/components/AddCourseButton.vue";
import EditCourseButton from "@/components/EditCourseButton.vue";
import AddSemesterButton from "@/components/AddSemesterButton.vue";
import EditSemesterButton from "@/components/EditSemesterButton.vue";
import { useCourseStore } from "@/stores/courseStore";
import { useSemesterStore } from "@/stores/semesterStore";
import { storeToRefs } from "pinia";
import type { Semester } from "@/stores/semesterStore";
import type { Course } from "@/stores/courseStore";

const activeNavItem = ref("settings");

const courseStore = useCourseStore();
const semesterStore = useSemesterStore();
const { courses } = storeToRefs(courseStore);

const semesters = computed(() => semesterStore.sortedSemesters);

const getSemestersByCourse = (course: Course) => {
  if (course.semesters && course.semesters.length) {
    return semesters.value.filter((p: Semester) =>
      course.semesters.includes(p.id)
    );
  }
  const regex = new RegExp(`^${course.number}\\b`);
  return semesters.value.filter((p: Semester) => regex.test(p.shortName));
};

const selectedSemester = ref<Semester | null>(null);
const selectedCourse = ref<{
  id: string;
  number: string;
  admissionYear: string;
  semesters: string[];
} | null>(null);

const openEditPeriod = async (period: AcademicPeriod) => {
  selectedPeriod.value = period;
  await nextTick();
  const targetEl = document.getElementById(`period-item-${period.id}`);
  if (targetEl) {
    f7.popover.open(`#edit-period-popover-${period.id}`, targetEl);
  }
};

const openEditCourse = async (course: Course) => {
  selectedCourse.value = {
    id: course.id,
    number: course.number,
    admissionYear: course.admissionYear,
    semesters: course.semesters || [],
  };
  await nextTick();
  const targetEl = document.getElementById(`course-item-${course.id}`);
  if (targetEl) {
    f7.popover.open(`#edit-settings-course-popover-${course.id}`, targetEl);
  }
};
</script>
