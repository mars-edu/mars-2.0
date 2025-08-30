<template>
  <div>
    <f7-popover
      id="download-template-popover"
      style="width: 400px !important"
      target="#download-template-button"
      close-on-escape
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
            <f7-icon
              ios="f7:doc_text"
              md="material:description"
              size="16px"
              class="text-white"
            ></f7-icon>
            Скачать Excel шаблон
          </a>

          <a
            class="w-full py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            @click="openWord"
          >
            <f7-icon
              ios="f7:doc_text"
              md="material:article"
              size="16px"
              class="text-white"
            ></f7-icon>
            Скачать Word шаблон
          </a>
        </div>
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { f7, f7Popover, f7Icon } from "framework7-vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";

const handleClose = () => {
  f7.popover.close("#download-template-popover");
};

const openExcel = () => {
  window.open("/rup_templates/Шаблон КТП Марса.xlsx", "_blank");
  f7.popover.close("#download-template-popover");
};

const openWord = () => {
  window.open("/rup_templates/Шаблон КТП Мрас.docx", "_blank");
  f7.popover.close("#download-template-popover");
};
</script>

<style>
.download-template-popover {
  max-height: 90vh;
  overflow-y: auto;
}
</style>
