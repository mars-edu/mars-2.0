<template>
  <AsyncRouteWrapper :async-component="StudentCard" />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import AsyncRouteWrapper from "@/components/AsyncRouteWrapper.vue";

const StudentCard = defineAsyncComponent(() => import("../StudentCard.vue"));
</script>
