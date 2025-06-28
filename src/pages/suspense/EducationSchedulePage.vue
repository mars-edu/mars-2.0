<template>
  <AsyncRouteWrapper :async-component="EducationSchedule" />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import AsyncRouteWrapper from "@/components/AsyncRouteWrapper.vue";

const EducationSchedule = defineAsyncComponent(
  () => import("../EducationSchedule.vue")
);
</script>
