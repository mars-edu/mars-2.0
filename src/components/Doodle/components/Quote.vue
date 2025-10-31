<template>
  <div class="quote-content">
    <div class="quote-text">
      <div class="quote-message">„Образование — это то, что остаётся после того, как забывается всё выученное в школе."</div>
      <div class="quote-author">— Альберт Эйнштейн</div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.quote-content {
  @apply flex items-center justify-center w-full h-full px-8 py-6;
}

.quote-text {
  @apply text-center max-w-4xl;
}

.quote-message {
  @apply text-white text-xl md:text-2xl font-medium mb-4 italic leading-relaxed;
}

.quote-author {
  @apply text-white/90 text-base md:text-lg font-semibold;
}
</style>
