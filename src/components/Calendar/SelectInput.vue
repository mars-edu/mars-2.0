<template>
  <div class="border-b pb-2">
    <f7-input
      type="select"
      :placeholder="placeholder"
      v-model:value="selectedValue"
      @input="emitChange"
    >
      <option value="">{{ emptyOptionText }}</option>
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option }}
      </option>
    </f7-input>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { f7Input } from "framework7-vue";

const props = defineProps<{
  placeholder?: string;
  emptyOptionText?: string;
  options: Array<{ value: string; text: string }>;
  modelValue?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const selectedValue = ref(props.modelValue || "");

watch(
  () => props.modelValue,
  (newValue) => {
    selectedValue.value = newValue || "";
  }
);

const emitChange = () => {
  emit("update:modelValue", selectedValue.value);
};
</script>
