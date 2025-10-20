<template>
  <f7-page name="profile">
    <f7-navbar title="Profile" back-link="Back"></f7-navbar>
    <f7-block>
      <p>Profile page content goes here</p>
    </f7-block>
  </f7-page>
</template>

<script setup lang="ts">
import { onMounted } from "vue";

console.log("[ProfilePage] Component setup initiated");

onMounted(() => {
  console.log("[ProfilePage] Component mounted");
});
</script>

<style scoped></style>
