<template>
  <div class="bg-card text-card-foreground rounded-xl p-4 md:p-5 shadow-md">
    <!-- Report Configuration Section -->
    <div class="grid grid-cols-1 gap-4 mb-6">
      <Select
        :model-value="selectedReportCategory"
        @update:model-value="$emit('update:selectedReportCategory', $event)"
        :options="reportCategoryOptions"
        :placeholder="analytics_category()"
        name="report-category"
        class="w-full"
      />
    </div>

    <!-- Expandable Sections -->
    <Accordion>
      <AccordionItem id="specialties" :default-expanded="true">
        <template #title>{{ analytics_specialties() }}</template>
        <template #selected-item>
          <span
            v-if="selectedSpecialties.length > 0"
            class="ml-2 text-xs md:text-sm px-2 py-1 rounded-md ring-2 ring-primary bg-primary/10"
          >
            {{ common_selected({ count: selectedSpecialties.length }) }}
          </span>
        </template>
        <div class="flex flex-wrap items-center gap-2 md:gap-3">
          <div
            class="flex items-center justify-between gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
            :class="{
              'ring-2 ring-primary bg-primary/10':
                selectedSpecialties.length === specialties.length &&
                specialties.length > 0,
            }"
            @click="toggleSelectAllSpecialties"
          >
            <span class="font-medium">{{ common_all() }}</span>
            <IconCircleCheck
              v-if="
                selectedSpecialties.length === specialties.length &&
                specialties.length > 0
              "
              class="w-[18px] h-[18px] text-primary"
            />
          </div>
          <div
            v-for="specialty in specialties"
            :key="specialty.id"
            class="flex items-center justify-between gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
            :class="{
              'ring-2 ring-primary bg-primary/10':
                selectedSpecialties.includes(specialty.id),
            }"
            @click="toggleSpecialtySelection(specialty.id)"
          >
            <span class="font-medium">
              {{ specialty.codeName || specialty.name }}
            </span>
            <IconInfo
              class="w-[18px] h-[18px] text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              :id="`specialty-item-${specialty.id}`"
              @click.stop="
                handleSpecialtyInfoClick(
                  specialty,
                  `#specialty-item-${specialty.id}`
                )
              "
            />
          </div>
          <div
            v-if="specialties.length === 0"
            class="text-muted-foreground"
          >
            {{ rup_no_specialties() }}
          </div>
        </div>
      </AccordionItem>

      <AccordionItem id="courses" :default-expanded="true">
        <template #title>{{ analytics_courses() }}</template>
        <template #selected-item>
          <span
            v-if="selectedCourses.length > 0"
            class="ml-2 text-xs md:text-sm px-2 py-1 rounded-md ring-2 ring-primary bg-primary/10"
          >
            {{ common_selected({ count: selectedCourses.length }) }}
          </span>
        </template>
        <div class="flex flex-wrap items-center gap-2 md:gap-3">
          <button
            class="w-fit flex items-center justify-between gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
            :class="{
              'ring-2 ring-primary bg-primary/10':
                selectedCourses.length === courseNumbers.length &&
                courseNumbers.length > 0,
            }"
            @click="toggleSelectAllCourses"
          >
            <span class="font-medium">{{ common_all() }}</span>
            <IconCircleCheck
              v-if="
                selectedCourses.length === courseNumbers.length &&
                courseNumbers.length > 0
              "
              class="w-[18px] h-[18px] text-primary"
            />
          </button>
          <button
            v-for="course in courseNumbers"
            :key="course"
            @click="toggleCourseSelection(course)"
            class="w-fit flex items-center justify-between gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
            :class="{
              'ring-2 ring-primary bg-primary/10':
                selectedCourses.includes(course),
            }"
          >
            <span class="font-medium">{{ analytics_course_label({ course }) }}</span>
          </button>
          <div
            v-if="courseNumbers.length === 0"
            class="text-muted-foreground"
          >
            {{ settings_no_courses() }}
          </div>
        </div>
      </AccordionItem>

      <AccordionItem id="languages" :default-expanded="true">
        <template #title>{{ analytics_languages() }}</template>
        <template #selected-item>
          <span
            v-if="selectedLanguageGroups.length > 0"
            class="ml-2 text-xs md:text-sm px-2 py-1 rounded-md ring-2 ring-primary bg-primary/10"
          >
            {{ common_selected({ count: selectedLanguageGroups.length }) }}
          </span>
        </template>
        <div class="flex flex-wrap items-center gap-2 md:gap-3">
          <div
            class="flex items-center justify-between gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
            :class="{
              'ring-2 ring-primary bg-primary/10':
                selectedLanguageGroups.length === languages.length &&
                languages.length > 0,
            }"
            @click="toggleSelectAllLanguages"
          >
            <span class="font-medium">{{ common_all() }}</span>
            <IconCircleCheck
              v-if="
                selectedLanguageGroups.length === languages.length &&
                languages.length > 0
              "
              class="w-[18px] h-[18px] text-primary"
            />
          </div>
          <div
            v-for="language in languages"
            :key="language.id"
            class="flex items-center justify-between gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
            :class="{
              'ring-2 ring-primary bg-primary/10':
                selectedLanguageGroups.includes(language.code),
            }"
            @click="toggleLanguageSelection(language.code)"
          >
            <span class="font-medium">{{ language.name }}</span>
            <IconCircleCheck
              v-if="selectedLanguageGroups.includes(language.code)"
              class="w-[18px] h-[18px] text-primary"
            />
          </div>
          <div
            v-if="languages.length === 0"
            class="text-muted-foreground"
          >
            {{ settings_no_languages() }}
          </div>
        </div>
      </AccordionItem>

      <AccordionItem id="students" :default-expanded="true">
        <template #title>{{ analytics_students() }}</template>
        <template #selected-item>
          <span
            v-if="selectedStudents.length > 0"
            class="ml-2 text-xs md:text-sm px-2 py-1 rounded-md ring-2 ring-primary bg-primary/10"
          >
            {{ common_selected({ count: selectedStudents.length }) }}
          </span>
        </template>
        <div class="overflow-y-auto border border-input rounded-lg">
          <table class="w-full text-sm">
            <thead class="sticky top-0 bg-card z-10">
              <tr class="border-b border-input">
                <th class="p-2 text-left w-12">
                  <f7-checkbox
                    :checked="isAllStudentsSelected"
                    @change="toggleSelectAllStudents"
                  />
                </th>
                <th class="p-2 text-left font-medium">{{ analytics_full_name() }}</th>
                <th class="p-2 text-left font-medium">{{ analytics_course() }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="student in filteredStudentsForAnalytics"
                :key="student.id"
                class="border-b border-input last:border-b-0 hover:bg-muted/50"
              >
                <td class="p-2">
                  <f7-checkbox
                    :checked="selectedStudents.includes(student.id)"
                    @change="toggleStudentSelection(student.id)"
                  />
                </td>
                <td class="p-2">{{ student.fullName }}</td>
                <td class="p-2 text-center">{{ student.course }}</td>
              </tr>
            </tbody>
          </table>
          <div
            v-if="filteredStudentsForAnalytics.length === 0"
            class="p-4 text-center text-muted-foreground"
          >
            {{ analytics_no_students_filter() }}
          </div>
        </div>
      </AccordionItem>
    </Accordion>

    <!-- Action Buttons -->
    <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
      <f7-button
        small
        default
        @click="$emit('reset')"
        class="bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
      >
        <IconRotateCw class="w-4 h-4 mr-2" />
        {{ common_reset() }}
      </f7-button>
      <f7-button
        small
        default
        :disabled="!canGenerateReport"
        @click="$emit('generate')"
        class="bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <IconCopy class="w-4 h-4 mr-2" />
        {{ common_export() }}
      </f7-button>
      <f7-button
        small
        default
        :disabled="!canGenerateReport"
        @click="$emit('export-excel')"
        class="bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <IconFileText class="w-4 h-4 mr-2" />
        {{ analytics_export_excel() }}
      </f7-button>
    </div>

    <!-- Specialty info popover -->
    <f7-popover
      class="specialty-info-popover"
      :arrow="true"
      style="width: 320px !important"
    >
      <div class="p-4 space-y-2 bg-card text-card-foreground">
        <h4 class="font-semibold text-base">
          {{ selectedSpecialtyInfo?.name || analytics_no_name() }}
        </h4>
        <p class="text-sm text-muted-foreground">
          {{ selectedSpecialtyInfo?.codeName || "" }}
        </p>
        <p class="text-sm text-foreground">
          {{ selectedSpecialtyInfo?.details || analytics_no_extra_info() }}
        </p>
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7, f7Button, f7Checkbox, f7Popover } from "framework7-vue";
import IconCircleCheck from "~icons/lucide/circle-check";
import IconInfo from "~icons/lucide/info";
import IconRotateCw from "~icons/lucide/rotate-cw";
import IconCopy from "~icons/lucide/copy";
import IconFileText from "~icons/lucide/file-text";
import Select from "@/components/ui/Select.vue";
import Accordion from "@/components/ui/accordion/Accordion.vue";
import AccordionItem from "@/components/ui/accordion/AccordionItem.vue";
import type { Specialty } from "@/types/specialty";
import type { StudyLanguage } from "@/types/study-language";
import {
  analytics_category,
  analytics_specialties,
  analytics_courses,
  analytics_course_label,
  analytics_export_excel,
  analytics_languages,
  analytics_students,
  analytics_full_name,
  analytics_course,
  analytics_no_students_filter,
  analytics_no_name,
  analytics_no_extra_info,
  rup_no_specialties,
  settings_no_courses,
  settings_no_languages,
  common_all,
  common_selected,
  common_reset,
  common_export,
} from "@/paraglide/messages";

const props = defineProps<{
  selectedReportCategory: string;
  reportCategoryOptions: Array<{ value: string; text: string }>;
  specialties: Specialty[];
  selectedSpecialties: string[];
  courseNumbers: string[];
  selectedCourses: string[];
  languages: StudyLanguage[];
  selectedLanguageGroups: string[];
  filteredStudentsForAnalytics: Array<{ id: string; fullName: string; course: number }>;
  selectedStudents: string[];
  canGenerateReport: boolean;
}>();

const emit = defineEmits<{
  (e: "update:selectedReportCategory", value: string): void;
  (e: "update:selectedSpecialties", value: string[]): void;
  (e: "update:selectedCourses", value: string[]): void;
  (e: "update:selectedLanguageGroups", value: string[]): void;
  (e: "update:selectedStudents", value: string[]): void;
  (e: "reset"): void;
  (e: "generate"): void;
  (e: "export-excel"): void;
}>();

const selectedSpecialtyInfo = ref<any>(null);

const isAllStudentsSelected = computed(() => {
  return (
    props.filteredStudentsForAnalytics.length > 0 &&
    props.selectedStudents.length === props.filteredStudentsForAnalytics.length
  );
});

const toggleSelectAllStudents = () => {
  if (isAllStudentsSelected.value) {
    emit("update:selectedStudents", []);
  } else {
    emit(
      "update:selectedStudents",
      props.filteredStudentsForAnalytics.map((s) => s.id)
    );
  }
};

const toggleStudentSelection = (studentId: string) => {
  const list = [...props.selectedStudents];
  const idx = list.indexOf(studentId);
  if (idx > -1) {
    list.splice(idx, 1);
  } else {
    list.push(studentId);
  }
  emit("update:selectedStudents", list);
};

const toggleCourseSelection = (courseNumber: string) => {
  const list = [...props.selectedCourses];
  const idx = list.indexOf(courseNumber);
  if (idx > -1) {
    list.splice(idx, 1);
  } else {
    list.push(courseNumber);
  }
  emit("update:selectedCourses", list);
};

const toggleSelectAllCourses = () => {
  if (
    props.selectedCourses.length === props.courseNumbers.length &&
    props.courseNumbers.length > 0
  ) {
    emit("update:selectedCourses", []);
  } else {
    emit("update:selectedCourses", [...props.courseNumbers]);
  }
};

const toggleSpecialtySelection = (specialtyId: string) => {
  const list = [...props.selectedSpecialties];
  const idx = list.indexOf(specialtyId);
  if (idx > -1) {
    list.splice(idx, 1);
  } else {
    list.push(specialtyId);
  }
  emit("update:selectedSpecialties", list);
};

const toggleSelectAllSpecialties = () => {
  if (
    props.selectedSpecialties.length === props.specialties.length &&
    props.specialties.length > 0
  ) {
    emit("update:selectedSpecialties", []);
  } else {
    emit(
      "update:selectedSpecialties",
      props.specialties.map((s) => s.id)
    );
  }
};

const toggleLanguageSelection = (languageCode: string) => {
  const list = [...props.selectedLanguageGroups];
  const idx = list.indexOf(languageCode);
  if (idx > -1) {
    list.splice(idx, 1);
  } else {
    list.push(languageCode);
  }
  emit("update:selectedLanguageGroups", list);
};

const toggleSelectAllLanguages = () => {
  if (
    props.selectedLanguageGroups.length === props.languages.length &&
    props.languages.length > 0
  ) {
    emit("update:selectedLanguageGroups", []);
  } else {
    emit(
      "update:selectedLanguageGroups",
      props.languages.map((l) => l.code)
    );
  }
};

const handleSpecialtyInfoClick = (specialty: any, iconId: string) => {
  selectedSpecialtyInfo.value = specialty;
  f7.popover.open(".specialty-info-popover", iconId);
};
</script>
