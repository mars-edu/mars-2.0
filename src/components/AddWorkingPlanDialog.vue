<template>
  <div>
    <button
      id="add-working-plan-button"
      class="w-7 h-7 md:p-2 flex items-center justify-center text-white bg-green-500 hover:bg-green-600 rounded-full transition-colors"
      :class="{
        'opacity-50 cursor-not-allowed': disabled,
      }"
      @click.stop="openWorkingPlanPopover"
      :disabled="disabled"
      :title="
        disabled
          ? 'Сначала выберите специальность и курс'
          : 'Создать рабочий учебный план'
      "
    >
      <f7-icon
        ios="f7:plus"
        md="material:add"
        size="16px"
        class="text-white"
      ></f7-icon>
    </button>

    <f7-popover
      id="add-working-plan-popover"
      style="width: 400px !important"
      target="#add-working-plan-button"
      close-on-escape
    >
      <div class="working-plan-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Выбрать"
          :disabled="!isValid"
        />

        <div class="p-4 flex flex-col gap-4">

          <AddWorkingPlanDialogNew
      :disabled="disabled"
      :specialty-id="specialtyId"
      :course-id="courseId"
      @opened="closeAddWorkingPlanDialogNew"
    />

          <button
            class="w-full py-3 rounded-lg text-white bg-gray-500 hover:bg-primary"
            @click="handleSubmit"
          >
            На базе 11 класса
          </button>
        </div>
      </div>
    </f7-popover>


    <Class9Popup
      target="#add-working-plan-button"
      :specialty-id="specialtyId"
      :course-id="courseId"
      @submit="handleClass9Submit"
      @close="closeClass9Popup"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { f7, f7Popover } from "framework7-vue";
import Class9Popup from "./Class9Popup.vue";
import AddWorkingPlanDialogNew from "./AddWorkingPlanDialogNew.vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";

const props = defineProps<{
  opened: boolean;
  disabled?: boolean;
  specialtyId: string;
  courseId: string;
}>();

const emit = defineEmits<{
  (e: "update:opened", value: boolean): void;
  (e: "submit", data: { baseClass: number }): void;
}>();

const isValid = computed(() => {
  return true;
});

const openWorkingPlanPopover = () => {
  f7.popover.open("#add-working-plan-popover", "#add-working-plan-button");
};

const handleClose = () => {
  f7.popover.close("#add-working-plan-popover");
  emit("update:opened", false);
};

const handleSubmit = () => {
  emit("submit", { baseClass: 11 });
  handleClose();
};

const closeAddWorkingPlanDialogNew = () => {
  f7.popover.close("#add-working-plan-popover");
};

const closeClass9Popup = () => {
  
};

const handleClass9Submit = () => {
  closeClass9Popup();
};
</script>

<style>
.working-plan-popover {
  max-height: 90vh;
  overflow-y: auto;
}
</style>
