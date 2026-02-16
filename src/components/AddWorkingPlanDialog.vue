<template>
  <button
    class="w-7 h-7 md:p-2 flex items-center justify-center text-white bg-primary hover:bg-primary/90 rounded-full transition-colors"
    :class="{
      'opacity-50 cursor-not-allowed': disabled,
    }"
    @click.stop="handleAdd"
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
</template>

<script setup lang="ts">
import { f7Icon } from "framework7-vue";

defineProps<{
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: "add"): void;
}>();

const handleAdd = () => {
  emit("add");
};
</script>
