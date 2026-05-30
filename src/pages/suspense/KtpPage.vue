<template>
  <AsyncRouteWrapper :async-component="KtpView" />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import AsyncRouteWrapper from "@/components/AsyncRouteWrapper.vue";

const KtpView = defineAsyncComponent(() => import("../KtpPage.vue"));
</script>
