<template>
  <div
    class="bg-card border border-border rounded-lg p-2 shadow-sm hover:shadow-md transition-all cursor-pointer group border-l-4 overflow-hidden"
    :style="eventStyles"
    :class="{
      'ring-2': isSelected,
    }"
    @click="handleClick"
  >
    <div class="text-[11px] font-bold text-foreground line-clamp-1 leading-tight mb-1" :style="{ color: textColor }">
      {{ event.title }}
    </div>
    <div class="flex items-center gap-2 text-[10px] text-muted-foreground">
      <div class="flex items-center gap-1" :style="{ color: textColor }">
        <IconClock class="w-2.5 h-2.5 shrink-0" />
        <span>{{ event.time }}</span>
      </div>
      <div
        v-if="event.group"
        class="flex items-center gap-1 truncate"
        :style="{ color: textColor }"
      >
        <span>{{ event.group }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CalendarEvent } from "@/composables/useCalendar";
import { computed } from "vue";
import IconClock from "~icons/lucide/clock";
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

  styles.borderLeftColor = baseColor;

  if (props.isSelected) {
    styles.boxShadow = `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`;
    styles.borderColor = baseColor;
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

.calendar-event-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}
</style>
