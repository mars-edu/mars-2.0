<template>
  <f7-page
    name="rup"
    class="flex flex-col h-screen bg-background text-foreground"
  >
    <Header
      @searchbar-enable="handleSearchbarEnable"
      @searchbar-disable="handleSearchbarDisable"
      @language-change="handleLanguageChange"
      class="hidden md:block flex-shrink-0 border-b border-border"
    />

    <div class="flex flex-1 overflow-hidden">
      <Sidebar
        v-model:activeNavItem="activeNavItem"
        class="hidden md:block h-[calc(100vh-64px)] flex-shrink-0 border-r border-border"
      />

      <div
        class="flex-1 overflow-y-auto p-4 md:p-6 bg-background pb-16 md:pb-6"
      >
        <div
          class="bg-card text-card-foreground rounded-xl p-4 md:p-6 shadow-sm"
        >
          <div
            class="flex flex-col md:flex-row md:items-center md:gap-6 mb-4 md:mb-8"
          >
            <div
              class="flex flex-col md:flex-row md:items-center md:gap-3 flex-1 mb-4 md:mb-0"
            >
              <span
                class="text-base md:text-lg font-medium md:font-semibold mb-1 md:mb-0"
                >Учебная программа:</span
              >
              <input
                type="text"
                class="border border-input rounded-lg px-2 md:px-3 py-1 md:py-2 flex-1 focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 bg-background"
              />
            </div>
            <div class="flex flex-col md:flex-row md:items-center md:gap-3">
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
                    class="p-1 md:p-1.5 hover:bg-primary/10 rounded-md transition-colors"
                  >
                    <f7-icon
                      ios="f7:plus"
                      md="material:add"
                      size="18px"
                      class="text-primary"
                    ></f7-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-4 md:space-y-6">
            <div
              class="border border-border rounded-lg md:rounded-xl overflow-hidden"
            >
              <div
                class="px-3 md:px-5 py-2 md:py-4 bg-muted bg-gray-50 md:bg-muted flex items-center justify-between cursor-pointer hover:bg-muted/80 transition-colors"
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
                    size="16px"
                    class="mr-1 md:mr-3 text-foreground/60"
                  ></f7-icon>
                  <span class="font-medium md:font-semibold"
                    >Специальности:</span
                  >
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
                        {{ specialty.codeName || specialty.code }}
                      </span>
                      <span class="text-sm text-muted-foreground">{{
                        specialty.name
                      }}</span>
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
                      ref="editSpecialtyRefs[specialty.id]"
                    />
                  </template>
                </div>
              </div>
            </div>

            <div
              class="border border-border rounded-lg md:rounded-xl overflow-hidden"
            >
              <div
                class="px-3 md:px-5 py-2 md:py-4 bg-muted bg-gray-50 md:bg-muted flex items-center justify-between cursor-pointer hover:bg-muted/80 transition-colors"
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
                    size="16px"
                    class="mr-1 md:mr-3 text-foreground/60"
                  ></f7-icon>
                  <span class="font-medium md:font-semibold">Курсы:</span>
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
                      v-for="course in courseStore.getAllCourses"
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
                      <span class="text-sm text-muted-foreground">{{
                        course.admissionYear
                      }}</span>
                      <span class="text-sm text-muted-foreground">{{
                        course.specialtyCode
                      }}</span>
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
                      v-if="courseStore.getAllCourses.length === 0"
                      class="text-muted-foreground"
                    >
                      Нет курсов
                    </div>
                    <EditCourseButton
                      v-for="course in courseStore.getAllCourses"
                      :key="`edit-${course.id}`"
                      :course="course"
                      ref="editCourseRefs[course.id]"
                    />
                  </template>
                </div>
              </div>
            </div>

            <div
              class="border border-border rounded-lg md:rounded-xl overflow-hidden"
            >
              <div
                class="px-3 md:px-5 py-2 md:py-4 bg-muted bg-gray-50 md:bg-muted flex items-center justify-between transition-colors"
                :class="{
                  'cursor-pointer hover:bg-muted/80':
                    selectedSpecialtyId && selectedCourseId,
                  'opacity-50 cursor-not-allowed': !(
                    selectedSpecialtyId && selectedCourseId
                  ),
                }"
                @click="
                  selectedSpecialtyId &&
                    selectedCourseId &&
                    toggleSection('modules')
                "
              >
                <div class="flex items-center">
                  <f7-icon
                    :ios="
                      modulesExpanded ? 'f7:chevron_down' : 'f7:chevron_right'
                    "
                    :md="
                      modulesExpanded
                        ? 'material:expand_more'
                        : 'material:chevron_right'
                    "
                    size="16px"
                    class="mr-1 md:mr-3 text-foreground/60"
                  ></f7-icon>
                  <span class="font-medium md:font-semibold"
                    >Модуль/дисциплины:</span
                  >
                </div>
                <div class="flex items-center gap-1 md:gap-2">
                  <ColumnConfigForm @columns-saved="handleColumnsSaved">
                    <template #trigger="{ open }">
                      <button
                        class="w-7 h-7 md:p-2 flex items-center justify-center text-green-500 md:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        aria-label="Configure Columns"
                        type="button"
                        @click.stop="open"
                        :disabled="!(selectedSpecialtyId && selectedCourseId)"
                      >
                        <f7-icon
                          ios="f7:gear"
                          md="material:settings"
                          size="16px"
                          class="md:text-blue-500"
                        ></f7-icon>
                      </button>
                    </template>
                  </ColumnConfigForm>
                  <AddModuleTemplateButton
                    @module-template-added="handleModuleTemplateAdded"
                  >
                    <template #trigger="{ open }">
                      <button
                        class="w-7 h-7 md:p-2 flex items-center justify-center text-green-500 md:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        aria-label="Add Module Template"
                        type="button"
                        @click.stop="open"
                        :disabled="!(selectedSpecialtyId && selectedCourseId)"
                      >
                        <f7-icon
                          ios="f7:plus"
                          md="material:add"
                          size="16px"
                          class="md:text-primary"
                        ></f7-icon>
                      </button>
                    </template>
                  </AddModuleTemplateButton>
                </div>
              </div>
              <div
                class="p-3 md:p-5 bg-card"
                v-show="
                  modulesExpanded && selectedSpecialtyId && selectedCourseId
                "
              >
                <ModuleTable />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #fixed>
      <f7-fab position="right-bottom" class="mb-6 mr-6">
        <f7-icon ios="f7:plus" md="material:add"></f7-icon>
        <f7-icon ios="f7:xmark" md="material:close"></f7-icon>
        <f7-fab-buttons position="top" class="mr-2">
          <f7-fab-button
            label="Загрузка документа"
            class="bg-primary text-primary-foreground shadow-lg"
          >
            <f7-icon ios="f7:doc_text" md="material:file_upload"></f7-icon>
          </f7-fab-button>
          <f7-fab-button
            label="Импорт модуля"
            class="bg-primary text-primary-foreground shadow-lg"
          >
            <f7-icon
              ios="f7:square_arrow_down"
              md="material:system_update_alt"
            ></f7-icon>
          </f7-fab-button>
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
import { ref, onMounted } from "vue";
import {
  f7Page,
  f7Fab,
  f7FabButtons,
  f7FabButton,
  f7Icon,
  f7SkeletonBlock,
} from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import AddSpecialtyButton from "@/components/AddSpecialtyButton.vue";
import EditSpecialtyButton from "@/components/EditSpecialtyButton.vue";
import AddCourseButton from "@/components/AddCourseButton.vue";
import EditCourseButton from "@/components/EditCourseButton.vue";
import AddModuleTemplateButton from "@/components/AddModuleTemplateButton.vue";
import ColumnConfigForm from "@/components/ColumnConfigForm.vue";
import ModuleTable from "@/components/ModuleTable.vue";
import { useLanguage } from "@/composables/useLanguage";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { useCourseStore } from "@/stores/courseStore";
import { f7 } from "framework7-vue";

const searchbarEnabled = ref(false);
const activeNavItem = ref("rup");
const specialtyStore = useSpecialtyStore();
const courseStore = useCourseStore();

const specialtiesExpanded = ref(true);
const coursesExpanded = ref(true);
const modulesExpanded = ref(true);

const toggleSection = (section: "specialties" | "courses" | "modules") => {
  if (section === "specialties")
    specialtiesExpanded.value = !specialtiesExpanded.value;
  if (section === "courses") coursesExpanded.value = !coursesExpanded.value;
  if (section === "modules") modulesExpanded.value = !modulesExpanded.value;
};

interface Column {
  name: string;
  width: number;
}

const handleModuleTemplateAdded = (
  moduleTemplate: Record<string, string>
) => {};

const handleColumnsSaved = (columns: Column[]) => {};

const { activeLanguage, availableLanguages, setLanguage } = useLanguage();

const handleSearchbarEnable = () => {
  searchbarEnabled.value = true;
};

const handleSearchbarDisable = () => {
  searchbarEnabled.value = false;
};

const handleLanguageChange = (code: string) => {
  setLanguage(code);
};

onMounted(async () => {
  await specialtyStore.fetchSpecialties();
  await courseStore.fetchCourses();
});

const editSpecialtyRefs = ref<{ [key: string]: any }>({});
const editCourseRefs = ref<{ [key: string]: any }>({});

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

const selectedSpecialtyId = ref<string | null>(null);
const selectedCourseId = ref<string | null>(null);
</script>
