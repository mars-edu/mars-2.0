<template>
  <div
    class="date-input-wrapper flex items-center w-full bg-muted rounded-xl text-sm border border-transparent hover:bg-muted/80 transition-all cursor-pointer"
    :class="{ 'ring-2 ring-foreground/80 bg-card': focused }"
  >
    <input
      ref="inputRef"
      type="date"
      :value="nativeValue"
      :placeholder="placeholder"
      @input="onInput"
      @focus="focused = true"
      @blur="focused = false"
      class="w-full h-full bg-transparent text-foreground text-sm px-4 py-2.5 outline-none border-none rounded-xl cursor-pointer"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import dayjs from "dayjs";

const props = withDefaults(
  defineProps<{
    value?: Date[];
    placeholder?: string;
  }>(),
  {
    value: () => [],
    placeholder: "дд.мм.гггг",
  }
);

const emit = defineEmits<{
  "update:value": [val: Date[]];
}>();

const focused = ref(false);

const nativeValue = computed(() => {
  if (!props.value || props.value.length === 0) return "";
  return dayjs(props.value[0]).format("YYYY-MM-DD");
});

function onInput(event: Event) {
  const str = (event.target as HTMLInputElement).value;
  if (!str) {
    emit("update:value", []);
    return;
  }
  emit("update:value", [dayjs(str).toDate()]);
}
</script>

<style scoped>
.date-input-wrapper {
  min-height: 44px;
}

input[type="date"] {
  -webkit-appearance: none;
  appearance: none;
}

input[type="date"]::-webkit-calendar-picker-indicator {
  @apply opacity-50;
  cursor: pointer;
}

input[type="date"]::-webkit-datetime-edit-fields-wrapper {
  @apply text-foreground;
}

input[type="date"]:invalid::-webkit-datetime-edit,
input[type="date"][value=""]::-webkit-datetime-edit {
  @apply text-muted-foreground;
}
</style>
