<template>
  <div class="rup-entry-table">
    <div v-if="rupEntryList.length" ref="sortableList" class="space-y-0">
      <div
        v-for="(item, idx) in rupEntryList"
        :key="item.id"
        class="overflow-hidden bg-card border-b border-border last:border-b-0 transition-colors duration-150"
        :class="{ 'is-selected': rupStore.isRupEntryItemSelected(item.id) }"
        @click="handleRowClick(item)"
      >
        <div class="flex items-stretch w-full">
          <div
            class="w-6 sm:w-7 bg-muted/60 text-muted-foreground flex items-center justify-center text-sm font-medium border-r border-border drag-handle cursor-move"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-grip-vertical"
            >
              <circle cx="9" cy="12" r="1" />
              <circle cx="9" cy="5" r="1" />
              <circle cx="9" cy="19" r="1" />
              <circle cx="15" cy="12" r="1" />
              <circle cx="15" cy="5" r="1" />
              <circle cx="15" cy="19" r="1" />
            </svg>
          </div>
          <div
            class="w-10 sm:w-11 bg-muted/40 flex items-center justify-center text-sm font-medium border-r border-border text-foreground/75"
          >
            {{ idx + 1 }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-start gap-2 sm:gap-3 px-3 py-3 sm:px-4 sm:py-3.5">
              <div class="flex-1 min-w-0">
                <div class="flex items-baseline flex-wrap gap-1.5 sm:gap-2">
                  <div class="text-base font-semibold text-foreground">
                    {{ item.moduleIndex }}
                  </div>
                  <div class="text-base font-medium text-foreground/90 truncate">
                    {{ item.moduleName }}
                  </div>
                  <span
                    v-if="item.language"
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide"
                    :class="{
                      'bg-indigo-100 text-indigo-700': item.language === 'ru',
                      'bg-teal-100 text-teal-700': item.language === 'kk',
                      'bg-purple-100 text-purple-700': item.language === 'en',
                    }"
                  >
                    {{ item.language.toUpperCase() }}
                  </span>
                </div>
                <div
                  v-if="item.learningOutcome"
                  class="text-sm text-muted-foreground mt-1 truncate"
                >
                  {{ item.learningOutcome }}
                </div>
                <div
                  v-if="
                    item.distributionEntries &&
                    item.distributionEntries.some(
                      (entry) =>
                        entry.finalControlId ||
                        entry.intermediateControlId ||
                        entry.examEnabled ||
                        entry.creditEnabled ||
                        entry.controlLessonEnabled
                    )
                  "
                  class="mt-2.5 flex flex-wrap items-center gap-1.5"
                >
                  <template
                    v-for="entry in item.distributionEntries"
                    :key="entry.id"
                  >
                    <span
                      v-if="entry.finalControlId"
                      class="inline-flex items-center px-2 py-1 rounded-md border border-red-100 bg-red-50 text-red-700 text-xs font-medium"
                    >
                      {{
                        finalControlStore.getFinalControlById(entry.finalControlId)
                          ?.shortName ?? "Ф"
                      }}
                    </span>
                    <span
                      v-if="entry.intermediateControlId"
                      class="inline-flex items-center px-2 py-1 rounded-md border border-red-100 bg-red-50 text-red-700 text-xs font-medium"
                    >
                      {{
                        intermediateControlStore.getIntermediateControlById(
                          entry.intermediateControlId
                        )?.shortName ?? "П"
                      }}
                    </span>
                    <span
                      v-if="entry.examEnabled"
                      class="inline-flex items-center px-2 py-1 rounded-md border border-red-100 bg-red-50 text-red-700 text-xs font-medium"
                    >
                      Экз.
                    </span>
                    <span
                      v-if="entry.creditEnabled"
                      class="inline-flex items-center px-2 py-1 rounded-md border border-red-100 bg-red-50 text-red-700 text-xs font-medium"
                    >
                      Зач.
                    </span>
                    <span
                      v-if="entry.controlLessonEnabled"
                      class="inline-flex items-center px-2 py-1 rounded-md border border-red-100 bg-red-50 text-red-700 text-xs font-medium"
                    >
                      Контр.
                    </span>
                  </template>
                  <span
                    v-if="item.totalHours"
                    class="inline-flex items-center px-2 py-1 rounded-md border border-red-100 bg-red-50 text-red-700 text-xs font-medium"
                  >
                    {{ item.totalHours }} ч.
                  </span>
                </div>
              </div>
              <div class="flex items-start gap-2">
                <button
                  @click.stop="duplicateItem(item)"
                  class="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                  aria-label="Дублировать"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-copy"
                  >
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path
                      d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      v-else
      class="min-h-[160px] rounded-lg border border-dashed border-border bg-muted/20 text-center text-muted-foreground flex items-center justify-center px-4 py-6"
    >
      Нет данных для отображения
    </div>
    <RupEntryViewPopover
      v-if="viewPopupOpen"
      :item="viewData"
      @close="closeViewPopup"
      @edit="openEditFromView"
    />
    <RupEntryPopup
      v-if="popupOpen"
      :specialty-ids="specialtyIds"
      :academic-year-id="academicYearId"
      :teacher-id="teacherId"
      :base-class="baseClass"
      :initial-data="initialData"
      :edit-mode="editMode"
      @close="closePopup"
      @submit="handlePopupSubmit"
    />
    <button style="display: none" ref="addBtn" @click="openAddPopup"></button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, onMounted, onBeforeUnmount } from "vue";
import { useRupEntryStore, type RupEntry } from "@/stores/rupEntryStore";
import { useFinalControlStore } from "@/stores/finalControlStore";
import { useIntermediateControlStore } from "@/stores/intermediateControlStore";
import { f7 } from "framework7-vue";
import RupEntryPopup from "@/components/RupEntryPopup.vue";
import RupEntryViewPopover from "@/components/RupEntryViewPopover.vue";
import { useRupStore } from "@/stores/rupStore";
import Sortable from "sortablejs";

const props = defineProps<{
  specialtyIds?: string[];
  academicYearId: string;
  teacherId?: string;
  selectMode?: boolean;
  baseClass?: number;
}>();

const emit = defineEmits<{
  (e: "duplicate-item", item: RupEntry): void;
}>();

const rupEntryStore = useRupEntryStore();
const rupStore = useRupStore();
const finalControlStore = useFinalControlStore();
const intermediateControlStore = useIntermediateControlStore();
const sortableList = ref<HTMLElement | null>(null);
let sortableInstance: Sortable | null = null;

const rupEntryList = computed(() => {
  if (!props.academicYearId) {
    return [];
  }
  return rupEntryStore.getRupEntryItemsByContext(
    props.academicYearId,
    props.specialtyIds,
    props.baseClass
  );
});

onMounted(() => {
  if (sortableList.value) {
    sortableInstance = new Sortable(sortableList.value, {
      handle: ".drag-handle",
      animation: 150,
      ghostClass: "ghost",
      onEnd: (evt) => {
        if (evt.oldIndex !== undefined && evt.newIndex !== undefined) {
          rupEntryStore.updateRupEntryOrder(
            props.academicYearId,
            props.specialtyIds || [],
            evt.oldIndex,
            evt.newIndex
          );
        }
      },
    });
  }
});

onBeforeUnmount(() => {
  if (sortableInstance) {
    sortableInstance.destroy();
  }
});

const popupOpen = ref(false);
const editMode = ref(false);
const initialData = ref<RupEntry | null>(null);
const viewPopupOpen = ref(false);
const viewData = ref<RupEntry | null>(null);

function handleRowClick(item: RupEntry) {
  if (props.selectMode) {
    rupStore.toggleRupEntryItemSelection(item.id);
  } else {
    openViewPopup(item);
  }
}

function openEditPopup(item: RupEntry) {
  editMode.value = true;
  initialData.value = { ...item };
  popupOpen.value = true;
  nextTick(() => {
    f7.popover.open("#rup-entry-popover");
  });
}

function openViewPopup(item: RupEntry) {
  viewData.value = { ...item };
  viewPopupOpen.value = true;
  nextTick(() => {
    f7.popover.open("#rup-entry-view-popover");
  });
}

function openAddPopup() {
  editMode.value = false;
  initialData.value = null;
  popupOpen.value = true;
  nextTick(() => {
    f7.popover.open("#rup-entry-popover");
  });
}

function closePopup() {
  popupOpen.value = false;
  editMode.value = false;
  initialData.value = null;
  f7.popover.close("#rup-entry-popover");
}

function closeViewPopup() {
  viewPopupOpen.value = false;
  viewData.value = null;
}

function requestCloseViewPopup() {
  f7.popover.close("#rup-entry-view-popover");
}

function openEditFromView() {
  const item = viewData.value;
  if (!item) return;
  requestCloseViewPopup();
  setTimeout(() => {
    openEditPopup(item);
  }, 0);
}

function handlePopupSubmit() {
  closePopup();
}

function duplicateItem(item: RupEntry) {
  emit("duplicate-item", item);
}

defineExpose({
  openAddPopup,
});
</script>

<style scoped>
.rup-entry-table {
  border: 1px solid hsl(var(--border) / 0.9);
  border-radius: 12px;
  overflow: hidden;
  background: hsl(var(--card));
}

.ghost {
  opacity: 0.5;
  background: hsl(var(--muted)) !important;
  border: 1px dashed var(--f7-theme-color) !important;
}

.rup-entry-table > div > div:hover {
  background-color: hsl(var(--muted) / 0.35) !important;
  cursor: pointer;
}

.is-selected {
  background-color: hsl(var(--primary) / 0.12) !important;
}
</style>
