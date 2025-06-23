<template>
  <f7-page
    name="rup"
    class="flex flex-col h-screen bg-background text-foreground"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <div class="flex flex-1 overflow-hidden">
      <Sidebar v-model:activeNavItem="activeNavItem" class="hidden md:block" />

      <div
        class="flex-1 overflow-y-auto p-3 md:p-4 bg-background pb-16 md:pb-6 md:ml-52 relative"
      >
        <div
          v-if="rupStore.showOverlay"
          class="absolute inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center"
          style="pointer-events: none"
        ></div>
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
                    :id="`specialty-item-${specialty.id}`"
                    class="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                    :class="{
                      'ring-2 ring-primary bg-primary/10':
                        selectedSpecialtyId === specialty.id,
                    }"
                    @click="selectedSpecialtyId = specialty.id"
                    @mouseenter="
                      handleSpecialtyMouseEnter(
                        specialty,
                        `#specialty-item-${specialty.id}`
                      )
                    "
                    @mouseleave="handleGroupMouseLeave"
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
                    <div class="text-muted-foreground flex items-center gap-2">
                      <f7-icon
                        ios="f7:doc_text_search"
                        md="material:search_off"
                        size="18px"
                      ></f7-icon>
                      <span>Нет курсов</span>
                    </div>
                  </div>
                </template>
              </div>
            </AccordionItem>

            <AccordionItem id="workingPlans" :default-expanded="true">
              <template #title>Рабочий учебный план:</template>
              <template #actions>
                <ImportWorkingPlanDialog
                  :disabled="
                    !(
                      selectedAcademicYear &&
                      selectedSpecialtyId &&
                      selectedCourseId
                    )
                  "
                  :specialty-id="selectedSpecialtyId || ''"
                  :course-id="selectedCourseId || ''"
                  @enable-select-mode="enableSelectMode"
                />

                <AddWorkingPlanDialog
                  v-model:opened="showAddWorkingPlanDialog"
                  @submit="handleWorkingPlanSubmit"
                  :disabled="
                    !(
                      selectedAcademicYear &&
                      selectedSpecialtyId &&
                      selectedCourseId
                    )
                  "
                  :specialty-id="selectedSpecialtyId || ''"
                  :course-id="selectedCourseId || ''"
                  @add-class-9="addClass9"
                />
              </template>
              <div
                v-if="!selectedAcademicYear"
                class="w-full p-3 flex items-center justify-center"
              >
                <div class="text-muted-foreground flex items-center gap-2">
                  <f7-icon
                    ios="f7:arrow_up"
                    md="material:keyboard_arrow_up"
                    size="18px"
                  ></f7-icon>
                  <span>Сначала выберите учебный год</span>
                </div>
              </div>
              <div
                v-else-if="!selectedSpecialtyId"
                class="w-full p-3 flex items-center justify-center"
              >
                <div class="text-muted-foreground flex items-center gap-2">
                  <f7-icon
                    ios="f7:arrow_up"
                    md="material:keyboard_arrow_up"
                    size="18px"
                  ></f7-icon>
                  <span>Сначала выберите специальность</span>
                </div>
              </div>
              <div
                v-else-if="!selectedCourseId"
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
              <div v-else class="space-y-3">
                <div class="mt-4">
                  <template v-if="selectedClassLevel === 9">
                    <Class9Table
                      ref="class9TableRef"
                      :specialty-id="selectedSpecialtyId"
                      :course-id="selectedCourseId"
                      :academic-year-id="selectedAcademicYear"
                      :select-mode="isSelectMode"
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
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>

    <template #fixed>
      <div
        v-if="isSelectMode"
        class="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50"
      >
        <button
          @click="handleFloatingImport"
          class="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-lg hover:bg-primary/90 transition-colors"
        >
          <f7-icon
            ios="f7:square_arrow_up"
            md="material:file_download"
            size="20px"
          ></f7-icon>
          <span>Импорт</span>
        </button>
        <button
          @click="cancelSelectMode"
          class="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-colors"
        >
          <f7-icon ios="f7:xmark" md="material:close" size="20px"></f7-icon>
          <span>Отмена</span>
        </button>
      </div>
      <f7-fab v-else position="right-bottom" class="mb-6 mr-6">
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
      <f7-popover
        class="specialty-info-popover w-64"
        @mouseenter="handlePopoverMouseEnter"
        @mouseleave="handleGroupMouseLeave"
      >
        <div
          v-if="hoveredSpecialty"
          class="p-3 bg-popover text-popover-foreground rounded-lg shadow-xl"
        >
          <div class="font-semibold text-base mb-1">
            {{ hoveredSpecialty.name }}
          </div>
          <div class="text-sm text-muted-foreground mb-2">
            {{ hoveredSpecialty.codeName }}
          </div>
          <p class="text-sm font-normal">
            {{
              hoveredSpecialty.details ||
              "Дополнительная информация отсутствует."
            }}
          </p>
        </div>
      </f7-popover>
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
  f7Popover,
} from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import AddWorkingPlanDialog from "@/components/AddWorkingPlanDialog.vue";
import Class9Table from "@/components/Class9Table.vue";
import Class11Table from "@/components/Class11Table.vue";
import { useSpecialtyStore, type Specialty } from "@/stores/specialtyStore";
import { useCourseStore } from "@/stores/courseStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import Accordion from "@/components/ui/accordion/Accordion.vue";
import AccordionItem from "@/components/ui/accordion/AccordionItem.vue";
import SmartSelect from "@/components/ui/SmartSelect.vue";
import { storeToRefs } from "pinia";
import ImportWorkingPlanDialog from "@/components/ImportWorkingPlanDialog.vue";
import { useRupStore } from "@/stores/rupStore";
import { useClass9Store } from "@/stores/class9Store";

const activeNavItem = ref("rup");
const specialtyStore = useSpecialtyStore();
const courseStore = useCourseStore();
const academicYearStore = useAcademicYearStore();

const class9TableRef = ref<InstanceType<typeof Class9Table> | null>(null);

const { specialties } = storeToRefs(specialtyStore);
const { academicYears } = storeToRefs(academicYearStore);

const selectedAcademicYear = computed({
  get: () => rupStore.selectedAcademicYearId || "",
  set: (value) => rupStore.setSelectedAcademicYear(value || null),
});

const academicYearOptions = computed(() => {
  return academicYears.value.map((year) => ({
    value: year.id,
    text: year.name,
  }));
});

const showAddWorkingPlanDialog = ref(false);
const workingPlans = ref<
  Array<{ id: number; name: string; year: number; description?: string }>
>([]);
const selectedClassLevel = ref<9 | 11>(9);

const rupStore = useRupStore();
const class9Store = useClass9Store();

const isSelectMode = ref(false);

const hoveredSpecialty = ref<Specialty | null>(null);
const isMouseOverGroup = ref(false);
let showTimeout: ReturnType<typeof setTimeout> | null = null;
let hideTimeout: ReturnType<typeof setTimeout> | null = null;

const handleSpecialtyMouseEnter = (specialty: Specialty, targetEl: string) => {
  isMouseOverGroup.value = true;
  if (hideTimeout) clearTimeout(hideTimeout);
  if (showTimeout) clearTimeout(showTimeout);

  showTimeout = setTimeout(() => {
    const popover = f7.popover.get(".specialty-info-popover");
    if (popover && popover.opened) return;
    hoveredSpecialty.value = specialty;
    f7.popover.open(".specialty-info-popover", targetEl);
  }, 300);
};

const handlePopoverMouseEnter = () => {
  isMouseOverGroup.value = true;
  if (hideTimeout) clearTimeout(hideTimeout);
};

const handleGroupMouseLeave = () => {
  isMouseOverGroup.value = false;
  if (showTimeout) clearTimeout(showTimeout);
  if (hideTimeout) clearTimeout(hideTimeout);

  hideTimeout = setTimeout(() => {
    if (!isMouseOverGroup.value) {
      f7.popover.close(".specialty-info-popover");
    }
  }, 300);
};

const onPopoverClosed = () => {
  hoveredSpecialty.value = null;
};

const enableSelectMode = () => {
  isSelectMode.value = true;
  rupStore.toggle();
};

const cancelSelectMode = () => {
  isSelectMode.value = false;
  rupStore.clearClass9Selection();
  rupStore.toggle();
};

const handleFloatingImport = () => {
  const selectedIds = rupStore.selectedClass9ItemIds;
  if (selectedIds.length === 0) {
    f7.dialog.alert("Не выбраны элементы для импорта.", "Ничего не выбрано");
    return;
  }

  const allItems = class9Store.getAllClass9Items;
  const itemsToImport = allItems.filter((item) =>
    selectedIds.includes(item.id)
  );

  const newItems = itemsToImport.map((item) => ({
    ...item,
    id: crypto.randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  class9Store.addClass9Items(newItems);

  f7.dialog.alert(
    `Импортировано ${newItems.length} элементов.`,
    "Импорт завершен"
  );
  cancelSelectMode();
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

const addClass9 = () => {
  if (class9TableRef.value) {
    class9TableRef.value.openAddPopup();
  }
};

const selectedSpecialtyId = computed({
  get: () => rupStore.selectedSpecialtyId,
  set: (value) => rupStore.setSelectedSpecialty(value),
});

const selectedCourseId = computed({
  get: () => rupStore.selectedCourseId,
  set: (value) => rupStore.setSelectedCourse(value),
});

const selectedSpecialty = computed(() => rupStore.selectedSpecialty);
const selectedCourse = computed(() => rupStore.selectedCourse);
const filteredVisibleCourses = computed(() => rupStore.filteredCourses);

onMounted(async () => {
  await specialtyStore.fetchSpecialties();
  await courseStore.fetchCourses();
  await academicYearStore.fetchAcademicYears();
  if (!rupStore.selectedAcademicYearId) {
    rupStore.setSelectedAcademicYear(
      academicYearStore.getActiveAcademicYear?.id || null
    );
  }
  f7.on("popoverClosed", (popover) => {
    if (popover.el.classList.contains("specialty-info-popover")) {
      onPopoverClosed();
    }
  });
});
</script>

<style scoped>
.specialty-info-popover.popover {
  margin-top: -100px;
}
</style>
