<template>
  <div class="flex p-0.5 rounded-full bg-muted">
    <button
      v-for="lang in availableLanguages"
      :key="lang.code"
      class="px-3 py-1 rounded-full text-xs font-bold transition-all"
      :class="lang.code === activeLanguage
        ? 'bg-card text-foreground shadow-sm'
        : 'text-muted-foreground hover:text-foreground'"
      @click="setLanguage(lang.code)"
    >
      {{ lang.code.toUpperCase() }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useLanguage } from "@/composables/useLanguage";

const { activeLanguage, availableLanguages, setLanguage } = useLanguage();
</script>
