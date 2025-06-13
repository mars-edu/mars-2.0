<template>
  <f7-page
    name="rup"
    class="flex flex-col h-screen bg-background text-foreground"
  >
    <Header
      @searchbar-enable="handleSearchbarEnable"
      @searchbar-disable="handleSearchbarDisable"
      class="hidden md:block flex-shrink-0 border-b border-border"
    />

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
                >Рабочие учебные планы:</span
              >
            </div>
            <div class="flex flex-col md:flex-row md:items-center md:gap-3">
              <SmartSelect
                v-model="selectedAcademicYear"
                :options="academicYearOptions"
                placeholder="Учебный год:"
                name="academic-year"
                class="w-[250px]"
              />
            </div>
          </div>

          <Accordion>
            <AccordionItem id="specialties" :default-expanded="true">
              <template #title>Специальности:</template>
              <template #selected-item>
                <span
                  v-if="selectedSpecialty"
                  class="ml-2 text-xs md:text-sm px-2 py-1 rounded-md ring-2 ring-primary bg-primary/10"
                >
                  {{ selectedSpecialty.codeName || selectedSpecialty.name }}
                </span>
              </template>
              <div class="flex flex-wrap items-center gap-2 md:gap-3">
                <template v-if="specialtyStore.isLoading">
                  <div
                    v-for="n in 3"
                    :key="n"
                    class="skeleton-text skeleton-effect-wave"
                  >
                    <div
                      class="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-background"
                    >
                      <f7-skeleton-block style="width: 80px; height: 20px" />
                      <f7-skeleton-block style="width: 120px; height: 16px" />
                    </div>
                  </div>
                </template>
                <div
                  v-else-if="specialtyStore.getError"
                  class="text-destructive"
                >
                  {{ specialtyStore.getError }}
                </div>
                <template v-else>
                  <div
                    v-for="specialty in specialties"
                    :key="specialty.id"
                    class="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                    :class="{
                      'ring-2 ring-primary bg-primary/10':
                        selectedSpecialtyId === specialty.id,
                    }"
                    @click="selectedSpecialtyId = specialty.id"
                  >
                    <span class="font-medium">
                      {{ specialty.codeName || specialty.name }}
                    </span>
                  </div>
                  <div
                    v-if="specialties.length === 0"
                    class="text-muted-foreground"
                  >
                    Нет специальностей
                  </div>
                </template>
              </div>
            </AccordionItem>

            <AccordionItem id="courses" :default-expanded="true">
              <template #title>Курсы:</template>
              <template #selected-item>
                <span
                  v-if="selectedCourse"
                  class="ml-2 text-xs md:text-sm px-2 py-1 rounded-md ring-2 ring-primary bg-primary/10"
                >
                  {{ selectedCourse.number }}
                </span>
              </template>
              <div class="flex flex-wrap items-center gap-2 md:gap-3">
                <template v-if="courseStore.isLoading">
                  <div
                    v-for="n in 4"
                    :key="n"
                    class="skeleton-text skeleton-effect-wave"
                  >
                    <div
                      class="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-background"
                    >
                      <f7-skeleton-block style="width: 40px; height: 20px" />
                      <f7-skeleton-block style="width: 60px; height: 16px" />
                    </div>
                  </div>
                </template>
                <div v-else-if="courseStore.getError" class="text-destructive">
                  {{ courseStore.getError }}
                </div>
                <template v-else>
                  <div
                    v-for="course in filteredVisibleCourses"
                    :key="course.id"
                    class="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                    :class="{
                      'ring-2 ring-primary bg-primary/10':
                        selectedCourseId === course.id,
                    }"
                    @click="selectedCourseId = course.id"
                  >
                    <span class="font-medium">
                      {{ course.number }}
                    </span>
                  </div>
                  <div
                    v-if="filteredVisibleCourses.length === 0"
                    class="w-full p-3 flex items-center justify-center"
                  >
                    <div
                      v-if="selectedSpecialtyId"
                      class="text-muted-foreground flex items-center gap-2"
                    >
                      <f7-icon
                        ios="f7:doc_text_search"
                        md="material:search_off"
                        size="18px"
                      ></f7-icon>
                      <span>Нет курсов</span>
                    </div>
                    <div
                      v-else
                      class="text-muted-foreground flex items-center gap-2"
                    >
                      <f7-icon
                        ios="f7:arrow_up"
                        md="material:keyboard_arrow_up"
                        size="18px"
                      ></f7-icon>
                      <span>Сначала выберите специальность</span>
                    </div>
                  </div>
                </template>
              </div>
            </AccordionItem>

            <AccordionItem id="workingPlans" :default-expanded="true">
              <template #title>Рабочий учебный план:</template>
              <template #actions>
                <ImportWorkingPlanDialog
                  :disabled="!(selectedSpecialtyId && selectedCourseId)"
                  :specialty-id="selectedSpecialtyId || ''"
                  :course-id="selectedCourseId || ''"
                  @import="handleImportWorkingPlan"
                />

                <AddWorkingPlanDialog
                  v-model:opened="showAddWorkingPlanDialog"
                  @submit="handleWorkingPlanSubmit"
                  :disabled="!(selectedSpecialtyId && selectedCourseId)"
                  :specialty-id="selectedSpecialtyId || ''"
                  :course-id="selectedCourseId || ''"
                />
              </template>
              <div
                v-if="selectedSpecialtyId && selectedCourseId"
                class="space-y-3"
              >
                <div class="mt-4">
                  <template v-if="selectedClassLevel === 9">
                    <Class9Table
                      :specialty-id="selectedSpecialtyId"
                      :course-id="selectedCourseId"
                    />
                  </template>
                  <template v-else>
                    <Class11Table
                      :specialty-id="selectedSpecialtyId"
                      :course-id="selectedCourseId"
                    />
                  </template>
                </div>
              </div>
              <div
                v-else-if="selectedSpecialtyId && !selectedCourseId"
                class="w-full p-3 flex items-center justify-center"
              >
                <div class="text-muted-foreground flex items-center gap-2">
                  <f7-icon
                    ios="f7:arrow_up"
                    md="material:keyboard_arrow_up"
                    size="18px"
                  ></f7-icon>
                  <span>Сначала выберите курс</span>
                </div>
              </div>
              <div v-else class="w-full p-3 flex items-center justify-center">
                <div class="text-muted-foreground flex items-center gap-2">
                  <f7-icon
                    ios="f7:arrow_up"
                    md="material:keyboard_arrow_up"
                    size="18px"
                  ></f7-icon>
                  <span>Сначала выберите специальность</span>
                </div>
              </div>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>

    <template #fixed>
      <f7-fab position="right-bottom" class="mb-6 mr-6">
        <f7-icon ios="f7:plus" md="material:add" class="text-white"></f7-icon>
        <f7-icon
          ios="f7:xmark"
          md="material:close"
          class="text-white"
        ></f7-icon>
        <f7-fab-buttons position="top" class="mr-2">
          <f7-fab-button
            label="Перевод курсов"
            class="bg-primary text-primary-foreground shadow-lg"
          >
            <f7-icon
              ios="f7:arrow_2_squarepath"
              md="material:language"
            ></f7-icon>
          </f7-fab-button>
        </f7-fab-buttons>
      </f7-fab>
    </template>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import {
  f7Page,
  f7Fab,
  f7FabButtons,
  f7FabButton,
  f7Icon,
  f7SkeletonBlock,
  f7,
} from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import AddWorkingPlanDialog from "@/components/AddWorkingPlanDialog.vue";
import Class9Table from "@/components/Class9Table.vue";
import Class11Table from "@/components/Class11Table.vue";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { useCourseStore } from "@/stores/courseStore";
import { useSelectedItemsStore } from "@/stores/selectedItemsStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import Accordion from "@/components/ui/accordion/Accordion.vue";
import AccordionItem from "@/components/ui/accordion/AccordionItem.vue";
import SmartSelect from "@/components/ui/SmartSelect.vue";
import { storeToRefs } from "pinia";
import ImportWorkingPlanDialog from "@/components/ImportWorkingPlanDialog.vue";

const searchbarEnabled = ref(false);
const activeNavItem = ref("rup");
const specialtyStore = useSpecialtyStore();
const courseStore = useCourseStore();
const selectedItemsStore = useSelectedItemsStore();
const academicYearStore = useAcademicYearStore();

const { specialties } = storeToRefs(specialtyStore);
const { academicYears } = storeToRefs(academicYearStore);
const { selectedSpecialty, selectedCourse } = storeToRefs(selectedItemsStore);

const selectedAcademicYear = ref("");

const academicYearOptions = computed(() => {
  return academicYears.value.map((year) => ({
    value: year.id,
    text: year.name,
  }));
});

selectedAcademicYear.value = academicYearStore.getActiveAcademicYear?.id || "";

const showAddWorkingPlanDialog = ref(false);
const showImportWorkingPlanDialog = ref(false);
const workingPlans = ref<
  Array<{ id: number; name: string; year: number; description?: string }>
>([]);
const selectedClassLevel = ref<9 | 11>(9);

const handleSearchbarEnable = () => {
  searchbarEnabled.value = true;
};

const handleSearchbarDisable = () => {
  searchbarEnabled.value = false;
};

const handleWorkingPlanSubmit = (data: { baseClass: number }) => {
  const newPlan = {
    id: Date.now(),
    name: `План ${data.baseClass} класс`,
    year: new Date().getFullYear(),
    baseClass: data.baseClass,
  };
  workingPlans.value.push(newPlan);
};

const handleImportWorkingPlan = () => {
  // TODO: implement import logic
};

const selectedSpecialtyId = computed({
  get: () => selectedItemsStore.selectedSpecialtyId,
  set: (value) => selectedItemsStore.setSelectedSpecialty(value),
});

const selectedCourseId = computed({
  get: () => selectedItemsStore.selectedCourseId,
  set: (value) => selectedItemsStore.setSelectedCourse(value),
});

const filteredVisibleCourses = computed(() => {
  if (!selectedSpecialtyId.value) return [];
  return courseStore.courses.filter((course) => course.isVisible !== false);
});

onMounted(async () => {
  await specialtyStore.fetchSpecialties();
  await courseStore.fetchCourses();
});
</script>
