<template>
  <div>
    <button
      id="import-working-plan-button"
      class="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors shadow-sm"
      :class="{
        'opacity-50 cursor-not-allowed border-border bg-muted text-muted-foreground':
          disabled,
      }"
      @click.stop="handleImport"
      :disabled="disabled"
      :title="
        disabled
          ? 'Сначала выберите специальность'
          : 'Импортировать рабочий учебный план'
      "
    >
      <f7-icon
        ios="f7:arrow_down_doc"
        md="material:file_upload"
        size="17px"
        class="text-current"
      ></f7-icon>
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  disabled?: boolean;
  specialtyId?: string;
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
