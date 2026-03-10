<template>
  <button
    class="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-white bg-emerald-500 hover:bg-emerald-600 rounded-full transition-colors shadow-sm"
    :class="{
      'opacity-50 cursor-not-allowed bg-muted text-muted-foreground': disabled,
    }"
    @click.stop="handleAdd"
    :disabled="disabled"
    :title="
      disabled
        ? 'Сначала выберите специальность'
        : 'Создать рабочий учебный план'
    "
  >
    <IconPlus class="w-4 h-4 text-white" />
  </button>
</template>

<script setup lang="ts">
import IconPlus from "~icons/lucide/plus";

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
