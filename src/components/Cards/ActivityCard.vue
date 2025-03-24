<template>
  <Card :theme="theme" title="Ваша активность">
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div :class="statBoxClasses">
          <div :class="statLabelClasses">Посещаемость</div>
          <div class="mt-1 flex items-baseline">
            <div :class="statValueClasses">94%</div>
            <div class="ml-2 text-sm text-green-500">+2.3%</div>
          </div>
        </div>
        <div :class="statBoxClasses">
          <div :class="statLabelClasses">Средний балл</div>
          <div class="mt-1 flex items-baseline">
            <div :class="statValueClasses">???</div>
            <div class="ml-2 text-sm text-green-500">+32</div>
          </div>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Card from "@/components/ui/Card.vue";

interface Props {
  theme?: "white" | "dark" | "lavanda";
}

const props = withDefaults(defineProps<Props>(), {
  theme: "white",
});

const statBoxClasses = computed(() => ({
  "bg-gray-50 rounded-lg p-4": props.theme === "white",
  "bg-gray-700 rounded-lg p-4": props.theme === "dark",
  "bg-purple-100 rounded-lg p-4": props.theme === "lavanda",
}));

const statLabelClasses = computed(() => ({
  "text-sm text-gray-500": props.theme === "white",
  "text-sm text-gray-300": props.theme === "dark",
  "text-sm text-purple-700": props.theme === "lavanda",
}));

const statValueClasses = computed(() => ({
  "text-2xl font-semibold text-gray-900": props.theme === "white",
  "text-2xl font-semibold text-white": props.theme === "dark",
  "text-2xl font-semibold text-purple-900": props.theme === "lavanda",
}));
</script>
