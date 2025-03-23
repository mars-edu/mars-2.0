<template>
  <f7-page>
    <f7-navbar title="Not found" back-link="Back"></f7-navbar>
    <f7-block strong inset>
      <p>Sorry</p>
      <p>Requested content not found: {{ path }}</p>
    </f7-block>
  </f7-page>
</template>

<script setup lang="ts">
import { ref } from "vue";

const path = ref(window.location.pathname);
</script>
