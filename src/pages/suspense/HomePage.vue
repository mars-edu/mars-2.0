<template>
  <AsyncRouteWrapper :async-component="HomeView" />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import AsyncRouteWrapper from "@/components/AsyncRouteWrapper.vue";

const HomeView = defineAsyncComponent(() => import("../home.vue"));
</script>
