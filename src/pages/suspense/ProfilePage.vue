<template>
  <AsyncRouteWrapper :async-component="ProfileView" />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import AsyncRouteWrapper from "@/components/AsyncRouteWrapper.vue";

const ProfileView = defineAsyncComponent(() => import("../profile.vue"));
</script>
