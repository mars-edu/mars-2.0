<template>
  <div class="date-input-container w-full" data-popover-ignore="true">
    <VueDatePicker
      v-model="modelDate"
      :time-config="{ enableTimePicker: enableTime }"
      :formats="{ input: enableTime ? 'dd.MM.yyyy, HH:mm' : 'dd.MM.yyyy' }"
      :input-attrs="{ clearable: true, alwaysClearable: true }"
      :locale="ruLocale"
      hide-offset-dates
      :teleport="true"
      :placeholder="placeholder || (enableTime ? 'дд.мм.гггг, чч:мм' : 'дд.мм.гггг')"
      auto-apply
      :disabled="disabled"
      :dark="isDark"
      @menu-mounted="onMenuMounted"
      @update:model-value="onDateChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";
import { VueDatePicker } from "@vuepic/vue-datepicker";
import "@/css/vue-datepicker.css";
import { ru as ruLocale } from "date-fns/locale";

const props = withDefaults(
  defineProps<{
    value?: Date[] | Date | null;
    placeholder?: string;
    enableTime?: boolean;
    disabled?: boolean;
  }>(),
  {
    value: () => [],
    placeholder: "дд.мм.гггг",
    enableTime: false,
    disabled: false,
  }
);

const emit = defineEmits<{
  "update:value": [val: Date[]];
  "change": [val: Date[]];
}>();

// Dark mode state
const isDark = ref(typeof document !== "undefined" && document.documentElement.classList.contains("dark"));
let observer: MutationObserver | null = null;

onMounted(() => {
  if (typeof document !== "undefined") {
    observer = new MutationObserver(() => {
      isDark.value = document.documentElement.classList.contains("dark");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  }
});

onUnmounted(() => {
  observer?.disconnect();
});

// Convert incoming props.value (Date[] or Date) to internal Date model
const modelDate = ref<Date | null>(parseIncoming(props.value));

watch(
  () => props.value,
  (newVal) => {
    modelDate.value = parseIncoming(newVal);
  },
  { deep: true }
);

function parseIncoming(val: Date[] | Date | null | undefined): Date | null {
  if (!val) return null;
  if (Array.isArray(val)) {
    return val.length > 0 && val[0] instanceof Date ? val[0] : null;
  }
  if (val instanceof Date) return val;
  return null;
}

function onMenuMounted(el: HTMLElement) {
  if (el) {
    el.setAttribute("data-popover-ignore", "true");
    if (el.parentElement) {
      el.parentElement.setAttribute("data-popover-ignore", "true");
    }
  }
}

function onDateChange(selected: Date | null) {
  const result = selected ? [selected] : [];
  emit("update:value", result);
  emit("change", result);
}
</script>
