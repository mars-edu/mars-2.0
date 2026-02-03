<template>
  <f7-page
    name="rup"
    class="flex flex-col h-screen bg-background text-foreground"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <div class="flex flex-1 overflow-hidden">
      <Sidebar v-model:activeNavItem="activeNavItem" class="hidden md:block" />

      <div
        class="flex-1 overflow-y-auto p-3 md:p-4 bg-background pb-16 md:pb-6 md:ml-32 relative"
      >
        <div
          v-if="isSelectMode"
          class="bg-primary text-primary-foreground p-4 mb-4 rounded-lg flex items-center justify-between shadow-lg"
          role="alert"
        >
          <div class="flex items-center">
            <f7-icon
              ios="f7:info_circle_fill"
              md="material:info"
              size="24px"
              class="mr-3"
            ></f7-icon>
            <div>
              <p class="font-bold">Режим импорта</p>
              <p class="text-sm opacity-90">
                Выберите элементы для импорта и нажмите кнопку 'Импорт'.
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button
              @click="handleImport"
              class="flex items-center gap-2 px-4 py-2 bg-primary-foreground text-primary rounded-lg shadow-lg hover:bg-primary-foreground/90 transition-colors"
            >
              <f7-icon
                ios="f7:square_arrow_up"
                md="material:file_download"
                size="20px"
              ></f7-icon>
              <span>Импорт</span>
            </button>
            <button
              @click="cancelSelectMode"
              class="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-colors"
            >
              <f7-icon ios="f7:xmark" md="material:close" size="20px"></f7-icon>
              <span>Отмена</span>
            </button>
          </div>
        </div>
        <div
          class="bg-card text-card-foreground rounded-xl p-4 md:p-4 shadow-sm"
        >
          <div
            class="flex flex-col md:flex-row md:items-center md:gap-3 mb-4 md:mb-4"
          >
            <div
              class="flex flex-col md:flex-row md:items-center md:gap-3 flex-1 mb-4 md:mb-0"
            >
              <span
                class="text-base md:text-lg font-medium md:font-semibold mb-1 md:mb-0"
                >Рабочие учебные планы:</span
              >
            </div>
            <div class="flex flex-col md:flex-row md:items-center md:gap-3">
              <Select
                v-model="selectedAcademicYear"
                :options="academicYearOptions"
                placeholder="Год поступления:"
                name="academic-year"
                class="w-[250px]"
              />
            </div>
          </div>

          <Accordion>
            <AccordionItem id="specialties" :default-expanded="true">
              <template #title>Специальности:</template>
              <template #selected-item>
                <span
                  v-if="selectedSpecialty"
                  class="ml-2 text-xs md:text-sm px-2 py-1 rounded-md ring-2 ring-primary bg-primary/10"
                >
                  {{ selectedSpecialty.codeName || selectedSpecialty.name }}
                </span>
              </template>
              <div class="flex flex-wrap items-center gap-2 md:gap-3">
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
                    class="flex items-center justify-between gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                    :class="{
                      'ring-2 ring-primary bg-primary/10':
                        selectedSpecialtyId === specialty.id,
                    }"
                    @click="selectedSpecialtyId = specialty.id"
                  >
                    <span class="font-medium">
                      {{ specialty.codeName || specialty.name }}
                    </span>
                    <f7-icon
                      ios="f7:info_circle"
                      md="material:info"
                      size="18px"
                      :id="`specialty-item-${specialty.id}`"
                      class="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                      @click.stop="
                        handleSpecialtyInfoClick(
                          specialty,
                          `#specialty-item-${specialty.id}`
                        )
                      "
                    ></f7-icon>
                  </div>
                  <div
                    v-if="specialties.length === 0"
                    class="text-muted-foreground"
                  >
                    Нет специальностей
                  </div>
                </template>
              </div>
            </AccordionItem>

            <AccordionItem id="workingPlans" :default-expanded="true">
              <template #title>Рабочий учебный план:</template>
              <template #actions>
                <ImportWorkingPlanDialog
                  :disabled="!(selectedAcademicYear && selectedSpecialtyId)"
                  :specialty-id="selectedSpecialtyId || ''"
                  @enable-select-mode="enableSelectMode"
                />

                <AddWorkingPlanDialog
                  v-model:opened="showAddWorkingPlanDialog"
                  @submit="handleWorkingPlanSubmit"
                  :disabled="!(selectedAcademicYear && selectedSpecialtyId)"
                  :specialty-id="selectedSpecialtyId || ''"
                  @add-class-9="addClass9"
                />
              </template>
              <div
                v-if="!selectedAcademicYear"
                class="w-full p-3 flex items-center justify-center"
              >
                <div class="text-muted-foreground flex items-center gap-2">
                  <f7-icon
                    ios="f7:arrow_up"
                    md="material:keyboard_arrow_up"
                    size="18px"
                  ></f7-icon>
                  <span>Сначала выберите учебный год</span>
                </div>
              </div>
              <div
                v-else-if="!selectedSpecialtyId"
                class="w-full p-3 flex items-center justify-center"
              >
                <div class="text-muted-foreground flex items-center gap-2">
                  <f7-icon
                    ios="f7:arrow_up"
                    md="material:keyboard_arrow_up"
                    size="18px"
                  ></f7-icon>
                  <span>Сначала выберите специальность</span>
                </div>
              </div>
              <div v-else class="space-y-3">
                <div class="mt-4">
                  <template v-if="selectedClassLevel === 9">
                    <Class9Table
                      ref="class9TableRef"
                      :specialty-ids="[selectedSpecialtyId]"
                      :academic-year-id="selectedAcademicYear"
                      :teacher-id="effectiveTeacherId"
                      :select-mode="isSelectMode"
                      @duplicate-item="handleDuplicateClass9Item"
                    />
                  </template>
                  <template v-else>
                    <Class11Table :specialty-id="selectedSpecialtyId" />
                  </template>
                </div>
              </div>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>

    <template #fixed>
      <FabActions v-if="!isSelectMode" />
    </template>

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
                "Дополнительная информация отсутствует."
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
import { f7Page, f7Icon, f7SkeletonBlock, f7, f7Popover } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import AddWorkingPlanDialog from "@/components/AddWorkingPlanDialog.vue";
import Class9Table from "@/components/Class9Table.vue";
import Class11Table from "@/components/Class11Table.vue";
import { useSpecialtyStore, type Specialty } from "@/stores/specialtyStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import Accordion from "@/components/ui/accordion/Accordion.vue";
import AccordionItem from "@/components/ui/accordion/AccordionItem.vue";
import Select from "@/components/ui/Select.vue";
import { storeToRefs } from "pinia";
import ImportWorkingPlanDialog from "@/components/ImportWorkingPlanDialog.vue";
import FabActions from "@/components/FabActions.vue";
import { useRupStore } from "@/stores/rupStore";
import { useClass9Store, type Class9Data } from "@/stores/class9Store";
import { useUserStore } from "@/stores/userStore";
import { useTeacherStore } from "@/stores/teacherStore";

const activeNavItem = ref("rup");
const specialtyStore = useSpecialtyStore();
const academicYearStore = useAcademicYearStore();
const userStore = useUserStore();
const teacherStore = useTeacherStore();

const class9TableRef = ref<InstanceType<typeof Class9Table> | null>(null);

const { specialties } = storeToRefs(specialtyStore);
const { academicYearOptions, getActiveAcademicYear } =
  storeToRefs(academicYearStore);

const selectedAcademicYear = computed({
  get: () =>
    rupStore.selectedAcademicYearId || getActiveAcademicYear?.value?.id || "",
  set: (value) => rupStore.setSelectedAcademicYear(value || null),
});

const showAddWorkingPlanDialog = ref(false);
const workingPlans = ref<
  Array<{ id: number; name: string; year: number; description?: string }>
>([]);
const selectedClassLevel = ref<9 | 11>(9);

const rupStore = useRupStore();
const class9Store = useClass9Store();

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
  rupStore.setItemsForImport(class9Store.getAllClass9Items);
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
  rupStore.clearClass9Selection();
  rupStore.clearItemsForImport();
};

const handleDuplicateClass9Item = (item: Class9Data) => {
  class9Store.duplicateClass9Item(item);
  f7.toast
    .create({
      text: "Модуль дублирован",
      horizontalPosition: "center",
      closeTimeout: 2000,
      cssClass: "bg-primary",
    })
    .open();
};

const handleImport = () => {
  const selectedIds = rupStore.selectedClass9ItemIds;
  if (selectedIds.length === 0) {
    f7.dialog.alert("Не выбраны элементы для импорта.", "Ничего не выбрано");
    return;
  }

  const targetSpecialtyId = rupStore.targetSpecialtyId;
  const targetAcademicYearId = rupStore.targetAcademicYearId;

  if (!targetSpecialtyId) {
    f7.dialog.alert("Не выбрана специальность для импорта.", "Ошибка импорта");
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

  class9Store.addClass9Items(newItems);

  cancelSelectMode();
  f7.dialog.alert(
    `Импортировано ${newItems.length} элементов в выбранную специальность.`,
    "Импорт завершен"
  );
};

const handleWorkingPlanSubmit = (data: { baseClass: number }) => {
  const newPlan = {
    id: Date.now(),
    name: `План ${data.baseClass} класс`,
    year: new Date().getFullYear(),
    baseClass: data.baseClass,
  };
  workingPlans.value.push(newPlan);
};

const addClass9 = () => {
  if (class9TableRef.value) {
    class9TableRef.value.openAddPopup();
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
</style>
