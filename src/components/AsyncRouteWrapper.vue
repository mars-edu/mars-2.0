<template>
  <Suspense @pending="onPending" @resolve="onResolve">
    <template #default>
      <component :is="asyncComponent" v-bind="$attrs" />
    </template>

    <template #fallback>
      <f7-page>
        <div
          class="display-flex justify-content-center align-items-center"
          style="min-height: 200px"
        >
          <f7-preloader v-if="!isError" />
          <ErrorDisplay v-else :message="errorMessage" />
        </div>
      </f7-page>
    </template>
  </Suspense>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, onUnmounted } from "vue";
import { f7Page, f7Preloader, f7 } from "framework7-vue";
import ErrorDisplay from "./ErrorDisplay.vue";

const isError = ref(false);
const errorMessage = ref("Произошла ошибка при загрузке компонента");
const isLoading = ref(false);

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

onUnmounted(() => {
  if (isLoading.value) {
    f7.preloader.hide();
  }
});

onErrorCaptured((error, instance, info) => {
  console.error('[AsyncRouteWrapper] Error loading component:', error);
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
