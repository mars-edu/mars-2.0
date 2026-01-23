<template>
  <AsyncRouteWrapper :async-component="ProtocolView" />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import AsyncRouteWrapper from "@/components/AsyncRouteWrapper.vue";

const ProtocolView = defineAsyncComponent(() => import("../protocol.vue"));
</script>
