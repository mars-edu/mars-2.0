<template>
  <AsyncRouteWrapper :async-component="Journals" />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import AsyncRouteWrapper from "@/components/AsyncRouteWrapper.vue";

const Journals = defineAsyncComponent(() => import("../journals.vue"));
</script>
