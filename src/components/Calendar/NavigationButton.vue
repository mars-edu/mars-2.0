<template>
  <button
    class="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center"
    @click="$emit('click')"
  >
    <i class="f7-icons text-gray-500 text-lg flex items-center justify-center">
      {{ icon }}
    </i>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  icon: string;
}>();

defineEmits<{
  (e: "click"): void;
}>();
</script>
