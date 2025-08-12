<template>
  <div>
    <f7-popover
      id="ktp-detail-popover"
      :arrow="false"
      style="width: calc(100vw - 50px) !important"
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
                  fill
                  color="black"
                  text-color="white"
                  class="!h-8 !min-h-8 !text-xs"
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
                  fill
                  color="black"
                  text-color="white"
                  class="!h-8 !min-h-8 !text-xs"
                  @click="uploadDocument"
                >
                  <f7-icon
                    ios="f7:arrow_up_doc"
                    md="material:upload_file"
                    class="!text-sm mr-1"
                  ></f7-icon>
                  Загрузить документ
                </f7-button>

                <f7-button
                  small
                  fill
                  color="black"
                  text-color="white"
                  class="!h-8 !min-h-8 !text-xs"
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
                  fill
                  color="black"
                  text-color="white"
                  class="!h-8 !min-h-8 !text-xs"
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
                  fill
                  color="black"
                  text-color="white"
                  class="!h-8 !min-h-8 !text-xs"
                  @click="addManually"
                >
                  <f7-icon
                    ios="f7:plus"
                    md="material:add"
                    class="!text-sm mr-1"
                  ></f7-icon>
                  Добавить вручную
                </f7-button>
              </div>
            </div>

            <div class="border border-border rounded-lg overflow-hidden">
              <div
                class="grid grid-cols-[40px_minmax(0,_1fr)_100px_80px_80px_120px] gap-4 px-4 py-2 bg-muted/50 text-sm text-muted-foreground"
              >
                <div class="font-medium text-center">№</div>
                <div class="font-medium">Темы занятий</div>
                <div class="font-medium text-center">Всего часов</div>
                <div class="font-medium text-center">СРСП</div>
                <div class="font-medium text-center">СРС</div>
                <div class="font-medium text-center">Что задано?</div>
              </div>

              <div v-if="loading" class="p-4 text-center text-muted-foreground">
                Загрузка деталей...
              </div>
              <div v-else class="divide-y divide-border">
                <div
                  v-for="item in ktpDetails"
                  :key="item.id"
                  :id="`ktp-detail-item-${item.id}`"
                  class="grid grid-cols-[40px_minmax(0,_1fr)_100px_80px_80px_120px] gap-4 px-4 py-3 items-start cursor-pointer hover:bg-muted/50 transition-colors"
                  :class="{
                    'bg-orange-400/80': item.id === selectedDetailId,
                  }"
                  @click="openEditPopover(item)"
                >
                  <div class="text-center text-sm">{{ item.position }}</div>
                  <div class="text-sm">{{ item.theme }}</div>
                  <div class="text-center text-sm">
                    {{ item.totalHours ?? "—" }}
                  </div>
                  <div class="text-center text-sm">{{ item.srsp ?? "—" }}</div>
                  <div class="text-center text-sm">{{ item.srs ?? "—" }}</div>
                  <div class="text-center text-sm">
                    {{ item.homework || "—" }}
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
import { ref, watch, toRefs } from "vue";
import { f7, f7Popover, f7Icon, f7Fab, f7Button } from "framework7-vue";
import { useKtpStore, type KtpDetail } from "@/stores/ktpStore";
import KtpDetailFormPopover from "@/components/KtpDetailFormPopover.vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import DownloadTemplateDialog from "@/components/DownloadTemplateDialog.vue";
import { storeToRefs } from "pinia";

const props = defineProps<{
  parentId: string | null;
  opened: boolean;
}>();

const emit = defineEmits<{
  (e: "update:opened", value: boolean): void;
}>();

const { parentId, opened } = toRefs(props);
const ktpStore = useKtpStore();
const { ktpDetails, loading } = storeToRefs(ktpStore);
const selectedDetailId = ref("ktp-detail-3");

const isFormPopoverOpen = ref(false);
const editingDetail = ref<KtpDetail | null>(null);
const formPopoverTarget = ref("");

const handleClose = () => {
  emit("update:opened", false);
};

const downloadTemplate = () => {
  f7.popover.open("#download-template-popover", "#download-template-button");
};

const uploadDocument = () => {
  console.log("Uploading document...");
  // TODO: Implement document upload functionality
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
</style>
