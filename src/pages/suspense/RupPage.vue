<template>
  <AsyncRouteWrapper :async-component="RupView" />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import AsyncRouteWrapper from "@/components/AsyncRouteWrapper.vue";

const RupView = defineAsyncComponent(() => import("../rup.vue"));
</script>
