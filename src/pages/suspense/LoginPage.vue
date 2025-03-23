<template>
  <AsyncRouteWrapper :async-component="LoginView" />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import AsyncRouteWrapper from "@/components/AsyncRouteWrapper.vue";

const LoginView = defineAsyncComponent(() => import("../login.vue"));
</script>
