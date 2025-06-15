<template>
  <AsyncRouteWrapper :async-component="JournalDetails" />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import AsyncRouteWrapper from "@/components/AsyncRouteWrapper.vue";

const JournalDetails = defineAsyncComponent(
  () => import("../JournalDetails.vue")
);
</script> 