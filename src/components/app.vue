<template>
  <f7-app v-bind="f7params">
    <f7-view main class="safe-areas"></f7-view>
    <!-- loadInitialPage="false"
      preloadPreviousPage="false"
      browserHistory
      reloadPages="true"
      browserHistoryInitialMatch -->
  </f7-app>
</template>
<script setup>
import { ref, onMounted } from "vue";
import { f7, f7ready } from "framework7-vue";

import routes from "../js/routes.js";
import store from "../js/store";

const f7params = {
  name: "Mars",
  theme: "ios",
  store: store,
  routes: routes,
};

onMounted(() => {
  f7ready(() => {});
});
</script>
