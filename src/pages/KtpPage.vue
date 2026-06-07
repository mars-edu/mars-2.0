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
          class="bg-card text-card-foreground rounded-xl p-4 md:p-4 shadow-sm"
        >
          <!-- Row 1: Title + Create -->
          <div class="flex items-center justify-between mb-6">
            <h1 class="text-2xl md:text-3xl font-bold">
              Тематические планы (КТП)
            </h1>
            <button
              class="w-fit flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all active:scale-95"
              :class="isAddDisabled
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'"
              :disabled="isAddDisabled"
              @click="openAddDialog"
            >
              <IconPlus class="w-5 h-5" />
              Создать
            </button>
          </div>

          <!-- Row 2: Search + Filters -->
          <div class="flex flex-col md:flex-row gap-3 mb-6">
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
              :key="item.id"
              class="group relative bg-card border border-border rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5"
              :style="{ zIndex: activeMenuKtpId === item.ktpId ? 30 : undefined }"
              @click="selectItem(item)"
            >
              <div
                v-if="isItemFullyLoaded(item)"
                class="absolute -top-2.5 -right-2.5 bg-primary text-primary-foreground p-2 rounded-xl shadow-lg rotate-12 group-hover:rotate-0 transition-transform z-10"
                title="План полностью заполнен"
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
                  <p
                    v-if="getKtpSubtitle(item)"
                    class="text-xs text-muted-foreground/70 flex items-center gap-1"
                  >
                    <IconClock class="w-3 h-3 flex-shrink-0" />
                    {{ getKtpSubtitle(item) }}
                  </p>
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
                  <div class="flex flex-col items-center min-w-[50px]">
                    <span class="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Курс</span>
                    <span class="text-sm font-semibold group-hover:text-primary transition-colors">
                      {{ getCourseNumber((item as any).courseId || "") || "—" }}
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
                  <button
                    class="p-2 rounded-xl text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors"
                    :data-testid="`ktp-card-menu-${item.ktpId}`"
                    @click="toggleCardMenu(item.ktpId)"
                  >
                    <IconMoreVertical class="w-5 h-5" />
                  </button>
                  <div
                    v-if="activeMenuKtpId === item.ktpId"
                    class="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-xl py-1 z-20 overflow-hidden"
                  >
                    <button
                      class="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                      @click="onEditKtp(item.ktpId)"
                    >
                      <IconEdit2 class="w-4 h-4 text-primary" />
                      Редактировать
                    </button>
                    <button
                      class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      @click="onDeleteKtp(item.ktpId)"
                    >
                      <IconTrash2 class="w-4 h-4" />
                      Удалить
                    </button>
                  </div>
                </div>

                <!-- Arrow -->
                <IconChevronRight
                  class="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <KtpDetailPopup
      v-model:opened="isPopupOpened"
      :ktp-id="
        getKtpIdForRupEntry(
          selectedKtpParentId,
          selectedAcademicYearId ?? undefined,
          selectedSemesterId
        )
      "
    />

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
import IconClock from "~icons/lucide/clock";
import IconChevronRight from "~icons/lucide/chevron-right";
import IconPaperclip from "~icons/lucide/paperclip";
import IconMoreVertical from "~icons/lucide/more-vertical";
import IconEdit2 from "~icons/lucide/edit-2";
import IconTrash2 from "~icons/lucide/trash-2";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import Select from "@/components/ui/Select.vue";
import SearchInput from "@/components/ui/SearchInput.vue";
import KtpDetailPopup from "@/components/KtpDetailPopup.vue";
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
import { useCalendarStore } from "@/stores/calendarStore";
import { storeToRefs } from "pinia";
import { useSidebar } from "@/composables/useSidebar";
import { useKtpPlannedHours } from "@/composables/useKtpPlannedHours";
import { isKtpFullyLoaded } from "@/lib/ktpHelpers";
import type { Ktp } from "@/stores/ktpStore";

const { contentMargin } = useSidebar();
const activeNavItem = ref("ktp");
const searchQuery = ref("");

const academicYearStore = useAcademicYearStore();
const { academicYears } = storeToRefs(academicYearStore);
const academicYearSemesterStore = useAcademicYearSemesterStore();

const rupEntryStore = useRupEntryStore();
const journalStore = useJournalStore();
const calendarStore = useCalendarStore();

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
const selectedItemId = ref<string | null>(null);
const isPopupOpened = ref(false);
const selectedKtpParentId = ref<string | null>(null);
const isAddItemFormOpen = ref(false);
const selectedSemesterId = ref<string>("");

const { getKtpIdForRupEntry, getModuleTitleForKtp } = storeToRefs(ktpStore);

const { getPlannedHoursForKtp } = useKtpPlannedHours();

// Card action menu
const activeMenuKtpId = ref<string | null>(null);
const editingKtp = ref<Ktp | null>(null);
const isEditPopoverOpen = ref(false);

const closeMenus = () => {
  activeMenuKtpId.value = null;
};
window.addEventListener("click", closeMenus);
onUnmounted(() => window.removeEventListener("click", closeMenus));

const toggleCardMenu = (ktpId: string) => {
  activeMenuKtpId.value = activeMenuKtpId.value === ktpId ? null : ktpId;
};

const onEditKtp = (ktpId: string) => {
  activeMenuKtpId.value = null;
  editingKtp.value = ktpStore.findKtpById(ktpId) ?? null;
  if (editingKtp.value) isEditPopoverOpen.value = true;
};

const onDeleteKtp = (ktpId: string) => {
  activeMenuKtpId.value = null;
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
    value: academicYearSemester.semesterNumber.toString(),
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

const isAddDisabled = computed(() => !selectedAcademicYearId.value);

const getCourseNumber = (courseId: string) => {
  const course = courseStore.getCourseById(courseId);
  return course ? course.number : "—";
};

const getKtpSubtitle = (item: any) => {
  // Find the calendar event that corresponds to this KTP's rupEntryId and semester
  const events = calendarStore.filteredEvents;
  const matchingEvent = events.find((event: any) => {
    const actualEvent = event._custom?.value || event;
    return (
      actualEvent.rupEntryId === item.id &&
      actualEvent.semester === item.semesterId
    );
  });

  if (!matchingEvent) {
    return "";
  }

  // Get the journal using the event ID
  const eventId = matchingEvent._custom?.value?.id || matchingEvent.id;
  const journal = journalStore.getJournalById(eventId);

  if (!journal) {
    return "";
  }

  // Use the journalStore's subtitle method
  return journalStore.getJournalSubtitle(journal);
};

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
  selectedItemId.value = item.id;
  selectedKtpParentId.value = item.id;
  isPopupOpened.value = true;
};

const openAddDialog = () => {
  if (!selectedAcademicYearId.value) {
    f7.dialog.alert(
      "Пожалуйста, выберите учебный год перед добавлением КТП",
      "Предупреждение"
    );
    return;
  }
  if (!selectedSemesterId.value) {
    f7.dialog.alert(
      "Пожалуйста, выберите семестр перед добавлением КТП",
      "Предупреждение"
    );
    return;
  }
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
        selectedSemesterId.value = autoSemester.semesterNumber.toString();
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
