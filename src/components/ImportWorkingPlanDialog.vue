<template>
  <div>
    <button
      id="import-working-plan-button"
      class="w-7 h-7 md:p-2 flex items-center justify-center text-white bg-blue-500 hover:bg-blue-600 rounded-full transition-colors"
      :class="{
        'opacity-50 cursor-not-allowed': disabled,
      }"
      @click.stop="handleImport"
      :disabled="disabled"
      :title="
        disabled
          ? 'Сначала выберите специальность и курс'
          : 'Импортировать рабочий учебный план'
      "
    >
      <f7-icon
        ios="f7:arrow_down_doc"
        md="material:file_upload"
        size="16px"
        class="text-white"
      ></f7-icon>
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  disabled?: boolean;
  specialtyId?: string;
  courseId?: string;
}>();

const emit = defineEmits<{
  (e: "enable-select-mode"): void;
}>();

const handleImport = () => {
  emit("enable-select-mode");
};
</script>

<style>
.working-plan-popover {
  max-height: 90vh;
  overflow-y: auto;
}
</style> 