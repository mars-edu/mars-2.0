<template>
  <div class="nauryz-content">
    <div class="nauryz-text">
      <div class="nauryz-quote">„Образование — это то, что остаётся после того, как забывается всё выученное в школе."</div>
      <div class="nauryz-author">Альберт Эйнштейн</div>
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

.nauryz-quote {
  @apply text-white text-base font-medium mb-2 italic;
}

.nauryz-author {
  @apply text-white/90 text-sm font-semibold;
}
</style>
