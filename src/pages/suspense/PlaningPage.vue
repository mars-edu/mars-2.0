<template>
  <AsyncRouteWrapper :async-component="PlaningView" />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import AsyncRouteWrapper from "@/components/AsyncRouteWrapper.vue";

const PlaningView = defineAsyncComponent(() => import("../planing.vue"));
</script>
