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
          ? 'Сначала выберите специальность'
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
        <PopoverHeader title="Выбрать" :disabled="!isValid" />

        <div class="p-4 flex flex-col gap-4">
          <button
            class="w-full py-3 rounded-lg text-white bg-gray-500 hover:bg-primary"
            @click="addClass9"
          >
            На базе 9 класса
          </button>

          <button
            class="w-full py-3 rounded-lg text-white bg-gray-500 hover:bg-primary"
            @click="handleSubmit"
          >
            На базе 11 класса
          </button>
        </div>
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { f7, f7Popover } from "framework7-vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";

const props = defineProps<{
  opened: boolean;
  disabled?: boolean;
  specialtyId: string;
}>();

const emit = defineEmits<{
  (e: "update:opened", value: boolean): void;
  (e: "submit", data: { baseClass: number }): void;
  (e: "add-class-9"): void;
}>();

const isValid = computed(() => {
  return true;
});

const openWorkingPlanPopover = () => {
  f7.popover.open("#add-working-plan-popover", "#add-working-plan-button");
};

const addClass9 = () => {
  f7.popover.close("#add-working-plan-popover");
  emit("add-class-9");
};

const handleClose = () => {
  f7.popover.close("#add-working-plan-popover");
  emit("update:opened", false);
};

const handleSubmit = () => {
  f7.popover.close("#add-working-plan-popover");

  f7.dialog.alert(
    "Функциональность для создания рабочего учебного плана на базе 11 класса пока не реализована.",
    "В разработке"
  );
};
</script>

<style>
.working-plan-popover {
  max-height: 90vh;
  overflow-y: auto;
}
</style>
