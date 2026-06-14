<template>
  <f7-page
    name="ktp"
    class="flex flex-col h-screen bg-background text-foreground"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <Sidebar v-model:activeNavItem="activeNavItem" />

    <div class="flex flex-1 overflow-hidden">
      <div
        class="flex-1 overflow-y-auto p-3 md:p-4 bg-background pb-16 md:pb-6 relative transition-all duration-200"
        :class="contentMargin"
      >
        <div
          :class="selectedKtpId
            ? ''
            : 'bg-card text-card-foreground rounded-xl p-4 md:p-4 shadow-sm'"
        >
          <KtpDetailView
            v-if="selectedKtpId"
            :ktp-id="selectedKtpId"
            @back="selectedKtpId = null"
          />
          <template v-else>
          <!-- Row 1: Title + Create -->
          <div class="flex items-center justify-between mb-6">
            <h1 class="text-2xl md:text-3xl font-bold">
              Тематические планы (КТП)
            </h1>
            <button
              class="w-fit flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
              @click="openAddDialog"
            >
              <IconPlus class="w-5 h-5" />
              Создать
            </button>
          </div>

          <!-- Row 2: Search + Filters -->
          <div class="flex flex-col md:flex-row gap-3 mb-4">
            <SearchInput
              v-model="searchQuery"
              placeholder="Поиск по названию, модулю или результату обучения..."
              wrapper-class="flex-1"
            />
            <Select
              v-model="selectedAcademicYearModel"
              :options="academicYearOptions"
              placeholder="Учебный год"
              name="academic-year"
              class="w-full md:w-[220px]"
            />
            <Select
              v-model="selectedSemesterId"
              :options="semesterOptions"
              placeholder="Семестр"
              name="semester"
              class="w-full md:w-[200px]"
            />
          </div>

          <!-- Tabs -->
          <div class="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            <button
              class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap"
              :class="filterTab === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'"
              @click="filterTab = 'all'"
            >
              Все КТП
            </button>
            <button
              class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5"
              :class="filterTab === 'attached' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'"
              @click="filterTab = 'attached'"
            >
              <IconPaperclip class="w-3.5 h-3.5" />
              Прикрепленные к журналу
            </button>
            <button
              class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5"
              :class="filterTab === 'library' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'"
              @click="filterTab = 'library'"
            >
              <IconBookOpen class="w-3.5 h-3.5" />
              Библиотека (Свободные)
            </button>
          </div>

          <!-- Cards -->
          <div v-if="isLoading" class="py-12 text-center text-muted-foreground">
            Загрузка данных...
          </div>
          <div
            v-else-if="filteredKtpItems.length === 0"
            class="py-12 text-center text-muted-foreground"
          >
            <IconBookOpen class="w-10 h-10 mx-auto mb-3 opacity-40" />
            <div class="text-sm">Нет данных для отображения</div>
          </div>
          <div v-else class="flex flex-col gap-3">
            <div
              v-for="item in filteredKtpItems"
              :key="item.ktpId"
              data-testid="ktp-card"
              class="group relative bg-card border border-border rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5"
              @click="selectItem(item)"
            >
              <div
                v-if="isKtpAttachedToJournal(item)"
                class="absolute -top-2.5 -right-2.5 bg-primary text-primary-foreground p-2 rounded-xl shadow-lg rotate-12 group-hover:rotate-0 transition-transform z-10"
                title="Прикреплен к журналу"
              >
                <IconPaperclip class="w-4 h-4" />
              </div>
              <div class="flex items-center gap-4">
                <!-- Icon -->
                <div
                  class="flex-shrink-0 p-3 rounded-xl transition-transform group-hover:scale-110"
                  :class="getKtpColor(item) ? '' : 'bg-primary/10 text-primary'"
                  :style="getKtpColor(item)
                    ? { backgroundColor: getKtpColor(item) + '20', color: getKtpColor(item) }
                    : {}"
                >
                  <IconBookOpen class="w-6 h-6" />
                </div>

                <!-- Main info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-0.5">
                    <h3
                      class="font-semibold text-base truncate group-hover:text-primary transition-colors"
                    >
                      {{ item.moduleIndex }} — {{ item.moduleName }}
                    </h3>
                    <span
                      v-for="lang in getKtpLanguages(item)"
                      :key="lang"
                      class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary flex-shrink-0"
                    >
                      {{ lang }}
                    </span>
                  </div>
                  <p
                    v-if="item.learningOutcome"
                    class="text-sm text-muted-foreground truncate mb-0.5"
                  >
                    {{ item.learningOutcome }}
                  </p>
                  
                  <div class="mt-2 flex flex-col gap-1">
                    <div class="flex items-center gap-2 text-xs text-muted-foreground">
                      <span class="font-medium text-foreground/80">Специальности:</span>
                      <span class="truncate max-w-[200px] sm:max-w-[300px]">{{ getKtpSpecialtiesDisplay(item).text }}</span>
                      <span v-if="getKtpSpecialtiesDisplay(item).isFromJournal" class="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-medium text-[9px] uppercase tracking-wider">
                        с журнала
                      </span>
                    </div>
                    <div class="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>Создан: {{ formatDate(item.createdAt.valueOf()) }}</span>
                    </div>
                  </div>
                  <!-- TODO: journals accordion disabled for now
                  <KtpJournalsAccordion
                    :journals="getKtpJournals(item.ktpId)"
                    dense
                    class="mt-0.5"
                  />
                  -->
                </div>

                <!-- Divider -->
                <div class="hidden md:block h-12 w-px bg-border flex-shrink-0" />

                <!-- Stats -->
                <div class="hidden md:flex items-center gap-6 flex-shrink-0">
                  <div class="flex flex-col items-center min-w-[50px]">
                    <span class="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Часы</span>
                    <span class="text-sm font-semibold group-hover:text-primary transition-colors">
                      {{ item.ktpTotalHours || 0 }}
                    </span>
                  </div>
                  <div class="flex flex-col items-center min-w-[50px] relative">
                    <span class="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Курс</span>
                    <span class="text-sm font-semibold group-hover:text-primary transition-colors">
                      {{ getCourseDisplay(item).text }}
                    </span>
                    <span v-if="getCourseDisplay(item).isFromJournal" class="absolute -top-4 whitespace-nowrap px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-medium text-[9px] uppercase tracking-wider">
                        с журнала
                    </span>
                  </div>
                  <div class="flex flex-col items-center min-w-[50px]">
                    <span class="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Тем</span>
                    <span
                      class="text-xs font-bold px-2.5 py-0.5 rounded-full"
                      :class="getTopicCount(item) > 0
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'"
                    >
                      {{ getTopicCount(item) }}
                    </span>
                  </div>
                </div>

                <!-- Action menu -->
                <div class="relative flex-shrink-0" @click.stop>
                  <DropdownMenu align="right" width="12rem">
                    <template #trigger="{ toggle }">
                      <button
                        class="p-2 rounded-xl text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors"
                        :data-testid="`ktp-card-menu-${item.ktpId}`"
                        @click="toggle"
                      >
                        <IconMoreVertical class="w-5 h-5" />
                      </button>
                    </template>
                    <template #default="{ close }">
                      <button
                        class="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                        @click="onEditKtp(item.ktpId); close()"
                      >
                        <IconEdit2 class="w-4 h-4 text-primary" />
                        Редактировать
                      </button>
                      <button
                        class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                        @click="onDeleteKtp(item.ktpId); close()"
                      >
                        <IconTrash2 class="w-4 h-4" />
                        Удалить
                      </button>
                    </template>
                  </DropdownMenu>
                </div>

                <!-- Arrow -->
                <IconChevronRight
                  class="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0"
                />
              </div>
            </div>
          </div>
          </template>
        </div>
      </div>
    </div>

    <AddKtpItemForm
      v-model:opened="isAddItemFormOpen"
      :selected-academic-year-id="selectedAcademicYearId ?? undefined"
      :selected-semester-id="selectedSemesterId ?? undefined"
    />

    <KtpEditPopover
      v-model:opened="isEditPopoverOpen"
      :ktp="editingKtp"
    />

  </f7-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from "vue";
import { f7Page, f7 } from "framework7-vue";
import IconPlus from "~icons/lucide/plus";
import IconBookOpen from "~icons/lucide/book-open";
import IconChevronRight from "~icons/lucide/chevron-right";
import IconPaperclip from "~icons/lucide/paperclip";
import IconMoreVertical from "~icons/lucide/more-vertical";
import IconEdit2 from "~icons/lucide/edit-2";
import IconTrash2 from "~icons/lucide/trash-2";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import Select from "@/components/ui/Select.vue";
import SearchInput from "@/components/ui/SearchInput.vue";
import DropdownMenu from "@/components/ui/DropdownMenu.vue";
import KtpDetailView from "@/components/KtpDetailView.vue";
import AddKtpItemForm from "@/components/AddKtpItemForm.vue";
import KtpEditPopover from "@/components/KtpEditPopover.vue";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useRupEntryStore } from "@/stores/rupEntryStore";
import { useSelectedItemsStore } from "@/stores/selectedItemsStore";
import { useSemesterStore } from "@/stores/semesterStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useCourseStore } from "@/stores/courseStore";
import { useKtpStore } from "@/stores/ktpStore";
import { useJournalStore } from "@/stores/journalStore";
import { collectKtpJournals } from "@/composables/useKtpJournals";
import KtpJournalsAccordion from "@/components/KtpJournalsAccordion.vue";
import { useCalendarStore } from "@/stores/calendarStore";
import { storeToRefs } from "pinia";
import { useSidebar } from "@/composables/useSidebar";
import { useKtpPlannedHours } from "@/composables/useKtpPlannedHours";
import { isKtpFullyLoaded } from "@/lib/ktpHelpers";
import type { Ktp } from "@/stores/ktpStore";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { formatDate } from "@/utils/dateUtils";

const { contentMargin } = useSidebar();
const activeNavItem = ref("ktp");
const searchQuery = ref("");
const filterTab = ref<"all" | "attached" | "library">("all");

const academicYearStore = useAcademicYearStore();
const { academicYears } = storeToRefs(academicYearStore);
const academicYearSemesterStore = useAcademicYearSemesterStore();

const rupEntryStore = useRupEntryStore();
const journalStore = useJournalStore();
const calendarStore = useCalendarStore();
const specialtyStore = useSpecialtyStore();

// Get KTP data and enrich with rupEntry information
const ktpItems = computed(() => {
  const ktps = ktpStore.ktps;
  const rupEntries = rupEntryStore.rupEntries;

  return ktps
    .map((ktp) => {
      const rupEntryItem = rupEntries.find((c) => c.id === ktp.rupEntryId);
      if (!rupEntryItem) return null;

      // Calculate total hours from KTP details
      const details = ktpStore.getDetailsByKtpId(ktp.id);
      const totalHours = details.reduce((sum, detail) => {
        return sum + (detail.totalHours || 0);
      }, 0);

      return {
        ...rupEntryItem,
        ktpId: ktp.id,
        ktpTotalHours: totalHours,
        academicYearId: ktp.academicYearId,
        semesterId: ktp.semesterId,
        createdAt: ktp.createdAt,
        updatedAt: ktp.updatedAt,
      };
    })
    .filter(Boolean);
});

const isLoading = computed(() => ktpStore.loading || rupEntryStore.isLoading);
const courseStore = useCourseStore();
const semesterStore = useSemesterStore();
const { sortedSemesters } = storeToRefs(semesterStore);
const ktpStore = useKtpStore();

const selectedItemsStore = useSelectedItemsStore();
const {
  selectedAcademicYearId,
  selectedSpecialtyId: selectedSpecialtyIdStore,
  selectedCourseId: selectedCourseIdStore,
} = storeToRefs(selectedItemsStore);
const selectedKtpId = ref<string | null>(null);
const isAddItemFormOpen = ref(false);
const selectedSemesterId = ref<string>("");

const { getKtpIdForRupEntry, getModuleTitleForKtp } = storeToRefs(ktpStore);

const { getPlannedHoursForKtp } = useKtpPlannedHours();

// Card action menu
const editingKtp = ref<Ktp | null>(null);
const isEditPopoverOpen = ref(false);

const onEditKtp = (ktpId: string) => {
  editingKtp.value = ktpStore.findKtpById(ktpId) ?? null;
  if (editingKtp.value) isEditPopoverOpen.value = true;
};

const onDeleteKtp = (ktpId: string) => {
  const title = getModuleTitleForKtp.value(ktpId);
  f7.dialog.confirm(
    `Удалить КТП «${title}» со всеми темами? Это действие нельзя отменить.`,
    "Удаление КТП",
    async () => {
      const result = await ktpStore.deleteKtpById(ktpId);
      f7.toast
        .create({
          text: result.success
            ? `КТП удалён (тем: ${result.deleted})`
            : "Не удалось удалить КТП",
          closeTimeout: 2000,
          cssClass: result.success ? "color-green" : "color-red",
        })
        .open();
    }
  );
};

const isItemFullyLoaded = (item: any): boolean => {
  if (!item.ktpId) return false;
  const details = ktpStore.getDetailsByKtpId(item.ktpId);
  return isKtpFullyLoaded(details, getPlannedHoursForKtp(item.ktpId));
};

const getKtpColor = (item: any): string | undefined => {
  return item.ktpId ? ktpStore.findKtpById(item.ktpId)?.color : undefined;
};

const getKtpLanguages = (item: any): string[] => {
  return (item.ktpId && ktpStore.findKtpById(item.ktpId)?.languages) || [];
};

const academicYearOptions = computed(() => {
  return academicYears.value.map((year) => ({
    value: year.id,
    text: year.name,
  }));
});

const semesterOptions = computed(() => {
  const yearId = selectedAcademicYearId.value;
  const list = yearId
    ? academicYearSemesterStore.getAcademicYearSemestersByAcademicYear(yearId)
    : [];
  return list.map((academicYearSemester) => ({
    // Value is the academicYearSemesters Convex id — ktps.semesterId stores
    // these ids (schema: v.id("academicYearSemesters")), so select values
    // must match for filtering and KTP creation to work.
    value: academicYearSemester.id,
    text: `Семестр ${academicYearSemester.semesterNumber}`,
  }));
});

const filteredKtpItems = computed(() => {
  const yearId = selectedAcademicYearId.value;
  const semId = selectedSemesterId.value;
  const query = searchQuery.value.toLowerCase().trim();
  return ktpItems.value
    .filter((item) => item !== null)
    .filter((item) => {
      if (yearId && item.academicYearId !== yearId) return false;
      if (semId && item.semesterId !== semId) return false;
      
      const isAttached = isKtpAttachedToJournal(item);
      if (filterTab.value === 'attached' && !isAttached) return false;
      if (filterTab.value === 'library' && isAttached) return false;
      
      if (query) {
        const haystack = [
          item.moduleIndex,
          item.moduleName,
          item.learningOutcome,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
});

const isKtpAttachedToJournal = (item: any) => {
  return getKtpJournals(item.ktpId).length > 0;
};

const getKtpSpecialtiesDisplay = (item: any) => {
  const journals = getKtpJournals(item.ktpId);
  if (journals.length > 0) {
    const names = journals.map(j => j.group || j.customTitle || "Группа журнала");
    const uniqueNames = Array.from(new Set(names));
    return { text: uniqueNames.join(", "), isFromJournal: true };
  }
  
  if (item.specialtyIds && item.specialtyIds.length > 0) {
    const codes = item.specialtyIds.map((id: string) => {
      const spec = specialtyStore.getSpecialtyById(id);
      return spec ? spec.codeName : id;
    });
    return { text: codes.join(", "), isFromJournal: false };
  }
  return { text: "—", isFromJournal: false };
};

const getCourseDisplay = (item: any) => {
  const journals = getKtpJournals(item.ktpId);
  if (journals.length > 0) {
    const courses = new Set<number>();
    journals.forEach(j => {
      if (j.courseNumber) courses.add(j.courseNumber);
    });
    if (courses.size > 0) {
      return { text: Array.from(courses).join(", "), isFromJournal: true };
    }
  }
  
  const baseClasses = item.baseClass;
  if (baseClasses && baseClasses.length > 0) {
    return { text: baseClasses.join(", "), isFromJournal: false };
  }
  return { text: "—", isFromJournal: false };
};

// Journals using a KTP: linked group journal + its individual children
const getKtpJournals = (ktpId: string) =>
  collectKtpJournals(ktpId, ktpStore, calendarStore, journalStore);

const getTopicCount = (item: any): number => {
  const ktpId = getKtpIdForRupEntry.value(
    item.id,
    selectedAcademicYearId.value ?? undefined,
    selectedSemesterId.value
  );
  if (!ktpId) return 0;
  const details = ktpStore.ktpDetails.filter((d) => d.ktpId === ktpId);
  return details.length;
};

const selectItem = (item: any) => {
  if (!item.ktpId) return;
  selectedKtpId.value = item.ktpId;
  ktpStore.fetchDetailsForKtp(item.ktpId);
};

// Year/semester/specialty are selected inside AddKtpItemForm
// (pre-filled from the page filters when set)
const openAddDialog = () => {
  isAddItemFormOpen.value = true;
};

// Auto-select active academic year when it becomes available
watch(
  () => academicYearStore.getActiveAcademicYear,
  (activeYear) => {
    if (activeYear && !selectedAcademicYearId.value) {
      selectedItemsStore.setSelectedAcademicYear(activeYear.id);
    }
  },
  { immediate: true }
);

const selectedAcademicYearModel = computed({
  get: () => selectedAcademicYearId.value ?? "",
  set: (v: string) => {
    selectedItemsStore.setSelectedAcademicYear(v || null);
  },
});

// Auto-select semester when academic year changes or semesters finish loading
watch(
  [selectedAcademicYearId, () => academicYearSemesterStore.academicYearSemesters],
  ([newYearId, semesters], [oldYearId, oldSemesters]) => {
    // Only trigger if we have a year, AND either the year just changed, OR we don't have a semester selected yet
    if (newYearId && (newYearId !== oldYearId || !selectedSemesterId.value)) {
      const autoSemester = academicYearSemesterStore.getAutoSelectedSemesterForYear(newYearId);
      if (autoSemester) {
        selectedSemesterId.value = autoSemester.id;
      } else if (newYearId !== oldYearId) {
        // Only clear if the year actually changed and there are no semesters
        selectedSemesterId.value = "";
      }
    }
  },
  { immediate: true }
);
</script>

<style scoped></style>
