<template>
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-foreground tracking-tight">
      {{ greeting }}, {{ firstName }}!
    </h1>
    <p class="text-muted-foreground text-sm font-medium mt-1">
      {{ formattedDate }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useUserStore } from "@/stores/userStore";

const userStore = useUserStore();

const firstName = computed(() => {
  const name = userStore.currentUser?.firstName;
  return name || "Пользователь";
});

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return "Доброе утро";
  if (hour < 17) return "Добрый день";
  return "Добрый вечер";
});

const formattedDate = computed(() => {
  return new Date().toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
});
</script>
