<template>
  <div>
    <button
      id="add-working-plan-button"
      class="w-7 h-7 md:p-2 flex items-center justify-center text-white bg-green-500 hover:bg-green-600 rounded-full transition-colors"
      :class="{
        'opacity-50 cursor-not-allowed': disabled
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
        <!-- Header with buttons -->
        <div class="flex justify-between items-center px-4 py-3 border-b border-input">
          <button
            class="text-muted-foreground hover:text-foreground"
            @click="handleClose"
          >
            Отменить
          </button>
          <span class="text-foreground font-semibold">Создать план</span>
          <button
            class="text-primary hover:text-primary/80 disabled:text-muted-foreground"
            :disabled="!isValid"
            @click="handleSubmit"
          >
            Создать
          </button>
        </div>

        <div class="p-4 flex flex-col gap-4">
          <button
            class="w-full py-3 rounded-lg text-white"
            :class="baseClass === 9 ? 'bg-primary hover:bg-primary hover:opacity-80' : 'bg-gray-500 hover:bg-gray-600'"
            @click="baseClass = 9; openClass9Popup()"
          >
            На базе 9 класса
          </button>

          <button
            class="w-full py-3 rounded-lg text-white"
            :class="baseClass === 11 ? 'bg-primary hover:bg-primary hover:opacity-80' : 'bg-gray-500 hover:bg-gray-600'"
            @click="baseClass = 11"
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
import { ref, computed } from 'vue';
import {
  f7,
  f7Popover,
} from 'framework7-vue';
import Class9Popup from './Class9Popup.vue';

const props = defineProps<{
  opened: boolean,
  disabled?: boolean,
  specialtyId: string,
  courseId: string
}>();

const emit = defineEmits<{
  (e: 'update:opened', value: boolean): void
  (e: 'submit', data: { baseClass: number }): void
}>();

const baseClass = ref<9 | 11 | null>(null);

const isValid = computed(() => {
  return baseClass.value !== null;
});

const openWorkingPlanPopover = () => {
  f7.popover.open('#add-working-plan-popover', '#add-working-plan-button');
};

const handleClose = () => {
  f7.popover.close('#add-working-plan-popover');
  emit('update:opened', false);
  baseClass.value = null;
};

const handleSubmit = () => {
  if (isValid.value && baseClass.value) {
    emit('submit', { baseClass: baseClass.value });
    handleClose();
  }
};

const openClass9Popup = () => {
  f7.popover.close('#add-working-plan-popover');
  setTimeout(() => {
    f7.popover.open('#class9-popover');
  }, 100);
};

const closeClass9Popup = () => {
  f7.popover.close('#class9-popover');
};

const handleClass9Submit = () => {
  // Handle form submission here
  closeClass9Popup();
};
</script>

<style>
.working-plan-popover {
  max-height: 90vh;
  overflow-y: auto;
}
</style> 