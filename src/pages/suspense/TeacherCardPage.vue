<template>
  <AsyncRouteWrapper :async-component="TeacherCard" />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import AsyncRouteWrapper from "@/components/AsyncRouteWrapper.vue";

const TeacherCard = defineAsyncComponent(() => import("../TeacherCard.vue"));
</script>
