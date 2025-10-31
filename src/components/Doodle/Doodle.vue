<template>
  <div
    class="bg-red-600 rounded-xl flex items-center justify-center relative overflow-hidden shadow-md"
    :class="[size === 'large' ? 'h-36' : 'h-28']"
  >
    <div class="w-full h-full">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: "large" | "small";
}

withDefaults(defineProps<Props>(), {
  size: "large",
});
</script>
