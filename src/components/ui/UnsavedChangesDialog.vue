<template>
  <div
    v-if="opened"
    class="fixed inset-0 z-[20000] flex items-center justify-center bg-black/35 p-4"
    role="dialog"
    aria-modal="true"
    @click.self="handleCancel"
  >
    <div class="w-full max-w-[352px] rounded-[14px] border border-[#e7e7eb] bg-[#f2f2f4] p-[18px_16px_16px] text-center shadow-[0_14px_40px_rgba(0,0,0,0.18)]">
      <div
        class="mx-auto mb-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-[#f8dfe1] text-[#ef4444]"
        aria-hidden="true"
      >
        <f7-icon ios="f7:exclamationmark_triangle_fill" md="material:warning" size="20" />
      </div>

      <h3 class="m-0 text-[30px] font-bold leading-[1.2] text-[#1f2937] max-[480px]:text-2xl">
        {{ title }}
      </h3>
      <p class="my-2.5 mb-4 text-sm leading-[1.45] text-[#6b7280]">
        {{ message }}
      </p>

      <div class="flex gap-2.5">
        <button
          class="min-h-12 flex-1 rounded-lg border-0 bg-[#e5e7eb] px-2.5 py-3 text-base font-medium leading-[1.25] text-[#374151] max-[480px]:text-[15px]"
          type="button"
          @click="handleCancel"
        >
          {{ cancelText }}
        </button>
        <button
          class="min-h-12 w-[110px] rounded-lg border-0 bg-[#ef4444] px-2.5 py-3 text-base font-medium leading-[1.25] text-white max-[480px]:text-[15px]"
          type="button"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { f7Icon } from "framework7-vue";

withDefaults(
  defineProps<{
    opened: boolean;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
  }>(),
  {
    title: "Закрыть форму?",
    message: "Все несохраненные данные будут потеряны. Вы действительно хотите закрыть окно?",
    confirmText: "Закрыть",
    cancelText: "Продолжить редактирование",
  }
);

const emit = defineEmits<{
  (e: "confirm"): void;
  (e: "cancel"): void;
  (e: "update:opened", value: boolean): void;
}>();

const handleCancel = () => {
  emit("cancel");
  emit("update:opened", false);
};

const handleConfirm = () => {
  emit("confirm");
  emit("update:opened", false);
};
</script>
