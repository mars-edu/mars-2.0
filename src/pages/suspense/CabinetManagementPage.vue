<template>
  <AsyncRouteWrapper :async-component="CabinetManagement" />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import AsyncRouteWrapper from "@/components/AsyncRouteWrapper.vue";

const CabinetManagement = defineAsyncComponent(
  () => import("../CabinetManagement.vue")
);
</script>
