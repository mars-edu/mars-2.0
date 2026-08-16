<template>
  <div :key="reloadKey">
    <Suspense @pending="onPending" @resolve="onResolve">
      <template #default>
        <component :is="asyncComponent" v-bind="$attrs" />
      </template>

      <template #fallback>
        <f7-page>
          <div
            class="display-flex justify-content-center align-items-center"
            style="min-height: 100vh"
          >
            <f7-preloader v-if="!isError" />
            <ErrorDisplay 
              v-else 
              :message="errorMessage" 
              :on-retry="retry"
            />
          </div>
        </f7-page>
      </template>
    </Suspense>
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, onUnmounted } from "vue";
import { f7Page, f7Preloader, f7 } from "framework7-vue";
import ErrorDisplay from "./ErrorDisplay.vue";

const isError = ref(false);
const errorMessage = ref("Произошла ошибка при загрузке компонента");
const isLoading = ref(false);
const reloadKey = ref(0);

defineOptions({
  name: "AsyncRouteWrapper",
  inheritAttrs: false,
});

defineProps<{
  asyncComponent: (() => Promise<any>) | Object;
}>();

function onPending() {
  isLoading.value = true;
  f7.preloader.show();
}

function onResolve() {
  if (isLoading.value) {
    isLoading.value = false;
    f7.preloader.hide();
  }
}

function retry() {
  isError.value = false;
  reloadKey.value++;
}

onUnmounted(() => {
  if (isLoading.value) {
    f7.preloader.hide();
  }
});

onErrorCaptured((error: any) => {
  console.error('[AsyncRouteWrapper] Error loading component:', error);
  const errorMsg = error?.message || String(error);
  if (
    errorMsg.includes("Failed to fetch dynamically imported module") ||
    errorMsg.includes("Unable to preload CSS") ||
    errorMsg.includes("Importing a module script failed") ||
    errorMsg.includes("dynamically imported")
  ) {
    console.warn("[AsyncRouteWrapper] Stale asset chunk detected from previous deployment, refreshing page...");
    window.location.reload();
    return false;
  }
  isError.value = true;
  if (isLoading.value) {
    isLoading.value = false;
    f7.preloader.hide();
  }
  return true;
});
</script>

<style scoped>
.error-container {
  width: 100%;
  max-width: 320px;
}
</style>
