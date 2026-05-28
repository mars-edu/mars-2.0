<template>
  <f7-page
    name="rup"
    class="flex flex-col h-screen bg-background text-foreground"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <Sidebar v-model:activeNavItem="activeNavItem" />

    <div class="flex flex-1 overflow-hidden">
      <div
        class="flex-1 overflow-y-auto px-2 py-3 sm:px-3 md:p-4 bg-background pb-16 md:pb-6 relative transition-all duration-200"
        :class="contentMargin"
      >
        <div
          v-if="isSelectMode"
          class="bg-primary text-primary-foreground p-4 mb-4 rounded-lg flex items-center justify-between shadow-lg"
          role="alert"
        >
          <div class="flex items-center">
            <IconInfo class="w-6 h-6 mr-3" />
            <div>
              <p class="font-bold">{{ rup_import_mode() }}</p>
              <p class="text-sm opacity-90">
                {{ rup_import_hint() }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button
              @click="handleImport"
              class="flex items-center gap-2 px-4 py-2 bg-primary-foreground text-primary rounded-lg shadow-lg hover:bg-primary-foreground/90 transition-colors"
            >
              <IconSquareArrowUp class="w-5 h-5" />
              <span>{{ rup_import_btn() }}</span>
            </button>
            <button
              @click="cancelSelectMode"
              class="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-colors"
            >
              <IconX class="w-5 h-5" />
              <span>{{ common_cancel() }}</span>
            </button>
          </div>
        </div>
        <div class="bg-card text-card-foreground rounded-2xl border border-border/80 p-3 sm:p-4 md:p-5 shadow-sm">
          <div
            class="flex flex-col gap-3 md:flex-row md:items-center md:gap-4 mb-4"
          >
            <div
              class="flex flex-col md:flex-row md:items-center md:gap-3 flex-1"
            >
              <span
                class="text-[1.75rem] leading-tight sm:text-2xl font-bold text-foreground"
                >{{ rup_title() }}</span
              >
            </div>
            <div class="flex md:justify-end">
              <Select
                v-model="selectedAcademicYear"
                :options="academicYearOptions"
                :placeholder="rup_academic_year()"
                name="academic-year"
                class="w-full sm:w-[220px] md:w-[250px]"
              />
            </div>
          </div>

          <Accordion class="rup-accordion !space-y-4">
            <AccordionItem id="specialties" :default-expanded="true">
              <template #title>
                <span class="text-lg font-medium">{{ rup_specialties() }}</span>
              </template>
              <template #selected-item>
                <span
                  v-if="selectedSpecialty"
                  class="ml-2 text-xs md:text-sm px-2.5 py-1 rounded-md border border-primary/30 bg-primary/10 text-foreground"
                >
                  {{ selectedSpecialty.codeName || selectedSpecialty.name }}
                </span>
              </template>
              <div class="flex flex-wrap items-center gap-2 md:gap-2.5">
                <template v-if="specialtyStore.isLoading">
                  <div
                    v-for="n in 3"
                    :key="n"
                    class="skeleton-text skeleton-effect-wave"
                  >
                    <div
                      class="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-background"
                    >
                      <f7-skeleton-block style="width: 80px; height: 20px" />
                      <f7-skeleton-block style="width: 120px; height: 16px" />
                    </div>
                  </div>
                </template>
                <div
                  v-else-if="specialtyStore.getError"
                  class="text-destructive"
                >
                  {{ specialtyStore.getError }}
                </div>
                <template v-else>
                  <div
                    v-for="specialty in specialties"
                    :key="specialty.id"
                    class="group flex items-center justify-between gap-2 px-3.5 py-2.5 border rounded-lg bg-muted/20 transition-all duration-200 cursor-pointer min-w-[72px] sm:min-w-[88px]"
                    :class="{
                      'border-primary bg-primary/10 ring-1 ring-primary/25 shadow-sm':
                        selectedSpecialtyId === specialty.id,
                      'border-border hover:border-border/80 hover:bg-muted/50':
                        selectedSpecialtyId !== specialty.id,
                    }"
                    @click="selectedSpecialtyId = specialty.id"
                  >
                    <span class="text-base font-semibold tracking-tight">
                      {{ specialty.codeName || specialty.name }}
                    </span>
                    <IconInfo
                      class="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors cursor-pointer"
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
                    class="w-full text-muted-foreground rounded-lg border border-dashed border-border px-3 py-5 text-center"
                  >
                    {{ rup_no_specialties() }}
                  </div>
                </template>
              </div>
            </AccordionItem>

            <AccordionItem id="workingPlans" :default-expanded="true">
              <template #title>
                <span class="text-lg font-medium">{{ rup_working_plan() }}</span>
                <div
                  v-if="selectedAcademicYear && selectedSpecialtyId"
                  class="inline-flex items-center rounded-lg border border-border bg-muted/70 p-1 ml-2 md:ml-3"
                  @click.stop
                >
                  <button
                    class="px-3.5 py-1.5 text-xs md:text-sm whitespace-nowrap rounded-md transition-all"
                    :class="
                      selectedClassLevel === 9
                        ? 'bg-background text-foreground font-semibold shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    "
                    @click="selectedClassLevel = 9"
                  >
                    {{ rup_base_9() }}
                  </button>
                  <button
                    class="px-3.5 py-1.5 text-xs md:text-sm whitespace-nowrap rounded-md transition-all"
                    :class="
                      selectedClassLevel === 11
                        ? 'bg-background text-foreground font-semibold shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    "
                    @click="selectedClassLevel = 11"
                  >
                    {{ rup_base_11() }}
                  </button>
                </div>
              </template>
              <template #actions>
                <div class="flex items-center gap-2">
                  <ImportWorkingPlanDialog
                    :disabled="!(selectedAcademicYear && selectedSpecialtyId)"
                    :specialty-id="selectedSpecialtyId || ''"
                    @enable-select-mode="enableSelectMode"
                  />

                  <AddWorkingPlanDialog
                    :disabled="!(selectedAcademicYear && selectedSpecialtyId)"
                    @add="addRupEntry"
                  />
                </div>
              </template>
              <div
                v-if="!selectedAcademicYear"
                class="w-full min-h-[140px] px-4 py-6 flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/20"
              >
                <div class="text-muted-foreground text-sm md:text-base flex items-center gap-2">
                  <IconArrowUp class="w-[18px] h-[18px]" />
                  <span>{{ rup_select_year_first() }}</span>
                </div>
              </div>
              <div
                v-else-if="!selectedSpecialtyId"
                class="w-full min-h-[140px] px-4 py-6 flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/20"
              >
                <div class="text-muted-foreground text-sm md:text-base flex items-center gap-2">
                  <IconArrowUp class="w-[18px] h-[18px]" />
                  <span>{{ rup_select_specialty_first() }}</span>
                </div>
              </div>
              <div v-else class="space-y-3 min-w-0">
                <div>
                  <RupEntryTable
                    ref="rupEntryTableRef"
                    :specialty-ids="[selectedSpecialtyId]"
                    :academic-year-id="selectedAcademicYear"
                    :teacher-id="effectiveTeacherId"
                    :select-mode="isSelectMode"
                    :base-class="selectedClassLevel"
                    @duplicate-item="handleDuplicateRupEntryItem"
                  />
                </div>
              </div>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>

    <f7-popover
      class="specialty-info-popover"
      :arrow="true"
      style="width: 320px !important"
    >
      <div
        v-if="selectedSpecialtyInfo"
        class="bg-card text-card-foreground p-4"
      >
        <div class="space-y-3">
          <div>
            <h3 class="font-semibold text-lg text-foreground mb-1">
              {{ selectedSpecialtyInfo.name }}
            </h3>
            <p class="text-sm text-muted-foreground font-medium">
              {{ selectedSpecialtyInfo.codeName }}
            </p>
          </div>

          <div class="border-t border-border pt-3">
            <p class="text-sm text-foreground leading-relaxed">
              {{
                selectedSpecialtyInfo.details ||
                rup_no_extra_info()
              }}
            </p>
          </div>
        </div>
      </div>
    </f7-popover>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { f7Page, f7SkeletonBlock, f7, f7Popover } from "framework7-vue";
import IconInfo from "~icons/lucide/info";
import IconSquareArrowUp from "~icons/lucide/square-arrow-up";
import IconX from "~icons/lucide/x";
import IconArrowUp from "~icons/lucide/arrow-up";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import AddWorkingPlanDialog from "@/components/AddWorkingPlanDialog.vue";
import RupEntryTable from "@/components/RupEntryTable.vue";
import { useSpecialtyStore, type Specialty } from "@/stores/specialtyStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import Accordion from "@/components/ui/accordion/Accordion.vue";
import AccordionItem from "@/components/ui/accordion/AccordionItem.vue";
import Select from "@/components/ui/Select.vue";
import { storeToRefs } from "pinia";
import ImportWorkingPlanDialog from "@/components/ImportWorkingPlanDialog.vue";
import { useRupStore } from "@/stores/rupStore";
import { useRupEntryStore, type RupEntry } from "@/stores/rupEntryStore";
import { useUserStore } from "@/stores/userStore";
import { useTeacherStore } from "@/stores/teacherStore";
import { useSidebar } from "@/composables/useSidebar";
import {
  rup_title,
  rup_academic_year,
  rup_specialties,
  rup_working_plan,
  rup_base_9,
  rup_base_11,
  rup_no_specialties,
  rup_select_year_first,
  rup_select_specialty_first,
  rup_no_extra_info,
  rup_import_mode,
  rup_import_hint,
  rup_import_btn,
  rup_import_nothing,
  rup_import_nothing_title,
  rup_import_no_specialty,
  rup_import_error_title,
  rup_import_done_title,
  rup_import_done_msg,
  rup_module_duplicated,
  common_cancel,
  common_menu,
  home_home,
  home_schedule,
  home_journals,
  home_rup,
} from "@/paraglide/messages";
import { useI18n } from "@/composables/useI18n";

const { locale } = useI18n();
const { contentMargin, openMobile } = useSidebar();
const activeNavItem = ref("rup");

const navigationItems = computed(() => {
  void locale.value;
  return [
    { id: "home", label: home_home(), icon: IconHouse, route: "/home" },
    { id: "schedule", label: home_schedule(), icon: IconCalendar, route: "/education-schedule/" },
    { id: "journals", label: home_journals(), icon: IconBook, route: "/journals/" },
    { id: "rup", label: home_rup(), icon: IconFileText, route: "/rup/" },
  ];
});

const handleTabClick = (item: any) => {
  activeNavItem.value = item.id;
  f7.views.main.router.navigate(item.route);
};
const specialtyStore = useSpecialtyStore();
const academicYearStore = useAcademicYearStore();
const userStore = useUserStore();
const teacherStore = useTeacherStore();

const rupEntryTableRef = ref<InstanceType<typeof RupEntryTable> | null>(null);

const { specialties } = storeToRefs(specialtyStore);
const { academicYearOptions, getActiveAcademicYear } =
  storeToRefs(academicYearStore);

const selectedAcademicYear = computed({
  get: () =>
    rupStore.selectedAcademicYearId || getActiveAcademicYear?.value?.id || "",
  set: (value) => rupStore.setSelectedAcademicYear(value || null),
});

const selectedClassLevel = ref<9 | 11>(9);

const rupStore = useRupStore();
const rupEntryStore = useRupEntryStore();

const isSelectMode = ref(false);

const selectedSpecialtyInfo = ref<Specialty | null>(null);

const handleSpecialtyInfoClick = (specialty: Specialty, targetEl: string) => {
  selectedSpecialtyInfo.value = specialty;
  f7.popover.open(".specialty-info-popover", targetEl);
};

const onPopoverClosed = () => {
  selectedSpecialtyInfo.value = null;
};

const enableSelectMode = () => {
  rupStore.setItemsForImport(rupEntryStore.getAllRupEntryItems);
  rupStore.setTargetContext(
    rupStore.selectedSpecialtyId,
    rupStore.selectedAcademicYearId
  );
  isSelectMode.value = true;
  rupStore.clearSelection();
};

const cancelSelectMode = () => {
  isSelectMode.value = false;
  rupStore.clearTargetContext();
  rupStore.clearRupEntrySelection();
  rupStore.clearItemsForImport();
};

const handleDuplicateRupEntryItem = (item: RupEntry) => {
  rupEntryStore.duplicateRupEntryItem(item);
  f7.toast
    .create({
      text: rup_module_duplicated(),
      horizontalPosition: "center",
      closeTimeout: 2000,
      cssClass: "bg-primary",
    })
    .open();
};

const handleImport = () => {
  const selectedIds = rupStore.selectedRupEntryItemIds;
  if (selectedIds.length === 0) {
    f7.dialog.alert(rup_import_nothing(), rup_import_nothing_title());
    return;
  }

  const targetSpecialtyId = rupStore.targetSpecialtyId;
  const targetAcademicYearId = rupStore.targetAcademicYearId;

  if (!targetSpecialtyId) {
    f7.dialog.alert(rup_import_no_specialty(), rup_import_error_title());
    return;
  }

  const allItems = rupStore.itemsForImport;
  const itemsToImport = allItems.filter((item) =>
    selectedIds.includes(item.id)
  );

  const newItems = itemsToImport.map((item) => ({
    ...item,
    id: crypto.randomUUID(),
    specialtyId: targetSpecialtyId,
    academicYearId: targetAcademicYearId || item.academicYearId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  rupEntryStore.addRupEntryItems(newItems);

  cancelSelectMode();
  f7.dialog.alert(
    rup_import_done_msg({ count: newItems.length }),
    rup_import_done_title()
  );
};

const addRupEntry = (baseClass?: number) => {
  if (typeof baseClass === "number") {
    selectedClassLevel.value = baseClass as 9 | 11;
  }
  if (rupEntryTableRef.value) {
    rupEntryTableRef.value.openAddPopup();
  }
};

// Helper function to get current specialty IDs for multi-specialty support
const currentSpecialtyIds = computed(() => {
  if (selectedSpecialtyId.value) {
    return [selectedSpecialtyId.value];
  }
  return [];
});

const selectedSpecialtyId = computed({
  get: () => rupStore.selectedSpecialtyId,
  set: (value) => rupStore.setSelectedSpecialty(value),
});

const selectedSpecialty = computed(() => rupStore.selectedSpecialty);

const selectedTeacherId = computed({
  get: () => rupStore.selectedTeacherId || "",
  set: (value) => rupStore.setSelectedTeacher(value || null),
});

const teacherOptions = computed(() => teacherStore.teacherSelectOptions);

const effectiveTeacherId = computed(() => {
  if (userStore.isAdmin) {
    return rupStore.selectedTeacherId || undefined;
  }
  if (userStore.isTeacher) {
    return userStore.currentUser?.id;
  }
  return undefined;
});

onMounted(async () => {
  await specialtyStore.fetchSpecialties();
  f7.on("popoverClosed", (popover) => {
    if (popover.el.classList.contains("specialty-info-popover")) {
      onPopoverClosed();
    }
  });
});
</script>

<style scoped>
.specialty-info-popover.popover {
  margin-top: -160px !important; /* FIXME: workaround */
}

.rup-accordion :deep(.border) {
  border-radius: 0.9rem;
}

.rup-accordion :deep(.bg-muted) {
  background-color: hsl(var(--muted) / 0.38);
}
</style>
