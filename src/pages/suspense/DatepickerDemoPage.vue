<template>
  <AsyncRouteWrapper :async-component="DatepickerDemoView" />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import AsyncRouteWrapper from "@/components/AsyncRouteWrapper.vue";

const DatepickerDemoView = defineAsyncComponent(() => import("../datepicker-demo.vue"));
</script>
