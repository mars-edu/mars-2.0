<template>
  <f7-page
    name="teacher-card"
    class="flex flex-col h-screen bg-background text-foreground"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <div class="flex flex-1 overflow-hidden">
      <Sidebar v-model:activeNavItem="activeNavItem" class="hidden md:block" />

      <div
        class="flex-1 overflow-y-auto p-3 md:p-4 bg-background pb-16 md:pb-6 md:ml-52"
      >
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold">Картотека преподавателей</h1>
            <div class="teacher-card-filters flex items-center gap-2">
              <f7-input
                type="text"
                placeholder="Поиск по ФИО..."
                v-model:value="searchTerm"
                class="w-[250px] !bg-white h-full !py-2"
                clear-button
              />
            </div>
          </div>

          <div
            class="flex flex-wrap gap-x-4 gap-y-2 items-center teacher-card-filters"
          >
            <Select
              v-model="selectedPosition"
              :options="positionOptions"
              placeholder="Должность:"
              name="position"
              class="min-w-[150px]"
            />

            <Select
              v-model="selectedEmploymentYear"
              :options="employmentYearOptions"
              placeholder="Год поступления:"
              name="employment-year"
              class="min-w-[150px]"
            />

            <Select
              v-model="selectedGender"
              :options="genderOptions"
              placeholder="Пол:"
              name="gender"
              class="min-w-[150px]"
            />
          </div>

          <div class="bg-card text-card-foreground rounded-xl p-3 shadow-sm">
            <div class="overflow-x-auto">
              <table class="w-full border-collapse rounded-lg">
                <thead>
                  <tr class="bg-gray-500 text-white">
                    <th class="px-4 py-2 text-left">№</th>
                    <th class="px-4 py-2 text-left">ФИО</th>
                    <th class="px-4 py-2 text-left">Должность</th>
                    <th class="px-4 py-2 text-left">Год поступления</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(teacher, index) in filteredTeachers"
                    :key="teacher.id"
                    :id="`teacher-item-${teacher.id}`"
                    class="border-b border-border hover:bg-muted/30"
                    :class="{
                      'bg-blue-100': teacher.gender === 'male',
                      'bg-pink-100': teacher.gender === 'female',
                    }"
                    @click="selectTeacher(teacher)"
                  >
                    <td class="px-4 py-3">{{ index + 1 }}</td>
                    <td class="px-4 py-3">
                      {{ teacherStore.getTeacherFullName(teacher.id) }}
                    </td>
                    <td class="px-4 py-3">{{ teacher.position }}</td>
                    <td class="px-4 py-3">{{ teacher.employmentYear }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #fixed>
      <AddTeacherButton />
    </template>

    <EditTeacherButton
      v-if="selectedTeacher"
      :key="`edit-${selectedTeacher.id}`"
      :teacher="selectedTeacher"
    />
  </f7-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { f7Page, f7Input, f7 } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import AddTeacherButton from "@/components/AddTeacherButton.vue";
import EditTeacherButton from "@/components/EditTeacherButton.vue";
import Select from "@/components/ui/Select.vue";
import { useTeacherStore, type Teacher } from "@/stores/teacherStore";
import { withAllOption, getGenderOptions } from "@/lib/utils";
import { usePositionStore } from "@/stores/positionStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { storeToRefs } from "pinia";

const activeNavItem = ref("teacher-card");
const teacherStore = useTeacherStore();
const positionStore = usePositionStore();
const academicYearStore = useAcademicYearStore();

const { positions } = storeToRefs(positionStore);
const { academicYearsAsNumbers } = storeToRefs(academicYearStore);
const { filteredTeachers } = storeToRefs(teacherStore);

const selectedPosition = ref("");
const selectedEmploymentYear = ref("");
const selectedGender = ref("");
const searchTerm = ref("");
const selectedTeacher = ref<Teacher | null>(null);

onMounted(() => {
  teacherStore.clearFilters();
  selectedPosition.value = "";
  selectedEmploymentYear.value = "";
  selectedGender.value = "";
  searchTerm.value = "";
  selectedTeacher.value = null;
});

const positionOptions = computed(() =>
  withAllOption(
    positions.value.map((position) => ({
      value: position.name,
      text: position.name,
    }))
  )
);

const employmentYearOptions = computed(() =>
  withAllOption(
    academicYearsAsNumbers.value.map((year) => ({
      value: year.toString(),
      text: year.toString(),
    }))
  )
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
  selectedTeacher.value = teacher;
  await nextTick();
  f7.popover.open(
    `#edit-teacher-popover-${teacher.id}`,
    `#teacher-item-${teacher.id}`
  );
};
</script>
