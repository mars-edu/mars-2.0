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
            <!-- <div class="flex flex-col md:flex-row md:items-center md:gap-3">
              <span
                class="text-base md:text-lg font-medium md:font-semibold mb-1 md:mb-0"
                >Учебный год:</span
              >
              <div
                class="border border-input rounded-lg px-2 md:px-3 py-1 md:py-2 flex items-center bg-background"
              >
                <input
                  type="text"
                  value="2025-2026"
                  class="w-full md:w-28 text-center focus:outline-none bg-transparent"
                />
                <div class="flex ml-2 md:ml-3 gap-1 md:gap-2">
                  <button
                    class="p-1 md:p-1.5 hover:bg-muted rounded-md transition-colors"
                  >
                    <f7-icon
                      ios="f7:doc"
                      md="material:file_copy"
                      size="18px"
                      class="text-foreground/60"
                    ></f7-icon>
                  </button>
                  <button
                    class="p-1 md:p-1.5 hover:bg-muted rounded-md transition-colors"
                  >
                    <f7-icon
                      ios="f7:pencil"
                      md="material:edit"
                      size="18px"
                      class="text-foreground/60"
                    ></f7-icon>
                  </button>
                  <button
                    class="p-1 md:p-1.5 hover:bg-green-500 rounded-full transition-colors"
                  >
                    <f7-icon
                      ios="f7:plus"
                      md="material:add"
                      size="18px"
                      class="text-green-500 hover:text-white"
                    ></f7-icon>
                  </button>
                </div>
              </div>
            </div> -->
          </div>

          <div class="space-y-2 md:space-y-3">
            <div
              class="border border-border rounded-lg md:rounded-xl overflow-hidden"
            >
              <div
                class="px-3 md:px-4 py-1.5 md:py-2 bg-muted bg-gray-50 md:bg-muted flex items-center justify-between cursor-pointer hover:bg-muted/80 transition-colors"
                @click="toggleSection('specialties')"
              >
                <div class="flex items-center">
                  <f7-icon
                    :ios="
                      specialtiesExpanded
                        ? 'f7:chevron_down'
                        : 'f7:chevron_right'
                    "
                    :md="
                      specialtiesExpanded
                        ? 'material:expand_more'
                        : 'material:chevron_right'
                    "
                    size="14px"
                    class="mr-1 md:mr-2 text-foreground/60"
                  ></f7-icon>
                  <span class="font-medium text-sm md:text-base"
                    >Специальности:</span
                  >
                  <span
                    v-if="!specialtiesExpanded && selectedSpecialty"
                    class="ml-2 text-xs md:text-sm px-2 py-1 rounded-md ring-2 ring-primary bg-primary/10"
                  >
                    {{ selectedSpecialty.codeName || selectedSpecialty.name }}
                  </span>
                </div>
                <div class="flex items-center gap-1 md:gap-2">
                  <AddSpecialtyButton />
                </div>
              </div>
              <div class="p-3 md:p-5 bg-card" v-show="specialtiesExpanded">
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
                      v-for="specialty in specialtyStore.getAllSpecialties"
                      :key="specialty.id"
                      class="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                      :id="`specialty-item-${specialty.id}`"
                      :class="{
                        'ring-2 ring-primary bg-primary/10':
                          selectedSpecialtyId === specialty.id,
                      }"
                      @click="selectedSpecialtyId = specialty.id"
                    >
                      <span class="font-medium">
                        {{ specialty.codeName || specialty.name }}
                      </span>
                      <button
                        class="ml-auto p-1 hover:bg-primary/10 rounded-md transition-colors"
                        @click.stop="openEditSpecialty(specialty)"
                        aria-label="Edit Specialty"
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
                    <div
                      v-if="specialtyStore.getAllSpecialties.length === 0"
                      class="text-muted-foreground"
                    >
                      Нет специальностей
                    </div>
                    <EditSpecialtyButton
                      v-for="specialty in specialtyStore.getAllSpecialties"
                      :key="`edit-${specialty.id}`"
                      :specialty="specialty"
                    />
                  </template>
                </div>
              </div>
            </div>

            <div
              class="border border-border rounded-lg md:rounded-xl overflow-hidden"
            >
              <div
                class="px-3 md:px-4 py-1.5 md:py-2 bg-muted bg-gray-50 md:bg-muted flex items-center justify-between cursor-pointer hover:bg-muted/80 transition-colors"
                @click="toggleSection('courses')"
              >
                <div class="flex items-center">
                  <f7-icon
                    :ios="
                      coursesExpanded ? 'f7:chevron_down' : 'f7:chevron_right'
                    "
                    :md="
                      coursesExpanded
                        ? 'material:expand_more'
                        : 'material:chevron_right'
                    "
                    size="14px"
                    class="mr-1 md:mr-2 text-foreground/60"
                  ></f7-icon>
                  <span class="font-medium text-sm md:text-base">Курсы:</span>
                  <span
                    v-if="!coursesExpanded && selectedCourse"
                    class="ml-2 text-xs md:text-sm px-2 py-1 rounded-md ring-2 ring-primary bg-primary/10"
                  >
                    {{ selectedCourse.number }}
                  </span>
                </div>
                <div class="flex items-center gap-1 md:gap-2">
                  <AddCourseButton />
                </div>
              </div>
              <div class="p-3 md:p-5 bg-card" v-show="coursesExpanded">
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
                        <f7-skeleton-block style="width: 100px; height: 16px" />
                      </div>
                    </div>
                  </template>
                  <div
                    v-else-if="courseStore.getError"
                    class="text-destructive"
                  >
                    {{ courseStore.getError }}
                  </div>
                  <template v-else>
                    <div
                      v-for="course in filteredCourses"
                      :key="course.id"
                      class="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                      :id="`course-item-${course.id}`"
                      :class="{
                        'ring-2 ring-primary bg-primary/10':
                          selectedCourseId === course.id,
                      }"
                      @click="selectedCourseId = course.id"
                    >
                      <span class="font-medium">
                        {{ course.number }}
                      </span>
                      <button
                        class="ml-auto p-1 hover:bg-primary/10 rounded-md transition-colors"
                        @click.stop="openEditCourse(course)"
                        aria-label="Edit Course"
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
                    <div
                      v-if="filteredCourses.length === 0"
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
                    <EditCourseButton
                      v-for="course in filteredCourses"
                      :key="`edit-${course.id}`"
                      :course="{
                        id: course.id,
                        number: course.number,
                        admissionYear: course.admissionYear,
                        specialtyId: course.specialtyId,
                        specialtyCode: course.specialtyCode || '',
                      }"
                    />
                  </template>
                </div>
              </div>
            </div>

            <div
              class="border border-border rounded-lg md:rounded-xl overflow-hidden"
            >
              <div
                class="px-3 md:px-4 py-1.5 md:py-2 bg-muted bg-gray-50 md:bg-muted flex items-center justify-between cursor-pointer hover:bg-muted/80 transition-colors"
                @click="toggleSection('workingPlans')"
              >
                <div class="flex items-center">
                  <f7-icon
                    :ios="
                      workingPlansExpanded
                        ? 'f7:chevron_down'
                        : 'f7:chevron_right'
                    "
                    :md="
                      workingPlansExpanded
                        ? 'material:expand_more'
                        : 'material:chevron_right'
                    "
                    size="14px"
                    class="mr-1 md:mr-2 text-foreground/60"
                  ></f7-icon>
                  <span class="font-medium text-sm md:text-base"
                    >Рабочий учебный план:</span
                  >
                </div>
                <div class="flex items-center gap-1 md:gap-2">
                  <AddWorkingPlanDialog
                    v-model:opened="showAddWorkingPlanDialog"
                    @submit="handleWorkingPlanSubmit"
                    :disabled="!(selectedSpecialtyId && selectedCourseId)"
                    :specialty-id="selectedSpecialtyId || ''"
                    :course-id="selectedCourseId || ''"
                  />
                </div>
              </div>
              <div class="p-3 md:p-5 bg-card" v-show="workingPlansExpanded">
                <div
                  v-if="selectedSpecialtyId && selectedCourseId"
                  class="space-y-3"
                >
                  <!-- <f7-segmented strong>
                    <f7-button 
                      :active="selectedClassLevel === 9"
                      @click="selectedClassLevel = 9"
                    >
                      9 класс
                    </f7-button>
                    <f7-button 
                      :active="selectedClassLevel === 11"
                      @click="selectedClassLevel = 11"
                    >
                      11 класс
                    </f7-button>
                  </f7-segmented> -->

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
              </div>
            </div>
          </div>
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
import { ref, onMounted, computed, watch } from "vue";
import {
  f7Page,
  f7Fab,
  f7FabButtons,
  f7FabButton,
  f7Icon,
  f7SkeletonBlock,
  f7,
  f7Segmented,
  f7Button,
} from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import AddSpecialtyButton from "@/components/AddSpecialtyButton.vue";
import EditSpecialtyButton from "@/components/EditSpecialtyButton.vue";
import AddCourseButton from "@/components/AddCourseButton.vue";
import EditCourseButton from "@/components/EditCourseButton.vue";
import AddWorkingPlanDialog from "@/components/AddWorkingPlanDialog.vue";
import Class9Table from "@/components/Class9Table.vue";
import Class11Table from "@/components/Class11Table.vue";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { useCourseStore } from "@/stores/courseStore";
import { useSelectedItemsStore } from "@/stores/selectedItemsStore";

const searchbarEnabled = ref(false);
const activeNavItem = ref("rup");
const specialtyStore = useSpecialtyStore();
const courseStore = useCourseStore();
const selectedItemsStore = useSelectedItemsStore();

const specialtiesExpanded = ref(true);
const coursesExpanded = ref(true);
const workingPlansExpanded = ref(true);
const showAddWorkingPlanDialog = ref(false);
const workingPlans = ref<
  Array<{ id: number; name: string; year: number; description?: string }>
>([]);
const selectedClassLevel = ref<9 | 11>(9);

const toggleSection = (section: "specialties" | "courses" | "workingPlans") => {
  if (section === "specialties")
    specialtiesExpanded.value = !specialtiesExpanded.value;
  else if (section === "courses") {
    coursesExpanded.value = !coursesExpanded.value;
  } else if (section === "workingPlans") {
    workingPlansExpanded.value = !workingPlansExpanded.value;
  }
};

const handleSearchbarEnable = () => {
  searchbarEnabled.value = true;
};

const handleSearchbarDisable = () => {
  searchbarEnabled.value = false;
};

onMounted(async () => {
  await specialtyStore.fetchSpecialties();
  await courseStore.fetchCourses();
});

const openEditSpecialty = (specialty: any) => {
  const targetEl = document.getElementById(`specialty-item-${specialty.id}`);
  if (targetEl) {
    f7.popover.open(`#edit-specialty-popover-${specialty.id}`, targetEl);
  }
};

const openEditCourse = (course: any) => {
  const targetEl = document.getElementById(`course-item-${course.id}`);
  if (targetEl) {
    f7.popover.open(`#edit-course-popover-${course.id}`, targetEl);
  }
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

const editWorkingPlan = (plan: any) => {
  console.log("Edit plan:", plan);
};

const deleteWorkingPlan = (id: number) => {
  workingPlans.value = workingPlans.value.filter((plan) => plan.id !== id);
};

const selectedSpecialtyId = computed({
  get: () => selectedItemsStore.selectedSpecialtyId,
  set: (value) => selectedItemsStore.setSelectedSpecialty(value),
});

const selectedCourseId = computed({
  get: () => selectedItemsStore.selectedCourseId,
  set: (value) => selectedItemsStore.setSelectedCourse(value),
});

const selectedSpecialty = computed(() => selectedItemsStore.selectedSpecialty);
const selectedCourse = computed(() => selectedItemsStore.selectedCourse);
const filteredCourses = computed(() => selectedItemsStore.filteredCourses);
</script>
