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
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useUserStore } from "@/stores/userStore";

const userStore = useUserStore();

const now = ref(new Date());
let timer: ReturnType<typeof setInterval>;

onMounted(() => {
  // Update every minute so greeting and date stay current
  timer = setInterval(() => { now.value = new Date(); }, 60_000);
});
onUnmounted(() => clearInterval(timer));

const firstName = computed(() => userStore.currentUser?.firstName || "Пользователь");

const greeting = computed(() => {
  const hour = now.value.getHours();
  if (hour < 12) return "Доброе утро";
  if (hour < 17) return "Добрый день";
  return "Добрый вечер";
});

const formattedDate = computed(() =>
  now.value.toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
);
</script>
