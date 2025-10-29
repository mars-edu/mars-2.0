<template>
  <AsyncRouteWrapper :async-component="ReportsView" />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import AsyncRouteWrapper from "@/components/AsyncRouteWrapper.vue";

const ReportsView = defineAsyncComponent(() => import("../reports.vue"));
</script>
