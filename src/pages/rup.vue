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
      <!-- Sidebar - hidden on mobile, visible on desktop -->
      <Sidebar
        v-model:activeNavItem="activeNavItem"
        class="hidden md:block h-[calc(100vh-64px)] flex-shrink-0 border-r border-border"
      />

      <!-- Main Content Area - responsive for both desktop and mobile -->
      <div
        class="flex-1 overflow-y-auto p-4 md:p-6 bg-background pb-16 md:pb-6"
      >
        <div
          class="bg-card text-card-foreground rounded-xl p-4 md:p-6 shadow-sm"
        >
          <!-- Program and Year Fields -->
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
            <!-- Specialties Section -->
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
                  <button
                    class="w-7 h-7 md:p-2 flex items-center justify-center text-gray-500 md:text-foreground/60 hover:bg-background rounded-lg transition-colors"
                    @click.stop
                  >
                    <f7-icon
                      ios="f7:pencil"
                      md="material:edit"
                      size="16px"
                      class="md:text-foreground/60"
                    ></f7-icon>
                  </button>

                  <AddSpecialtyButton @specialty-added="handleSpecialtyAdded" />
                </div>
              </div>
              <div class="p-3 md:p-5 bg-card" v-show="specialtiesExpanded">
                <div class="flex items-center gap-2 md:gap-3">
                  <span
                    class="px-2 py-1 md:px-4 md:py-2 border border-border rounded-md md:rounded-lg text-center min-w-[40px] md:min-w-[60px] bg-muted"
                    >...</span
                  >
                </div>
              </div>
            </div>

            <!-- Courses Section -->
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
                  <button
                    class="w-7 h-7 md:p-2 flex items-center justify-center text-gray-500 md:text-foreground/60 hover:bg-background rounded-lg transition-colors"
                    @click.stop
                  >
                    <f7-icon
                      ios="f7:pencil"
                      md="material:edit"
                      size="16px"
                      class="md:text-foreground/60"
                    ></f7-icon>
                  </button>

                  <AddCourseButton @course-added="handleCourseAdded" />
                </div>
              </div>
              <div class="p-3 md:p-5 bg-card" v-show="coursesExpanded">
                <div class="flex items-center gap-2 md:gap-3">
                  <span
                    class="px-2 py-1 md:px-4 md:py-2 border border-border rounded-md md:rounded-lg text-center min-w-[40px] md:min-w-[60px] bg-muted"
                    >1</span
                  >
                </div>
              </div>
            </div>

            <div
              class="border border-border rounded-lg md:rounded-xl overflow-hidden"
            >
              <div
                class="px-3 md:px-5 py-2 md:py-4 bg-muted bg-gray-50 md:bg-muted flex items-center justify-between cursor-pointer hover:bg-muted/80 transition-colors"
                @click="toggleSection('modules')"
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
                  <ColumnConfigForm @columns-saved="handleColumnsSaved" />
                  <AddModuleTemplateButton
                    @module-template-added="handleModuleTemplateAdded"
                  />
                </div>
              </div>
              <div class="p-3 md:p-5 bg-card" v-show="modulesExpanded">
                <ModuleTable />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Action Button -->
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
import { ref } from "vue";
import {
  f7Page,
  f7Fab,
  f7FabButtons,
  f7FabButton,
  f7Icon,
} from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import AddSpecialtyButton from "@/components/AddSpecialtyButton.vue";
import AddCourseButton from "@/components/AddCourseButton.vue";
import AddModuleTemplateButton from "@/components/AddModuleTemplateButton.vue";
import ColumnConfigForm from "@/components/ColumnConfigForm.vue";
import ModuleTable from "@/components/ModuleTable.vue";
import { useLanguage } from "@/composables/useLanguage";

const searchbarEnabled = ref(false);
const activeNavItem = ref("rup");

// Section toggle states
const specialtiesExpanded = ref(true);
const coursesExpanded = ref(true);
const modulesExpanded = ref(true);

// Toggle section visibility
const toggleSection = (section: "specialties" | "courses" | "modules") => {
  if (section === "specialties")
    specialtiesExpanded.value = !specialtiesExpanded.value;
  if (section === "courses") coursesExpanded.value = !coursesExpanded.value;
  if (section === "modules") modulesExpanded.value = !modulesExpanded.value;
};

// Add back the Column interface
interface Column {
  name: string;
  width: number;
}

// Handle specialty added
const handleSpecialtyAdded = (specialty: {
  name: string;
  codeName: string;
  code: string;
  createModule: boolean;
}) => {
  console.log("New specialty added:", specialty);
  // Here you would typically add the specialty to your state or send to backend
};

// Handle course added
const handleCourseAdded = (course: {
  number: string;
  admissionYear: string;
  specialtyCode: string;
}) => {
  console.log("New course added:", course);
  // Here you would typically add the course to your state or send to backend
};

// Handle module template added
const handleModuleTemplateAdded = (moduleTemplate: Record<string, string>) => {
  // Here you would typically add the module template to your state or send to backend
};

// Handle column saved
const handleColumnsSaved = (columns: Column[]) => {
  // Here you would process the column configuration if needed
};

// Language management
const { activeLanguage, availableLanguages, setLanguage } = useLanguage();

// Event handlers
const handleSearchbarEnable = () => {
  searchbarEnabled.value = true;
};

const handleSearchbarDisable = () => {
  searchbarEnabled.value = false;
};

const handleLanguageChange = (code: string) => {
  setLanguage(code);
};
</script>
