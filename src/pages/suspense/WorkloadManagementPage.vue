<template>
  <AsyncRouteWrapper :async-component="WorkloadManagement" />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import AsyncRouteWrapper from "@/components/AsyncRouteWrapper.vue";

const WorkloadManagement = defineAsyncComponent(() => import("../WorkloadManagement.vue"));
</script>
