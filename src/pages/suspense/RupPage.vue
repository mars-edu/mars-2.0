<template>
  <AsyncRouteWrapper :async-component="pageView" />
</template>

<script setup lang="ts">
import { defineAsyncComponent, computed } from "vue";
import AsyncRouteWrapper from "@/components/AsyncRouteWrapper.vue";
import { useUserStore } from "@/stores/userStore";

const userStore = useUserStore();

const pageView = computed(() => {
  if (userStore.isTeacher) {
    return defineAsyncComponent(() => import("../KtpPage.vue"));
  }
  return defineAsyncComponent(() => import("../rup.vue"));
});
</script>
