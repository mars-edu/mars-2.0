<template>
  <AsyncRouteWrapper :async-component="PlanningView" />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import AsyncRouteWrapper from "@/components/AsyncRouteWrapper.vue";

const PlanningView = defineAsyncComponent(() => import("../planning.vue"));
</script>
