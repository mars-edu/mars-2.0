<template>
  <AsyncRouteWrapper :async-component="SpecialtyCatalog" />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import AsyncRouteWrapper from "@/components/AsyncRouteWrapper.vue";

const SpecialtyCatalog = defineAsyncComponent(
  () => import("../SpecialtyCatalog.vue")
);
</script>
