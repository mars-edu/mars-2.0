<template>
  <AsyncRouteWrapper :async-component="RestorePasswordView" />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import AsyncRouteWrapper from "@/components/AsyncRouteWrapper.vue";

const RestorePasswordView = defineAsyncComponent(
  () => import("../restore-password.vue")
);
</script>
