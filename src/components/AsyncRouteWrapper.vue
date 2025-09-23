<template>
  <Suspense @pending="handlePending">
    <template #default>
      <component :is="asyncComponent" v-bind="$attrs" />
    </template>

    <template #fallback>
      <PageSkeleton v-if="!isError" />
      <f7-page v-else>
        <div
          class="display-flex justify-content-center align-items-center"
          style="min-height: 200px"
        >
          <ErrorDisplay :message="errorMessage" />
        </div>
      </f7-page>
    </template>
  </Suspense>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from "vue";
import { f7Page } from "framework7-vue";
import PageSkeleton from "./PageSkeleton.vue";
import ErrorDisplay from "./ErrorDisplay.vue";

const isError = ref(false);
const errorMessage = ref("Произошла ошибка при загрузке компонента");

defineOptions({
  name: "AsyncRouteWrapper",
  inheritAttrs: false,
});

defineProps<{
  asyncComponent: (() => Promise<any>) | Object;
}>();

const handlePending = () => {
  isError.value = false;
};

onErrorCaptured((error, instance, info) => {
  isError.value = true;
  return true;
});
</script>

<style scoped>
.error-container {
  width: 100%;
  max-width: 320px;
}
</style>
