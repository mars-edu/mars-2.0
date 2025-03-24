<template>
  <Card :theme="theme" title="Объявления">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h2 class="text-lg font-semibold" :class="textClass">Объявления</h2>
        <a href="#" class="text-sm font-medium text-red-500 hover:text-red-600">
          подробнее
        </a>
      </div>
    </template>

    <div class="space-y-4">
      <div
        v-for="(announcement, index) in announcements"
        :key="index"
        class="group p-4 rounded-lg transition-colors cursor-pointer"
        :class="announcementBoxClass"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center"
                :class="iconBoxClass"
              >
                <i class="text-red-500" :class="announcement.icon"></i>
              </div>
            </div>
            <div>
              <h3 class="text-sm font-medium" :class="textClass">
                {{ announcement.title }}
              </h3>
              <p class="text-sm" :class="mutedTextClass">
                {{ announcement.date }}
              </p>
            </div>
          </div>
          <i
            class="f7:chevron_right group-hover:text-gray-600"
            :class="chevronClass"
          ></i>
        </div>
        <p class="mt-2 text-sm" :class="descriptionClass">
          {{ announcement.description }}
        </p>
        <div class="mt-3 flex items-center space-x-2">
          <span
            v-if="announcement.category"
            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
            :class="getCategoryStyle(announcement.category)"
          >
            {{ announcement.category }}
          </span>
          <span class="text-xs" :class="mutedTextClass">
            {{ announcement.timeAgo }}
          </span>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import Card from "@/components/ui/Card.vue";

interface Props {
  theme?: "white" | "dark" | "lavanda";
}

const props = withDefaults(defineProps<Props>(), {
  theme: "white",
});

interface Announcement {
  title: string;
  description: string;
  date: string;
  timeAgo: string;
  category?: string;
  icon: string;
}

// Theme-based classes
const textClass = computed(() => {
  switch (props.theme) {
    case "dark":
      return "text-white";
    case "lavanda":
      return "text-purple-900";
    default:
      return "text-gray-900";
  }
});

const mutedTextClass = computed(() => {
  switch (props.theme) {
    case "dark":
      return "text-gray-400";
    case "lavanda":
      return "text-purple-600";
    default:
      return "text-gray-500";
  }
});

const descriptionClass = computed(() => {
  switch (props.theme) {
    case "dark":
      return "text-gray-300";
    case "lavanda":
      return "text-purple-800";
    default:
      return "text-gray-600";
  }
});

const announcementBoxClass = computed(() => {
  switch (props.theme) {
    case "dark":
      return "bg-gray-700 hover:bg-gray-600";
    case "lavanda":
      return "bg-purple-100 hover:bg-purple-200";
    default:
      return "bg-gray-50 hover:bg-gray-100";
  }
});

const iconBoxClass = computed(() => {
  switch (props.theme) {
    case "dark":
      return "bg-red-900/30";
    case "lavanda":
      return "bg-red-100";
    default:
      return "bg-red-100";
  }
});

const chevronClass = computed(() => {
  switch (props.theme) {
    case "dark":
      return "text-gray-500";
    case "lavanda":
      return "text-purple-400";
    default:
      return "text-gray-400";
  }
});

const announcements = ref<Announcement[]>([
  {
    title: "Технические работы",
    description: "Плановые технические работы в системе",
    date: "13 января 2025",
    timeAgo: "2 дня назад",
    category: "Система",
    icon: "f7:gear",
  },
]);

const getCategoryStyle = (category: string) => {
  if (props.theme === "dark") {
    const darkStyles = {
      Важное: "bg-red-900/30 text-red-300",
      Курсы: "bg-blue-900/30 text-blue-300",
      Система: "bg-gray-800 text-gray-300",
    };
    return (
      darkStyles[category as keyof typeof darkStyles] ||
      "bg-gray-800 text-gray-300"
    );
  } else if (props.theme === "lavanda") {
    const lavandaStyles = {
      Важное: "bg-red-200 text-red-800",
      Курсы: "bg-blue-200 text-blue-800",
      Система: "bg-purple-200 text-purple-800",
    };
    return (
      lavandaStyles[category as keyof typeof lavandaStyles] ||
      "bg-purple-200 text-purple-800"
    );
  } else {
    const styles = {
      Важное: "bg-red-100 text-red-800",
      Курсы: "bg-blue-100 text-blue-800",
      Система: "bg-gray-100 text-gray-800",
    };
    return (
      styles[category as keyof typeof styles] || "bg-gray-100 text-gray-800"
    );
  }
};
</script>
