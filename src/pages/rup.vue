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

    <!-- Desktop Layout -->
    <div class="hidden md:flex overflow-hidden flex-1">
      <!-- Left Sidebar - always visible on desktop -->
      <Sidebar
        v-model:activeNavItem="activeNavItem"
        class="h-[calc(100vh-64px)] flex-shrink-0 border-r border-border"
      />

      <!-- Main Content Area for Desktop -->
      <div class="flex-1 overflow-y-auto p-6 bg-background">
        <div class="bg-card text-card-foreground rounded-xl p-6 shadow-sm">
          <div class="flex items-center gap-6 mb-8">
            <div class="flex items-center gap-3 flex-1">
              <span class="text-lg font-semibold">Учебная программа:</span>
              <input
                type="text"
                class="border border-input rounded-lg px-3 py-2 flex-1 focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 bg-background"
              />
            </div>
            <div class="flex items-center gap-3">
              <span class="text-lg font-semibold">Учебный год:</span>
              <div
                class="border border-input rounded-lg px-3 py-2 flex items-center bg-background"
              >
                <input
                  type="text"
                  value="2025-2026"
                  class="w-28 text-center focus:outline-none bg-transparent"
                />
                <div class="flex ml-3 gap-2">
                  <button
                    class="p-1.5 hover:bg-muted rounded-md transition-colors"
                  >
                    <f7-icon
                      ios="f7:doc"
                      md="material:file_copy"
                      size="18px"
                      class="text-foreground/60"
                    ></f7-icon>
                  </button>
                  <button
                    class="p-1.5 hover:bg-muted rounded-md transition-colors"
                  >
                    <f7-icon
                      ios="f7:pencil"
                      md="material:edit"
                      size="18px"
                      class="text-foreground/60"
                    ></f7-icon>
                  </button>
                  <button
                    class="p-1.5 hover:bg-primary/10 rounded-md transition-colors"
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

          <div class="space-y-6">
            <!-- Specialties Section -->
            <div class="border border-border rounded-xl overflow-hidden">
              <div
                class="px-5 py-4 bg-muted flex items-center justify-between cursor-pointer hover:bg-muted/80 transition-colors"
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
                    size="20px"
                    class="mr-3 text-foreground/60"
                  ></f7-icon>
                  <span class="font-semibold">Специальности:</span>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    class="p-2 hover:bg-background rounded-lg transition-colors"
                    @click.stop
                  >
                    <f7-icon
                      ios="f7:pencil"
                      md="material:edit"
                      size="18px"
                      class="text-foreground/60"
                    ></f7-icon>
                  </button>
                  <button
                    class="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                    @click.stop
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
              <div class="p-5 bg-card" v-show="specialtiesExpanded">
                <div class="flex items-center gap-3">
                  <span
                    class="px-4 py-2 border border-border rounded-lg text-center min-w-[60px] bg-muted"
                    >...</span
                  >
                  <AddSpecialtyButton @specialty-added="handleSpecialtyAdded" />
                </div>
              </div>
            </div>

            <!-- Courses Section -->
            <div class="border border-border rounded-xl overflow-hidden">
              <div
                class="px-5 py-4 bg-muted flex items-center justify-between cursor-pointer hover:bg-muted/80 transition-colors"
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
                    size="20px"
                    class="mr-3 text-foreground/60"
                  ></f7-icon>
                  <span class="font-semibold">Курсы:</span>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    class="p-2 hover:bg-background rounded-lg transition-colors"
                    @click.stop
                  >
                    <f7-icon
                      ios="f7:pencil"
                      md="material:edit"
                      size="18px"
                      class="text-foreground/60"
                    ></f7-icon>
                  </button>
                  <button
                    class="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                    @click.stop
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
              <div class="p-5 bg-card" v-show="coursesExpanded">
                <div class="flex items-center gap-3">
                  <span
                    class="px-4 py-2 border border-border rounded-lg text-center min-w-[60px] bg-muted"
                    >1</span
                  >
                  <AddCourseButton @course-added="handleCourseAdded" />
                </div>
              </div>
            </div>

            <!-- Modules Section -->
            <div class="border border-border rounded-xl overflow-hidden">
              <div
                class="px-5 py-4 bg-muted flex items-center justify-between cursor-pointer hover:bg-muted/80 transition-colors"
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
                    size="20px"
                    class="mr-3 text-foreground/60"
                  ></f7-icon>
                  <span class="font-semibold">Модуль/дисциплины:</span>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    class="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                    @click.stop
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
              <div class="p-5 bg-card" v-show="modulesExpanded">
                <!-- Module/disciplines content will go here -->
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Layout -->
    <div
      class="md:hidden overflow-y-auto p-4 bg-background text-foreground pb-16"
    >
      <div class="bg-card text-card-foreground rounded-xl p-4 shadow-sm">
        <div class="mb-4">
          <div class="text-base font-medium mb-1">Учебная программа:</div>
          <input type="text" class="border rounded px-2 py-1 w-full" />
        </div>

        <div class="mb-4">
          <div class="text-base font-medium mb-1">Учебный год:</div>
          <div class="border rounded px-2 py-1 flex items-center">
            <input type="text" value="2025-2026" class="flex-1 text-center" />
            <div class="flex ml-2">
              <button class="px-1">
                <f7-icon
                  ios="f7:doc"
                  md="material:file_copy"
                  size="18px"
                ></f7-icon>
              </button>
              <button class="px-1">
                <f7-icon
                  ios="f7:pencil"
                  md="material:edit"
                  size="18px"
                ></f7-icon>
              </button>
              <button class="px-1 text-green-500">
                <f7-icon ios="f7:plus" md="material:add" size="18px"></f7-icon>
              </button>
            </div>
          </div>
        </div>

        <div class="border rounded-lg mb-4">
          <div
            class="border-b px-3 py-2 bg-gray-50 rounded-t-lg flex items-center justify-between cursor-pointer"
            @click="toggleSection('specialties')"
          >
            <div class="flex items-center">
              <f7-icon
                :ios="
                  specialtiesExpanded ? 'f7:chevron_down' : 'f7:chevron_right'
                "
                :md="
                  specialtiesExpanded
                    ? 'material:expand_more'
                    : 'material:chevron_right'
                "
                size="16px"
                class="mr-1"
              ></f7-icon>
              <span class="font-medium">Специальности:</span>
            </div>
            <div class="flex items-center">
              <button
                class="w-7 h-7 flex items-center justify-center text-gray-500"
                @click.stop
              >
                <f7-icon
                  ios="f7:pencil"
                  md="material:edit"
                  size="16px"
                ></f7-icon>
              </button>
              <button
                class="w-7 h-7 flex items-center justify-center text-green-500"
                @click.stop
              >
                <f7-icon ios="f7:plus" md="material:add" size="16px"></f7-icon>
              </button>
            </div>
          </div>
          <div class="p-3 flex flex-col gap-3" v-show="specialtiesExpanded">
            <div class="flex items-center gap-2">
              <span class="px-2 py-1 border rounded-md text-center">...</span>
              <AddSpecialtyButton @specialty-added="handleSpecialtyAdded" />
            </div>
          </div>
        </div>

        <div class="border rounded-lg mb-4">
          <div
            class="border-b px-3 py-2 bg-gray-50 rounded-t-lg flex items-center justify-between cursor-pointer"
            @click="toggleSection('courses')"
          >
            <div class="flex items-center">
              <f7-icon
                :ios="coursesExpanded ? 'f7:chevron_down' : 'f7:chevron_right'"
                :md="
                  coursesExpanded
                    ? 'material:expand_more'
                    : 'material:chevron_right'
                "
                size="16px"
                class="mr-1"
              ></f7-icon>
              <span class="font-medium">Курсы:</span>
            </div>
            <div class="flex items-center">
              <button
                class="w-7 h-7 flex items-center justify-center text-gray-500"
                @click.stop
              >
                <f7-icon
                  ios="f7:pencil"
                  md="material:edit"
                  size="16px"
                ></f7-icon>
              </button>
              <button
                class="w-7 h-7 flex items-center justify-center text-green-500"
                @click.stop
              >
                <f7-icon ios="f7:plus" md="material:add" size="16px"></f7-icon>
              </button>
            </div>
          </div>
          <div class="p-3 flex flex-col gap-3" v-show="coursesExpanded">
            <div class="flex items-center gap-2">
              <span class="px-2 py-1 border rounded-md text-center">1</span>
              <AddCourseButton @course-added="handleCourseAdded" />
            </div>
          </div>
        </div>

        <div class="border rounded-lg">
          <div
            class="border-b px-3 py-2 bg-gray-50 rounded-t-lg flex items-center justify-between cursor-pointer"
            @click="toggleSection('modules')"
          >
            <div class="flex items-center">
              <f7-icon
                :ios="modulesExpanded ? 'f7:chevron_down' : 'f7:chevron_right'"
                :md="
                  modulesExpanded
                    ? 'material:expand_more'
                    : 'material:chevron_right'
                "
                size="16px"
                class="mr-1"
              ></f7-icon>
              <span class="font-medium">Модуль/дисциплины:</span>
            </div>
            <div class="flex items-center">
              <button
                class="w-7 h-7 flex items-center justify-center text-green-500"
                @click.stop
              >
                <f7-icon ios="f7:plus" md="material:add" size="16px"></f7-icon>
              </button>
            </div>
          </div>
          <div class="p-3" v-show="modulesExpanded">
            <!-- Module/disciplines content will go here -->
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
