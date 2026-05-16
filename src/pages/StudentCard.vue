<template>
  <f7-page
    name="student-card"
    class="flex flex-col h-screen bg-background text-foreground"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />
    <Sidebar v-model:activeNavItem="activeNavItem" />

    <div
      class="flex flex-1 overflow-hidden p-2 md:p-4 transition-all duration-200"
      :class="contentMargin"
    >
      <div class="flex-1 flex flex-col min-h-0 rounded-2xl border border-border/10 overflow-hidden bg-card shadow-[0_8px_30px_rgba(0,0,0,0.04)]">

        <!-- Title row -->
        <div class="flex items-center px-8 py-6 pb-2 shrink-0">
          <h1 class="text-xl font-bold text-foreground whitespace-nowrap">{{ student_card_title() }}</h1>
        </div>

        <!-- Scrollable content -->
        <div class="flex-1 overflow-y-auto p-6 pb-16 md:pb-6">
          <div class="w-full space-y-6 pb-8">

            <!-- Promotion mode bulk action bar -->
            <div
              v-if="isPromotionMode"
              class="flex items-center justify-between gap-4 p-4 rounded-lg border border-border bg-card shadow-sm animate-in slide-in-from-top-2"
            >
              <div class="flex items-center gap-4 flex-wrap">
                <div class="flex items-center gap-2 font-semibold text-foreground text-sm">
                  <IconGraduationCap class="w-5 h-5 text-muted-foreground" />
                  <span>Режим перевода курса</span>
                </div>
                <span class="text-sm px-3 py-1 bg-muted text-muted-foreground rounded-full font-medium">
                  Выбрано: {{ selectedStudentIds.length }}
                </span>
                <div class="h-5 w-px bg-border mx-1"></div>
                <div class="flex items-center gap-2">
                  <label class="text-sm text-muted-foreground font-medium whitespace-nowrap">№ Приказа:</label>
                  <input
                    v-model="promotionOrder"
                    type="text"
                    placeholder="Введите номер..."
                    class="promotion-order-input rounded-lg px-3 py-1.5 text-sm w-44"
                    autofocus
                  />
                </div>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <button
                  @click="handleCancelPromotion"
                  class="w-auto px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  @click="handleBulkPromotion"
                  :disabled="!promotionOrder || selectedStudentIds.length === 0"
                  class="w-auto px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
                >
                  Подтвердить перевод
                </button>
              </div>
            </div>

            <!-- Controls Card -->
            <div class="student-card-filters space-y-3 p-4 rounded-lg shadow-sm border border-border bg-card">
              <!-- Row 1: search + add + promote button -->
              <div class="flex items-center gap-3">
                <div class="relative flex-1 max-w-sm">
                  <IconSearch class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 w-[18px] h-[18px]" />
                  <input
                    v-model="searchTerm"
                    type="text"
                    :placeholder="student_card_search()"
                    class="student-search-input w-full pl-10 pr-4 py-2 rounded-lg text-sm text-foreground transition-all"
                    @input="handleSearchInput"
                  />
                </div>
                <button
                  v-if="!isPromotionMode"
                  @click="handleStartPromotion"
                  class="w-auto flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-lg transition-colors shadow-sm border border-border text-sm"
                >
                  <IconGraduationCap class="w-[18px] h-[18px]" />
                  <span class="hidden sm:inline">Перевести на следующий курс</span>
                </button>
                <button
                  @click="triggerAddStudent"
                  class="w-auto flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors shadow-sm"
                >
                  <IconPlus class="w-[18px] h-[18px]" />
                  <span class="hidden sm:inline">{{ common_add() }}</span>
                </button>
              </div>
              <!-- Row 2: filter selects -->
              <div class="flex flex-wrap gap-3 items-center">
                <Select
                  id="student-filter-year"
                  v-model="selectedAcademicYear"
                  :options="academicYearOptions"
                  :placeholder="student_card_year()"
                  class="w-56"
                />
                <Select
                  id="student-filter-specialty"
                  v-model="selectedSpecialty"
                  :options="specialtyOptions"
                  :placeholder="student_card_specialty()"
                  class="w-60"
                />
                <Select
                  id="student-filter-gender"
                  v-model="selectedGender"
                  :options="genderOptions"
                  :placeholder="student_card_gender()"
                  class="w-40"
                />
                <Select
                  id="student-filter-base"
                  v-model="selectedBase"
                  :options="baseOptions"
                  :placeholder="student_card_base()"
                  class="w-40"
                />
              </div>
            </div>

            <!-- Table Card -->
            <div class="bg-card rounded-lg shadow-sm border border-border overflow-hidden relative">
              <div 
                v-if="isPaginatedLoading"
                class="absolute inset-0 z-10 bg-background/40 backdrop-blur-[1px] flex items-center justify-center transition-all duration-300"
              >
                <div class="flex flex-col items-center gap-3">
                  <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead class="bg-muted/50 border-b border-border">
                    <tr>
                      <th v-if="isPromotionMode" class="px-4 py-4 w-10">
                        <input
                          type="checkbox"
                          class="rounded border-border w-4 h-4 cursor-pointer"
                          :checked="allOnPageSelected"
                          @change="toggleAll"
                        />
                      </th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-14">{{ student_card_col_num() }}</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{{ student_card_col_name() }}</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{{ student_card_col_specialty() }}</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-32 text-center">{{ student_card_col_status() }}</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-24 text-center">{{ student_card_col_language() }}</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20 text-center">{{ student_card_col_course() }}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-border">
                    <tr
                      v-for="(student, index) in paginatedFilteredStudents"
                      :key="student.id"
                      :id="`student-item-${student.id}`"
                      class="group hover:bg-muted/40 transition-colors cursor-pointer"
                      :class="{ 'bg-green-50/60 dark:bg-green-950/20': isPromotionMode && selectedStudentIds.includes(student.id) }"
                      @click="isPromotionMode ? toggleSelect(student.id) : selectStudent(student)"
                    >
                      <td v-if="isPromotionMode" class="px-4 py-4">
                        <input
                          type="checkbox"
                          class="rounded border-border w-4 h-4 cursor-pointer"
                          :checked="selectedStudentIds.includes(student.id)"
                          @click.stop
                          @change="toggleSelect(student.id)"
                        />
                      </td>
                      <td class="px-6 py-4 text-sm text-muted-foreground/70 font-medium">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-2">
                          <span
                            class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            :class="student.gender === 'male' ? 'bg-sky-400' : 'bg-pink-400'"
                          />
                          <span class="font-medium text-foreground text-sm">
                            {{ student.surname }} {{ student.firstName }} {{ student.patronymic }}
                          </span>
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm font-medium text-foreground">
                          {{ specialtyStore.getSpecialtyById(student.specialty)?.codeName || "—" }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <div 
                          class="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                          :class="getStatusBadgeClass(student.status)"
                        >
                          {{ getStatusText(student.status) }}
                        </div>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <span
                          class="inline-block text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide"
                          :class="{
                            'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400': student.language === 'ru',
                            'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400': student.language === 'kk',
                            'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400': student.language === 'en',
                          }"
                        >{{ student.language === 'kk' ? 'Kz' : student.language === 'ru' ? 'Ru' : student.language || '—' }}</span>
                      </td>
                      <td class="px-6 py-4 text-center text-sm font-medium text-muted-foreground/70">{{ student.course }}</td>
                    </tr>
                    <tr v-if="paginatedFilteredStudents.length === 0">
                      <td :colspan="isPromotionMode ? 7 : 6" class="px-8 py-24 text-center text-muted-foreground/40 text-sm italic">
                        Обучающиеся не найдены
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Pagination -->
              <Pagination
                v-if="filteredStudents.length > 0"
                v-model:currentPage="currentPage"
                :total-items="filteredStudents.length"
                :page-size="pageSize"
              />
            </div>

          </div>
        </div>
      </div>
    </div>

    <template #fixed>
      <AddStudentButton />
    </template>

    <StudentDetailsDialog
      v-if="selectedStudentId"
      :key="`details-${selectedStudentId}`"
      :student-id="selectedStudentId"
      @closed="selectedStudentId = null"
    />
  </f7-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { f7Page, f7Button, f7 } from "framework7-vue";
import IconSearch from "~icons/lucide/search";
import IconPlus from "~icons/lucide/plus";
import IconGraduationCap from "~icons/lucide/graduation-cap";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import AddStudentButton from "@/components/AddStudentButton.vue";
import StudentDetailsDialog from "@/components/StudentDetailsDialog.vue";
import Select from "@/components/ui/Select.vue";
import Pagination from "@/components/ui/Pagination.vue";
import { useStudentStore, type Student } from "@/stores/studentStore";
import { withAllOption, getGenderOptions } from "@/lib/utils";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { useLanguageStore } from "@/stores/languageStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useBaseStore } from "@/stores/baseStore";
import { storeToRefs } from "pinia";
import { useSidebar } from "@/composables/useSidebar";
import type { StudentStatus } from "@/types/student";
import { useStudentHelpers } from "@/composables/useStudentHelpers";
import {
  student_card_title,
  student_card_search,
  student_card_year,
  student_card_specialty,
  student_card_gender,
  student_card_base,
  student_card_col_num,
  student_card_col_name,
  student_card_col_specialty,
  student_card_col_language,
  student_card_col_course,
  student_card_col_status,
  common_add,
} from "@/paraglide/messages";
import { useI18n } from "@/composables/useI18n";

const { locale } = useI18n();

const { contentMargin } = useSidebar();
const activeNavItem = ref("student-card");
const studentStore = useStudentStore();
const specialtyStore = useSpecialtyStore();
const languageStore = useLanguageStore();
const academicYearStore = useAcademicYearStore();
const baseStore = useBaseStore();
const { getStatusText, getStatusBadgeClass } = useStudentHelpers();

const { academicYearOptions } = storeToRefs(academicYearStore);
const { paginatedFilteredStudents, filteredStudents, currentPage, pageSize, isPaginatedLoading } = storeToRefs(studentStore);
const { specialtyOptions: storeSpecialtyOptions } = storeToRefs(specialtyStore);
const { baseOptions: storeBaseOptions } = storeToRefs(baseStore);

const selectedSpecialty = ref("");
const selectedLanguage = ref("");
const selectedGender = ref("");
const selectedBase = ref("");
const selectedAcademicYear = ref("");
const searchTerm = ref("");
const selectedStudentId = ref<string | null>(null);
const isInitializing = ref(true);

// Promotion mode state
const isPromotionMode = ref(false);
const selectedStudentIds = ref<string[]>([]);
const promotionOrder = ref("");

onMounted(async () => {
  try {
    studentStore.clearFilters();
    selectedSpecialty.value = "";
    selectedLanguage.value = "";
    selectedGender.value = "";
    selectedBase.value = "";
    selectedAcademicYear.value = "";
    searchTerm.value = "";
    selectedStudentId.value = null;
  } finally {
    isInitializing.value = false;
  }
});

const genderOptions = computed(() => getGenderOptions());
const specialtyOptions = computed(() => withAllOption(storeSpecialtyOptions.value));
const baseOptions = computed(() => storeBaseOptions.value);

selectedAcademicYear.value = academicYearStore.getActiveAcademicYear?.id || "";

watch(selectedSpecialty, (newValue) => {
  studentStore.setFilter("specialty", newValue);
});

watch(selectedGender, (newValue) => {
  studentStore.setFilter("gender", newValue);
});

watch(selectedBase, (newValue) => {
  studentStore.setFilter("base", newValue);
});

watch(selectedAcademicYear, (newValue) => {
  studentStore.setFilter("academicYearId", newValue);
});

watch(searchTerm, (newValue) => {
  studentStore.setFilter("searchTerm", newValue);
});

const allOnPageSelected = computed(() => {
  const ids = paginatedFilteredStudents.value.map(s => s.id);
  return ids.length > 0 && ids.every(id => selectedStudentIds.value.includes(id));
});

const toggleSelect = (id: string) => {
  if (selectedStudentIds.value.includes(id)) {
    selectedStudentIds.value = selectedStudentIds.value.filter(sid => sid !== id);
  } else {
    selectedStudentIds.value = [...selectedStudentIds.value, id];
  }
};

const toggleAll = () => {
  const ids = paginatedFilteredStudents.value.map(s => s.id);
  if (allOnPageSelected.value) {
    selectedStudentIds.value = selectedStudentIds.value.filter(id => !ids.includes(id));
  } else {
    const merged = new Set([...selectedStudentIds.value, ...ids]);
    selectedStudentIds.value = Array.from(merged);
  }
};

const handleStartPromotion = () => {
  isPromotionMode.value = true;
  selectedStudentIds.value = [];
};

const handleCancelPromotion = () => {
  isPromotionMode.value = false;
  selectedStudentIds.value = [];
  promotionOrder.value = "";
};

const handleBulkPromotion = () => {
  if (!promotionOrder.value || selectedStudentIds.value.length === 0) return;
  const count = selectedStudentIds.value.length;
  handleCancelPromotion();
  f7.toast.create({
    text: `Переведено на следующий курс: ${count} студентов (Приказ №${promotionOrder.value})`,
    closeTimeout: 3000,
  }).open();
};

const selectStudent = async (student: Student) => {
  selectedStudentId.value = student.id;
  await nextTick();
  f7.popup.open(`#student-details-popup-${student.id}`);
};

const handleSearchInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  searchTerm.value = target.value;
};

const triggerAddStudent = () => {
  const btn = document.getElementById("add-student-button");
  if (btn) btn.click();
};
</script>

<style scoped>
.student-search-input {
  background-color: rgb(243, 244, 246) !important;
  border: 1px solid rgb(229, 231, 235) !important;
  color: hsl(var(--foreground)) !important;
  outline: none !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
  padding: 0.5rem 1rem 0.5rem 2.5rem !important;
  font-size: 0.875rem !important;
  line-height: 1.25rem !important;
  border-radius: 0.5rem !important;
  width: 100% !important;
}
.student-search-input::placeholder {
  color: rgb(156, 163, 175) !important;
}
.student-search-input:focus {
  background-color: rgb(255, 255, 255) !important;
  border-color: rgb(209, 213, 219) !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08) !important;
}
.promotion-order-input {
  background-color: rgb(243, 244, 246) !important;
  border: 1px solid rgb(209, 213, 219) !important;
  color: hsl(var(--foreground)) !important;
  outline: none !important;
}
.promotion-order-input:focus {
  background-color: rgb(255, 255, 255) !important;
  border-color: rgb(156, 163, 175) !important;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.15) !important;
}
</style>

<style>
@media (min-width: 768px) {
  #add-student-button {
    display: none !important;
  }
}
</style>
