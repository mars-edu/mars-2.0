<template>
  <f7-page
    name="teacher-card"
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
          <h1 class="text-xl font-bold text-foreground whitespace-nowrap">{{ teacher_card_title() }}</h1>
        </div>

        <!-- Scrollable content -->
        <div class="flex-1 overflow-y-auto p-6 pb-16 md:pb-6">
          <div class="w-full space-y-6 pb-8">

            <!-- Controls Card -->
            <div class="teacher-card-filters space-y-3 p-4 rounded-lg shadow-sm border border-border bg-card">
              <!-- Row 1: search + add -->
              <div class="flex items-center gap-3">
                <div class="relative flex-1 max-w-sm">
                  <IconSearch class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 w-[18px] h-[18px]" />
                  <input
                    v-model="searchTerm"
                    type="text"
                    :placeholder="teacher_card_search()"
                    class="teacher-search-input w-full pl-10 pr-4 py-2 rounded-lg text-sm text-foreground transition-all"
                  />
                </div>
                <button
                  @click="triggerAddTeacher"
                  class="w-auto flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors shadow-sm"
                >
                  <IconPlus class="w-[18px] h-[18px]" />
                  <span class="hidden sm:inline">{{ common_add() }}</span>
                </button>
              </div>
              <!-- Row 2: filter selects -->
              <div class="flex flex-wrap gap-3 items-center">
                <Select
                  id="teacher-filter-position"
                  v-model="selectedPosition"
                  :options="positionOptions"
                  :placeholder="teacher_card_position()"
                  class="w-48"
                />
                <Select
                  id="teacher-filter-year"
                  v-model="selectedEmploymentYear"
                  :options="employmentYearOptions"
                  :placeholder="teacher_card_year()"
                  class="w-40"
                />
                <Select
                  id="teacher-filter-gender"
                  v-model="selectedGender"
                  :options="genderOptions"
                  :placeholder="teacher_card_gender()"
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
              <div class="overflow-x-auto">                <table class="w-full text-left border-collapse">
                  <thead class="bg-muted/50 border-b border-border">
                    <tr>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-14">{{ teacher_card_col_num() }}</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{{ teacher_card_col_name() }}</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{{ teacher_card_col_login() }}</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{{ teacher_card_col_email() }}</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{{ teacher_card_col_position() }}</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20">{{ teacher_card_col_year() }}</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right w-40">{{ teacher_card_col_actions() }}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-border">
                    <tr
                      v-for="(teacher, index) in paginatedFilteredTeachers"
                      :key="teacher.id"
                      :id="`teacher-item-${teacher.id}`"
                      class="group hover:bg-muted/40 transition-colors cursor-pointer"
                      @click="selectTeacher(teacher)"
                    >
                      <td class="px-6 py-4 text-sm text-muted-foreground/70 font-medium">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-2">
                          <span
                            class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            :class="teacher.gender === 'male' ? 'bg-sky-400' : 'bg-pink-400'"
                          />
                          <span class="font-medium text-foreground text-sm">{{ teacherStore.getTeacherFullName(teacher.id) }}</span>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-sm text-muted-foreground">{{ teacher.username || "—" }}</td>
                      <td class="px-6 py-4 text-sm text-muted-foreground">{{ teacher.email || "—" }}</td>
                      <td class="px-6 py-4 text-sm text-foreground">{{ teacher.position }}</td>
                      <td class="px-6 py-4 text-sm text-muted-foreground">{{ teacher.employmentYear }}</td>
                      <td class="px-6 py-4 text-right">
                        <div class="flex items-center justify-end gap-1" @click.stop>
                          <button
                            v-if="!teacher.email"
                            @click="generateCredentials(teacher)"
                            :disabled="generatingForId === teacher.id"
                            class="px-3 py-1.5 text-xs font-medium bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            {{ generatingForId === teacher.id ? teacher_card_generating() : teacher_card_create_account() }}
                          </button>
                          <button
                            v-else
                            @click="openActionsMenu(teacher, $event)"
                            class="p-2 text-muted-foreground/40 hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors"
                            :id="`teacher-actions-${teacher.id}`"
                          >
                            <IconEllipsisVertical class="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="paginatedFilteredTeachers.length === 0">
                      <td colspan="7" class="px-8 py-24 text-center text-muted-foreground/40 text-sm italic">
                        Преподаватели не найдены
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Pagination -->
              <Pagination
                v-if="filteredTeachers.length > 0"
                v-model:currentPage="currentPage"
                :total-items="filteredTeachers.length"
                :page-size="pageSize"
              />
            </div>

          </div>
        </div>
      </div>
    </div>

    <template #fixed>
      <AddTeacherButton />
    </template>

    <EditTeacherButton
      v-if="selectedTeacherId"
      :key="`edit-${selectedTeacherId}`"
      :teacher-id="selectedTeacherId"
    />

    <PasswordHistoryPopup
      v-if="selectedTeacherForHistory"
      :key="`history-${selectedTeacherForHistory.id}`"
      :teacher-id="selectedTeacherForHistory.id"
      :user-id="selectedTeacherForHistory.userId"
    />
  </f7-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { f7Page, f7 } from "framework7-vue";
import IconSearch from "~icons/lucide/search";
import IconPlus from "~icons/lucide/plus";
import IconEllipsisVertical from "~icons/lucide/ellipsis-vertical";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import AddTeacherButton from "@/components/AddTeacherButton.vue";
import EditTeacherButton from "@/components/EditTeacherButton.vue";
import PasswordHistoryPopup from "@/components/PasswordHistoryPopup.vue";
import Select from "@/components/ui/Select.vue";
import Pagination from "@/components/ui/Pagination.vue";
import { useTeacherStore, type Teacher } from "@/stores/teacherStore";
import { getGenderOptions } from "@/lib/utils";
import { usePositionStore } from "@/stores/positionStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { storeToRefs } from "pinia";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useSidebar } from "@/composables/useSidebar";
import {
  teacher_card_title,
  teacher_card_search,
  teacher_card_position,
  teacher_card_year,
  teacher_card_gender,
  teacher_card_col_num,
  teacher_card_col_name,
  teacher_card_col_login,
  teacher_card_col_email,
  teacher_card_col_position,
  teacher_card_col_year,
  teacher_card_col_actions,
  teacher_card_generating,
  teacher_card_create_account,
  teacher_card_update_password,
  teacher_card_password_history,
  teacher_card_credentials_created,
  teacher_card_password_updated,
  teacher_card_create_error,
  teacher_card_regen_error,
  teacher_card_no_user_error,
  teacher_card_error_title,
  teacher_card_credential_full_name,
  teacher_card_credential_login,
  teacher_card_credential_password,
  teacher_card_credential_new_password,
  teacher_card_credential_save_note,
  teacher_card_credential_save_new_note,
  common_cancel,
  common_add,
} from "@/paraglide/messages";
import { useI18n } from "@/composables/useI18n";

const { locale } = useI18n();

const { contentMargin } = useSidebar();
const activeNavItem = ref("teacher-card");
const teacherStore = useTeacherStore();
const positionStore = usePositionStore();
const academicYearStore = useAcademicYearStore();

const { positions } = storeToRefs(positionStore);
const { academicYearsAsNumbers } = storeToRefs(academicYearStore);
const { paginatedFilteredTeachers, filteredTeachers, currentPage, pageSize, isPaginatedLoading } = storeToRefs(teacherStore);

const selectedPosition = ref("");
const selectedEmploymentYear = ref("");
const selectedGender = ref("");
const searchTerm = ref("");
const selectedTeacherId = ref<string | null>(null);
const selectedTeacherForHistory = ref<Teacher | null>(null);
const generatingForId = ref<string | null>(null);

onMounted(() => {
  teacherStore.clearFilters();
  selectedPosition.value = "";
  selectedEmploymentYear.value = "";
  selectedGender.value = "";
  searchTerm.value = "";
  selectedTeacherId.value = null;
});

const positionOptions = computed(() =>
  positions.value.map((position) => ({
    value: position.name,
    text: position.name,
  }))
);

const employmentYearOptions = computed(() =>
  academicYearsAsNumbers.value.map((year) => ({
    value: year.toString(),
    text: year.toString(),
  }))
);

const genderOptions = computed(() => getGenderOptions());

watch(selectedPosition, (newValue) => {
  teacherStore.setFilter("position", newValue);
});

watch(selectedEmploymentYear, (newValue) => {
  teacherStore.setFilter("employmentYear", newValue);
});

watch(selectedGender, (newValue) => {
  teacherStore.setFilter("gender", newValue);
});

watch(searchTerm, (newValue) => {
  teacherStore.setFilter("searchTerm", newValue);
});

const selectTeacher = async (teacher: Teacher) => {
  selectedTeacherId.value = teacher.id;
  await nextTick();
  f7.popover.open(`#edit-teacher-popover-${teacher.id}`);
};

const triggerAddTeacher = () => {
  const btn = document.getElementById("add-teacher-button");
  if (btn) btn.click();
};

const generateCredentials = async (teacher: Teacher) => {
  try {
    generatingForId.value = teacher.id;

    const response = await convex.action(api.auth.mutations.registerTeacher, {
      firstName: teacher.firstName,
      lastName: teacher.surname,
      middleName: teacher.patronymic,
      position: teacher.position,
      gender: teacher.gender,
      employmentYear: teacher.employmentYear,
    });

    const teacherIndex = teacherStore.teachers.findIndex(
      (t) => t.id === teacher.id
    );
    if (teacherIndex !== -1) {
      teacherStore.teachers[teacherIndex].email = response.email;
      teacherStore.teachers[teacherIndex].password = response.password;
      teacherStore.teachers[teacherIndex].username = response.username;
    }

    const fullName = `${teacher.surname} ${teacher.firstName} ${teacher.patronymic}`;

    f7.dialog.alert(
      `<div class="text-left">
        <p class="mb-2"><strong>${teacher_card_credential_full_name()}</strong> ${fullName}</p>
        <p class="mb-2"><strong>${teacher_card_credential_login()}</strong> ${response.username}</p>
        <p class="mb-2"><strong>Email:</strong> ${response.email}</p>
        <p class="mb-2"><strong>${teacher_card_credential_password()}</strong> ${response.password}</p>
        <p class="text-sm text-gray-600 mt-3">${teacher_card_credential_save_note()}</p>
      </div>`,
      teacher_card_credentials_created()
    );
  } catch (error) {
    console.error("Failed to generate credentials:", error);
    f7.dialog.alert(teacher_card_create_error(), teacher_card_error_title());
  } finally {
    generatingForId.value = null;
  }
};

const regeneratePassword = async (teacher: Teacher) => {
  try {
    generatingForId.value = teacher.id;

    const response = await convex.action(api.auth.mutations.regenerateTeacherPassword, {
      username: teacher.username,
    });

    const teacherIndex = teacherStore.teachers.findIndex(
      (t) => t.id === teacher.id
    );
    if (teacherIndex !== -1) {
      teacherStore.teachers[teacherIndex].password = response.password;
    }

    const fullName = `${teacher.surname} ${teacher.firstName} ${teacher.patronymic}`;

    f7.dialog.alert(
      `<div class="text-left">
        <p class="mb-2"><strong>${teacher_card_credential_full_name()}</strong> ${fullName}</p>
        <p class="mb-2"><strong>${teacher_card_credential_login()}</strong> ${teacher.username}</p>
        <p class="mb-2"><strong>Email:</strong> ${teacher.email}</p>
        <p class="mb-2"><strong>${teacher_card_credential_new_password()}</strong> ${response.password}</p>
        <p class="text-sm text-gray-600 mt-3">${teacher_card_credential_save_new_note()}</p>
      </div>`,
      teacher_card_password_updated()
    );
  } catch (error) {
    console.error("Failed to regenerate password:", error);
    f7.dialog.alert(teacher_card_regen_error(), teacher_card_error_title());
  } finally {
    generatingForId.value = null;
  }
};

const showPasswordHistory = async (teacher: Teacher) => {
  if (!teacher.userId) {
    f7.dialog.alert(teacher_card_no_user_error(), teacher_card_error_title());
    return;
  }

  selectedTeacherForHistory.value = teacher;
  await nextTick();
  f7.popup.open(`#password-history-popup-${teacher.id}`);
};

const openActionsMenu = (teacher: Teacher, event: Event) => {
  const target = event.currentTarget as HTMLElement;

  const buttons = [
    {
      text: teacher_card_update_password(),
      onClick: () => { regeneratePassword(teacher); },
    },
    {
      text: teacher_card_password_history(),
      onClick: () => { showPasswordHistory(teacher); },
    },
  ];

  const actions = f7.actions.create({
    buttons: [buttons, [{ text: common_cancel(), bold: true }]],
    targetEl: target,
  });

  actions.open();
};
</script>

<style scoped>
.teacher-search-input {
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
.teacher-search-input::placeholder {
  color: rgb(156, 163, 175) !important;
}
.teacher-search-input:focus {
  background-color: rgb(255, 255, 255) !important;
  border-color: rgb(209, 213, 219) !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08) !important;
}
</style>

<style>
@media (min-width: 768px) {
  #add-teacher-button {
    display: none !important;
  }
}

/* Remove gray gap in action sheet */
.actions-modal .actions-group {
  margin: 0 !important;
}
.actions-modal {
  background: transparent !important;
}
.actions-modal .actions-button {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}
</style>
