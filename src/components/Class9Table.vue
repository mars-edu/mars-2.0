<template>
  <div class="class9-table">
    <div v-if="class9List.length" ref="sortableList" class="space-y-0.5">
      <div
        v-for="(item, idx) in class9List"
        :key="item.id"
        class="overflow-hidden bg-card border-b border-gray-200"
        :class="{ 'is-selected': rupStore.isClass9ItemSelected(item.id) }"
        @click="handleRowClick(item)"
      >
        <div class="flex items-stretch w-full">
          <div
            class="w-8 bg-muted flex items-center justify-center text-sm font-medium border-r border-border drag-handle cursor-move"
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
            class="w-8 bg-muted flex items-center justify-center text-sm font-medium border-r border-border"
          >
            {{ idx + 1 }}
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-4 p-2">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <div class="text-sm font-medium">{{ item.moduleIndex }}</div>
                  <div class="text-sm">{{ item.moduleName }}</div>
                </div>
                <div
                  v-if="item.learningOutcome"
                  class="text-xs text-muted-foreground mt-1"
                >
                  {{ item.learningOutcome }}
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  @click.stop="duplicateItem(item)"
                  class="p-1 text-gray-500 hover:text-gray-700"
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
                class="flex items-center gap-3 px-3 py-1.5 bg-orange-500 text-white rounded-lg"
              >
                <template
                  v-for="entry in item.distributionEntries"
                  :key="entry.id"
                >
                  <div
                    v-if="entry.finalControlId"
                    class="flex items-center gap-1.5"
                  >
                    <span class="text-xs font-medium">
                      {{
                        finalControlStore.getFinalControlById(
                          entry.finalControlId
                        )?.shortName ?? "Ф"
                      }}
                    </span>
                    <div
                      class="w-6 h-6 bg-white text-orange-500 rounded flex items-center justify-center"
                    >
                      <span class="text-xs font-bold">✓</span>
                    </div>
                  </div>
                  <div
                    v-if="entry.intermediateControlId"
                    class="flex items-center gap-1.5"
                  >
                    <span class="text-xs font-medium">
                      {{
                        intermediateControlStore.getIntermediateControlById(
                          entry.intermediateControlId
                        )?.shortName ?? "П"
                      }}
                    </span>
                    <div
                      class="w-6 h-6 bg-white text-orange-500 rounded flex items-center justify-center"
                    >
                      <span class="text-xs font-bold">✓</span>
                    </div>
                  </div>
                  <div
                    v-if="entry.examEnabled"
                    class="flex items-center gap-1.5"
                  >
                    <span class="text-xs font-medium">Экз.</span>
                    <div
                      class="w-6 h-6 bg-white text-orange-500 rounded flex items-center justify-center"
                    >
                      <span class="text-xs font-bold">✓</span>
                    </div>
                  </div>
                  <div
                    v-if="entry.creditEnabled"
                    class="flex items-center gap-1.5"
                  >
                    <span class="text-xs font-medium">Зач.</span>
                    <div
                      class="w-6 h-6 bg-white text-orange-500 rounded flex items-center justify-center"
                    >
                      <span class="text-xs font-bold">✓</span>
                    </div>
                  </div>
                  <div
                    v-if="entry.controlLessonEnabled"
                    class="flex items-center gap-1.5"
                  >
                    <span class="text-xs font-medium">Контр.</span>
                    <div
                      class="w-6 h-6 bg-white text-orange-500 rounded flex items-center justify-center"
                    >
                      <span class="text-xs font-bold">✓</span>
                    </div>
                  </div>
                </template>
                <div
                  v-if="item.totalHours"
                  class="flex items-center gap-1 ml-2 pl-2 border-l border-orange-400"
                >
                  <span class="text-xs">{{ item.totalHours }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-center text-muted-foreground py-4">
      Нет данных для отображения
    </div>
    <Class9Popup
      v-if="popupOpen"
      :specialty-ids="specialtyIds"
      :academic-year-id="academicYearId"
      :teacher-id="teacherId"
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
import { useClass9Store, type Class9Data } from "@/stores/class9Store";
import { useFinalControlStore } from "@/stores/finalControlStore";
import { useIntermediateControlStore } from "@/stores/intermediateControlStore";
import { f7 } from "framework7-vue";
import Class9Popup from "@/components/Class9Popup.vue";
import { useRupStore } from "@/stores/rupStore";
import Sortable from "sortablejs";

const props = defineProps<{
  specialtyIds?: string[];
  academicYearId: string;
  teacherId?: string;
  selectMode?: boolean;
}>();

const emit = defineEmits<{
  (e: "duplicate-item", item: Class9Data): void;
}>();

const class9Store = useClass9Store();
const rupStore = useRupStore();
const finalControlStore = useFinalControlStore();
const intermediateControlStore = useIntermediateControlStore();
const sortableList = ref<HTMLElement | null>(null);
let sortableInstance: Sortable | null = null;

const class9List = computed(() => {
  if (!props.academicYearId) {
    return [];
  }
  return class9Store.getClass9ItemsByContext(
    props.academicYearId,
    props.specialtyIds
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
          class9Store.updateClass9Order(
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
const initialData = ref<Class9Data | null>(null);

function handleRowClick(item: Class9Data) {
  if (props.selectMode) {
    rupStore.toggleClass9ItemSelection(item.id);
  } else {
    openEditPopup(item);
  }
}

function openEditPopup(item: Class9Data) {
  editMode.value = true;
  initialData.value = { ...item };
  popupOpen.value = true;
  nextTick(() => {
    f7.popover.open("#class9-popover");
  });
}

function openAddPopup() {
  editMode.value = false;
  initialData.value = null;
  popupOpen.value = true;
  nextTick(() => {
    f7.popover.open("#class9-popover");
  });
}

function closePopup() {
  popupOpen.value = false;
  editMode.value = false;
  initialData.value = null;
  f7.popover.close("#class9-popover");
}

function handlePopupSubmit() {
  closePopup();
}

function duplicateItem(item: Class9Data) {
  emit("duplicate-item", item);
}

defineExpose({
  openAddPopup,
});
</script>

<style scoped>
.class9-table {
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  overflow: hidden;
}

.ghost {
  opacity: 0.5;
  background: hsl(var(--muted)) !important;
  border: 1px dashed var(--f7-theme-color) !important;
}

.class9-table > div > div:hover {
  background-color: hsl(var(--muted)) !important;
  cursor: pointer;
}

.is-selected {
  background-color: hsl(var(--primary) / 0.15) !important;
  border: 1px solid var(--f7-theme-color) !important;
}
</style>
