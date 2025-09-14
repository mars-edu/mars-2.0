<template>
  <div
    class="text-xs p-2 rounded-md truncate border-l-2 transition-shadow duration-200 hover:shadow-md cursor-pointer calendar-event"
    :style="eventStyles"
    :class="{
      'ring-2': isSelected,
    }"
    @click="handleClick"
  >
    <div class="font-medium" :style="{ color: textColor }">
      {{ event.title }}
    </div>
    <div class="text-opacity-80" :style="{ color: textColor }">
      {{ event.time }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CalendarEvent } from "@/composables/useCalendar";
import { computed } from "vue";
import { useThemeStore } from "@/stores/themeStore";

const props = defineProps<{
  event: CalendarEvent;
  isSelected?: boolean;
}>();

const emit = defineEmits<{
  (e: "click", event: CalendarEvent, evt: MouseEvent): void;
}>();

const themeStore = useThemeStore();

const isDarkMode = computed(() => {
  return themeStore.currentTheme === "dark";
});

// Get the event color or fallback to CSS primary color
const eventColor = computed(() => {
  if (props.event.color) {
    return props.event.color;
  }
  // Fallback to CSS primary color
  return "hsl(var(--primary))";
});

const textColor = computed(() => {
  if (!props.event.color) {
    return "hsl(var(--foreground))"; // Default text color for primary theme
  }
  // When a custom color is used, it's applied with transparency over the
  // card background. So, in dark mode, the resulting background is dark,
  // and in light mode it's light.
  return isDarkMode.value ? "#FFFFFF" : "#000000";
});

const eventStyles = computed(() => {
  const baseColor = eventColor.value;

  const styles: { [key: string]: string } = {};

  if (!props.event.color) {
    // Use CSS variables for primary color theming
    styles.backgroundColor = "hsl(var(--primary) / 0.2)";
    styles.borderLeftColor = "hsl(var(--primary))";
    styles["--hover-bg"] = "hsl(var(--primary) / 0.3)";
  } else {
    // Use custom color with increased base opacity
    styles.backgroundColor = `${baseColor}4D`; // ~30% opacity
    styles.borderLeftColor = baseColor;
    styles["--hover-bg"] = `${baseColor}66`; // ~40% opacity on hover
  }

  // If selected, darken (increase opacity) for all occurrences of this event
  if (props.isSelected) {
    if (!props.event.color) {
      styles.backgroundColor = "hsl(var(--primary) / 0.45)"; // darker overlay
    } else {
      styles.backgroundColor = `${baseColor}99`; // ~60% opacity
      styles["--hover-bg"] = `${baseColor}B3`; // ~70% opacity on hover
    }
    styles["--tw-ring-color"] = baseColor;
  }

  return styles;
});

const handleClick = (evt: MouseEvent) => {
  emit("click", props.event, evt);
};
</script>

<style scoped>
.calendar-event:hover {
  background-color: var(--hover-bg);
}
</style>
