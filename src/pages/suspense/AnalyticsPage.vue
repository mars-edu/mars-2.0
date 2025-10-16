<template>
  <AsyncRouteWrapper :async-component="AnalyticsView" />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import AsyncRouteWrapper from "@/components/AsyncRouteWrapper.vue";

const AnalyticsView = defineAsyncComponent(() => import("../analytics.vue"));
</script>
