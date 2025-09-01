<template>
  <div>
    <f7-popover
      id="ktp-detail-popover"
      :arrow="false"
      style="
        width: calc(100vw - 50px) !important;
        height: calc(100dvh - 50px) !important;
      "
      close-on-escape
      @popover:closed="$emit('update:opened', false)"
    >
      <div class="ktp-detail-popover bg-card text-card-foreground">
        <div class="fixed-header">
          <PopoverHeader
            title="Рабочие учебные программы"
            cancel-text="Закрыть"
            :on-cancel="handleClose"
            :is-loading="loading"
          />

          <div v-if="ktpStore.error" class="px-4 pb-2 text-destructive text-sm">
            {{ ktpStore.error }}
          </div>
        </div>

        <div class="scrollable-content">
          <div class="p-4 space-y-3">
            <div
              class="bg-primary text-primary-foreground rounded-lg p-3 flex items-center justify-between"
            >
              <div class="flex items-center gap-2 flex-wrap">
                <f7-button
                  id="download-template-button"
                  small
                  text-color="white"
                  class="!h-8 !min-h-8 !text-xs bg-sun"
                  @click="downloadTemplate"
                >
                  <f7-icon
                    ios="f7:arrow_down_doc"
                    md="material:download"
                    class="!text-sm mr-1"
                  ></f7-icon>
                  Скачать шаблон
                </f7-button>

                <f7-button
                  small
                  text-color="white"
                  class="!h-8 !min-h-8 !text-xs bg-sun"
                  @click="uploadDocument"
                >
                  <f7-icon
                    ios="f7:arrow_up_doc"
                    md="material:upload_file"
                    class="!text-sm mr-1"
                  ></f7-icon>
                  Загрузить план
                </f7-button>

                <f7-button
                  small
                  text-color="white"
                  class="!h-8 !min-h-8 !text-xs bg-sun"
                  @click="importData"
                >
                  <f7-icon
                    ios="f7:square_arrow_down"
                    md="material:import_export"
                    class="!text-sm mr-1"
                  ></f7-icon>
                  Импорт
                </f7-button>

                <f7-button
                  small
                  text-color="white"
                  class="!h-8 !min-h-8 !text-xs bg-sun"
                  @click="shareDocument"
                >
                  <f7-icon
                    ios="f7:share"
                    md="material:share"
                    class="!text-sm mr-1"
                  ></f7-icon>
                  Поделиться
                </f7-button>

                <f7-button
                  small
                  text-color="white"
                  class="!h-8 !min-h-8 !text-xs bg-sun"
                  @click="addManually"
                >
                  <f7-icon
                    ios="f7:plus"
                    md="material:add"
                    class="!text-sm mr-1"
                  ></f7-icon>
                  Добавить вручную
                </f7-button>

                <f7-button
                  small
                  text-color="white"
                  class="!h-8 !min-h-8 !text-xs bg-sun"
                  @click="downloadRup"
                >
                  <f7-icon
                    ios="f7:arrow_down_doc"
                    md="material:download"
                    class="!text-sm mr-1"
                  ></f7-icon>
                  Скачать РУП
                </f7-button>
              </div>
            </div>

            <div class="border border-border rounded-lg overflow-hidden">
              <div
                class="grid grid-cols-[40px_minmax(0,_1fr)_100px_80px_80px_120px_160px] gap-4 px-4 py-2 bg-muted/50 text-sm text-muted-foreground"
              >
                <div class="font-medium text-center">№</div>
                <div class="font-medium">Темы занятий</div>
                <div class="font-medium text-center">Всего часов</div>
                <div class="font-medium text-center">СРСП</div>
                <div class="font-medium text-center">СРС</div>
                <div class="font-medium text-center">Что задано?</div>
                <div class="font-medium text-center">Примечание</div>
              </div>

              <div
                v-if="loading && !isImporting"
                class="p-4 text-center text-muted-foreground"
              >
                Загрузка деталей...
              </div>
              <div v-else class="divide-y divide-border">
                <div
                  v-for="item in ktpDetails"
                  :key="item.id"
                  :id="`ktp-detail-item-${item.id}`"
                  class="grid grid-cols-[40px_minmax(0,_1fr)_100px_80px_80px_120px_160px] gap-4 px-4 py-3 items-start cursor-pointer hover:bg-muted/50 transition-colors"
                  :class="{
                    'is-dragging': dragSourceId === item.id,
                    'is-drag-over':
                      dragOverId === item.id && dragSourceId !== item.id,
                  }"
                  draggable="true"
                  @dragstart="onDragStart(item)"
                  @dragover.prevent
                  @dragenter.prevent="onDragEnter(item)"
                  @drop.prevent="onDrop(item)"
                  @dragend="onDragEnd"
                  @click="openEditPopover(item)"
                >
                  <div
                    class="flex items-center justify-center gap-2 select-none"
                  >
                    <span
                      class="drag-handle inline-flex items-center justify-center p-1 rounded cursor-move text-muted-foreground/80 hover:text-foreground hover:bg-muted"
                    >
                      <f7-icon
                        ios="f7:line_horizontal_3"
                        md="material:drag_indicator"
                        class="!text-base"
                      ></f7-icon>
                    </span>
                    <span class="text-sm font-medium">{{ item.position }}</span>
                  </div>
                  <div class="text-sm">{{ item.theme }}</div>
                  <div class="text-center text-sm">
                    {{ item.totalHours ?? "—" }}
                  </div>
                  <div class="text-center text-sm">{{ item.srsp ?? "—" }}</div>
                  <div class="text-center text-sm">{{ item.srs ?? "—" }}</div>
                  <div class="text-center text-sm">
                    {{ item.homework || "—" }}
                  </div>
                  <div class="text-center text-sm">
                    {{ item.notes || "—" }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <f7-fab
          position="right-bottom"
          slot="fixed"
          id="add-ktp-detail-fab"
          @click="openAddPopover"
          class="hidden"
        >
          <f7-icon ios="f7:plus" md="material:add"></f7-icon>
        </f7-fab>

        <KtpDetailFormPopover
          v-if="parentId"
          v-model:opened="isFormPopoverOpen"
          :target="formPopoverTarget"
          :parent-id="parentId"
          :detail-to-edit="editingDetail"
        />

        <DownloadTemplateDialog />
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, toRefs, computed } from "vue";
import { f7, f7Popover, f7Icon, f7Fab, f7Button } from "framework7-vue";
import { useKtpStore, type KtpDetail } from "@/stores/ktpStore";
import KtpDetailFormPopover from "@/components/KtpDetailFormPopover.vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import DownloadTemplateDialog from "@/components/DownloadTemplateDialog.vue";
import { storeToRefs } from "pinia";
import {
  parseEducationalSchedule,
  parseEducationalScheduleEnhanced,
} from "@/services/excel-parser";

const props = defineProps<{
  parentId: string | null;
  opened: boolean;
}>();

const emit = defineEmits<{
  (e: "update:opened", value: boolean): void;
}>();

const { parentId, opened } = toRefs(props);
const ktpStore = useKtpStore();
const { loading } = storeToRefs(ktpStore);
const selectedDetailId = ref("ktp-detail-3");

// Computed property to get filtered details for the current parent
const ktpDetails = computed(() => {
  if (!parentId.value) return [];
  return ktpStore.getDetailsByParentId(parentId.value);
});

const isFormPopoverOpen = ref(false);
const editingDetail = ref<KtpDetail | null>(null);
const formPopoverTarget = ref("");
const isImporting = ref(false);
const dragSourceId = ref<string | null>(null);
const dragOverId = ref<string | null>(null);

const handleClose = () => {
  emit("update:opened", false);
};

const downloadTemplate = () => {
  f7.popover.open("#download-template-popover", "#download-template-button");
};

const downloadRup = () => {
  console.log("Downloading RUP...");
  // TODO: Implement RUP download functionality
};

const uploadDocument = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".xlsx,.xls";
  input.style.display = "none";

  input.onchange = async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!parentId.value) {
      f7.toast
        .create({
          text: "Ошибка: не указан родительский элемент",
          closeTimeout: 3000,
          cssClass: "color-red",
        })
        .open();
      return;
    }

    try {
      isImporting.value = true;
      ktpStore.error = null;

      f7.toast
        .create({
          text: `Загрузка файла ${file.name}...`,
          closeTimeout: 2000,
        })
        .open();

      let parseResult;
      try {
        parseResult = await parseEducationalSchedule(file);
      } catch (basicError) {
        console.warn(
          "Basic parser failed, trying enhanced parser:",
          basicError
        );
        parseResult = await parseEducationalScheduleEnhanced(file);
      }

      if (!parseResult.lessons.length) {
        throw new Error("В файле не найдено ни одного урока для импорта");
      }

      const importResult = ktpStore.bulkImportKtpDetails(
        parentId.value,
        parseResult.lessons
      );

      if (importResult.success) {
        f7.toast
          .create({
            text: `Успешно импортировано ${importResult.imported} уроков из файла ${parseResult.metadata.fileName}`,
            closeTimeout: 4000,
            cssClass: "color-green",
          })
          .open();
        // Refresh current list to ensure view shows imported data for this parent
        ktpStore.fetchDetailsForParent(parentId.value);
      } else {
        throw new Error(importResult.error || "Ошибка импорта данных");
      }
    } catch (error) {
      console.error("Error processing Excel file:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Неизвестная ошибка при обработке файла";

      f7.toast
        .create({
          text: `Ошибка: ${errorMessage}`,
          closeTimeout: 5000,
          cssClass: "color-red",
        })
        .open();

      ktpStore.error = errorMessage;
    } finally {
      isImporting.value = false;
    }
  };

  document.body.appendChild(input);
  input.click();
  document.body.removeChild(input);
};

const importData = () => {
  console.log("Importing data...");
  // TODO: Implement data import functionality
};

const shareDocument = () => {
  console.log("Sharing document...");
  // TODO: Implement document sharing functionality
};

const addManually = () => {
  console.log("Adding manually...");
  // TODO: Implement manual addition functionality
  openAddPopover(); // For now, open the existing add popover
};

const openAddPopover = () => {
  editingDetail.value = null;
  formPopoverTarget.value = "#add-ktp-detail-fab";
  isFormPopoverOpen.value = true;
};

const openEditPopover = (detail: KtpDetail) => {
  editingDetail.value = detail;
  selectedDetailId.value = detail.id;
  formPopoverTarget.value = `#ktp-detail-item-${detail.id}`;
  isFormPopoverOpen.value = true;
};

function onDragStart(item: KtpDetail) {
  dragSourceId.value = item.id;
}

function onDragEnter(item: KtpDetail) {
  dragOverId.value = item.id;
}

function onDrop(targetItem: KtpDetail) {
  if (!parentId.value || !dragSourceId.value) return;

  const ids = ktpDetails.value.map((d) => d.id);
  const fromIndex = ids.indexOf(dragSourceId.value);
  const toIndex = ids.indexOf(targetItem.id);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    dragSourceId.value = null;
    dragOverId.value = null;
    return;
  }

  const newOrder = [...ids];
  const [moved] = newOrder.splice(fromIndex, 1);
  newOrder.splice(toIndex, 0, moved);

  const result = ktpStore.reorderKtpDetails(parentId.value, newOrder);
  if (!result.success) {
    f7.toast
      .create({
        text: `Ошибка при изменении порядка: ${result.error}`,
        closeTimeout: 3000,
        cssClass: "color-red",
      })
      .open();
  } else {
    f7.toast
      .create({
        text: `Порядок элементов обновлен`,
        closeTimeout: 1500,
        cssClass: "color-green",
      })
      .open();
  }

  // Ensure UI reflects new order immediately
  ktpStore.fetchDetailsForParent(parentId.value);

  dragSourceId.value = null;
  dragOverId.value = null;
}

function onDragEnd() {
  dragSourceId.value = null;
  dragOverId.value = null;
}

watch(parentId, (newParentId) => {
  if (newParentId) {
    ktpStore.fetchDetailsForParent(newParentId);
  }
});

watch(opened, (isOpened) => {
  if (isOpened) {
    if (parentId.value) {
      ktpStore.fetchDetailsForParent(parentId.value);
    }
    f7.popover.open("#ktp-detail-popover");
  } else {
    f7.popover.close("#ktp-detail-popover");
  }
});
</script>

<style>
#ktp-detail-popover {
  left: 50%;
  transform: translateX(-50%);
}

.ktp-detail-popover {
  height: 100%;
  display: flex;
  flex-direction: column;
  max-height: 100dvh;
}

.fixed-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--f7-popover-bg-color);
  border-bottom: 1px solid var(--f7-border-color);
}

.scrollable-content {
  flex: 1;
  overflow-y: auto;
  height: calc(100dvh - 120px);
}

.is-dragging {
  opacity: 0.7;
  transform: scale(0.995);
}

.is-drag-over {
  background-color: rgba(255, 159, 67, 0.15);
  outline: 2px dashed var(--f7-theme-color);
}

.drag-handle {
  touch-action: none;
}
</style>
