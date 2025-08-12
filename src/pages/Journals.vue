<template>
  <f7-page
    name="journals"
    class="journals-page flex flex-col h-screen bg-background text-foreground"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <div class="flex flex-1 overflow-hidden">
      <Sidebar v-model:activeNavItem="activeNavItem" class="hidden md:block" />

      <div
        class="flex-1 overflow-y-auto p-3 md:p-4 bg-background pb-16 md:pb-6 md:ml-52"
      >
        <div class="flex flex-col gap-4">
          <div
            class="flex flex-col md:flex-row md:items-center justify-between gap-3 journals-page-header"
          >
            <h1 class="text-2xl font-semibold">Журналы</h1>
            <div class="flex items-center gap-3">
              <Select
                v-model="selectedAcademicYear"
                :options="academicYearOptions"
                placeholder="Учебный год:"
                name="academic-year"
                class="w-44"
              />
              <f7-input
                type="text"
                placeholder="Семестр:"
                class="!border !border-border !rounded-lg !w-36 !text-center !h-10 !bg-white"
              />
            </div>
          </div>

          <div
            class="bg-card text-card-foreground rounded-xl p-4 md:p-5 shadow-md"
          >
            <div class="flex flex-wrap gap-4 mb-6">
              <Select
                v-model="selectedDiscipline"
                :options="disciplineOptions"
                placeholder="Дисциплина"
                name="discipline"
                class="flex-1 min-w-[200px]"
              />
              <Select
                v-model="selectedTerm"
                :options="termOptions"
                placeholder="Срок обучения"
                name="term"
                class="flex-1 min-w-[200px]"
              />
              <Select
                v-model="selectedStatus"
                :options="statusOptions"
                placeholder="Статус"
                name="status"
                class="flex-1 min-w-[200px]"
              />
              <Select
                v-model="selectedGroup"
                :options="groupOptions"
                placeholder="Группа"
                name="group"
                class="flex-1 min-w-[200px]"
              />
              <Select
                v-model="selectedRole"
                :options="roleOptions"
                placeholder="Роль"
                name="role"
                class="flex-1 min-w-[200px]"
              />
            </div>
            <div class="overflow-x-auto">
              <div class="flex gap-5 min-w-max">
                <template v-for="(course, idx) in courses" :key="course.id">
                  <div class="flex flex-col gap-3 w-[250px]">
                    <h2
                      class="font-semibold text-sm text-center py-1 bg-muted rounded-md text-muted-foreground"
                    >
                      {{ course.number }} курс
                    </h2>
                    <div
                      v-for="journal in journalEventsByCourse[
                        parseInt(course.number)
                      ]"
                      :key="journal.id"
                      class="rounded-lg p-4 text-gray-800 shadow-md min-h-[90px] flex flex-col justify-between transition-all duration-200 bg-amber-400 cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:bg-amber-500"
                      @click="goToJournalDetails(journal.id)"
                    >
                      <p class="font-semibold text-sm leading-tight">
                        {{ getJournalTitle(journal) }}
                      </p>
                    </div>
                    <div
                      v-if="
                        journalEventsByCourse[parseInt(course.number)]
                          .length === 0
                      "
                      class="rounded-lg p-4 text-gray-500 shadow-sm min-h-[90px] flex items-center justify-center bg-gray-50 border border-gray-100"
                    >
                      <p class="text-sm">Нет доступных журналов</p>
                    </div>
                  </div>
                  <div v-if="idx === 3" class="flex flex-col gap-3 w-[250px]">
                    <h2
                      class="font-semibold text-sm text-center py-1 bg-muted rounded-md text-muted-foreground"
                    >
                      смешанные группы
                    </h2>
                    <div
                      v-for="journal in mixedGroupJournals"
                      :key="journal.id"
                      class="rounded-lg p-4 text-gray-800 shadow-md min-h-[90px] flex flex-col justify-between transition-all duration-200 bg-blue-100 border border-blue-200"
                    >
                      <p class="font-semibold text-sm leading-tight">
                        {{ getJournalTitle(journal) }}
                      </p>
                    </div>
                    <div
                      v-if="mixedGroupJournals.length === 0"
                      class="rounded-lg p-4 text-gray-500 shadow-sm min-h-[90px] flex items-center justify-center bg-gray-50 border border-gray-100"
                    >
                      <p class="text-sm">Нет доступных журналов</p>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { f7Page, f7Input, f7 } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import Select from "@/components/ui/Select.vue";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useJournalStore, type Journal } from "@/stores/journalStore";
import { useCourseStore } from "@/stores/courseStore";
import { withAllOption } from "@/lib/utils";
import { storeToRefs } from "pinia";

const activeNavItem = ref("journals");

const academicYearStore = useAcademicYearStore();
const { academicYears } = storeToRefs(academicYearStore);

const journalStore = useJournalStore();
const { journalsByCourse, mixedGroupJournals } = storeToRefs(journalStore);

const courseStore = useCourseStore();
const { courses } = storeToRefs(courseStore);

function getJournalTitle(journal: Journal) {
  if (!journal.students || journal.students.length === 0) {
    return journal.title;
  }
  return journalStore.generateJournalTitle(
    journal.courseNumber,
    journal.students || []
  );
}

// Journals mapped by course coming directly from the journal store
const journalEventsByCourse = journalsByCourse;

const selectedAcademicYear = ref("");

const academicYearOptions = computed(() => {
  return academicYears.value.map((year) => ({
    value: year.id,
    text: year.name,
  }));
});

onMounted(async () => {
  selectedAcademicYear.value =
    academicYearStore.getActiveAcademicYear?.id || "";
});

const goToJournalDetails = (id: number | string) => {
  f7.views.main.router.navigate(`/journals/${id}`);
};

const selectedDiscipline = ref("");
const disciplineOptions = ref(
  withAllOption([{ value: "philosophy", text: "Философия" }], "все", "")
);

const selectedTerm = ref("");
const termOptions = ref(
  withAllOption([{ value: "1y", text: "1 год" }], "все", "")
);

const selectedStatus = ref("");
const statusOptions = ref(
  withAllOption([{ value: "active", text: "Активный" }], "все", "")
);

const selectedGroup = ref("");
const groupOptions = ref(
  withAllOption([{ value: "pi-1-21", text: "ПИ-1-21" }], "все", "")
);

const selectedRole = ref("");
const roleOptions = ref(
  withAllOption([{ value: "student", text: "Студент" }], "все", "")
);
</script>

<style>
.journals-page-header .smart-select-list-container {
  background-color: #ffffff !important;
}

.journals-page-header .smart-select-list-container .item-inner {
  background-color: #ffffff !important;
}
</style>
