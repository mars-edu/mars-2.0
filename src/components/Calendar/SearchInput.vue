<template>
  <div
    class="flex items-center bg-white border border-gray-200 rounded-full pl-3 pr-1 py-3 shadow-sm"
  >
    <i
      class="f7-icons text-gray-500 text-lg mr-2 flex items-center justify-center"
      >search</i
    >
    <input
      type="text"
      :placeholder="placeholder"
      class="bg-transparent outline-none text-sm w-52 placeholder-gray-400 text-gray-700"
      v-model="searchQuery"
      @input="emitSearch"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  placeholder: string;
}>();

const emit = defineEmits<{
  (e: "search", query: string): void;
}>();

const searchQuery = ref("");

const emitSearch = () => {
  emit("search", searchQuery.value);
};
</script>
