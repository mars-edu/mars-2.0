<template>
  <div class="flex flex-col space-y-2">
    <div class="flex justify-start">
      <span class="text-sm text-gray-900">{{ label }}</span>
    </div>
    <div class="flex space-x-4 justify-end">
      <f7-input
        type="datepicker"
        placeholder="Дата"
        v-model:value="dateValue"
        readonly
        :calendar-params="{ closeOnSelect: true }"
        @input="emitChange"
      ></f7-input>
      <f7-input
        type="timepicker"
        placeholder="Время"
        v-model:value="timeValue"
        @input="emitChange"
      ></f7-input>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { f7Input } from "framework7-vue";

const props = defineProps<{
  label: string;
  initialDate: string;
  initialTime: string;
}>();

const emit = defineEmits<{
  (e: "update:date", value: string): void;
  (e: "update:time", value: string): void;
}>();

const dateValue = ref(props.initialDate);
const timeValue = ref(props.initialTime);

watch(
  () => props.initialDate,
  (newValue) => {
    dateValue.value = newValue;
  }
);

watch(
  () => props.initialTime,
  (newValue) => {
    timeValue.value = newValue;
  }
);

const emitChange = () => {
  emit("update:date", dateValue.value);
  emit("update:time", timeValue.value);
};
</script>

<style lang="scss">
.input-with-value {
  input {
    background-color: transparent !important;
  }
}
</style>
