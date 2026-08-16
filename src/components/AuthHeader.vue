<!-- src/components/AuthHeader.vue -->
<template>
  <header
    class="w-full flex items-center justify-between px-6 py-4 absolute top-0 left-0 right-0 z-50 pointer-events-auto bg-background/80 backdrop-blur-md border-b border-border/30 md:bg-transparent md:backdrop-blur-none md:border-b-0"
  >
    <div class="flex items-center gap-2">
      <Logo variant="sidebar" :is-expanded="true" class="!mb-0 !h-auto" />
    </div>

    <div class="flex items-center gap-2.5">
      <LanguageSelector />
      <ThemeToggle />
    </div>
  </header>
</template>

<script setup lang="ts">
import Logo from "@/components/Logo/Logo.vue";
import LanguageSelector from "@/components/LanguageSelector.vue";
import ThemeToggle from "@/components/ThemeToggle.vue";
</script>
