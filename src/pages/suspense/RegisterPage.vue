<template>
  <AsyncRouteWrapper :async-component="RegisterView" />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import AsyncRouteWrapper from "@/components/AsyncRouteWrapper.vue";

const RegisterView = defineAsyncComponent(() => import("../register.vue"));
</script>
