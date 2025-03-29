<template>
  <Suspense>
    <template #default>
      <component :is="asyncComponent" v-bind="$attrs" />
    </template>

    <template #fallback>
      <f7-page>
        <div
          class="display-flex justify-content-center align-items-center"
          style="min-height: 200px"
        >
          <div v-if="isError" class="text-color-red text-align-center">
            <p>Произошла ошибка при загрузке компонента</p>
          </div>
          <Loader v-else />
        </div>
      </f7-page>
    </template>
  </Suspense>
</template>

<script setup lang="ts">
import { onErrorCaptured, onMounted, onUnmounted } from "vue";
import { ref } from "vue";
import { f7Page } from "framework7-vue";
import Loader from "./Loader.vue";

const isError = ref(false);

defineOptions({
  name: "AsyncRouteWrapper",
  inheritAttrs: false,
});

defineProps<{
  asyncComponent: (() => Promise<any>) | Object;
}>();

onMounted(() => {
  isError.value = false;
});

onUnmounted(() => {
  isError.value = false;
});

onErrorCaptured((error) => {
  console.error("Error loading async component:", error);
  isError.value = true;
  return false;
});
</script>
