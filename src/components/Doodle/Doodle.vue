<template>
  <div
    class="bg-red-600 rounded-xl flex items-center justify-center relative overflow-hidden shadow-md"
    :class="[size === 'large' ? 'h-36' : 'h-28']"
  >
    <div class="text-5xl font-bold text-white tracking-tight">{{ title }}</div>
    <div class="absolute right-0 h-full w-2/5">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  size?: "large" | "small";
}

withDefaults(defineProps<Props>(), {
  size: "large",
});
</script>
