<template>
  <button class="flex items-center gap-6 w-fit" @click="navigateToHome">
    <div
      class="w-12 h-12 rounded-full bg-[#e53935] flex items-center justify-center text-white font-bold text-2xl shadow-md shadow-[rgba(229,57,53,0.3)]"
    >
      <span>M</span>
    </div>
    <span class="text-2xl font-bold text-[#333] tracking-[-0.5px]">Mars</span>
  </button>
</template>

<script setup lang="ts">
const navigateToHome = () => {
  window.location.href = "/";
};
</script>
