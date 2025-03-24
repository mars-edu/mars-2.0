<!-- Navigation Demo Component -->
<template>
  <div class="navigation-demo mt-4 p-4 bg-white shadow rounded-lg">
    <div class="text-lg font-medium mb-2">Custom Navigation Demo</div>
    <p class="text-sm text-gray-600 mb-4">
      This component demonstrates custom browser navigation handling. The
      browser's back/forward buttons have been overridden with custom behavior.
    </p>

    <div class="flex space-x-4 mt-4">
      <f7-button fill @click="goToPage('/planning/')"> Planning </f7-button>
      <f7-button fill @click="goToPage('/schedule/')"> Schedule </f7-button>
      <f7-button fill @click="goToPage('/settings/')"> Settings </f7-button>
      <f7-button fill @click="goBack"> Go Back </f7-button>
    </div>

    <div class="mt-4 p-4 bg-gray-100 rounded-lg text-sm">
      <div><strong>Current URL:</strong> {{ currentUrl }}</div>
      <div><strong>Navigation Stack Size:</strong> {{ historyStackSize }}</div>
      <div><strong>Position:</strong> {{ currentPosition }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { f7, f7ready } from "framework7-vue";
import { setupCustomNavigation } from "../js/navigation";

// Navigation state tracking
const currentUrl = ref(window.location.href);
const historyStackSize = ref(1);
const currentPosition = ref(0);
const navigation = ref(setupCustomNavigation());

// Initialize navigation handler on mount
onMounted(() => {
  f7ready(() => {
    // We'll use our own instance for this demo
    // The app.vue already has a global instance
    navigation.value.initialize();

    // Set initial values
    currentUrl.value = window.location.href;
    currentPosition.value = window.history.state?.position || 0;

    // Update the demo display periodically
    setInterval(() => {
      currentUrl.value = window.location.href;
      currentPosition.value = window.history.state?.position || 0;
    }, 500);
  });
});

// Navigation methods
const goToPage = (url: string) => {
  navigation.value.navigateTo(url);
  historyStackSize.value++;
};

const goBack = () => {
  navigation.value.goBack();
  if (historyStackSize.value > 1) {
    historyStackSize.value--;
  }
};
</script>

<style scoped>
.navigation-demo {
  max-width: 800px;
  margin: 0 auto;
}
</style>
