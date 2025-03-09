<template>
  <f7-app v-bind="f7params">
    <!-- Views container -->
    <f7-view main url="/" class="safe-areas"></f7-view>
  </f7-app>
</template>
<script setup>
import { ref, onMounted } from "vue";
import { f7, f7ready } from "framework7-vue";

import routes from "../js/routes.js";
import store from "../js/store";

// Framework7 Parameters
const f7params = {
  name: "Mars", // App name
  theme: "ios", // Automatic theme detection
  // App store
  store: store,
  // App routes
  routes: routes,
};

onMounted(() => {
  f7ready(() => {});
});
</script>
