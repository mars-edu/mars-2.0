<template>
  <f7-page
    name="journal-details"
    class="flex flex-col h-screen bg-background text-foreground"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <div class="flex flex-1 overflow-hidden">
      <Sidebar v-model:activeNavItem="activeNavItem" class="hidden md:block" />

      <div
        class="flex-1 overflow-y-auto p-3 md:p-4 bg-background pb-16 md:pb-6 md:ml-52"
      >
        <div class="flex flex-col gap-4">
          <!-- Page Header -->
          <div class="flex items-center justify-between">
            <div class="text-xl font-semibold">
              <p>
                Модуль/дисциплина:
                <span class="text-green-600">{{ currentJournal?.title }}</span>
              </p>
              <p>
                Учебная группа:
                <span class="text-green-600">{{ currentJournal?.group }}</span>
              </p>
            </div>
            <div class="flex items-center gap-2">
              <!-- Journal Settings Gear Button -->
              <button
                id="journal-settings-button"
                class="flex items-center justify-center w-10 h-10 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                @click="openJournalSettings"
              >
                <f7-icon
                  ios="f7:gear"
                  md="material:settings"
                  size="18px"
                  class="text-muted-foreground"
                />
              </button>

              <!-- <input
                type="range"
                min="0"
                max="100"
                value="0"
                class="w-64 h-2 cursor-pointer accent-primary"
              /> -->
              <Select
                v-model="selectedAcademicYear"
                :options="academicYearOptions"
                placeholder="Учебный год:"
                name="academic-year"
                class="w-[250px] !border !border-border !rounded-lg !h-10 !bg-white"
              />
              <f7-input
                type="text"
                placeholder="Семестр:"
                class="!border !border-border !rounded-lg !w-36 !text-center !h-10 !bg-white"
              />
            </div>
          </div>

          <!-- Main Content Area with Tabs -->
          <div
            class="bg-card text-card-foreground rounded-xl p-3 md:p-4 shadow-sm"
          >
            <f7-toolbar tabbar>
              <f7-link
                tab-link="#tab-journal"
                :tab-link-active="activeTab === 'journal'"
                @click="activeTab = 'journal'"
                class="tab-link"
              >
                Журнал
              </f7-link>
              <f7-link
                tab-link="#tab-participants"
                :tab-link-active="activeTab === 'participants'"
                @click="activeTab = 'participants'"
                class="tab-link"
              >
                Участники
              </f7-link>
              <f7-link
                tab-link="#tab-planning"
                :tab-link-active="activeTab === 'planning'"
                @click="activeTab = 'planning'"
                class="tab-link"
              >
                Тематическое планирование
              </f7-link>
              <f7-link
                tab-link="#tab-assignments"
                :tab-link-active="activeTab === 'assignments'"
                @click="activeTab = 'assignments'"
                class="tab-link"
              >
                Задания
              </f7-link>
              <f7-link
                tab-link="#tab-chat"
                :tab-link-active="activeTab === 'chat'"
                @click="activeTab = 'chat'"
                class="tab-link"
              >
                Чат
              </f7-link>
              <f7-link
                tab-link="#tab-files"
                :tab-link-active="activeTab === 'files'"
                @click="activeTab = 'files'"
                class="tab-link"
              >
                Файлы
              </f7-link>
              <f7-link
                tab-link="#tab-testing"
                :tab-link-active="activeTab === 'testing'"
                @click="activeTab = 'testing'"
                class="tab-link"
              >
                Тестирование
              </f7-link>
              <f7-link
                tab-link="#tab-services"
                :tab-link-active="activeTab === 'services'"
                @click="activeTab = 'services'"
                class="tab-link"
              >
                Сервисы
              </f7-link>
            </f7-toolbar>

            <f7-tabs>
              <f7-tab
                id="tab-journal"
                class="page-content"
                :tab-active="activeTab === 'journal'"
              >
                <JournalTab
                  ref="journalTabRef"
                  :journal-id="journalId"
                  :current-journal="currentJournal"
                  :journal-settings="journalSettings"
                  @show-floating-row="showFloatingRow"
                  @open-date-focus="openDateFocus"
                  @update-students="updateStudents"
                  @open-ktp-details="onOpenKtpDetails"
                />
              </f7-tab>

              <f7-tab
                id="tab-participants"
                class="page-content"
                :tab-active="activeTab === 'participants'"
              >
                <div class="flex flex-col gap-4">
                  <div class="text-center py-8">
                    <h3 class="text-lg font-medium text-muted-foreground">
                      Участники
                    </h3>
                    <p class="text-sm text-muted-foreground mt-2">
                      Здесь будут отображаться участники журнала
                    </p>
                  </div>
                </div>
              </f7-tab>

              <f7-tab
                id="tab-planning"
                class="page-content"
                :tab-active="activeTab === 'planning'"
              >
                <div class="flex flex-col gap-4">
                  <div class="text-center py-8">
                    <h3 class="text-lg font-medium text-muted-foreground">
                      Тематическое планирование
                    </h3>
                    <p class="text-sm text-muted-foreground mt-2">
                      Здесь будет тематическое планирование
                    </p>
                  </div>
                </div>
              </f7-tab>

              <f7-tab
                id="tab-assignments"
                class="page-content"
                :tab-active="activeTab === 'assignments'"
              >
                <div class="flex flex-col gap-4">
                  <div class="text-center py-8">
                    <h3 class="text-lg font-medium text-muted-foreground">
                      Задания
                    </h3>
                    <p class="text-sm text-muted-foreground mt-2">
                      Здесь будут отображаться задания
                    </p>
                  </div>
                </div>
              </f7-tab>

              <f7-tab
                id="tab-chat"
                class="page-content"
                :tab-active="activeTab === 'chat'"
              >
                <div class="flex flex-col gap-4">
                  <div class="text-center py-8">
                    <h3 class="text-lg font-medium text-muted-foreground">
                      Чат
                    </h3>
                    <p class="text-sm text-muted-foreground mt-2">
                      Здесь будет чат
                    </p>
                  </div>
                </div>
              </f7-tab>

              <f7-tab
                id="tab-files"
                class="page-content"
                :tab-active="activeTab === 'files'"
              >
                <div class="flex flex-col gap-4">
                  <div class="text-center py-8">
                    <h3 class="text-lg font-medium text-muted-foreground">
                      Файлы
                    </h3>
                    <p class="text-sm text-muted-foreground mt-2">
                      Здесь будут отображаться файлы
                    </p>
                  </div>
                </div>
              </f7-tab>

              <f7-tab
                id="tab-testing"
                class="page-content"
                :tab-active="activeTab === 'testing'"
              >
                <div class="flex flex-col gap-4">
                  <div class="text-center py-8">
                    <h3 class="text-lg font-medium text-muted-foreground">
                      Тестирование
                    </h3>
                    <p class="text-sm text-muted-foreground mt-2">
                      Здесь будет тестирование
                    </p>
                  </div>
                </div>
              </f7-tab>

              <f7-tab
                id="tab-services"
                class="page-content"
                :tab-active="activeTab === 'services'"
              >
                <div class="flex flex-col gap-4">
                  <div class="text-center py-8">
                    <h3 class="text-lg font-medium text-muted-foreground">
                      Сервисы
                    </h3>
                    <p class="text-sm text-muted-foreground mt-2">
                      Здесь будут отображаться сервисы
                    </p>
                  </div>
                </div>
              </f7-tab>
            </f7-tabs>
          </div>
        </div>
      </div>
    </div>
    <FloatingJournalRow
      :student="selectedStudent"
      :student-index="selectedStudentIndex"
      :table-headers="tableHeaders"
      @close="hideFloatingRow"
      @update-student="updateStudent"
    />
    <DateColumnFocus
      :visible="isDateFocusVisible"
      :students="students"
      :column-header="focusedColumnHeader"
      :selected-date-index="focusedDateIndex"
      @close="isDateFocusVisible = false"
      @update-students="updateStudents"
    />
    <KtpDetailPopup
      v-model:opened="isKtpPopupOpened"
      :parent-id="ktpParentId"
    />

    <!-- Journal Settings Popup -->
    <f7-popover
      id="journal-settings-popover"
      style="width: 500px !important"
      close-on-escape
      target="#journal-settings-button"
    >
      <div class="journal-settings-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Настройки журнала"
          :disabled="false"
          :is-loading="false"
          :on-cancel="closeJournalSettings"
          :on-save="saveJournalSettings"
        />

        <div class="p-4 space-y-6">
          <!-- Calculation Type Section -->
          <div class="space-y-3">
            <h3 class="text-sm font-medium text-foreground">
              Тип расчета сессии
            </h3>

            <div class="space-y-3">
              <!-- Calculated Option -->
              <div class="space-y-2">
                <label class="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="calculation-type"
                    value="calculated"
                    v-model="journalSettings.calculationType"
                    class="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary"
                  />
                  <span class="text-sm text-foreground">Расчитываемая</span>
                </label>

                <!-- Sub-options for Calculated -->
                <div
                  v-if="journalSettings.calculationType === 'calculated'"
                  class="ml-7 space-y-2"
                >
                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="calculation-method"
                      value="only-assigned"
                      v-model="journalSettings.calculationMethod"
                      class="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary"
                    />
                    <span class="text-sm text-muted-foreground"
                      >Только выставленных дней</span
                    >
                  </label>

                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="calculation-method"
                      value="all-days"
                      v-model="journalSettings.calculationMethod"
                      class="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary"
                    />
                    <span class="text-sm text-muted-foreground">Всех дней</span>
                  </label>
                </div>
              </div>

              <!-- Manual Option -->
              <div>
                <label class="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="calculation-type"
                    value="manual"
                    v-model="journalSettings.calculationType"
                    class="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary"
                  />
                  <span class="text-sm text-foreground">Выставляемая</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </f7-popover>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import {
  f7Page,
  f7,
  f7Toolbar,
  f7Link,
  f7Tabs,
  f7Tab,
  f7Input,
  f7Icon,
  f7Popover,
} from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useJournalStore } from "@/stores/journalStore";
import Select from "@/components/ui/Select.vue";
import JournalTab from "@/components/JournalTab.vue";
import FloatingJournalRow from "@/components/FloatingJournalRow.vue";
import DateColumnFocus from "@/components/DateColumnFocus.vue";
import KtpDetailPopup from "@/components/KtpDetailPopup.vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import { storeToRefs } from "pinia";

const journalId = computed(() => {
  return f7.views.main.router.currentRoute.params.id as string;
});

const activeNavItem = ref("journal-details");
const activeTab = ref("journal");

const academicYearStore = useAcademicYearStore();
const { academicYears } = storeToRefs(academicYearStore);

const journalStore = useJournalStore();

const selectedAcademicYear = ref("");

const academicYearOptions = computed(() =>
  academicYears.value.map((year) => ({
    value: year.id,
    text: year.name,
  }))
);

const currentJournal = computed(() => {
  if (!journalId.value) return null;
  return journalStore.getJournalById(journalId.value);
});

const selectedStudent = ref<any>(null);
const selectedStudentIndex = ref(0);

const isDateFocusVisible = ref(false);
const focusedColumnHeader = ref<{ type: string; label: string } | null>(null);
const focusedDateIndex = ref(0);

const isKtpPopupOpened = ref(false);
const ktpParentId = ref<string | null>(null);

const journalTabRef = ref<InstanceType<typeof JournalTab> | null>(null);

// Journal settings state
const journalSettings = ref({
  calculationType: "calculated" as "calculated" | "manual",
  calculationMethod: "only-assigned" as "only-assigned" | "all-days",
});

const openDateFocus = (
  header: { type: string; label: string },
  index: number
) => {
  if (header.type !== "date") return;
  focusedColumnHeader.value = header;
  focusedDateIndex.value = index;
  isDateFocusVisible.value = true;
};

const showFloatingRow = (student: any, index: number) => {
  selectedStudent.value = student;
  selectedStudentIndex.value = index;
};

const hideFloatingRow = () => {
  selectedStudent.value = null;
};

const updateStudents = (updatedStudents: any[]) => {
  // This function receives updates from the JournalTab component
  // You can add any additional logic here if needed
};

const updateStudent = (updatedStudent: any) => {
  if (journalTabRef.value) {
    journalTabRef.value.updateStudent(updatedStudent);
  }
};

const onOpenKtpDetails = (
  header: { type: string; label: string },
  index: number
) => {
  if (!currentJournal.value) return;
  // Map to KTP parent id using disciplineId; keep mock mapping consistent with KtpPage
  if (
    currentJournal.value.disciplineId ===
    (journalStore.mixedGroupJournals[0]?.disciplineId || "")
  ) {
    ktpParentId.value = "mock-class9-id-1";
  } else {
    ktpParentId.value = currentJournal.value.disciplineId;
  }
  isKtpPopupOpened.value = true;
};

// Journal settings functions
const openJournalSettings = () => {
  f7.popover.open("#journal-settings-popover", "#journal-settings-button");
};

const closeJournalSettings = () => {
  f7.popover.close("#journal-settings-popover");
};

const saveJournalSettings = () => {
  // TODO: Implement saving journal settings to backend/store
  console.log("Saving journal settings:", journalSettings.value);
  closeJournalSettings();
};

// Get computed properties from JournalTab component
const tableHeaders = computed(() => {
  return journalTabRef.value?.tableHeaders || [];
});

const students = computed(() => {
  return journalTabRef.value?.students || [];
});

onMounted(async () => {
  selectedAcademicYear.value =
    academicYearStore.getActiveAcademicYear?.id || "";
});
</script>

<style>
.tab-link {
  @apply px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200;
  @apply text-muted-foreground hover:text-foreground hover:bg-muted;
}

.tab-link.tab-link-active {
  @apply bg-primary text-primary-foreground;
}

.toolbar.tabbar {
  @apply bg-transparent border-b border-border mb-4;
  --f7-toolbar-inner-padding-left: 0;
  --f7-toolbar-inner-padding-right: 0;
}

.toolbar.tabbar .toolbar-inner {
  @apply gap-2 p-1 bg-muted rounded-lg;
}

.page-content {
  padding: 0;
}
</style>
