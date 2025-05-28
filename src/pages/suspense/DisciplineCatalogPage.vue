<template>
  <AsyncRouteWrapper :async-component="DisciplineCatalog" />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import AsyncRouteWrapper from "@/components/AsyncRouteWrapper.vue";

const DisciplineCatalog = defineAsyncComponent(
  () => import("../DisciplineCatalog.vue")
);
</script>
