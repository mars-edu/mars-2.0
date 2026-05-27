<template>
  <AsyncRouteWrapper :async-component="Testing" />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import AsyncRouteWrapper from "@/components/AsyncRouteWrapper.vue";

const Testing = defineAsyncComponent(
  () => import("../TestingPage.vue")
);
</script>
