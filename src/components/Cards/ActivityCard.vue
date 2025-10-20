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
import { computed, onMounted } from "vue";
import Card from "@/components/ui/Card.vue";

console.log("[ActivityCard] Component setup initiated");

interface Props {
  theme?: "white" | "dark" | "lavanda";
}

const props = withDefaults(defineProps<Props>(), {
  theme: "white",
});

console.log("[ActivityCard] Props received:", { theme: props.theme });

const statBoxClasses = computed(() => {
  const classes = {
    "bg-gray-50 rounded-lg p-4": props.theme === "white",
    "bg-gray-700 rounded-lg p-4": props.theme === "dark",
    "bg-purple-100 rounded-lg p-4": props.theme === "lavanda",
  };
  console.log("[ActivityCard] Computed stat box classes:", classes);
  return classes;
});

const statLabelClasses = computed(() => {
  const classes = {
    "text-sm text-gray-500": props.theme === "white",
    "text-sm text-gray-300": props.theme === "dark",
    "text-sm text-purple-700": props.theme === "lavanda",
  };
  console.log("[ActivityCard] Computed stat label classes:", classes);
  return classes;
});

const statValueClasses = computed(() => {
  const classes = {
    "text-2xl font-semibold text-gray-900": props.theme === "white",
    "text-2xl font-semibold text-white": props.theme === "dark",
    "text-2xl font-semibold text-purple-900": props.theme === "lavanda",
  };
  console.log("[ActivityCard] Computed stat value classes:", classes);
  return classes;
});

onMounted(() => {
  console.log("[ActivityCard] Component mounted");
  console.log("[ActivityCard] Final computed classes:", {
    statBox: statBoxClasses.value,
    statLabel: statLabelClasses.value,
    statValue: statValueClasses.value,
  });
});
</script>
