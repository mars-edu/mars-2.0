<template>
  <div class="nauryz-content">
    <div class="nauryz-text">
      <div class="nauryz-title">С днем солиста<br />поздравляем!</div>
      <div class="nauryz-date">6 июля</div>
    </div>
    <div
      class="nauryz-background"
      style="background-image: url('/images/nauryz-illustration.svg')"
    ></div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.nauryz-content {
  @apply flex items-center justify-end w-full h-full;
}

.nauryz-text {
  @apply text-right pr-4;
}

.nauryz-background {
  @apply h-full w-2/5 bg-contain bg-no-repeat bg-right relative transition-transform duration-300 ease-in-out;
}

.nauryz-background:hover {
  transform: scale(1.01);
}

.nauryz-title {
  @apply text-white text-base font-bold mb-0.5;
}

.nauryz-date {
  @apply text-white/80 text-xs;
}
</style>
