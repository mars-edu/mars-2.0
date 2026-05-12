<template>
  <div class="mb-8" :key="locale">
    <h1 class="text-3xl font-bold text-foreground tracking-tight">
      {{ greeting }}, {{ fullName }}!
    </h1>
    <p class="text-muted-foreground text-sm font-medium mt-1">
      {{ formattedDate }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useUserStore } from "@/stores/userStore";
import { useI18n } from "@/composables/useI18n";
import { getUserFullName, getGreeting, formatWelcomeDate } from "@/utils/homeUtils";

const userStore = useUserStore();
const { locale } = useI18n();

const now = ref(new Date());
let timer: ReturnType<typeof setInterval>;

onMounted(() => {
  // Update every minute so greeting and date stay current
  timer = setInterval(() => {
    now.value = new Date();
  }, 60_000);
});

onUnmounted(() => clearInterval(timer));

const fullName = computed(() => getUserFullName(userStore.currentUser, locale.value));
const greeting = computed(() => getGreeting(now.value, locale.value));
const formattedDate = computed(() => formatWelcomeDate(now.value, locale.value));
</script>
