<template>
  <div>
    <GuardedPopover
      id="download-template-popover"
      style="width: 400px !important"
      target="#download-template-button"
    >
      <div class="download-template-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Скачать шаблон"
          cancel-text="Закрыть"
          :on-cancel="handleClose"
        />

        <div class="p-4 flex flex-col gap-4">
          <a
            class="w-full py-3 rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            @click="openExcel"
          >
            <IconFileText class="w-4 h-4 text-white" />
            Скачать Excel шаблон
          </a>

          <a
            class="w-full py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            @click="openWord"
          >
            <IconFileText class="w-4 h-4 text-white" />
            Скачать Word шаблон
          </a>
        </div>
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { f7, f7Popover } from "framework7-vue";
import IconFileText from "~icons/lucide/file-text";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import { saveAs } from "file-saver";

const handleClose = () => {
  f7.popover.close("#download-template-popover");
};

const openExcel = async () => {
  try {
    const response = await fetch("/rup_templates/Шаблон КТП Марса.xlsx");
    const blob = await response.blob();
    saveAs(blob, "Шаблон КТП Марса.xlsx");
    f7.popover.close("#download-template-popover");
  } catch (error) {
    console.error("Error downloading Excel template:", error);
  }
};

const openWord = async () => {
  try {
    const response = await fetch("/rup_templates/Шаблон КТП Мрас.docx");
    const blob = await response.blob();
    saveAs(blob, "Шаблон КТП Мрас.docx");
    f7.popover.close("#download-template-popover");
  } catch (error) {
    console.error("Error downloading Word template:", error);
  }
};
</script>

<style>
.download-template-popover {
  max-height: 90vh;
  overflow-y: auto;
}
</style>
