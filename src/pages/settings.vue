<template>
  <f7-page
    name="settings"
    class="bg-background"
  >
    <div class="desktop-header-container">
      <Header />
    </div>

    <Sidebar v-model:activeNavItem="activeNavItem" />

    <f7-page-content class="settings-content">
      <div 
        class="flex-1 flex flex-col min-w-0 bg-background overflow-hidden transition-all duration-200"
        :class="contentMargin"
      >
        <div class="flex-1 overflow-y-auto p-4 md:p-8 bg-background transition-all duration-200">
          <div class="max-w-6xl mx-auto space-y-8">
            <h1 class="text-2xl md:text-3xl font-bold text-foreground mb-8">{{ settings_title() }}</h1>
            
            <!-- Semesters Section -->
            <SettingsSection
              :title="settings_semesters()"
              :items="semesterItems"
              allow-delete
              @edit="openEditSemester"
              @delete="deleteSemesterItem"
            >
              <template #action>
                <AddSemesterButton />
              </template>
            </SettingsSection>

            <!-- Courses Section -->
            <SettingsSection
              :title="settings_courses()"
              :items="courseItems"
              allow-delete
              @edit="openEditCourse"
              @delete="deleteCourseItem"
            >
              <template #action>
                <AddCourseButton />
              </template>
            </SettingsSection>

            <!-- Languages Section -->
            <SettingsSection
              :title="settings_languages()"
              :items="languageItems"
              allow-delete
              @edit="openEditLanguage"
              @delete="deleteLanguageItem"
            >
              <template #action>
                <AddLanguageButton />
              </template>
            </SettingsSection>

            <!-- Controls Section -->
            <SettingsSection
              :title="settings_final_controls()"
              :items="finalControlItems"
              allow-delete
              @edit="openEditFinalControl"
              @delete="deleteFinalControlItem"
            >
              <template #action>
                <AddFinalControlButton />
              </template>
            </SettingsSection>

            <SettingsSection
              :title="settings_intermediate_controls()"
              :items="intermediateControlItems"
              allow-delete
              @edit="openEditIntermediateControl"
              @delete="deleteIntermediateControlItem"
            >
              <template #action>
                <AddIntermediateControlButton />
              </template>
            </SettingsSection>
          </div>
        </div>
      </div>
    </f7-page-content>

    <!-- Modal placeholders for F7 Popovers -->
    <EditSemesterButton v-if="selectedSemesterId" :semester-id="selectedSemesterId" />
    <EditCourseButton v-if="selectedCourseId" :course-id="selectedCourseId" />
    <EditLanguageButton v-if="selectedLanguageId" :language-id="selectedLanguageId" />
    <EditFinalControlButton v-if="selectedFinalControlId" :control-id="selectedFinalControlId" />
    <EditIntermediateControlButton v-if="selectedIntermediateControlId" :control-id="selectedIntermediateControlId" />
  </f7-page>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import { storeToRefs } from "pinia";
import { f7Page, f7, f7PageContent } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import SettingsSection from "@/components/SettingsSection.vue";
import AddCourseButton from "@/components/AddCourseButton.vue";
import EditCourseButton from "@/components/EditCourseButton.vue";
import { useCourseStore } from "@/stores/courseStore";
import type { Course } from "@/stores/courseStore";
import AddSemesterButton from "@/components/AddSemesterButton.vue";
import EditSemesterButton from "@/components/EditSemesterButton.vue";
import { useSemesterStore } from "@/stores/semesterStore";
import type { Semester } from "@/stores/semesterStore";
import AddLanguageButton from "@/components/AddLanguageButton.vue";
import EditLanguageButton from "@/components/EditLanguageButton.vue";
import { useLanguageStore } from "@/stores/languageStore";
import type { Language } from "@/stores/languageStore";
import AddFinalControlButton from "@/components/AddFinalControlButton.vue";
import EditFinalControlButton from "@/components/EditFinalControlButton.vue";
import { useFinalControlStore } from "@/stores/finalControlStore";
import type { FinalControl } from "@/stores/finalControlStore";
import AddIntermediateControlButton from "@/components/AddIntermediateControlButton.vue";
import EditIntermediateControlButton from "@/components/EditIntermediateControlButton.vue";
import { useIntermediateControlStore } from "@/stores/intermediateControlStore";
import type { IntermediateControl } from "@/stores/intermediateControlStore";
import { useSidebar } from "@/composables/useSidebar";
import {
  settings_title,
  settings_semesters,
  settings_courses,
  settings_languages,
  settings_final_controls,
  settings_intermediate_controls,
} from "@/paraglide/messages";

const { contentMargin } = useSidebar();

const activeNavItem = ref("settings");

const courseStore = useCourseStore();
const semesterStore = useSemesterStore();
const languageStore = useLanguageStore();
const finalControlStore = useFinalControlStore();
const intermediateControlStore = useIntermediateControlStore();

const { courses } = storeToRefs(courseStore);
const { semesters } = storeToRefs(semesterStore);
const { languages } = storeToRefs(languageStore);
const { sortedFinalControls } = storeToRefs(finalControlStore);
const { sortedIntermediateControls } = storeToRefs(intermediateControlStore);

// Data Mappings for SettingsSection
const semesterItems = computed(() => semesters.value.map(s => ({
  id: s.id,
  number: s.shortName,
  name: s.fullName,
  idAttr: `semester-item-${s.id}`
})));

const courseItems = computed(() => courses.value.map(c => ({
  id: c.id,
  number: c.number,
  name: 'курс',
  details: c.semesters, // This might need mapping to names if they are just IDs
  idAttr: `course-item-${c.id}`
})));

const languageItems = computed(() => languages.value.map(l => ({
  id: l.id,
  name: l.name,
  shortName: l.code,
  idAttr: `language-item-${l.id}`
})));

const finalControlItems = computed(() => sortedFinalControls.value.map(c => ({
  id: c.id,
  name: c.name,
  shortName: c.shortName,
  idAttr: `final-control-item-${c.id}`
})));

const intermediateControlItems = computed(() => sortedIntermediateControls.value.map(c => ({
  id: c.id,
  name: c.name,
  shortName: c.shortName,
  idAttr: `intermediate-control-item-${c.id}`
})));

// State for selected ids
const selectedCourseId = ref<string | null>(null);
const selectedSemesterId = ref<string | null>(null);
const selectedLanguageId = ref<string | null>(null);
const selectedFinalControlId = ref<string | null>(null);
const selectedIntermediateControlId = ref<string | null>(null);

// Method to open edit course popover
const openEditCourse = async (item: any) => {
  selectedCourseId.value = item.id;
  await nextTick();
  const targetEl = document.getElementById(`course-item-${item.id}`);
  if (targetEl) {
    f7.popover.open(`#edit-settings-course-popover-${item.id}`, targetEl);
  }
};

// Method to open edit semester popover
const openEditSemester = async (item: any) => {
  selectedSemesterId.value = item.id;
  await nextTick();
  const targetEl = document.getElementById(`semester-item-${item.id}`);
  if (targetEl) {
    f7.popover.open(`#edit-semester-popover-${item.id}`, targetEl);
  }
};

// Method to open edit language popover
const openEditLanguage = async (item: any) => {
  selectedLanguageId.value = item.id;
  await nextTick();
  const targetEl = document.getElementById(`language-item-${item.id}`);
  if (targetEl) {
    f7.popover.open(`#edit-language-popover-${item.id}`, targetEl);
  }
};

// Method to open edit final control popover
const openEditFinalControl = async (item: any) => {
  selectedFinalControlId.value = item.id;
  await nextTick();
  const targetEl = document.getElementById(`final-control-item-${item.id}`);
  if (targetEl) {
    f7.popover.open(`#edit-settings-final-control-popover-${item.id}`, targetEl);
  }
};

// Method to open edit intermediate control popover
const openEditIntermediateControl = async (item: any) => {
  selectedIntermediateControlId.value = item.id;
  await nextTick();
  const targetEl = document.getElementById(`intermediate-control-item-${item.id}`);
  if (targetEl) {
    f7.popover.open(`#edit-settings-intermediate-control-popover-${item.id}`, targetEl);
  }
};

// ── Delete handlers ────────────────────────────────────────────────────────────
const deleteSemesterItem = (id: string) => {
  const item = semesters.value.find(s => s.id === id);
  f7.dialog.confirm(
    `<p>Удалить <strong>${item?.shortName || item?.fullName || 'запись'}</strong>?</p>
     <p class="text-sm text-muted-foreground mt-1">Это действие нельзя отменить.</p>`,
    'Удаление',
    async () => {
      try { await semesterStore.deleteSemester(id); }
      catch { f7.dialog.alert('Не удалось удалить запись.'); }
    }
  );
};

const deleteCourseItem = (id: string) => {
  const item = courses.value.find(c => c.id === id);
  f7.dialog.confirm(
    `<p>Удалить <strong>${item?.number ? item.number + ' курс' : 'запись'}</strong>?</p>
     <p class="text-sm text-muted-foreground mt-1">Это действие нельзя отменить.</p>`,
    'Удаление',
    async () => {
      try { await courseStore.deleteCourse(id); }
      catch { f7.dialog.alert('Не удалось удалить запись.'); }
    }
  );
};

const deleteLanguageItem = (id: string) => {
  const item = languages.value.find(l => l.id === id);
  f7.dialog.confirm(
    `<p>Удалить язык <strong>${item?.name || 'запись'}</strong>?</p>
     <p class="text-sm text-muted-foreground mt-1">Это действие нельзя отменить.</p>`,
    'Удаление',
    async () => {
      try { await languageStore.deleteLanguage(id); }
      catch { f7.dialog.alert('Не удалось удалить запись.'); }
    }
  );
};

const deleteFinalControlItem = (id: string) => {
  const item = sortedFinalControls.value.find(c => c.id === id);
  f7.dialog.confirm(
    `<p>Удалить <strong>${item?.name || 'запись'}</strong>?</p>
     <p class="text-sm text-muted-foreground mt-1">Это действие нельзя отменить.</p>`,
    'Удаление',
    async () => {
      try { await finalControlStore.deleteFinalControl(id); }
      catch { f7.dialog.alert('Не удалось удалить запись.'); }
    }
  );
};

const deleteIntermediateControlItem = (id: string) => {
  const item = sortedIntermediateControls.value.find(c => c.id === id);
  f7.dialog.confirm(
    `<p>Удалить <strong>${item?.name || 'запись'}</strong>?</p>
     <p class="text-sm text-muted-foreground mt-1">Это действие нельзя отменить.</p>`,
    'Удаление',
    async () => {
      try { await intermediateControlStore.deleteIntermediateControl(id); }
      catch { f7.dialog.alert('Не удалось удалить запись.'); }
    }
  );
};
</script>

<style scoped>
.desktop-header-container {
  flex-shrink: 0;
}

.settings-content {
  display: flex;
  overflow: hidden;
  height: calc(100vh - 80px);
}
</style>
