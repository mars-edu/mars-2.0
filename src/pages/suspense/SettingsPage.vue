<template>
  <AsyncRouteWrapper :async-component="SettingsView" />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import AsyncRouteWrapper from "@/components/AsyncRouteWrapper.vue";

const SettingsView = defineAsyncComponent(() => import("../settings.vue"));
</script>
