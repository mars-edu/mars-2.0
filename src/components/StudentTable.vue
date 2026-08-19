<template>
  <div class="bg-card rounded-lg shadow-sm border border-border overflow-hidden relative">
    <div
      v-if="loading"
      class="absolute inset-0 z-10 bg-background/40 backdrop-blur-[1px] flex items-center justify-center transition-all duration-300"
    >
      <div class="flex flex-col items-center gap-3">
        <div
          class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"
        ></div>
      </div>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead class="bg-muted/50 border-b border-border">
          <tr>
            <th v-if="selectionMode" class="px-4 py-4 w-10">
              <input
                type="checkbox"
                class="rounded border-border w-4 h-4 cursor-pointer"
                :checked="allOnPageSelected"
                @change="$emit('toggle-all')"
              />
            </th>
            <th
              v-if="showRowNumber"
              class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-14"
            >
              {{ student_card_col_num() }}
            </th>
            <th
              class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              {{ student_card_col_name() }}
            </th>
            <th
              v-if="showSpecialty"
              class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              {{ student_card_col_specialty() }}
            </th>
            <th
              v-if="showStatus"
              class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-32 text-center"
            >
              {{ student_card_col_status() }}
            </th>
            <th
              v-if="showLanguage"
              class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-24 text-center"
            >
              {{ student_card_col_language() }}
            </th>
            <th
              v-if="showCourse"
              class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20 text-center"
            >
              {{ student_card_col_course() }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr
            v-for="(student, index) in students"
            :key="student.id"
            :id="`student-item-${student.id}`"
            class="group hover:bg-muted/40 transition-colors"
            :class="[
              clickable ? 'cursor-pointer' : '',
              selectionMode && selectedIds.includes(student.id)
                ? 'bg-green-50/60 dark:bg-green-950/20'
                : '',
            ]"
            @click="handleRowClick(student)"
          >
            <td v-if="selectionMode" class="px-4 py-4">
              <input
                type="checkbox"
                class="rounded border-border w-4 h-4 cursor-pointer"
                :checked="selectedIds.includes(student.id)"
                @click.stop
                @change="$emit('toggle-select', student.id)"
              />
            </td>
            <td
              v-if="showRowNumber"
              class="px-6 py-4 text-sm text-muted-foreground/70 font-medium"
            >
              {{ startIndex + index + 1 }}
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-2">
                <span
                  class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  :class="student.gender === 'male' ? 'bg-sky-400' : 'bg-pink-400'"
                />
                <span class="font-medium text-foreground text-sm">
                  {{ student.surname }} {{ student.firstName }}
                  {{ student.patronymic }}
                </span>
              </div>
            </td>
            <td v-if="showSpecialty" class="px-6 py-4">
              <span class="text-sm font-medium text-foreground">
                {{
                  specialtyStore.getSpecialtyById(student.specialty)?.codeName ||
                  student.specialty ||
                  "—"
                }}
              </span>
            </td>
            <td v-if="showStatus" class="px-6 py-4 text-center">
              <div
                class="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                :class="getStatusBadgeClass(student.status)"
              >
                {{ getStatusText(student.status) }}
              </div>
            </td>
            <td v-if="showLanguage" class="px-6 py-4 text-center">
              <span
                class="inline-block text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide"
                :class="getLanguageBadgeClass(student.language)"
              >
                {{ getLanguageLabel(student.language) }}
              </span>
            </td>
            <td
              v-if="showCourse"
              class="px-6 py-4 text-center text-sm font-medium text-muted-foreground/70"
            >
              {{ student.course ?? "—" }}
            </td>
          </tr>
          <tr v-if="students.length === 0">
            <td
              :colspan="totalColumns"
              class="px-8 py-24 text-center text-muted-foreground/40 text-sm italic"
            >
              {{ emptyText || student_table_not_found() }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { useStudentHelpers } from "@/composables/useStudentHelpers";
import { getLanguageLabel, getLanguageBadgeClass } from "@/utils/languageBadge";
import {
  student_card_col_num,
  student_card_col_name,
  student_card_col_specialty,
  student_card_col_status,
  student_card_col_language,
  student_card_col_course,
  student_table_not_found,
} from "@/paraglide/messages";

interface StudentRow {
  id: string;
  firstName: string;
  surname: string;
  patronymic: string;
  gender?: "male" | "female";
  specialty?: string;
  language?: string;
  course?: number | string;
  status?: string;
}

const props = withDefaults(
  defineProps<{
    students: StudentRow[];
    startIndex?: number;
    clickable?: boolean;
    showRowNumber?: boolean;
    showSpecialty?: boolean;
    showStatus?: boolean;
    showLanguage?: boolean;
    showCourse?: boolean;
    selectionMode?: boolean;
    selectedIds?: string[];
    allOnPageSelected?: boolean;
    loading?: boolean;
    emptyText?: string;
  }>(),
  {
    startIndex: 0,
    clickable: true,
    showRowNumber: true,
    showSpecialty: true,
    showStatus: true,
    showLanguage: true,
    showCourse: true,
    selectionMode: false,
    selectedIds: () => [],
    allOnPageSelected: false,
    loading: false,
  },
);

const emit = defineEmits<{
  "row-click": [student: StudentRow];
  "toggle-select": [id: string];
  "toggle-all": [];
}>();

const specialtyStore = useSpecialtyStore();
const { getStatusText, getStatusBadgeClass } = useStudentHelpers();

const totalColumns = computed(
  () =>
    (props.selectionMode ? 1 : 0) +
    (props.showRowNumber ? 1 : 0) +
    1 +
    (props.showSpecialty ? 1 : 0) +
    (props.showStatus ? 1 : 0) +
    (props.showLanguage ? 1 : 0) +
    (props.showCourse ? 1 : 0),
);

const handleRowClick = (student: StudentRow) => {
  if (props.selectionMode) {
    emit("toggle-select", student.id);
  } else if (props.clickable) {
    emit("row-click", student);
  }
};
</script>
