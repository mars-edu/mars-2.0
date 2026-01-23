<template>
  <AsyncRouteWrapper :async-component="NotificationsView" />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import AsyncRouteWrapper from "@/components/AsyncRouteWrapper.vue";

const NotificationsView = defineAsyncComponent(() => import("../notifications.vue"));
</script>
